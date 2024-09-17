require('dotenv').config();
const path = require('path');
const AutoPublish = require(path.join(__dirname, '..', '..', 'models', 'AutoPublish'));
const { Events, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
    name: Events.MessageCreate,
    once: false,
    async execute(message) {

        //AUTOPUBLISH
        if (!message.embeds.length && message.channel.type === ChannelType.GuildAnnouncement) {

            try {
                //Query para ver se o text-channel já existe na BD
                const QueryChannelID = await AutoPublish.count({ where: { ChannelID: message.channel.id } });

                if (QueryChannelID === 1) {

                    if (message.content.split('\n').length > 1) {

                        const content = message.content;
                        const lines = content.split('\n');
                        const title = lines[0];
                        const description = lines.slice(1).join('\n');
                        const color = '#' + Math.floor(Math.random() * 16777215).toString(16);

                        const embed = new EmbedBuilder()
                            .setTitle(title)
                            .setDescription(description)
                            .setColor(color)
                            .setTimestamp();

                        // Delete the original message sent by the user
                        message.delete();

                        message.channel.send({ embeds: [embed] })
                            .then(sentMessage => {
                                // Crosspost the message
                                sentMessage.crosspost()
                                    .catch(console.error);
                            })
                            .catch(console.error);

                    }
                    else {
                        message.delete();
                        //DM
                  
                         message.author.send("To send an embed inside the announcement channel you'll need to use the first line as a title and the other lines as a description.\n\nExample:\nThis the the Title\nThis is the description");
      
                    }

                }
            } catch {
                return;
            }
        }
    }
}
