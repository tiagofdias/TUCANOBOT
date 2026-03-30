const { Events } = require('discord.js');

module.exports = {
	name: Events.GuildMemberUpdate,
	async execute(oldMember, newMember) {
        if (global.DATABASE_OFFLINE) return console.debug('[Safe Mode] Skipping GuildMemberUpdate.js - database offline');

		
	},
};