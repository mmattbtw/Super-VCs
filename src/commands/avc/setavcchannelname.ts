import { ApplicationCommandOptionType, ApplicationCommandType } from 'discord.js';
import { prisma } from '../..';
import { Command } from '../../utils/command';

export const setavcchannelname: Command = {
    name: 'setavcchannelname',
    description: 'set the name of the voice channel for the bot to automatically make.',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'name',
            description: 'the name of the new channel',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    defaultMemberPermissions: 'Administrator',
    run: async (client, interaction) => {
        if (!interaction.guildId) {
            return interaction.reply('this command can only be used in a server!');
        }

        let server = await prisma.server.findFirst({ where: { id: interaction.guildId } });

        if (!server) {
            server = await prisma.server.create({
                data: {
                    id: interaction.guildId,
                    customVcName: interaction.options.get('name', true).value?.toString(),
                },
            });
        } else {
            await prisma.server.update({
                where: {
                    id: interaction.guildId,
                },
                data: {
                    customVcName: interaction.options.get('name', true)?.value?.toString(),
                },
            });
        }

        return interaction.reply({ content: 'the name of the new channel has been set!', ephemeral: true });
    },
};
