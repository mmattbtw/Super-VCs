import { ApplicationCommandType, Client, CommandInteraction } from 'discord.js';
import { prisma } from '..';
import { Command } from '../utils/command';

export const forceserversignup: Command = {
    name: 'forceserversignup',
    description: 'force your server to get signed up!',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: 'Administrator',
    run: async (client: Client, interaction: CommandInteraction) => {
        if (!interaction.guildId) {
            return interaction.reply('this command can only be used in a server!');
        }

        const server = await prisma.server.findFirst({ where: { id: interaction.guildId } });

        if (server) {
            return interaction.reply({ content: 'this server is registered! no need to use this command.', ephemeral: true });
        }

        await prisma.server.create({
            data: {
                id: interaction.guildId,
            },
        });

        return interaction.reply({ content: 'server has been signed up!', ephemeral: true });
    },
};
