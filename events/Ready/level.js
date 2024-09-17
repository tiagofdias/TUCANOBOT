const path = require('path');
const Level = require(path.join(__dirname, '..', '..', 'models', 'Level'));
const LevelConfig = require(path.join(__dirname, '..', '..', 'models', 'LevelConfig'));
const LevelRoleMultiplier = require(path.join(__dirname, '..', '..', 'models', 'LevelRoleMultiplier'));
const { Events } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {

        //LEVEL
        setInterval(async () => {

            client.guilds.cache.forEach(async (guild) => {

                guild.channels.cache.forEach(async (channel) => {

                    // Check if the channel is a voice channel
                    if (channel.type === 2) {
                        channel.members.forEach(async (member) => {

                            try {

                                let levelConfig = await LevelConfig.findOne({ where: { ServerID: guild.id } });
                                let xpToGive = null;
                                if (levelConfig) xpToGive = levelConfig.VoiceXP;
                                if (levelConfig && levelConfig.Status == 1 && !member.voice.selfMute && !member.voice.serverMute && !member.voice.deaf && !member.voice.selfDeaf) {

                                    //ROLEMULTIPLIER
                                    ////////////////////////////////////////////
                                    // Find all roles with boost numbers for the specified server
                                    const roles = await LevelRoleMultiplier.findAll({ where: { ServerID: guild.id } });

                                    if (roles) {

                                        // Filter the roles that the member has
                                        const memberRoles = member.roles.cache.filter(role => roles.some(r => r.RoleID === role.id));

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

                                    const query = await Level.findOne({ where: { ServerID: guild.id, MemberID: member.id } });

                                    if (query)  //UPDATE
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

                                        if (leveledUp) member.send(`${member} you have leveled up to **level ${query.level}**.`);

                                        await query.save().catch((e) => {
                                            console.log(`Error saving updated level ${e}`);
                                            return;
                                        });

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
                                            ServerID: guild.id,
                                            MemberID: member.id,
                                            xp: xpToGive,
                                            xplevel: remainingXP,
                                            level: currentLevel
                                        });

                                        await newLevel.save();

                                        if (leveledUp) member.send(`${member} you have leveled up to **level ${currentLevel}**.`);

                                    }
                                }

                            } catch (error) {
                                console.log(`Error giving xp: ${error}`);
                            }

                        });
                    }
                });
            });
        }, 60000); // Repeat every minute (60,000 milliseconds)

    }
}