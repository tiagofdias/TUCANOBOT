const { Events } = require('discord.js');

const PersistentRoles2 = require('../models/PersistantRoles2');
const PersistentRoles = require('../models/PersistantRoles');
const AutoRole = require('../models/AutoRole');

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {

    try {

      //Autorole
      const autoRoles = await AutoRole.findAll({ where: { serverId: member.guild.id } });
      for (const autoRole of autoRoles) {
        if (member.user.bot && autoRole.botRoleId) {
          const botRole = member.guild.roles.cache.get(autoRole.botRoleId);
          if (botRole) {
            await member.roles.add(botRole);
          }
        } else if (!member.user.bot && autoRole.userRoleId) {
          const userRole = member.guild.roles.cache.get(autoRole.userRoleId);
          if (userRole) {
            await member.roles.add(userRole);
          }
        }
      }


      //Persistant Roles
      const persistentRoles = await PersistentRoles2.findOne({ where: { ServerID: member.guild.id } });

      if (persistentRoles && persistentRoles.Status === true) {

        const Query = await PersistentRoles.findAll({
          where: { ServerID: member.guild.id, MemberID: member.id },
        });

        if (Query.length === 1) {

          const result = Query[0].RoleIDS;

          const Array = result.split(",");
          Array.forEach(resultado => {
            const role = member.guild.roles.cache.get(resultado);

            if (role) {
              member.roles.add(role);
            }
          });
        }
      }

    } catch (error) {
      console.log(error);
      return;
    }
  },
};