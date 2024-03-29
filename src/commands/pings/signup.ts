import { ApplicationCommandType } from 'discord.js';
import { prisma } from '../..';
import { Command } from '../../utils/command';

export const signup: Command = {
    name: 'signup',
    description: 'sign up to get pinged when a new voice channel is created in this server',
    type: ApplicationCommandType.ChatInput,
    run: async (client, interaction) => {
        if (!interaction.guildId) {
            return interaction.reply('this command can only be used in a server!');
        }

        const server = await prisma.server.findFirst({ where: { id: interaction.guildId } });

        if (!server) {
            return interaction.reply('this server is not registered! ask a server admin to use the `forceserversignup` command.');
        }

        // if user is already in the server.signedUpUsers array, return that they have already been signed up
        if (server.signedUpUsers.find((id) => id === interaction.user.id)) {
            return interaction.reply({ content: 'you have already signed up!', ephemeral: true });
        }

        let newUsersList = server.signedUpUsers;

        newUsersList.push(`${interaction.user.id}`);

        await prisma.server.update({
            where: { id: interaction.guildId },
            data: {
                channelId: server.channelId,
                id: server.id,
                signedUpUsers: newUsersList,
            },
        });

        if (!server.channelId) {
            return interaction.reply(
                'you have been signed up! however, the server has not yet set a channel to send the ping messages in, an administrator will have to use the `setpingchannel` command.'
            );
        } else {
            return interaction.reply({ content: 'you have been signed up!', ephemeral: true });
        }
    },
};
