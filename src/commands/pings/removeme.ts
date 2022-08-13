import { ApplicationCommandType } from 'discord.js';
import { prisma } from '../..';
import { Command } from '../../utils/command';

export const removeme: Command = {
    name: 'removeme',
    description: 'get removed from being pinged when a new voice channel is created in this server',
    type: ApplicationCommandType.ChatInput,
    run: async (client, interaction) => {
        if (!interaction.guildId) {
            return interaction.reply('this command can only be used in a server!');
        }

        const server = await prisma.server.findFirst({ where: { id: interaction.guildId } });

        if (!server) {
            return interaction.reply('this server is not registered! ask a server admin to use the `forceserversignup` command.');
        }

        const user = server.signedUpUsers.find((id) => id === interaction.user.id);
        // if user is already in the server.signedUpUsers array, return that they have already been signed up
        if (!user) {
            return interaction.reply({ content: "you aren't signed up!", ephemeral: true });
        }

        let newUsersList = server.signedUpUsers;

        const indexOfUser = newUsersList.indexOf(user);
        if (indexOfUser !== -1) {
            newUsersList.splice(indexOfUser, 1);
        }

        await prisma.server.update({
            where: { id: interaction.guildId },
            data: {
                channelId: server.channelId,
                id: server.id,
                signedUpUsers: newUsersList,
            },
        });

        return interaction.reply({ content: 'you have been removed!', ephemeral: true });
    },
};
