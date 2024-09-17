const path = require('path');
const Birthday = require(path.join(__dirname, '..', '..', 'models', 'Birthday'));
const BirthdayConfig = require(path.join(__dirname, '..', '..', 'models', 'BirthdayConfig'));
const cron = require('node-cron');
const { Events } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {

        //////////////////////////////

        //HORÁRIO BRASILIA = 00:00 PT
        cron.schedule('00 20 * * *', async () => {

            //Birthday

            const now = new Date();
            const month = now.getMonth() + 1; // Adding 1 because months are zero-indexed
            const day = now.getDate();

            //Remover aniversários antigos
            try {
                const birthdayConfigs = await BirthdayConfig.findAll();

                if (birthdayConfigs) {

                    birthdayConfigs.forEach(async (birthdayConfig) => {
                        const guild = client.guilds.cache.get(birthdayConfig.ServerID);

                        if (guild) {
                            const birthdayRole = guild.roles.cache.get(birthdayConfig.RoleID);
                            console.log(birthdayRole);
                            if (birthdayRole) {
                                guild.members.cache.forEach(async (member) => {
                                    try {
                                        await member.roles.remove(birthdayRole);
                                    } catch (error) {
                                        console.error(`Failed to remove birthday role from ${member.user.username} in server ${guild.name}:`, error);
                                    }
                                });
                            }
                        }
                    });

                }
            } catch (error) {
                console.log(error);
            }


            //Adicionar role 
            try {
                const birthdays = await Birthday.findAll({ where: { Month: month, Day: day } });

                if (birthdays) {

                    birthdays.forEach(async (birthday) => {
                        const guild = client.guilds.cache.get(birthday.ServerID);

                        const BirthdayConfigs = await BirthdayConfig.findAll({ where: { ServerID: birthday.ServerID } });

                        BirthdayConfigs.forEach(async (birthdayConfig) => {
                            const birthdayRole = guild.roles.cache.find(role => role.id === birthdayConfig.RoleID);

                            if (birthdayRole) {
                                if (guild && BirthdayConfigs) {
                                    const member = await guild.members.fetch(birthday.MemberID);

                                    if (member && birthdayRole) {
                                        member.roles.add(birthdayRole)
                                            .then()
                                            .catch(error => console.error('Failed to assign birthday role:', error));
                                    }
                                }
                            }
                        });

                    });

                }

            } catch (error) {
                console.error('Failed to fetch birthdays:', error);
            }
        });
    }
}