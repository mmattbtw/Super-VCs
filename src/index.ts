import { PrismaClient, Server } from '@prisma/client';
import { Client, Collection, CommandInteraction, GatewayIntentBits, Interaction } from 'discord.js';
import dotenv from 'dotenv';
import { signup } from './commands/signup';
import { Command } from './utils/command';
dotenv.config();

const Commands: Command[] = [signup];

export const prisma = new PrismaClient();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

// @ts-ignorej=
client.commands = new Collection();

client.once('ready', async () => {
    if (!client.user || !client.application) return;

    console.log('setting application commands...');
    await client.application.commands.set(Commands);

    console.log('getting guilds...');
    let guildsForDb = [] as Server[];
    client.guilds.cache.map((guild) => {
        guildsForDb.push({
            id: guild.id,
            signedUpUsers: [],
            channelId: '',
        });
    });

    console.log('insertting guilds into db...');
    await prisma.server.createMany({
        data: guildsForDb,
        skipDuplicates: true,
    });

    console.log('ready :^)');
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

client.login(process.env.TOKEN);
