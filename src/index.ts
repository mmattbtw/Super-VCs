import { PrismaClient, Server } from '@prisma/client';
import { ActivityType, ChannelType, Client, Collection, CommandInteraction, GatewayIntentBits, Guild, GuildChannel, Interaction } from 'discord.js';
import dotenv from 'dotenv';
import ora from 'ora';
import { forceserversignup } from './commands/forceserversignup';
import { removeme } from './commands/removeme';
import { setpingchannel } from './commands/setpingchannel';
import { signup } from './commands/signup';
import { Command } from './utils/command';
dotenv.config();

// make this automatic sometime? idk this is kinda just a quick project...
const Commands: Command[] = [signup, removeme, forceserversignup, setpingchannel];

export const prisma = new PrismaClient();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

// @ts-ignorej=
client.commands = new Collection();

client.once('ready', async () => {
    if (!client.user || !client.application) return;

    const applicationsSpinner = ora('setting application commands...').start();
    // ** GLOBAL COMMANDS ** //
    await client.application.commands.set(Commands);

    // ** TEMP SERVER COMMANDS ** //
    // await client.guilds.cache.find((g) => g.id === '854448828546940950')?.commands.set(Commands);

    applicationsSpinner.stopAndPersist({ symbol: '✅', text: 'application commands set' });

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

const handleSlashCommand = async (client: Client, interaction: CommandInteraction): Promise<void> => {
    const slashCommand = Commands.find((c) => c.name === interaction.commandName);
    if (!slashCommand) {
        interaction.followUp({ content: 'An error has occurred' });
        return;
    }

    // await interaction.deferReply();

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

client.login(process.env.TOKEN);
