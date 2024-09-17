const { SlashCommandBuilder, ChannelType } = require('discord.js');

const CHATGPT = require('../models/CHATGPT');
const AutoDelete = require('../models/AutoDelete');
const AutoPublish = require('../models/AutoPublish');
const Suggestions = require('../models/Suggestions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('chatgpt')
        .setDescription('Chatgpt inside your server')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Adds the chatgpt to a specific channel')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('The channel where the chatgpt messages will be sent.')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Removes the chatgpt channel from the server')
        ),
    async execute(interaction) {

        if (interaction.options.getSubcommand()) {

            switch (interaction.options.getSubcommand()) {

                case "add":

                    try {

                        const Channel = interaction.options.get("channel").value;

                        //Validações
                        const QuerySuggestions = await Suggestions.count({ where: { ServerID: interaction.guildId.toString(), ChannelID: Channel }, });
                        const QueryAutoPublish = await AutoPublish.count({ where: { ServerID: interaction.guildId.toString(), ChannelID: Channel }, });
                        const QueryAutoDelete = await AutoDelete.count({ where: { ServerID: interaction.guildId.toString(), ChannelID: Channel }, });

                        if (QueryAutoDelete == 1) return interaction.reply({ content: `<#${Channel}> is already an autodelete channel. You cannot add CHATGPT here.`, ephemeral: true, });
                        if (QueryAutoPublish == 1) return interaction.reply({ content: `<#${Channel}> is already an autopublish channel. You cannot add CHATGPT here.`, ephemeral: true, });
                        if (QuerySuggestions == 1) return interaction.reply({ content: `<#${Channel}> is already a suggestion channel. You cannot add CHATGPT here.`, ephemeral: true, });

                        //INSERT E UPDATE
                        const created = await CHATGPT.upsert({ServerID: interaction.guildId.toString(),ChannelID: Channel.toString(),},{where: { ServerID: interaction.guildId.toString() },});
                        
                        const message = created ? `ChatGPT is now working inside <#${Channel}>.` : `The ChatGPT channel is now updated to <#${Channel}>.`;
                        
                        interaction.reply({content: message,ephemeral: true,});             

                    } catch (error) {
                        if (error.name === "SequelizeUniqueConstraintError") return interaction.reply("That record already exists.");
                        return interaction.reply("Something went wrong.");
                    }

                    break;

                case "remove":

                    try {
                        const count = await CHATGPT.count({where: { ServerID: interaction.guildId.toString() },});

                        const QueryChannel2 = await CHATGPT.findOne({where: { ServerID: interaction.guildId.toString() },});

                        if (count <= 0) {
                            interaction.reply({content: `CHATGPT is not in any channel inside this server.`,ephemeral: true,});
                            return
                        }

                        await CHATGPT.destroy({where: { ServerID: interaction.guildId.toString(), ChannelID: QueryChannel2.ChannelID },});

                        interaction.reply({content: `CHATGPT is now removed from the server.`,ephemeral: true,});

                    } catch (error) {
                        if (error.name === "SequelizeUniqueConstraintError") return interaction.reply("That record already exists.");
                        return interaction.reply("Something went wrong.");
                    }

                    break;
            }
        }
    },
}; 