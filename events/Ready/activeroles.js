const path = require('path');
const ActiveRoles = require(path.join(__dirname, '..', '..', 'models', 'ActiveRoles'));
const ActiveRolesConfig = require(path.join(__dirname, '..', '..', 'models', 'ActiveRolesConfig'));
const cron = require('node-cron');

const { Events } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {

        //ACTIVE ROLES
        cron.schedule('*/10 * * * *', async () => {

            client.guilds.cache.each(async (guild) => {

                const QueryActiveRolesConfig = await ActiveRolesConfig.findOne({ where: { ServerID: guild.id } });

                if (QueryActiveRolesConfig && QueryActiveRolesConfig.Enabled === true) {

                    //////////////////////////////////////////////// PARA OS QUE TAO FORA DO VC

                    guild.members.cache.each(async (member) => {
                        const serverID = guild.id;
                        const memberID = member.id;

                        if (!member.voice.channel && !member.user.bot) {

                            const activeRole = await ActiveRoles.findOne({
                                where: { ServerID: serverID, MemberID: memberID },
                            });

                            if (activeRole) {
                                activeRole.Points -= QueryActiveRolesConfig.PointsLost;

                                // Teto mínimo
                                if (activeRole.Points < 0) activeRole.Points = 0;

                                await activeRole.save();

                                //Role - Limite
                                const role = guild.roles.cache.get(QueryActiveRolesConfig.RoleID);

                                if (activeRole.Points >= QueryActiveRolesConfig.PointsLimit) await member.roles.add(role);
                                else await member.roles.remove(role);

                            }

                        }
                    });

                    //////////////////////////////////////////////// PARA OS QUE TAO DENTRO DE UM VC
                    const voiceChannels = guild.channels.cache.filter(channel => channel.type === 2);

                    voiceChannels.each(async channel => {
                        const channelMembers = channel.members;

                        //DAR PONTOS A QUEM ESTÁ NO VC COMO DEVE DE SER
                        channelMembers.each(async member => {

                            const serverID = guild.id;
                            const memberID = member.id;

                            if (!member.voice.selfMute && !member.voice.serverMute && !member.voice.deaf && !member.voice.selfDeaf && !member.user.bot) {

                                const [activeRole, created] = await ActiveRoles.findOrCreate({
                                    where: { ServerID: serverID, MemberID: memberID },
                                    defaults: { Points: QueryActiveRolesConfig.PointsPerVoice },
                                });

                                if (!created) {
                                    activeRole.Points += QueryActiveRolesConfig.PointsPerVoice;

                                    //Teto máximo
                                    if (activeRole.Points > QueryActiveRolesConfig.PointsCeiling) activeRole.Points = QueryActiveRolesConfig.PointsCeiling;

                                    await activeRole.save();

                                }
                            }
                            else {

                                const activeRole = await ActiveRoles.findOne({
                                    where: { ServerID: serverID, MemberID: memberID },
                                });

                                if (activeRole) {
                                    activeRole.Points -= QueryActiveRolesConfig.PointsLost;

                                    // Teto mínimo
                                    if (activeRole.Points < 0) activeRole.Points = 0;

                                    await activeRole.save();
                                }

                            }

                            if (!member.user.bot) {
                                const activeRole = await ActiveRoles.findOne({
                                    where: { ServerID: serverID, MemberID: memberID },
                                });

                                //Role - Limite
                                const role = guild.roles.cache.get(QueryActiveRolesConfig.RoleID);

                                if (activeRole.Points >= QueryActiveRolesConfig.PointsLimit) await member.roles.add(role);
                                else await member.roles.remove(role);
                            }

                        });
                    });

                }
            });
        });

    }
}