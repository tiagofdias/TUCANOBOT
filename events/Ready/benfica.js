const path = require('path');
const BenficaDay = require(path.join(__dirname, '..', '..', 'models', 'Benfica'));
const cron = require('node-cron');
const { Events } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {

        //HORÁRIO BRASILIA = 00:00 PT
        cron.schedule('00 20 * * *', async () => {

            //Dia de Benfica
            const servers = await BenficaDay.findAll({
                where: { Status: 1 },
                attributes: ['ServerID'],
                raw: true,
            });

            const serverIDs = Array.from(new Set(servers.map((s) => s.ServerID)));

            for (const serverID of serverIDs) {
                const rolesData = await BenficaDay.findAll({ where: { ServerID: serverID } });

                for (const roleData of rolesData) {
                    const guild = client.guilds.cache.get(serverID);
                    if (!guild) {
                        console.error(`Error fetching guild ${serverID}`);
                        continue;
                    }

                    const role = guild.roles.cache.get(roleData.RoleID);
                    if (role) await role.setColor(roleData.Colour);
                }

                const guild = client.guilds.cache.get(serverID);
                if (!guild) {
                    console.error(`Error fetching guild ${serverID}`);
                    continue;
                }

                await BenficaDay.update({ Status: 0 }, { where: { ServerID: serverID } })
                    .catch(err => {
                        console.error(`Error updating status for server ${serverID}:`, err);
                    });

                const newIcon = 'https://img.favpng.com/2/24/0/cristiano-ronaldo-uefa-champions-league-indian-institute-of-technology-madras-portugal-national-football-team-euroleague-png-favpng-i3HbYUe2W014QpeXSdHXTvShw.jpg';
                guild.setIcon(newIcon)
                    .then(() => {

                    })
                    .catch(err => {
                        console.error(`Error setting icon for server ${serverID}:`, err);
                    });
            }

        });
    }
}