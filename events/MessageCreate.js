require('dotenv').config();
const AutoDelete = require('../models/AutoDelete');
const AutoPublish = require('../models/AutoPublish');
const Suggestions = require('../models/Suggestions');
const AutoScreenshot = require('../models/AutoScreenshot');
const CHATGPT = require('../models/CHATGPT');
const { Events, EmbedBuilder, ChannelType, AttachmentBuilder } = require('discord.js');
const puppeteer = require('puppeteer');

// ChatGPT is disabled - set openai to null
const openai = null;
const MSG_LENGTH_LIMIT = 500;
const AI_SYSTEM_PROMPT = 'You are a helpful assistant.';

// Screenshot helper (kept small & self‑contained)
async function takeWebsiteScreenshot(message, url) {
	let browser;
	try {
		console.log(`[SCREENSHOT] Starting browser for: ${url}`);
		browser = await puppeteer.launch({
			headless: 'new',
			args: [
				'--no-sandbox',
				'--disable-setuid-sandbox',
				'--disable-dev-shm-usage',
				'--disable-accelerated-2d-canvas',
				'--disable-gpu',
				'--window-size=1920,1080',
			],
		});
		const page = await browser.newPage();
		await page.setViewport({ width: 1920, height: 1080 });
		await page.setUserAgent(
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
		);
		console.log(`[SCREENSHOT] Navigating to: ${url}`);
		await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
		await new Promise((r) => setTimeout(r, 2000));
		console.log(`[SCREENSHOT] Taking screenshot...`);
		const screenshot = await page.screenshot({ type: 'png', fullPage: false });
		const attachment = new AttachmentBuilder(screenshot, { name: 'website-screenshot.png' });
		const embed = new EmbedBuilder()
			.setTitle('📸 Website Screenshot')
			.setDescription(url)
			.setImage('attachment://website-screenshot.png');
		console.log(`[SCREENSHOT] Sending screenshot to Discord...`);
		await message.reply({ embeds: [embed], files: [attachment] });
		console.log(`[SCREENSHOT] Screenshot sent successfully!`);
	} catch (err) {
		console.error(`[SCREENSHOT ERROR] ${url}:`, err.message);
		try {
			await message.reply(`⚠️ Could not screenshot: ${err.message}`);
		} catch {}
	} finally {
		if (browser) await browser.close().catch(() => {});
	}
}

module.exports = {
	name: Events.MessageCreate,
	async execute(message) {
        if (global.DATABASE_OFFLINE) return console.debug('[Safe Mode] Skipping MessageCreate.js - database offline');

		// Leveling logic removed from this file; handled in events/MessageCreate/Level.js
		if (!message.inGuild()) return;

		// SUGGESTIONS
		try {
			const exists = await Suggestions.count({ where: { ChannelID: message.channel.id } });
			if (exists === 1) {
				if (!message.embeds.length && message.channel.type === ChannelType.GuildText) {
					const memberName = message.member.displayName;
					const memberAvatar = message.author.avatarURL();
					message.channel
						.fetchWebhooks()
						.then((webhooks) => {
							const existing = webhooks.find((w) => w.name === memberName);
							return existing
								? existing
								: message.channel.createWebhook({ name: memberName, avatar: memberAvatar });
						})
						.then((webhook) => {
							const content = message.content;
							const embed = new EmbedBuilder()
								.setDescription(content)
								.setColor('White')
								.setFooter({ text: 'Suggestion' })
								.setTimestamp();
							webhook
								.send({ embeds: [embed] })
								.then((sent) => sent.react('👍').then(() => sent.react('👎')).then(() => sent.react('❓')))
								.catch(console.error);
							message.delete().catch(() => {});
						})
						.catch(console.error);
				}
			}
		} catch (e) {
			/* ignore suggestions errors */
		}

		// AUTOPUBLISH
		if (!message.embeds.length && message.channel.type === ChannelType.GuildAnnouncement) {
			try {
				const exists = await AutoPublish.count({ where: { ChannelID: message.channel.id } });
				if (exists === 1) {
					if (message.content.split('\n').length > 1) {
						const lines = message.content.split('\n');
						const title = lines[0];
						const description = lines.slice(1).join('\n');
						const color = '#' + Math.floor(Math.random() * 16777215).toString(16);
						const embed = new EmbedBuilder().setTitle(title).setDescription(description).setColor(color).setTimestamp();
						message.delete().catch(() => {});
						message.channel
							.send({ embeds: [embed] })
							.then((sent) => sent.crosspost().catch(console.error))
							.catch(console.error);
					} else {
						message.delete().catch(() => {});
						message.author
							.send(
								"To send an embed in this announcement channel use the first line as a title and the remaining lines as the description.\n\nExample:\nTitle Line\nDescription line 1\nDescription line 2"
							)
							.catch(() => {});
					}
				}
			} catch (e) {
				/* ignore autopublish errors */
			}
		}

		// AUTODELETE
		try {
			const exists = await AutoDelete.count({ where: { ChannelID: message.channel.id } });
			if (exists === 1) {
				const row = await AutoDelete.findOne({ where: { ChannelID: message.channel.id } });
				setTimeout(() => {
					if (!message.pinned) message.delete().catch(() => {});
				}, row.Seconds * 1000);
			}
		} catch (e) {
			/* ignore autodelete errors */
		}

		// AI CHAT
		try {
			if (openai) { // Only run AI if OpenAI is available
				const chatCfg = await CHATGPT.findOne({ where: { ServerID: message.guild.id, ChannelID: message.channel.id } });
				if (chatCfg && chatCfg.ChannelID === message.channel.id && !message.author.bot && !message.content.startsWith('!')) {
				await message.channel.sendTyping();
				if (message.content.length > MSG_LENGTH_LIMIT) {
					const embed = new EmbedBuilder()
						.setDescription("Whoa now, I'm not going to read all that. Maybe summarize?")
						.setColor('White');
					return void message.reply({ embeds: [embed] });
				}
				let prev = await message.channel.messages.fetch({ limit: 75 });
				prev = prev.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
				const conversation = [{ role: 'system', content: AI_SYSTEM_PROMPT }];
				prev.forEach((m) => {
					if (m.content.startsWith('!')) return;
					if (m.content.length > MSG_LENGTH_LIMIT) return;
					if (m.author.id !== message.author.id) return;
					conversation.push({ role: 'user', content: m.content });
				});
				const result = await openai.chat.completions.create({ model: 'gpt-3.5-turbo', messages: conversation });
				const out = result.choices[0].message.content;
				if (out.length >= 2000) {
					for (let i = 0; i < out.length; i += 2000) {
						const chunk = out.substring(i, i + 2000);
						const embed = new EmbedBuilder().setDescription(chunk).setColor('White');
						await message.reply({ embeds: [embed] });
					}
				} else {
					const embed = new EmbedBuilder().setDescription(out).setColor('White');
					await message.reply({ embeds: [embed] });
				}
			}
			} // Close the openai if statement
		} catch (e) {
			console.log(`Error with ChatGPT: ${e}`);
		}

		// URL SCREENSHOT (only in configured channels)
		try {
			if (!message.author.bot) {
				// Check if automatic screenshots are enabled for this channel
				const screenshotEnabled = await AutoScreenshot.findOne({
					where: { ServerID: message.guild.id, ChannelID: message.channel.id }
				});
				
				if (screenshotEnabled) {
					const urlRegex = /(https?:\/\/[^\s]+)/gi;
					const urls = message.content.match(urlRegex);
					if (urls && urls.length) {
						console.log(`[SCREENSHOT] Found URL: ${urls[0]}`);
						const url = urls[0];
						const skip = ['discord.com', 'discordapp.com', 'cdn.discordapp.com', 'media.discordapp.net'].some((d) =>
							url.includes(d)
						);
						if (!skip) {
							console.log(`[SCREENSHOT] Taking screenshot of: ${url}`);
							await takeWebsiteScreenshot(message, url);
						} else {
							console.log(`[SCREENSHOT] Skipped URL (Discord domain): ${url}`);
						}
					}
				}
			}
		} catch (e) {
			console.log(`Error with URL screenshot: ${e}`);
		}
	},
};
