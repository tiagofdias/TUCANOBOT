require('dotenv').config();
const { Events } = require('discord.js');
const path = require('path');
const Level = require(path.join(__dirname, '..', '..', 'models', 'Level'));
const LevelConfig = require(path.join(__dirname, '..', '..', 'models', 'LevelConfig'));
const LevelRoleMultiplier = require(path.join(__dirname, '..', '..', 'models', 'LevelRoleMultiplier'));
const cooldowns = new Set();

module.exports = {
	name: Events.MessageCreate,
	once: false,
	async execute(message) {

		//LEVEL
		if (!message.inGuild() || message.author.bot || cooldowns.has(message.author.id)) return;

		try {

			let xpToGive = null;
			let levelConfig = await LevelConfig.findOne({ where: { ServerID: message.guild.id } });

			if (levelConfig) xpToGive = levelConfig.TextXP; else xpToGive = 10

			if (levelConfig && levelConfig.Status == 1) {

				//ROLEMULTIPLIER

				////////////////////////////////////////////
				// Find all roles with boost numbers for the specified server
				const roles = await LevelRoleMultiplier.findAll({ where: { ServerID: message.guild.id } });

				if (roles) {

					// Filter the roles that the member has
					const memberRoles = message.member.roles.cache.filter(role => roles.some(r => r.RoleID === role.id));

					let highestBoostRoleBoost = 1;

					if (memberRoles.size != 0) {

						// Get the role with the highest boost number
						const highestBoostRole = memberRoles.reduce((prev, current) => {
							const prevRoleBoost = roles.find(r => r.RoleID === prev.id)?.Boost ?? 0;
							const currentRoleBoost = roles.find(r => r.RoleID === current.id)?.Boost ?? 0;
							return currentRoleBoost > prevRoleBoost ? current : prev;
						});

						// Get the boost number of the highestBoostRole
						highestBoostRoleBoost = roles.find(r => r.RoleID === highestBoostRole.id)?.Boost ?? 1;

					}

					xpToGive *= highestBoostRoleBoost;
				}

				////////////////////////////////////////////

				const query = await Level.findOne({ where: { ServerID: message.guild.id, MemberID: message.author.id } });

				if (query) //UPDATE
				{
					let nextLevelXp = 3 * (query.level ** 2);

					query.xp += xpToGive;
					query.xplevel += xpToGive;

					let leveledUp = false;

					while (query.xplevel >= nextLevelXp) {
						query.level++;
						query.xplevel -= nextLevelXp;
						nextLevelXp = 3 * (query.level ** 2);
						leveledUp = true;
					}

					if (leveledUp) message.member.send(`${message.member} you have leveled up to **level ${query.level}**.`);

					await query.save().catch((e) => {
						console.log(`Error saving updated level ${e}`);
						return;
					});

					//Cooldown de 60 sec
					cooldowns.add(message.author.id);
					setTimeout(() => {
						cooldowns.delete(message.author.id);
					}, 60000);
				}
				else  //INSERT
				{

					const XP_FORMULA = (newLevel) => 3 * (newLevel ** 2);

					// Initialize variables
					let currentLevel = 1;
					let remainingXP = xpToGive;

					let leveledUp = false;
					// Loop through levels until remainingXP is smaller than the XP for the next level
					while (remainingXP >= XP_FORMULA(currentLevel)) {
						remainingXP -= XP_FORMULA(currentLevel);
						currentLevel++;
						leveledUp = true;
					}

					// create new level
					const newLevel = new Level({
						ServerID: message.guild.id,
						MemberID: message.author.id,
						xp: xpToGive,
						xplevel: remainingXP,
						level: currentLevel
					});

					await newLevel.save();

					if (leveledUp) message.member.send(`${message.member} you have leveled up to **level ${currentLevel}**.`);
					
					cooldowns.add(message.author.id);
					setTimeout(() => {
						cooldowns.delete(message.author.id);
					}, 60000); //60 secs de cooldown 
				}
			}

		} catch (error) {
			console.log(`Error giving xp: ${error}`);
		}
    }
}