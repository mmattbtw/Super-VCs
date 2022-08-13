import { ApplicationCommandOptionType, ApplicationCommandType, ChannelType } from 'discord.js';
import { prisma } from '../..';
import { Command } from '../../utils/command';

export const setnewsessionchannel: Command = {
    name: 'setnewsessionchannel',
    description: 'set the channel for the bot to automatically make a voice channel.',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'channel',
            description: 'the channel for people to join so that the bot creates a new voice channel for them',
            type: ApplicationCommandOptionType.Channel,
            required: true,
            channel_types: [ChannelType.GuildVoice],
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
                    newSessionVcId: channel,
                },
            });
        } else {
            await prisma.server.update({
                where: {
                    id: interaction.guildId,
                },
                data: {
                    newSessionVcId: channel,
                },
            });
        }

        return interaction.reply({ content: "server's new session channel has been set!", ephemeral: true });
    },
};
