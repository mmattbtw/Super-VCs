import { CommandInteraction, SlashCommandBuilder } from 'discord.js';

export = {
    data: new SlashCommandBuilder().setName('signup').setDescription('sign up to get pinged when a new voice channel is created'),
    async execute(interaction: CommandInteraction) {
        await interaction.reply('fuck you');
    },
};
