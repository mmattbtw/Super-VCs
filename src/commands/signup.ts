import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { prisma } from '..';

export = {
    data: new SlashCommandBuilder().setName('signupxd').setDescription('sign up to get pinged when a new voice channel is created'),
    async execute(interaction: CommandInteraction) {
        if (!interaction.guildId) {
            return interaction.reply('this command can only be used in a server!');
        }

        const server = await prisma.server.findFirst({ where: { id: interaction.guildId } });

        if (!server) {
            return interaction.reply('this server is not registered! ask a server admin to use the `forceserversignup` command.');
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

        return interaction.reply('you have been signed up!');
    },
};
