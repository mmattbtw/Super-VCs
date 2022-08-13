import { ApplicationCommandOptionType, ApplicationCommandType, ChannelType } from 'discord.js';
import { prisma } from '../..';
import { Command } from '../../utils/command';

export const setpingchannel: Command = {
    name: 'setpingchannel',
    description: 'force your server to get signed up!',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'channel',
            description: 'the channel to ping',
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
                    channelId: channel,
                },
            });
        } else {
            await prisma.server.update({
                where: {
                    id: interaction.guildId,
                },
                data: {
                    channelId: channel,
                },
            });
        }

        return interaction.reply({ content: "server's ping channel has been set!", ephemeral: true });
    },
};
