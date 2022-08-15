import { ApplicationCommandOptionType, ApplicationCommandType, ChannelType } from 'discord.js';
import { prisma } from '..';
import { Command } from '../utils/command';

export const setlogschannel: Command = {
    name: 'setlogschannel',
    description: 'set the channel that gets used for logs',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'channel',
            description: 'the channel to log to',
            type: ApplicationCommandOptionType.Channel,
            required: true,
            channel_types: [ChannelType.GuildText],
        },
    ],
    defaultMemberPermissions: 'Administrator',
    run: async (client, interaction) => {
        if (!interaction.guildId) {
            return interaction.reply('this command can only be used in a server!');
        }

        let server = await prisma.server.findFirst({ where: { id: interaction.guildId } });

        const channel = interaction.options.get('channel', true)?.channel?.id;

        if (!server) {
            server = await prisma.server.create({
                data: {
                    id: interaction.guildId,
                    logsChannelId: channel,
                },
            });
        } else {
            await prisma.server.update({
                where: {
                    id: interaction.guildId,
                },
                data: {
                    logsChannelId: channel,
                },
            });
        }

        return interaction.reply({ content: "server's logs channel has been set!", ephemeral: true });
    },
};
