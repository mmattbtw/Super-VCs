const fs = require('node:fs');
const path = require('node:path');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.ts'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    commands.push(command.data.toJSON());
}
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN ?? '');

rest.put(Routes.applicationCommands('930304941682212934'), { body: commands })
    .then(() => console.log('Successfully registered application commands.'))
    .catch(console.error);
