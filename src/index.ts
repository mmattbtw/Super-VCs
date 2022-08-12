import { PrismaClient, Server } from '@prisma/client';
import ModuleLoader from 'discord-module-loader';
import { ActivityType, ChannelType, Client, GatewayIntentBits, Guild, GuildChannel } from 'discord.js';
import dotenv from 'dotenv';
import ora from 'ora';
dotenv.config();

// make this automatic sometime? idk this is kinda just a quick project...

export const prisma = new PrismaClient();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });
const moduleLoader = new ModuleLoader(client, {
    unknownCommandMessage: 'unkown command!',
    commandCooldownMessage: 'command on cooldown!',
    disabledCommandMessage: 'command disabled!',
    disallowedChannelMessage: 'command not allowed in this channel!',
});

// @ts-ignorej=

client.once('ready', async () => {
    if (!client.user || !client.application) return;

    const loadingCommandsSpinner = ora('loading commands...').start();
    await moduleLoader.loadAll();
    loadingCommandsSpinner.stopAndPersist({ symbol: '✅', text: 'loading commands complete' });

    const updateSlashCommandsSpinner = ora('updating slash commands...').start();
    await moduleLoader.updateSlashCommands();
    updateSlashCommandsSpinner.stopAndPersist({ symbol: '✅', text: 'updating slash commands complete' });

    const gettingGuildsSpinner = ora('getting guilds...').start();
    let guildsForDb = [] as Server[];
    client.guilds.cache.map((guild) => {
        guildsForDb.push({
            id: guild.id,
            signedUpUsers: [],
            channelId: '',
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
    client.user.setActivity('the voice channels...', { type: ActivityType.Watching });
    presenceSpinner.stopAndPersist({ symbol: '✅', text: 'presence set' });
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

client.login(process.env.TOKEN);
