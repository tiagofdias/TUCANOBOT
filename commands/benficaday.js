const { SlashCommandBuilder } = require('discord.js');
const BenficaDay = require('../models/Benfica');
const { Sequelize, Op } = require('sequelize');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('benficaday')
        .setDescription('HOJE É CONTRA QUEM? JE NE SAIS PA.')
        .addIntegerOption(option =>
            option.setName('operation')
                .setDescription('Select the operation to perform')
                .setRequired(true)
                .addChoices(
                    { name: 'Activate', value: 0 },
                    { name: 'Desactivate', value: 1 },
                )
        ),
        guildID: process.env.GUILD_ID,
    async execute(interaction) {
        try {

            if (!interaction.isCommand()) return;

            const operation = parseInt(interaction.options.get('operation').value);

            if (operation === 0) {

                await interaction.reply({ content: '1904 1904 LALALALALA', ephemeral: true });

                const roles = await interaction.guild.roles.fetch();

                for (const role of roles.values()) {
                    // Skip the @everyone role
                    if (role.name === '@everyone' || role.name === 'Toucan Bot') continue;
                    if (role.hexColor === '#ff0000') continue;

                    //nao ta a mudar o status
                        await BenficaDay.upsert({
                        ServerID: interaction.guild.id,
                        RoleID: role.id,
                        Colour: role.hexColor,
                        Status: true,
                    });

                }

                for (const role of roles.values()) {

                    if (role.name === '@everyone' || role.name === 'Toucan Bot') continue;
                    await role.setColor('#ff0000');
                }

                const client = interaction.client;
                const guildId = interaction.guildId;

                client.guilds.fetch(guildId)
                    .then(guild => {
                        const newIcon = 'https://pbs.twimg.com/media/Fu37WTBXgAIi7Bx?format=jpg&name=small';
                        guild.setIcon(newIcon)
                            .then()
                            .catch();
                    })
                    .catch();

            } else if (operation === 1) {

                await interaction.reply({ content: 'E O BENFICA GANHOUUUUU!!!!!', ephemeral: true });

                const rolesData = await BenficaDay.findAll({ where: { ServerID: interaction.guildId.toString() }, });

                for (const roleData of rolesData) {

                    const role = await interaction.guild.roles.fetch(roleData.RoleID);
                    if (role) await role.setColor(roleData.Colour);
                }

                const client = interaction.client;
                const guildId = interaction.guildId;

                client.guilds.fetch(guildId)
                    .then(guild => {
                        const newIcon = 'https://img.favpng.com/2/24/0/cristiano-ronaldo-uefa-champions-league-indian-institute-of-technology-madras-portugal-national-football-team-euroleague-png-favpng-i3HbYUe2W014QpeXSdHXTvShw.jpg';
                        guild.setIcon(newIcon)
                            .then()
                            .catch();
                    })
                    .catch();

            }
            
        } catch (error) {
            console.log(error)
        }
    },
};