const { Events } = require('discord.js');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (global.DATABASE_OFFLINE) {
			const errorMessage = { content: '⚠️ The database is currently unavailable. The bot is running in Safe Mode and some features are temporarily disabled. Please try again later.', flags: 64 };
			try {
				if (interaction.replied || interaction.deferred) await interaction.followUp(errorMessage);
				else await interaction.reply(errorMessage);
			} catch(e) {}
			return;
		}

		if (!interaction.isChatInputCommand()) return;

		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(`Error executing ${interaction.commandName}`);
			console.error(error);
			
			// Try to respond to the user so they don't see "Application did not respond"
			try {
				const errorMessage = { content: 'There was an error executing this command.', flags: 64 };
				if (interaction.replied || interaction.deferred) {
					await interaction.followUp(errorMessage);
				} else {
					await interaction.reply(errorMessage);
				}
			} catch (replyError) {
				console.error('Failed to send error response:', replyError);
			}
		}
	},
};
