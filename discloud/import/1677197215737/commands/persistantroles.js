const { SlashCommandBuilder } = require('discord.js');

const PersistentRoles2 = require('../models/PersistantRoles2');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('persistentroles')
        .setDescription('Enable/disable persistent roles in the server.'),

    async execute(interaction) {

        if (interaction.commandName === "persistentroles") {

            // Check if persistent roles are currently enabled or disabled
            const persistentRoles = await PersistentRoles2.findOne({ where: { ServerID: interaction.guildId } });
            let status;
            if (persistentRoles && persistentRoles.Status === true) {
                // If persistent roles are currently enabled, disable them
                await PersistentRoles2.update({ Status: false }, { where: { ServerID: interaction.guildId } });
                status = "disabled";
            } else {
                // If persistent roles are currently disabled, enable them
                await PersistentRoles2.upsert({ ServerID: interaction.guildId, Status: true });
                status = "enabled";
            }

            // Respond to the user with the updated status
            interaction.reply({
                content: `Persistent roles are now ${status}. It is important to remember that in order for this command to function properly, you must prioritize the toucan role and place it at the highest point in your roles hierarchy.`,
                ephemeral: true,
            });
        }

    },
}; 