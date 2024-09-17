const { Events } = require('discord.js');
const PersistentRoles2 = require('../models/PersistantRoles2');
const PersistentRoles = require('../models/PersistantRoles');

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(member) {

        try {

            const persistentRoles = await PersistentRoles2.findOne({ where: { ServerID: member.guild.id } });

            if (persistentRoles && persistentRoles.Status === true) {

                let array = [];
                member.roles.cache.forEach(role => {
                    if (role.name !== '@everyone') array.push(role.id);
                });

                let arrayString = array.join(',');

                const Query = await PersistentRoles.count({
                    where: { ServerID: member.guild.id, MemberID: member.id, },
                });

                if (Query === 1) {
                    //Update
                    try {
                        const UPDATE = await PersistentRoles.update(
                            { RoleIDS: arrayString },
                            { where: { ServerID: member.guild.id, MemberID: member.id } }
                        );

                    } catch (error) {
                        if (error.name === "SequelizeUniqueConstraintError") {
                            return console.log("That tag already exists.");
                        }
                    }

                }
                else {
                    //Inserir 
                    try {
                        const INSERT = await PersistentRoles.create({
                            ServerID: member.guild.id,
                            MemberID: member.id,
                            RoleIDS: arrayString,

                        });

                    } catch (error) {
                        if (error.name === "SequelizeUniqueConstraintError") {
                            return console.log("That tag already exists.");
                        }
                    }
                }
            }

        } catch (error) {
            console.log(error);
            return;
        }

    },
};