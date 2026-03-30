const { Events } = require('discord.js');

const VanityRoles = require('../models/VanityRoles');
const RoleStatus = require('../models/RoleStatus');
const CacheManager = require('../utils/CacheManager');

module.exports = {
	name: Events.PresenceUpdate,
	once: false,
	async execute( oldPresence, newPresence ) {
        if (global.DATABASE_OFFLINE) return console.debug('[Safe Mode] Skipping presenceUpdate.js - database offline');


    try {

      const guild = newPresence.guild;
      const serverID = guild.id;
  
      // 0 - Playing
      // 1 - Streaming
      // 2 - Listening
      // 3 - Watching
      // 4 - Custom
      // 5 - Competing
  
      if (!newPresence.member.user.bot) {
        let TipoNewAtividades = newPresence.activities.map(function (activity) {
          return parseInt(activity.type);
        });
  
        let TipoOldAtividades = oldPresence.activities.map(function (activity) {
          return parseInt(activity.type);
        });
  
        let TipoAllAtividades = TipoNewAtividades.concat(
          TipoOldAtividades.filter((item) => TipoNewAtividades.indexOf(item) < 0)
        );
  
        const allRoleStatuses = await CacheManager.getOrFetch(
          CacheManager.keys.allRoleStatus(serverID),
          () => RoleStatus.findAll({ where: { ServerID: serverID }, raw: true })
        );

        // Filter for relevant role types
        const QueryRoleStatus = allRoleStatuses.filter(record => 
          TipoAllAtividades.includes(parseInt(record.Roletype))
        );

        let roles = {};

        QueryRoleStatus.forEach((record) => {
          roles[record.Roletype] = record.RoleID;
        });

        let RolesRemove = [];
        //Tinha no Antigo e agora nao
        let AtividadesRemove = TipoOldAtividades.filter(
          (x) => !TipoNewAtividades.includes(x)
        );

        AtividadesRemove.forEach((Atividade) => {
          roles[Atividade] != null
            ? RolesRemove.push(roles[Atividade])
            : null;
        });

        let RolesAdd = [];

        let AtividadesAdd = TipoNewAtividades;

        AtividadesAdd.forEach((Atividade) => {
          roles[Atividade] != null ? RolesAdd.push(roles[Atividade]) : null;
        });

        if (RolesRemove.length > 0) {
          await newPresence.member.roles.remove(RolesRemove);
        }

        if (RolesAdd.length > 0) {
          await newPresence.member.roles.add(RolesAdd);
        }
      }
  
      //VANITY ROLES
  
      let customStatusOld = oldPresence.activities.length > 0 ? oldPresence.activities[0].state : null;
      let customStatusNew = newPresence.activities.length > 0 ? newPresence.activities[0].state : null;
  
      const allVanityRoles = await CacheManager.getOrFetch(
        CacheManager.keys.vanityRoles(serverID),
        () => VanityRoles.findAll({ where: { ServerID: serverID } })
      );

      if (customStatusOld !== "null") {
        const Query = allVanityRoles.filter(role => role.CustomStatus === customStatusOld);
  
        if (Query.length > 0) {
          for (let i = 0; i < Query.length; i++) {
            const role = oldPresence.member.guild.roles.cache.get(Query[i].RoleID);
            if (role) {
              await oldPresence.member.roles.remove(role);
            }
          }
        }
      }
  
      if (customStatusNew !== "null") {
        const Query = allVanityRoles.filter(role => role.CustomStatus === customStatusNew);
  
        if (Query.length > 0) {
          for (let i = 0; i < Query.length; i++) {
            const role = newPresence.member.guild.roles.cache.get(Query[i].RoleID);
            if (role) {
              await newPresence.member.roles.add(role);
            }
          }
        }
      }
    } catch (error) {
    
    }
    //
	},
};


