const { Events } = require('discord.js');
const AutoDelete = require('../models/AutoDelete');
const AutoPublish = require('../models/AutoPublish');
const Suggestions = require('../models/Suggestions');
const TempVCS = require('../models/TempVCS');

module.exports = {
    name: Events.ChannelDelete,
    async execute(channel) {

        try {

            switch (channel.type) {

                case 0: //text

                    //Autodelete
                    const QueryAutoDelete = await AutoDelete.count({ where: { ChannelID: channel.id } });
                    if (QueryAutoDelete === 1) await AutoDelete.destroy({ where: { ChannelID: channel.id } });

                    //Suggestions
                    const QuerySuggestions = await Suggestions.count({ where: { ChannelID: channel.id } });
                    if (QuerySuggestions === 1) await Suggestions.destroy({ where: { ChannelID: channel.id } });

                    break;

                case 2: // voice

                    const QueryTempVCS = await TempVCS.count({ where: { VCID: channel.id } });
                    if (QueryTempVCS === 1) await TempVCS.destroy({ where: { VCID: channel.id } });

                    break;

                case 5: // announcement

                    //AutoPublish
                    const QueryAutoPublish = await AutoPublish.count({ where: { ChannelID: channel.id } });
                    if (QueryAutoPublish === 1) await AutoPublish.destroy({ where: { ChannelID: channel.id } });

                    break;

                case 13: // stage

                    break;

                case 15: // forum

                    break;
            }

        } catch {
            return;
        }

    },
};