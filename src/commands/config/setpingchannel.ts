import { ICommand } from 'wokcommands';
import pingSchema from '../../models/ping-schema';

export default {
    name: 'setpingchannel',
    description: 'set a ping channel for your server',
    category: 'config',

    permissions: ['ADMINISTRATOR'],

    minArgs: 1,
    expectedArgs: '<channel>',

    slash: true,
    guildOnly: true,

    options: [
        {
            name: 'channel',
            description: 'the channel you want your new members to be welcomed in.',
            type: 'CHANNEL',
            required: true,
        }
    ],        

    callback: async ({ guild, interaction }) => {
        const target = interaction.options.getChannel('channel');

        if (!guild) {
            return 'this command can only be ran in servers';
        }

        // error handling just in case a user tries to make a welcome channel a `voice/anything that isn't text` channel.
        if (!target || target.type !== 'GUILD_TEXT') {
            return 'incorrect channel type';
        }

        await pingSchema.findOneAndUpdate(
            {
                _id: guild.id,
            },
            {
                _id: guild.id,
                channelId: target.id,
            },
            {
                upsert: true,
            }
        );

        return 'pinging channel has been set.';
    },
} as ICommand;
