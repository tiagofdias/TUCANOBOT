const { SlashCommandBuilder } = require('discord.js');

const AutoRole = require('../models/AutoRole');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autorole')
        .setDescription('Set the role for new bots and/or members')
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Set the role for new bots and/or members')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role to assign to new bots and/or members')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('The type of role to set: "bot" or "members"')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Bot', value: 'bot' },
                            { name: 'Members', value: 'user' },
                        )),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('cancel')
                .setDescription('Cancel the autorole configuration')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('The type of role to set: "bot" or "members"')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Bot', value: 'bot' },
                            { name: 'Members', value: 'user' },
                        )),
        ),

    async execute(interaction) {

        if (!interaction.isCommand() || interaction.commandName !== 'autorole') return;

        switch (interaction.options.getSubcommand()) {
            case 'set':

                const role = interaction.options.getRole('role');
                const guildId = interaction.guildId;

                // Check if the user has permission to manage roles
                if (!interaction.member.permissions.has('MANAGE_ROLES')) return interaction.reply({content: 'You do not have permission to use this command.', ephemeral: true});

                try {
                    // Find the AutoRole record for the guild
                    const autoRole = await AutoRole.findOne({ where: { serverId: guildId } });

                    // If no record exists, create a new one
                    if (!autoRole) await AutoRole.create({ serverId: guildId });

                    // Update the bot role ID or user role ID
                    const type = interaction.options.getString('type');
                    const roleId = role.id;

                    if (type === 'bot') await AutoRole.update({ botRoleId: roleId }, { where: { serverId: guildId } });
                    else if (type === 'user') await AutoRole.update({ userRoleId: roleId }, { where: { serverId: guildId } });
                    else return;

                    await interaction.reply({content: `Auto role set to ${role.name}. It is important to remember that in order for this command to function properly, you must prioritize the toucan role and place it at the highest point in your roles hierarchy.`, ephemeral: true});

                } catch (error) {
                    console.error(error);
                    await interaction.reply({content: 'An error occurred while processing this command.', ephemeral: true});
                }

                break;

            case 'cancel':

                // Check if the user has permission to manage roles
                if (!interaction.member.permissions.has('MANAGE_ROLES')) return interaction.reply({content: 'You do not have permission to use this command.', ephemeral: true});

                try {

                    // Find the AutoRole record for the guild
                    const autoRole = await AutoRole.findOne({ where: { serverId: interaction.guildId } });

                    // If no record exists, create a new one
                    if (autoRole) {

                        // Update the bot role ID or user role ID
                        const type = interaction.options.getString('type');

                        if (type === 'bot') await AutoRole.update({ botRoleId: null }, { where: { serverId: interaction.guildId } });
                        else if (type === 'user') await AutoRole.update({ userRoleId: null }, { where: { serverId: interaction.guildId } });
                        else return;

                        await interaction.reply({content: 'Auto role configuration cancelled.', ephemeral: true});
                    }
                    else{
                        await interaction.reply({content: 'The is no autoroles enabled.', ephemeral: true});
                    }

                } catch (error) {
                    console.error(error);
                    await interaction.reply({content: 'An error occurred while processing this command.', ephemeral: true});
                }

                break;
        }



    },
}; 