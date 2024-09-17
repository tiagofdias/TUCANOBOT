//First, lets require the database definition file:
require('dotenv').config();
const AutoDelete = require('../models/AutoDelete');
const CHATGPT = require('../models/CHATGPT');
const AutoPublish = require('../models/AutoPublish');
const Suggestions = require('../models/Suggestions');
const { Client, Events, EmbedBuilder, ChannelType } = require('discord.js');
const db = require('../database/database');
const { model } = require('../database/database');
const { Configuration, OpenAIApi } = require('openai');

//AI
const configuration = new Configuration({
	organization: 'org-s3Hpc4kxpaebLgL4UxYiCno3',
	apiKey: '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',
});
const openai = new OpenAIApi(configuration);
const msgLengthLimit = 2000;
const context = 'You are a friendly chatbot in Discord.';

module.exports = {
	name: Events.MessageCreate,
	once: false,
	async execute(message) {

		const guild = client.guilds.cache.get('your_guild_id_here');
		const botRole = guild.me.roles.highest;

		if (botRole.position === guild.roles.cache.size - 1) {
			console.log('Bot role is at the top of the role hierarchy');
		} else {
			console.log('Bot role is not at the top of the role hierarchy');
		}


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
		} catch {
			return;
		}

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
		} catch {
			return;
		}

		//AI
		try {
			const client = message.client;
			const serverID = message.guild.id;

			const Query = await CHATGPT.findOne({
				where: { ServerID: serverID, ChannelID: message.channel.id },
			});

			if (message.author.bot) return;
			if (Query.ChannelID != message.channel.id) return;
			if (message.content.startsWith('!')) return;

			await message.channel.sendTyping();

			if (message.content.length > msgLengthLimit) {

				const embed = new EmbedBuilder()
					.setDescription("Whoa now, I'm not going to read all that. Maybe summarize?")
					.setColor('White');

				message.reply({ embeds: [embed] });

				return;
			}

			let prevMessages = await message.channel.messages.fetch({ limit: 75 });
			prevMessages = prevMessages.sort((a, b) => a - b);

			let conversationLog = [{ role: 'system', content: context }];

			prevMessages.forEach((msg) => {
				if (msg.content.startsWith('!')) return;
				if (msg.content.length > msgLengthLimit) return;
				if (msg.author.id !== client.user.id && message.author.bot) return;
				if (msg.author.id !== message.author.id) return;

				conversationLog.push({
					role: 'user',
					content: `${msg.content}`,
				});
			});

			const result = await openai.createChatCompletion({
				model: 'gpt-3.5-turbo',
				messages: conversationLog,
			});

			const messageContent = result.data.choices[0].message.content;
			const messageLength = messageContent.length;

			if (messageLength >= 2000) {
				// Split the text into multiple messages of maximum 2000 characters
				const numChunks = Math.ceil(messageLength / 2000);
				const chunks = [];

				for (let i = 0; i < numChunks; i++) {
					const start = i * 2000;
					const end = Math.min(start + 2000, messageLength);
					const chunk = messageContent.substring(start, end);
					chunks.push(chunk);
				}

				// Send each chunk as a separate message
				for (let i = 0; i < chunks.length; i++) {
					const chunkMessage = chunks[i];

					// Replace the original message with each chunk
					result.data.choices[0].message.content = chunkMessage;

					// Send the chunk as a message
					const embed = new EmbedBuilder()
						.setDescription(chunkMessage)
						.setColor('White');

					message.reply({ embeds: [embed] });

				}
			} else {
				// If the text is shorter than 2000 characters, send it as a single message
				const embed = new EmbedBuilder()
					.setDescription(messageContent)
					.setColor('White');

				message.reply({ embeds: [embed] });
			}

		} catch {
			return;
		}

		//
	},
};
