const { Events } = require('discord.js');

const VanityRoles = require('../models/VanityRoles');
const RoleStatus = require('../models/RoleStatus');
const LevelRoleMultiplier = require('../models/LevelRoleMultiplier');

module.exports = {
    name: Events.GuildRoleDelete,
    async execute(role) {

        try {

            //Vanity Roles
            const QueryVanity = await VanityRoles.count({ where: { RoleID: role.id } })
            if (QueryVanity >= 1) await VanityRoles.destroy({ where: { RoleID: role.id } });

            //Role Status
            const QueryRoleStatus = await RoleStatus.count({ where: { RoleID: role.id } })
            if (QueryRoleStatus >= 1) await RoleStatus.destroy({ where: { RoleID: role.id } });

            //LevelRoleMultiplier
            const QueryLevelRoleMultiplier = await LevelRoleMultiplier.count({ where: { RoleID: role.id } })
            if (QueryLevelRoleMultiplier >= 1) await LevelRoleMultiplier.destroy({ where: { RoleID: role.id } });

        } catch {
            return;
        }
    },
};