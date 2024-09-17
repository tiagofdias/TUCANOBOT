const { Events } = require('discord.js');

const PersistentRoles2 = require('../models/PersistantRoles2');
const PersistentRoles = require('../models/PersistantRoles');
const AutoRole = require('../models/AutoRole');

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {

    try {

        //Isto tudo é para verificar se a role do bot tá no topo da hierarquia.
        ///////////////////////////////////////////////////////////
        const client = member.client;
        const guild = client.guilds.cache.get(member.guild.id);
        // Get all the roles in the server as an array
        const roles = Array.from(guild.roles.cache.values());
        // assume `roles` is an array of all roles in the hierarchy
        let highestRole = null;
        roles.forEach(role => { if (!highestRole || role.position > highestRole.position) highestRole = role; });

        if (highestRole.name !== 'Toucan Bot') return;

        //////////////////////////////////////////////////////////

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