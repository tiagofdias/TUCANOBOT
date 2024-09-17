const { SlashCommandBuilder, ChannelType, EmbedBuilder } = require('discord.js');
const AutoPublish = require('../models/AutoPublish');
const CHATGPT = require('../models/CHATGPT');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autopublish')
        .setDescription('autodeletes a message')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Automatically publishes messages that are sent into the specified announcement channel.')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('The channel where the messages will be deleted.')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildAnnouncement)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Removes a channel from the auto publish list')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('Removes a channel from the auto publish list')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildAnnouncement)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('list all the channels where the auto publish is running.')
        ),

    async execute(interaction) {

        if (interaction.options.getSubcommand()) {

            switch (interaction.options.getSubcommand()) {

                case "add":

                    try {

                        const Channel = interaction.options.get('channel').value;

                        //Validações
                        const QueryCHATGPT = await CHATGPT.count({ where: { ServerID: interaction.guildId.toString(), ChannelID: Channel }, });

                        if (QueryCHATGPT == 1) return interaction.reply({ content: `<#${Channel}> is already the CHATGPT channel. You cannot set an autopublish channel here.`, ephemeral: true, });

                        await AutoPublish.upsert({ ServerID: interaction.guildId.toString(), ChannelID: Channel.toString(), });

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

                        const deletedRows = await AutoPublish.destroy({ where: { ChannelID: channelID } });

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

                        const count = await AutoPublish.count({ where: { ServerID: serverID } });

                        if (count > 0) {
                            const channels = await AutoPublish.findAll({ where: { ServerID: serverID } });

                            const channelNames = await Promise.all(
                                channels.map(async (channel) => {
                                    const channelName = await interaction.guild.channels.fetch(channel.ChannelID);
                                    return channelName.toString();
                                })
                            );

                            const embed = new EmbedBuilder()
                                .setTitle('Auto Publish Channel List')
                                .setDescription(`The toucan is auto publishing messages inside these channels: \n\n ${channelNames.join('\n')}`)
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
