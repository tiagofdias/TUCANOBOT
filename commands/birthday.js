const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Birthday = require('../models/Birthday');
const BirthdayConfig = require('../models/BirthdayConfig');

module.exports = {

    data: new SlashCommandBuilder()
        .setName('birthday')
        .setDescription('Manage birthdays')
        .addSubcommand(subcommand =>
            subcommand
                .setName('role')
                .setDescription('Set the birthday role for this server')
                .addRoleOption(option =>
                    option.setName('role').setDescription('The role to set as the birthday role').setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a birthday')
                .addUserOption(option =>
                    option.setName('user').setDescription('The user to add a birthday for').setRequired(true)
                )
                .addIntegerOption(option =>
                    option
                        .setName('month')
                        .setDescription("The month of the birthday.")
                        .setRequired(true)
                        .addChoices(
                            { name: 'January', value: 1 },
                            { name: 'February', value: 2 },
                            { name: 'March', value: 3 },
                            { name: 'April', value: 4 },
                            { name: 'May', value: 5 },
                            { name: 'June', value: 6 },
                            { name: 'July', value: 7 },
                            { name: 'August', value: 8 },
                            { name: 'September', value: 9 },
                            { name: 'October', value: 10 },
                            { name: 'November', value: 11 },
                            { name: 'December', value: 12 },
                        ))
                        .addIntegerOption(option =>
                            option
                              .setName('day')
                              .setDescription('The day of the birthday')
                              .setRequired(true)
                              .setMinValue(1)
                              .setMaxValue(31)
                          )
                
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a birthday')
                .addUserOption(option =>
                    option.setName('user').setDescription('The user to remove the birthday for').setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all birthdays')
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'add': {
                const user = interaction.options.getUser('user');
                const month = interaction.options.getInteger('month');
                const day = interaction.options.getInteger('day');

                try {
                    await Birthday.upsert({ ServerID: interaction.guild.id, MemberID: user.id, Month: month, Day: day });
                    await interaction.reply({ content: `${user.username}'s birthday has been added or updated.`, ephemeral: true });
                } catch (error) {
                    console.error('Failed to add or update birthday:', error);
                    await interaction.reply({ content: 'Failed to add or update the birthday.', ephemeral: true });
                }
                break;
            }

            case 'remove': {
                const user = interaction.options.getUser('user');

                try {
                    await Birthday.destroy({ where: { ServerID: interaction.guild.id, MemberID: user.id } });
                    await interaction.reply({ content: `${user.username}'s birthday has been removed.`, ephemeral: true });
                } catch (error) {
                    console.error('Failed to remove birthday:', error);
                    await interaction.reply({ content: 'Failed to remove the birthday.', ephemeral: true });
                }
                break;
            }

            case 'list': {

                try {
                    const birthdays = await Birthday.findAll({ where: { ServerID: interaction.guildId.toString() }, });

                    if (birthdays.length === 0) {
                        await interaction.reply({ content: 'There are no birthdays recorded.', ephemeral: true });
                        return;
                    }

                    let Description;

                    birthdays.forEach(birthday => {
                        const member = interaction.guild.members.cache.get(birthday.MemberID);
                        const birthdayString = `${member} - ${birthday.Month}/${birthday.Day}`;
                        Description += ` ${birthdayString} `;
                    });

                    Description = Description.substring(9, Description.length);

                    const embed = new EmbedBuilder()
                        .setTitle('Birthday List')
                        .setDescription(` \n ${Description} `)
                        .setColor('#FF0000');

                    await interaction.reply({ embeds: [embed], ephemeral: true });

                } catch (error) {
                    console.error('Failed to fetch birthdays:', error);
                    await interaction.reply({ content: 'Failed to fetch the birthdays.', ephemeral: true });
                }

                break;
            }
            case 'role': {
                const role = interaction.options.getRole('role');

                try {
                    await BirthdayConfig.upsert({ ServerID: interaction.guild.id, RoleID: role.id });
                    await interaction.reply({ content: `Birthday role set to ${role.name}.`, ephemeral: true });
                } catch (error) {
                    console.error('Failed to set the birthday role:', error);
                    await interaction.reply({ content: 'Failed to set the birthday role.', ephemeral: true });
                }
                break;
            }

            default:
                await interaction.reply({ content: 'Invalid subcommand.', ephemeral: true });

                break;
        }
    },
};

