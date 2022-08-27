import { PrismaClient, Server } from '@prisma/client';
import {
    ActivityType,
    ChannelType,
    Client,
    CommandInteraction,
    EmbedBuilder,
    GatewayIntentBits,
    Guild,
    GuildChannel,
    Interaction,
    VoiceChannel,
} from 'discord.js';
import dotenv from 'dotenv';
import ora from 'ora';
import AutoPoster from 'topgg-autoposter';
import { setavcchannelname } from './commands/avc/setavcchannelname';
import { setnewsessionchannel } from './commands/avc/setnewsessionchannel';
import { forceserversignup } from './commands/forceserversignup';
import { removeme } from './commands/pings/removeme';
import { setpingchannel } from './commands/pings/setpingchannel';
import { signup } from './commands/pings/signup';
import { serversettings } from './commands/serversettings';
import { setlogschannel } from './commands/setlogschannel';
import { Command } from './utils/command';
dotenv.config();

// make this automatic sometime? idk this is kinda just a quick project...
const Commands: Command[] = [
    signup,
    removeme,
    forceserversignup,
    setpingchannel,
    setnewsessionchannel,
    setavcchannelname,
    serversettings,
    setlogschannel,
];

export const prisma = new PrismaClient();
export enum Colors {
    RED = 0xff8f8f,
    GREEN = 0x8fff94,
}

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });
if (process.env.TOPGG_TOKEN) {
    const ap = AutoPoster(process.env.TOPGG_TOKEN, client);
}

client.once('ready', async () => {
    if (!client.user || !client.application) return;

    client.user.setStatus('idle');
    client.user.setActivity('getting ready...', { type: ActivityType.Competing });

    const applicationsSpinner = ora('setting application commands...').start();
    // ** GLOBAL COMMANDS ** //
    await client.application.commands.set(Commands);

    // ** TEMP SERVER COMMANDS ** //
    await client.guilds.cache.find((g) => g.id === '1008526603753635901')?.commands.set([]);

    applicationsSpinner.stopAndPersist({ symbol: '✅', text: 'application commands set' });

    const gettingGuildsSpinner = ora('getting guilds...').start();
    let guildsForDb = [] as Server[];
    client.guilds.cache.map((guild) => {
        guildsForDb.push({
            id: guild.id,
            signedUpUsers: [],
            channelId: '',
            customVcName: '',
            voiceChannelIds: [],
            newSessionVcId: '',
            logsChannelId: '',
        });
    });
    gettingGuildsSpinner.stopAndPersist({ symbol: '✅', text: 'guilds retrieved' });

    const inserttingGuildsSpinner = ora('inserting guilds into db...').start();
    await prisma.server.createMany({
        data: guildsForDb,
        skipDuplicates: true,
    });
    inserttingGuildsSpinner.stopAndPersist({ symbol: '✅', text: 'guilds inserted into db' });

    console.log('online+ready :^)');

    const presenceSpinner = ora('setting presence...').start();
    client.user.setStatus('online');
    client.user.setActivity('the voice channels...', { type: ActivityType.Watching });
    presenceSpinner.stopAndPersist({ symbol: '✅', text: 'presence set' });
});

const handleSlashCommand = async (client: Client, interaction: CommandInteraction): Promise<void> => {
    const slashCommand = Commands.find((c) => c.name === interaction.commandName);
    if (!slashCommand) {
        interaction.followUp({ content: 'An error has occurred' });
        return;
    }

    slashCommand.run(client, interaction);
};

client.on('interactionCreate', async (interaction: Interaction) => {
    if (interaction.isCommand() || interaction.isContextMenuCommand()) {
        await handleSlashCommand(client, interaction);
    }
});

// creates server in db when bot joins server
client.on('guildCreate', async (guild: Guild) => {
    const serverJoinedSpinner = ora('creating server in db...').start();
    const server = await prisma.server.findFirst({ where: { id: guild.id } });
    if (!server) {
        await prisma.server.create({
            data: {
                id: guild.id,
            },
        });
    }
    serverJoinedSpinner.stopAndPersist({ symbol: '✅', text: 'server created in db' });
});

client.on('channelCreate', async (channel: GuildChannel) => {
    if (channel.type !== ChannelType.GuildVoice) return;
    const server = await prisma.server.findFirst({ where: { id: channel.guild.id } });
    if (!server) return;

    if (server.channelId) {
        if (server.signedUpUsers.length < 1) return;

        const pingMesageChannel = channel.guild.channels.cache.get(server.channelId);

        if (pingMesageChannel?.type === ChannelType.GuildText) {
            await pingMesageChannel.send(`NEW VC: <#${channel.id}>` + '\n' + `${server.signedUpUsers.map((u) => `<@${u}>`).join(' ')}`);
        }
    }
});

// there is functionality to delete the channel from server+db in the voiceStateUpdate event
// - however, if the bot somehow doesn't catch it, if the user removes the channel manually
// - it will remove it from db.
client.on('channelDelete', async (channel) => {
    if (channel.type !== ChannelType.GuildVoice) return;
    const server = await prisma.server.findFirst({ where: { id: channel.guild.id } });
    if (!server) return;

    // Logs
    if (server.logsChannelId) {
        const logsMessageChannel = channel.guild.channels.cache.get(server.logsChannelId);
        if (logsMessageChannel?.type === ChannelType.GuildText) {
            await logsMessageChannel.send({
                embeds: [new EmbedBuilder().setColor(Colors.RED).setDescription(`🗑️ Voice channel \`${channel.name}\` has been deleted.`)],
            });
        }
    }

    if (server.voiceChannelIds.includes(channel.id)) {
        server.voiceChannelIds = server.voiceChannelIds.filter((c) => c !== channel.id);
        await prisma.server.update({
            where: { id: server.id },
            data: { voiceChannelIds: server.voiceChannelIds },
        });
    }
});

client.on('voiceStateUpdate', async (oldState, newState) => {
    const server = await prisma.server.findFirst({ where: { id: newState.guild.id } });
    if (!server) return;

    if (oldState.channelId !== newState.channelId && oldState.channelId !== server.newSessionVcId && newState.channelId !== server.newSessionVcId) {
        if (server.logsChannelId) {
            const logsMessageChannel = newState.guild.channels.cache.get(server.logsChannelId);
            if (logsMessageChannel?.type === ChannelType.GuildText) {
                if (oldState.channelId === null) {
                    await logsMessageChannel.send({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(Colors.GREEN)
                                .setDescription(`🎤 <@${newState.id}> has joined voice channel \`${newState.channel?.name}\`.`),
                        ],
                    });
                } else if (newState.channelId === null) {
                    await logsMessageChannel.send({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(Colors.RED)
                                .setDescription(`🎤 <@${oldState.id}> has left voice channel \`${oldState.channel?.name}\`.`),
                        ],
                    });
                } else {
                    await logsMessageChannel.send({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(Colors.GREEN)
                                .setDescription(
                                    `<@${newState.member?.id}> moved from \`${oldState.channel?.name}\` to \`${newState.channel?.name}\`.`
                                ),
                        ],
                    });
                }
            }
        }
    }

    if (newState.channelId === server.newSessionVcId) {
        let newChannelName = `${server.voiceChannelIds.length + 1}`;
        if (server.customVcName) newChannelName = server.customVcName + ` [${server.voiceChannelIds.length + 1}]`;

        let newChannel: VoiceChannel | undefined;
        if (newState.channel?.parent) {
            newChannel = await newState.channel?.parent?.children.create({ name: newChannelName, type: ChannelType.GuildVoice });
        } else {
            newChannel = await newState.channel?.guild?.channels.create({ name: newChannelName, type: ChannelType.GuildVoice });
        }
        if (!newChannel) return;

        await prisma.server.update({
            where: { id: newState.guild.id },
            data: { voiceChannelIds: [...server.voiceChannelIds, newChannel.id] },
        });

        // Logs
        if (server.logsChannelId) {
            const logsMessageChannel = newState.guild.channels.cache.get(server.logsChannelId);
            if (logsMessageChannel?.type === ChannelType.GuildText) {
                await logsMessageChannel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(Colors.GREEN)
                            .setDescription(`➕ Voice channel \`${newChannel.name}\` has been created by <@${newState.member?.id}>.`),
                    ],
                });
            }
        }

        if (newChannel.joinable) await newState.member?.voice.setChannel(newChannel);
    } else if (oldState.channelId && oldState.channelId !== newState.channelId) {
        if (server.voiceChannelIds.includes(oldState.channelId)) {
            if (!oldState.channel) return;
            if (oldState.channel.members.size === 0) {
                await prisma.server.update({
                    where: { id: oldState.guild.id },
                    data: { voiceChannelIds: server.voiceChannelIds.filter((c) => c !== oldState.channelId) },
                });

                await oldState.channel.delete();
            }
        }
    }
});

client.login(process.env.TOKEN);
