const { Client, Intents, Permissions, SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
//const Maintenance = require('../models/Maintenance');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('maintenance')
        .setDescription('activate the server maintenance')
        .addSubcommand(subcommand =>
            subcommand
                .setName('enable')
                .setDescription('put the server in a maintenance state.')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('disable')
                .setDescription('removes the server from the maintenance state.')
        ),

    async execute(interaction) {

        switch (interaction.options.getSubcommand()) {

            case "enable":

                try {
                    const server = interaction.guild;

                    // Get the Toucan bot role
                 //   const botRole = server.roles.cache.find(role => role.name === 'Toucan Bot');

                    // Save the View permission state for all roles except the bot role
                  // const roles = server.roles.cache.filter(role => role !== botRole);

                 /*    for (const role of roles.values()) {
                        const viewPermissionEnabled = role.permissions.has(PermissionFlagsBits.ViewChannel);
                        await Maintenance.upsert({
                            ServerID: server.id,
                            RoleID: role.id,
                            Status: viewPermissionEnabled,
                        });
                    }  */

                    //Desactivate the view channel roles
                    const everyoneRole = server.roles.everyone;
                    //const newPermissions = everyoneRole.permissions.remove(PermissionFlagsBits.ViewChannel);
                    everyoneRole.setPermissions(everyoneRole.permissions.remove(PermissionFlagsBits.ViewChannel));
                  //  for (const role of roles.values()) await role.setPermissions(newPermissions);

                    // Create the channel
                    const client = interaction.client;
                    const guild = client.guilds.cache.get(server.id);

                    const maintenancechannel = await guild.channels.create({
                        name: "Maintenance",
                        type: ChannelType.GuildText,
                        // parent: newChannel.parent,
                        permissionOverwrites: [
                            // @EVERYONE
                            {
                                id: guild.id,
                                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
                                deny: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageWebhooks, PermissionFlagsBits.ManageRoles,
                                PermissionFlagsBits.CreateInstantInvite, PermissionFlagsBits.SendMessages, PermissionFlagsBits.SendMessagesInThreads,
                                PermissionFlagsBits.CreatePublicThreads, PermissionFlagsBits.CreatePrivateThreads, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AttachFiles,
                                PermissionFlagsBits.AddReactions, PermissionFlagsBits.UseExternalEmojis, PermissionFlagsBits.UseExternalStickers, PermissionFlagsBits.MentionEveryone, PermissionFlagsBits.ManageMessages,
                                PermissionFlagsBits.ManageThreads, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.SendTTSMessages, PermissionFlagsBits.UseApplicationCommands],
                            },
                        ],
                    })

                    let embed = new EmbedBuilder()
                        .setTitle("Maintenance Mode")
                        .setDescription(`The server is currently in maintenance.
                    You should be able to use the server when the downtime ends.
                    We apologize for the inconvenience.`)
                        .setColor('#e8ff00');

                    maintenancechannel.send({ embeds: [embed], ephemeral: true });

                    await interaction.reply({ content: 'Maintenance has started.', ephemeral: true });

                } catch (err) {
                    console.error(err);
                }

                break;

            case "disable":

                try {

                    const server = interaction.guild;

      /*               const roles = await server.roles.fetch(); // Use fetch to get the updated roles

                    //Desactivate the view channel roles
                    for (const role of roles.values()) {

                        const maintenanceRoles = await Maintenance.findOne({ where: { RoleID: role.id } });

                        if (maintenanceRoles && maintenanceRoles.Status === true) await role.setPermissions(role.permissions.add(PermissionFlagsBits.ViewChannel));
                        else if (maintenanceRoles && maintenanceRoles.Status === false) await role.setPermissions(role.permissions.remove(PermissionFlagsBits.ViewChannel));

                    } */

                    const everyoneRole = server.roles.everyone;
                    everyoneRole.setPermissions(everyoneRole.permissions.add(PermissionFlagsBits.ViewChannel));

                    //Delete Maintenence channel
                    const channels = await server.channels.fetch();

                    channels.forEach(channel => {
                        if (channel.type === 0 && channel.name.includes("maintenance")) channel.delete();
                    });

                    await interaction.reply({ content: 'Maintenance has ended.', ephemeral: true });

                } catch (err) {
                    console.error(err);
                }

                break;
        }
    }
}