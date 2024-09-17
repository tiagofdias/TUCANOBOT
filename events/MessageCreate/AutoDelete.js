require('dotenv').config();
const path = require('path');
const AutoDelete = require(path.join(__dirname, '..', '..', 'models', 'AutoDelete'));
const { Events } = require('discord.js');

module.exports = {
	name: Events.MessageCreate,
	once: false,
	async execute(message) {

		//Autodelete
		try {

			//Query para ver se o text-channel já existe na BD
			const QueryChannelID = await AutoDelete.count({ where: { ChannelID: message.channel.id } });

			if (QueryChannelID === 1) {

				//Query para obter os segundos
				const QuerySegundos = await AutoDelete.findOne({ where: { ChannelID: message.channel.id } });

				setTimeout(() => {
					if (!message.pinned) {

						message.delete().catch(console.error);
						return;
					}
				}, QuerySegundos.Seconds * 1000);

			}
		} catch (error) {
			console.log(error);
		}
    }
}