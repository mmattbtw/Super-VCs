import { ICommand } from 'wokcommands';
import usersSchema from '../models/users-schema';

export default {
    name: 'signup',
    description: 'sing up to get pinged when a new vc is created',
    category: 'general',

    slash: true,
    guildOnly: true,
    testOnly: true,

    callback: async ({ guild, user }) => {
        if (!guild) {
            return 'this command can only be ran in servers';
        }

        const data = await usersSchema.findById({
            _id: guild.id,
        });

        const { usersId } = data;

        usersId.push(`<@${user.id}>`);

        await usersSchema.findOneAndUpdate(
            {
                _id: guild.id,
            },
            {
                _id: guild.id,
                usersId,
            },
            {
                upsert: true,
            }
        );

        return 'you have been signed up to recieve pings.';
    },
} as ICommand;
