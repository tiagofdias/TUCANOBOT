const { Events } = require('discord.js');

const database = require('../database/database');

const VanityRoles = require('../models/VanityRoles');
const RoleStatus = require('../models/RoleStatus');

module.exports = {
	name: Events.PresenceUpdate,
	once: false,
	async execute( oldPresence, newPresence ) {

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
  
        await RoleStatus.findAll({
          where: { ServerID: serverID, Roletype: TipoAllAtividades },
          raw: true,
        }).then(async function (QueryRoleStatus) {
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
        });
      }
  
      //VANITY ROLES
  
      //const guild = newPresence.guild;
      //const serverID = guild.id;
  
      let customStatusOld = oldPresence.activities.length > 0 ? oldPresence.activities[0].state : null;
      let customStatusNew = newPresence.activities.length > 0 ? newPresence.activities[0].state : null;
  
      if (customStatusOld !== "null") {
        const Query = await VanityRoles.findAll({ where: { ServerID: serverID, CustomStatus: customStatusOld } });
  
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
        const Query = await VanityRoles.findAll({ where: { ServerID: serverID, CustomStatus: customStatusNew } });
  
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


