import { EmbedBuilder } from 'discord.js';
import { prisma } from '..';
import { Command } from '../utils/command';

export const serversettings: Command = {
    name: 'serversettings',
    description: 'see all the settings for the current server',
    defaultMemberPermissions: 'Administrator',
    run: async (client, interaction) => {
        if (!interaction.guildId) {
            return interaction.reply('this command can only be used in a server!');
        }

        const server = await prisma.server.findFirst({ where: { id: interaction.guildId } });

        if (!server) {
            await prisma.server.create({
                data: {
                    id: interaction.guildId,
                    signedUpUsers: [],
                    channelId: '',
                    customVcName: '',
                    voiceChannelIds: [],
                    newSessionVcId: '',
                },
            });

            return interaction.reply({ content: "the server didn't exist in our database yet, just insertted your server!", ephemeral: true });
        }

        return interaction.reply({
            embeds: [
                new EmbedBuilder().setDescription(
                    `ping channel: <#${server.channelId}>\n` +
                        `custom vc name: \`${server.customVcName}\n\`` +
                        `new session vc: <#${server.newSessionVcId}>\n` +
                        `\n` +
                        '**raw data**\n' +
                        `\`\`\`json\n${JSON.stringify(server, null, 2)}\`\`\``
                ),
            ],
            ephemeral: true,
        });
    },
};
