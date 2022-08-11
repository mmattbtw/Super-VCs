import { PrismaClient, Server } from '@prisma/client';
import { Client, Collection, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
dotenv.config();

export const prisma = new PrismaClient();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

// @ts-ignorej=
client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    // @ts-ignorej=
    client.commands.set(command.data.name, command);
}

client.once('ready', async () => {
    let guildsForDb = [] as Server[];
    const guilds = client.guilds.cache.map((guild) => {
        guildsForDb.push({
            id: guild.id,
            signedUpUsers: [],
            channelId: '',
        });
    });

    await prisma.server.createMany({
        data: guildsForDb,
        skipDuplicates: true,
    });

    console.log('ready :^)');
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    // @ts-ignore
    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

client.login(process.env.TOKEN);
