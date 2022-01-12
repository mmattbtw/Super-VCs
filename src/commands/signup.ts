import { ICommand } from 'wokcommands';
import usersSchema from '../models/users-schema';

export default {
    name: 'signup',
    description: 'sing up to get pinged when a new vc is created',
    category: 'general',

    slash: true,
    guildOnly: true,

    callback: async ({ guild, user, interaction }) => {
        interaction.deferReply();
        if (!guild) {
            return 'this command can only be ran in servers';
        }

        const data = await usersSchema.findById({
            _id: guild.id,
        });

        if (!data) {
            usersSchema.create({
                _id: guild.id,
                usersId: [`<@${user.id}>`],
            });
        } else {
            const { usersId } = data;

            if (usersId.includes(user.id)) {
                interaction.editReply('you are already signed up to be pinged!');
                return;
            }

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
        }

        interaction.editReply('you have been signed up to recieve pings.');
        return;
    },
} as ICommand;
