require('dotenv').config();
const path = require('path');
const ActiveRoles = require(path.join(__dirname, '..', '..', 'models', 'ActiveRoles'));
const ActiveRolesConfig = require(path.join(__dirname, '..', '..', 'models', 'ActiveRolesConfig'));
const { Events } = require('discord.js');
const cooldowns = new Set();

module.exports = {
	name: Events.MessageCreate,
	once: false,
	async execute(message) {

        if (!message.inGuild() || message.author.bot || cooldowns.has(message.author.id)) return;

		//Active Members

		const QueryActiveRolesConfig = await ActiveRolesConfig.findOne({ where: { ServerID: message.guild.id } });

		if (QueryActiveRolesConfig && QueryActiveRolesConfig.Enabled === true) {

			let [activeRole, created] = await ActiveRoles.findOrCreate({
				where: { ServerID: message.guild.id, MemberID: message.author.id },
				defaults: { Points: 0 },
			});

			if (activeRole) {
				activeRole.Points += QueryActiveRolesConfig.PointsPerMsg;

				// Teto máximo
				if (activeRole.Points > QueryActiveRolesConfig.PointsCeiling) {
					activeRole.Points = QueryActiveRolesConfig.PointsCeiling;
				}

				// Update the activeRole directly if it was not created
				if (!created) {
					await activeRole.update({ Points: activeRole.Points });
				}

				// Role - Limite
				const role = message.guild.roles.cache.get(QueryActiveRolesConfig.RoleID);

				if (activeRole.Points >= QueryActiveRolesConfig.PointsLimit) {
					await message.member.roles.add(role);
				} else {
					await message.member.roles.remove(role);
				}
			}

            cooldowns.add(message.author.id);
            setTimeout(() => {
                cooldowns.delete(message.author.id);
            }, 60000); //60 secs de cooldown 
		}

    }
}