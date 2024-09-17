const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const VanityRoles = require('../models/VanityRoles');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('vanityroles')
		.setDescription('assign users a role based on their custom status.')
		.addSubcommand(subcommand => 
			subcommand
			.setName('add')
			.setDescription('assign users a role based on their custom status.')
			.addRoleOption(option => 
				option.setName('role')
					.setDescription('The role given after matching the custom status.')
					.setRequired(true)
			)
			.addStringOption(option =>
				option
				.setName('text')
				.setDescription('Write your custom status text')
				.setRequired(true)
			)
		)
		.addSubcommand(subcommand => 
			subcommand
			.setName('remove')
			.setDescription('removes a role based on their custom status.')
			.addIntegerOption(option => 
				option
					.setName('index')
					.setDescription("The index that you wanna remove. If you don't know the index use /vanityroles list")
					.setRequired(true)
			)
		)
		.addSubcommand(subcommand => 
			subcommand
			.setName('list')
			.setDescription('list all the vanity roles.')
		),
	async execute(interaction) {
		
		try {

			if (interaction.options.getSubcommand()){

				switch (interaction.options.getSubcommand()){
					case "add" :

						const role = interaction.options.get('role').value;
    					const customstatus = interaction.options.get('text').value;

    					VanityRoles.count({ where: { CustomStatus: customstatus, RoleID: role } })
      						.then(QueryVanity => {
        					if (QueryVanity === 0) {
          						VanityRoles.create({
            						ServerID: interaction.guildId.toString(),
            						RoleID: role,
            						CustomStatus: customstatus
          						})
            					.then(() => interaction.reply({ content: "Your vanity was successfully created", ephemeral: true }))
            					.catch(error => {
              						if (error.name === 'SequelizeUniqueConstraintError') {
                						interaction.reply('That tag already exists.');
              						} else {
                						interaction.reply('Something went wrong.');
              						}
            					});
        					} else {
          						interaction.reply({ content: "This vanity already exists", ephemeral: true });
        					}
      					});
					

					break;

					case "remove" :
						
						const id = interaction.options.get('index').value;
						const count = await VanityRoles.count({ where: { IDVanity: id } });
				
						if (count === 1) {
					  		await VanityRoles.destroy({ where: { IDVanity: id } });
					  		interaction.reply({ content: `The vanity role has been successfully deleted from the list`, ephemeral: true });
						} else
					  		interaction.reply({ content: `The ID is not in the list. Please check /vanityroles list to get the correct Index`, ephemeral: true });
						

					break;

					case "list" :
						
						const serverId = interaction.guildId.toString();
						const list = await VanityRoles.findAll({ where: { ServerID: serverId } });
				
						if (list.length > 0) {
					  		const description = `These are the saved vanity roles:\n\n${list.map(({ IDVanity, RoleID, CustomStatus }) =>
							`${IDVanity} - <@&${RoleID}> - ${CustomStatus}\n`
					  		).join('')}`;
				
					  		const embed = new EmbedBuilder()
								.setTitle("Vanity Roles List")
								.setDescription(description)
								.setColor('Green');
				
					  			interaction.reply({ embeds: [embed], ephemeral: true });
						} else {
					  		interaction.reply({ content: `The list is empty`, ephemeral: true });
						}

					break;
				}
				
			}

		} catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
				return interaction.editReply('That tag already exists.');
			}

            console.log(error);

			return interaction.editReply('Something went wrong with adding a tag.');
        }

	},
};
