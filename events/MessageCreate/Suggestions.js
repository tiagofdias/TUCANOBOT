require('dotenv').config();
const path = require('path');
const Suggestions = require(path.join(__dirname, '..', '..', 'models', 'Suggestions'));
const { Events, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
    name: Events.MessageCreate,
    once: false,
    async execute(message) {

        //SUGGESTIONS
        try {

            //Query para ver se o text-channel já existe na BD
            const QueryChannelID = await Suggestions.count({ where: { ChannelID: message.channel.id } });

            if (QueryChannelID === 1) {

                if (!message.embeds.length && message.channel.type === ChannelType.GuildText) {

                    const memberName = message.member.displayName;
                    const memberAvatar = message.author.avatarURL();

                    message.channel.fetchWebhooks()
                        .then(webhooks => {
                            const existingWebhook = webhooks.find(webhook => webhook.name === memberName);
                            if (existingWebhook) {
                                return existingWebhook;
                            } else {
                                return message.channel.createWebhook({
                                    name: memberName,
                                    avatar: memberAvatar,
                                });
                            }
                        })
                        .then(webhook => {
                            const content = message.content;
                            const color = '#' + Math.floor(Math.random() * 16777215).toString(16);

                            const embed = new EmbedBuilder()
                                .setDescription(content)
                                .setColor('White')
                                .setFooter({
                                    text: `Suggestion`,
                                    iconURL: null,
                                })
                                .setTimestamp();

                            webhook.send({
                                embeds: [embed]
                            })
                                .then(sentMessage => {
                                    sentMessage.react('👍')
                                        .then(() => sentMessage.react('👎'))
                                        .then(() => sentMessage.react('❓'))
                                        .catch(console.error);
                                })
                                .catch(console.error);

                            // Delete the original message sent by the user
                            message.delete();
                        })
                        .catch(console.error);
                }
            }
        } catch (error) {
            console.log(error);
            return;
        }

    }
}