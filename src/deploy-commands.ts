import { REST } from '@discordjs/rest';
import { Routes } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
dotenv.config();

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
console.log(commandsPath);
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
console.log(commandFiles);

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    // console.log(filePath);
    const command = require(filePath);
    // console.log(command);
    commands.push(command.data.toJSON());
}
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN ?? '');

console.log(commands);

rest.put(Routes.applicationGuildCommands('930304941682212934', '854448828546940950'), { body: commands })
    .then(() => console.log('Successfully registered application commands.'))
    .catch(console.error);

// rest.put(Routes.applicationCommands('930304941682212934'), { body: commands })
//     .then(() => console.log('Successfully registered application commands.'))
//     .catch(console.error);
