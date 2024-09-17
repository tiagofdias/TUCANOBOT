const { SlashCommandBuilder, ChannelType, EmbedBuilder } = require('discord.js');
const Suggestions = require('../models/Suggestions');
const CHATGPT = require('../models/CHATGPT');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('suggestions')
        .setDescription('autodeletes a message')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription("Adds a suggestion channel to the server.")
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('The channel where the suggestions will appear.')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Removes a suggestion channel from the server')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('The channel where the suggestions will stop showing.')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('list all the suggestion channels inside the server.')
        ),

    async execute(interaction) {

        if (interaction.options.getSubcommand()) {

            switch (interaction.options.getSubcommand()) {
                case "add":

                    try {

                        const Channel = interaction.options.get('channel').value;

                          //Validações
                          const QueryCHATGPT = await CHATGPT.count({ where: { ServerID: interaction.guildId.toString(), ChannelID: Channel }, });

                          if (QueryCHATGPT == 1) return interaction.reply({ content: `<#${Channel}> is already the CHATGPT channel. You cannot set the suggestion channel here.`, ephemeral: true, });
    
                          //INSERT E UPDATE
                        await Suggestions.upsert({ ServerID: interaction.guildId.toString(), ChannelID: Channel.toString(), });

                        interaction.reply({ content: `The operation was concluded successfully`, ephemeral: true });

                    }
                    catch (error) {
                        if (error.name === 'SequelizeUniqueConstraintError') return interaction.reply('That tag already exists.');
                        return interaction.reply('Something went wrong with adding a tag.');
                    }

                    break;

                case "remove":

                    try {
                        const channelID = interaction.options.get('channel').value;

                        const deletedRows = await Suggestions.destroy({ where: { ChannelID: channelID } });

                        if (deletedRows > 0)
                            interaction.reply({ content: `<#${channelID}> has been successfully removed from the list`, ephemeral: true });
                        else
                            interaction.reply({ content: `<#${channelID}> is not in the list`, ephemeral: true });

                    } catch (error) {
                        console.error(error);
                        interaction.reply({ content: 'An error occurred while removing the channel from the list.', ephemeral: true });
                    }

                    break;

                case "list":

                    try {
                        const serverID = interaction.guildId.toString();

                        const count = await Suggestions.count({ where: { ServerID: serverID } });

                        if (count > 0) {
                            const channels = await Suggestions.findAll({ where: { ServerID: serverID } });

                            const channelNames = await Promise.all(
                                channels.map(async (channel) => {
                                    const channelName = await interaction.guild.channels.fetch(channel.ChannelID);
                                    return channelName.toString();
                                })
                            );

                            const embed = new EmbedBuilder()
                                .setTitle('Suggestion Channels List')
                                .setDescription(`The toucan is transforming suggestions inside these channels: \n\n ${channelNames.join('\n')}`)
                                .setColor('Green');

                            interaction.reply({ embeds: [embed], ephemeral: true });
                        } else
                            interaction.reply({ content: 'The list is empty', ephemeral: true });

                    } catch (error) {
                        console.error(error);
                        interaction.reply({ content: 'An error occurred while listing the channels.', ephemeral: true });
                    }

                    break;
            }
        }
    },
};
