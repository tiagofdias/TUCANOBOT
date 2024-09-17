const { SlashCommandBuilder } = require('discord.js');

const ActiveRolesConfig = require('../models/ActiveRolesConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('activeroles')
        .setDescription('Set the role for new bots and/or members')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('configure the active roles system.')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role to assign to active members.')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option
                        .setName('pointspervoice')
                        .setDescription("The number of points awarded per voice activity.")
                        .setRequired(true)
                        .setMinValue(1)
                )
                .addIntegerOption(option =>
                    option
                        .setName('pointspermsg')
                        .setDescription("The number of points awarded per message.")
                        .setRequired(true)
                        .setMinValue(1)
                )
                .addIntegerOption(option =>
                    option
                        .setName('pointslost')
                        .setDescription("The number of points lost per penalty.")
                        .setRequired(true)
                        .setMinValue(1)
                )
                .addIntegerOption(option =>
                    option
                        .setName('pointslimit')
                        .setDescription("The maximum points a user can accumulate.")
                        .setRequired(true)
                        .setMinValue(1)
                )
                .addIntegerOption(option =>
                    option
                        .setName('pointsceiling')
                        .setDescription("The maximum points a user can reach.")
                        .setRequired(true)
                        .setMinValue(1)
                )
                .addIntegerOption(option =>
                    option
                        .setName('bonuspoints')
                        .setDescription("The maximum points a user can reach.")
                        .setRequired(true)
                        .setMinValue(1)
                )
                .addBooleanOption(option =>
                    option
                        .setName('enabled')
                        .setDescription("Enable or disable the active roles system.")
                        .setRequired(true)
                )
        ),

    async execute(interaction) {

        if (!interaction.isCommand() || interaction.commandName !== 'activeroles') return;

        //Isto tudo é para verificar se a role do bot tá no topo da hierarquia.
        ///////////////////////////////////////////////////////////
        const client = interaction.client;
        const guild = client.guilds.cache.get(interaction.guild.id);
        // Get all the roles in the server as an array
        const roles = Array.from(guild.roles.cache.values());
        // assume `roles` is an array of all roles in the hierarchy
        let highestRole = null;
        roles.forEach(role => { if (!highestRole || role.position > highestRole.position) highestRole = role; });

        if (highestRole.name !== 'Toucan Bot') return interaction.reply({ content: `The operation was cancelled. In order for this command to function properly, you must prioritize the Toucan Bot role and place it at the highest point in your roles hierarchy.`, ephemeral: true, });

        //////////////////////////////////////////////////////////

        switch (interaction.options.getSubcommand()) {

            case 'setup':

                const role = interaction.options.getRole('role');
                const pointsPerVoice = interaction.options.getInteger('pointspervoice');
                const pointsPerMsg = interaction.options.getInteger('pointspermsg');
                const pointsLost = interaction.options.getInteger('pointslost');
                const pointsLimit = interaction.options.getInteger('pointslimit');
                const pointsCeiling = interaction.options.getInteger('pointsceiling');
                const bonuspoints = interaction.options.getInteger('bonuspoints');
                const enabled = interaction.options.getBoolean('enabled');

                // Perform any validation or error handling for the options
                  await ActiveRolesConfig.upsert({
                    ServerID: interaction.guild.id,
                    RoleID: role.id,
                    PointsPerVoice: pointsPerVoice,
                    PointsPerMsg: pointsPerMsg,
                    PointsLost: pointsLost,
                    PointsLimit: pointsLimit,
                    PointsCeiling: pointsCeiling,
                    Enabled: enabled,
                    BonusPoints: bonuspoints
                });   

                interaction.reply({ content: 'Active roles system has been configured.', ephemeral: true, });

                break;

        }
    },
}; 