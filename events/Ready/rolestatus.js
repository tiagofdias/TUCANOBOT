const path = require('path');
const RoleStatus = require(path.join(__dirname, '..', '..', 'models', 'RoleStatus'));
const CacheManager = require(path.join(__dirname, '..', '..', 'utils', 'CacheManager'));

const { Events } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {

        setInterval(async () => {
            if (global.DATABASE_OFFLINE) return console.debug('[Safe Mode] Skipping interval in rolestatus.js');


            client.guilds.cache.forEach(async (guild) => {

                //Role Status - Serve para remover/dar as roles em caso de o bot ir abaixo
                try {

                    const queries = [
                        { Roletype: 7 },
                        { Roletype: 6 },
                        { Roletype: 5 },
                        { Roletype: 3 }
                    ];

                    await Promise.all(
                        queries.map(async (query) => {
                            const queryResult = await CacheManager.getOrFetch(
                                CacheManager.keys.roleStatus(guild.id, query.Roletype),
                                () => RoleStatus.findOne({
                                    where: { ServerID: guild.id, ...query }
                                })
                            );

                            if (queryResult) {
                                const role = guild.roles.cache.get(queryResult.RoleID);
                                if (!role) return; // Role doesn't exist anymore
                                
                                // Use cached members instead of fetching all members
                                // This is much more efficient and won't timeout on Render
                                const membersNotInVoice = guild.members.cache.filter((member) => {
                                    return member.roles.cache.has(role.id) && !member.voice.channel;
                                });

                                membersNotInVoice.forEach((member) => {
                                    member.roles.remove(role.id).catch(console.error);
                                });
                            }
                        })
                    );

                } catch (error) {
                    console.log(error)
                }
      
            });
        }, 60000); // Repeat every minute (60,000 milliseconds)

        /* try {
            client.guilds.cache.forEach(async (guild) => {
              const serverID = guild.id;
        
              // Fetch all members and their presence information
              await guild.members.fetch();
        
              guild.members.cache.forEach(async (member) => {
                if (!member.user.bot) {
                  const newPresence = member.presence;
        
                  if (newPresence && newPresence.activities) {
                    let TipoNewAtividades = newPresence.activities.map(function (activity) {
                      return parseInt(activity.type);
                    });
        
                    await RoleStatus.findAll({
                      where: { ServerID: serverID },
                      raw: true,
                    }).then(async function (QueryRoleStatus) {
                      let roles = {};
        
                      QueryRoleStatus.forEach((record) => {
                        roles[record.Roletype] = record.RoleID;
                      });
        
                      let RolesToRemove = [];
                      let RolesToAdd = [];
        
                      Object.keys(roles).forEach((Atividade) => {
                        const roleID = roles[Atividade];
                        const atividadeType = parseInt(Atividade);
        
                        const hadRoleBeforeOffline = member.roles.cache.has(roleID);
        
                        if (TipoNewAtividades.includes(atividadeType) && !hadRoleBeforeOffline) {
                          RolesToAdd.push(roleID);
                        } else if (!TipoNewAtividades.includes(atividadeType) && hadRoleBeforeOffline) {
                          RolesToRemove.push(roleID);
                        }
                      });
        
                      if (RolesToRemove.length > 0) {
                        await member.roles.remove(RolesToRemove);
                      }
        
                      if (RolesToAdd.length > 0) {
                        await member.roles.add(RolesToAdd);
                      }
                    });
                  }
                }
              });
            });
          } catch (error) {
            console.error(error);
          } */
          
    }
}