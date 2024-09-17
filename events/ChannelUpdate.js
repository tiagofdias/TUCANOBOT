const { Events, PermissionFlagsBits } = require('discord.js');
const RoleStatus = require('../models/RoleStatus');

module.exports = {
    name: Events.ChannelUpdate,
    async execute(oldChannel, newChannel) {

        if (oldChannel?.type === 2 && newChannel?.type === 2) {
           
            const everyoneRole = newChannel.guild.roles.everyone;
            const permissions = newChannel.permissionsFor(everyoneRole);
            const canViewChannel = permissions.has(PermissionFlagsBits.ViewChannel);

            //Sharing the screen
            const queryRoleStatus = await RoleStatus.findOne({ where: { ServerID: newChannel.guild.id, Roletype: 3 } });
            const roleID = queryRoleStatus?.RoleID;

            if (roleID) {
                const membersWithRole = newChannel.members.filter(member => !member.user.bot && member.roles.cache.has(roleID));

                if (!canViewChannel) {
                    await Promise.all(membersWithRole.map(member => member.roles.remove(roleID)));
                } else {
                    await Promise.all(newChannel.members.filter(member => !member.user.bot && member.voice?.streaming).map(member => member.roles.add(roleID)));
                }
            }

            //Recording
            const queryRoleStatus3 = await RoleStatus.findOne({ where: { ServerID: newChannel.guild.id, Roletype: 5 } });
            const roleID3 = queryRoleStatus3?.RoleID;

            if (roleID3) {
                const membersWithRole = newChannel.members.filter(member => !member.user.bot && member.roles.cache.has(roleID3));

                if (!canViewChannel) {
                    await Promise.all(membersWithRole.map(member => member.roles.remove(roleID3)));
                } else {
                    await Promise.all(newChannel.members.filter(member => !member.user.bot && member.voice?.selfVideo).map(member => member.roles.add(roleID3)));
                }
            }

            //in a VC role
            const QueryRoleStatus2 = await RoleStatus.findOne({ where: { ServerID: newChannel.guild.id, Roletype: 7 }, })
            const roleID2 = QueryRoleStatus2?.RoleID;

            if (roleID2) {
                const membersWithRole = newChannel.members.filter(member => !member.user.bot && member.roles.cache.has(roleID2));

                if (!canViewChannel) {
                    await Promise.all(membersWithRole.map(member => member.roles.remove(roleID2)));
                } else {
                    await Promise.all(newChannel.members.map(member => member.roles.add(roleID2)));
                }
            }

        } else if (oldChannel?.type === 13 && newChannel?.type === 13) {

            const everyoneRole = newChannel.guild.roles.everyone;
            const permissions = newChannel.permissionsFor(everyoneRole);
            const canViewChannel = permissions.has(PermissionFlagsBits.ViewChannel);

            //in a Stage Channel role
            const QueryRoleStatus4 = await RoleStatus.findOne({ where: { ServerID: newChannel.guild.id, Roletype: 6 }, })
            const roleID4 = QueryRoleStatus4?.RoleID;

            if (roleID4) {
                const membersWithRole = newChannel.members.filter(member => !member.user.bot && member.roles.cache.has(roleID4));

                if (!canViewChannel) {
                    await Promise.all(membersWithRole.map(member => member.roles.remove(roleID4)));
                } else {
                    await Promise.all(newChannel.members.map(member => member.roles.add(roleID4)));
                }
            }

        }
    },
};
