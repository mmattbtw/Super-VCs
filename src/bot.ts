import DiscordJS, { Intents } from 'discord.js';
import path from 'path';
import WOKCommands from 'wokcommands';
import config from './config';

export const version = '1.0.0';

const client = new DiscordJS.Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

client.on('ready', () => {
    new WOKCommands(client, {
        commandsDir: path.join(__dirname, 'commands'), // Directory where commands are stored
        featuresDir: path.join(__dirname, 'features'), // Directory where features (event listeners pretty much) are stored
        typeScript: false, // This is disabled when running for prod, otherwise while testing it is enabled.
        testServers: ['815021537303986176', '854448828546940950'],
        mongoUri: config.mongoUri, // MongoDB connection string (Stored as MONGO_URI in .env)
        disabledDefaultCommands: ['language', 'help', 'requiredrole'],
        defaultLanguage: 'english',
        ignoreBots: true, // WOKCommands ignores other Discord Bots, for no echoing of commands and such.
        delErrMsgCooldown: 5, // After 5 seconds, the default WOKCommands error messages delete.
        dbOptions: { keepAlive: true },
        botOwners: ['308000668181069824'], // For owner only commands (3080... is mmatt)
        ephemeral: false,
    })
        .setDefaultPrefix('b!') // Default prefix for legacy commands (which most are not used for the public) is d!
        .setDisplayName('PingPong');

    console.log(`PingPong ${version} is ready!`);
    client.user?.setPresence({
        status: 'online',
        activities: [
            {
                name: `PingPong ${version} || server count: ${client.guilds.cache.size}`,
            },
        ],
    });
});

client.login(config.discordToken);
