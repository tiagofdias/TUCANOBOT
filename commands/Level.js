const { SlashCommandBuilder, ApplicationCommandOptionType, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { Op, Sequelize, QueryTypes } = require('sequelize');

const canvacord = require('canvacord');
const Level = require('../models/Level');
const LevelConfig = require('../models/LevelConfig');
const LevelRoleMultiplier = require('../models/LevelRoleMultiplier');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('level-admin')
    .setDescription('Get the rank or set the XP of a user.')
    .addSubcommand(subcommand =>
      subcommand
        .setName('setxp')
        .setDescription('Set the XP of a user.')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('The user to set the XP for.')
            .setRequired(true),
        )
        .addIntegerOption(option =>
          option.setName('xp')
            .setDescription('The amount of XP to set. Can be a positive (add) or negative value (remove).')
            .setRequired(true),
        ),
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('enable')
        .setDescription('enable/disable the Levelling System')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('rolemultiplier')
        .setDescription('set/update/remove a role that multiples the earned XP by x times.')
        .addIntegerOption(option =>
          option
            .setName('operation')
            .setDescription("choose the operation that you want to do.")
            .setRequired(true)
            .addChoices(
              { name: 'Insert/Update', value: 0 },
              { name: 'Remove', value: 1 },
              { name: 'List', value: 2 },
            )
        )
        .addRoleOption(option =>
          option.setName('role')
            .setDescription('The role that will give users x times more XP.')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option
            .setName('boost')
            .setDescription("the number of times the XP is multiplier for.")
            .setRequired(false)
            .setMinValue(0)
        )

    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('xpconfig')
        .setDescription('Configures XP settings.')
        .addIntegerOption(option =>
          option
            .setName('text')
            .setDescription('The amount of XP earned per text message.')
            .setRequired(true)
            .setMinValue(0))
        .addIntegerOption(option =>
          option
            .setName('voice')
            .setDescription('The amount of XP earned per minute of voice chat.')
            .setRequired(true)
            .setMinValue(0))
        .addIntegerOption(option =>
          option
            .setName('reaction')
            .setDescription('The amount of XP earned per reacted message.')
            .setRequired(false)
            .setMinValue(0))
        .addIntegerOption(option =>
          option
            .setName('giveaway')
            .setDescription('The amount of XP earned for winning a giveaway.')
            .setRequired(false)
            .setMinValue(0))
        .addIntegerOption(option =>
          option
            .setName('pool')
            .setDescription('The amount of XP earned for participating in a pool.')
            .setRequired(false)
            .setMinValue(0))
        .addIntegerOption(option =>
          option
            .setName('moderator')
            .setDescription('The amount of XP earned for moderating a chat.')
            .setRequired(false)
            .setMinValue(0))
        .addIntegerOption(option =>
          option
            .setName('daily')
            .setDescription('The amount of XP earned for daily login.')
            .setRequired(false)
            .setMinValue(0))
    ),

  async execute(interaction) {

    if (!interaction.inGuild()) {
      interaction.reply('You can only run this command inside a server.');
      return;
    }

    switch (interaction.options.getSubcommand()) {

      case "setxp":
        const checkbot2 = interaction.options.get('user').user;
        if (checkbot2 && checkbot2.bot) return interaction.reply({ content: 'Bots cannot be ranked.', ephemeral: true });

        const userId = interaction.options.getUser('user').id;
        let xpToSet = interaction.options.getInteger('xp');

        try {
          // Find the record to get the current level
          let query = await Level.findOne({
            where: { ServerID: interaction.guild.id, MemberID: userId }
          });

          if (query) { // UPDATE
            let newXP = query.xp + xpToSet;
            let xplevel = newXP;

            let leveledUp = false;

            let level = 1;
            while (level > 0) {

              let LevelXp = (3 * (level ** 2));

              if (xplevel >= LevelXp) {
                xplevel -= LevelXp;
                level++;
                leveledUp = true;
              } else break;

            }

            if (leveledUp) {
              const user = await interaction.client.users.fetch(userId);

              user.send(`${user} you have leveled up to **level ${level}**.`);

            }

            if (newXP <= 0) {
              newXP = 0;
              xplevel = 0;
              level = 1;
            }

            await query.update({ xp: newXP, xplevel: xplevel, level: level });

            // Check if the new level is greater than the current level
            await interaction.reply({ content: `Success. The operation was completed successfully.`, ephemeral: true });

          } else { // INSERT

            let newXP = xpToSet;
            let xplevel = newXP;

            let leveledUp = false;

            let level = 1;
            while (level > 0) {

              let LevelXp = (3 * (level ** 2));

              if (xplevel >= LevelXp) {
                xplevel -= LevelXp;
                level++;
                leveledUp = true;
              } else break;

            }

            if (leveledUp) {
              const user = await interaction.client.users.fetch(userId);

              user.send(`${user} you have leveled up to **level ${level}**.`);

            }

            if (newXP <= 0) {
              newXP = 0;
              xplevel = 0;
              level = 1;
            }

            await Level.create({
              ServerID: interaction.guild.id,
              MemberID: userId,
              xp: xpToSet,
              xplevel: xplevel,
              level: level
            });

            await interaction.reply({ content: `Success. The operation was completed successfully.`, ephemeral: true });

          }
        } catch (error) {
          console.error(error);
          await interaction.reply({ content: 'An error occurred while setting the XP.', ephemeral: true });
        }
        break;

      case "xpconfig":

        const textXP = interaction.options.getInteger('text');
        const voiceXP = interaction.options.getInteger('voice');
        const reactionXP = interaction.options.getInteger('reaction');
        const giveawayXP = interaction.options.getInteger('giveaway');
        const poolXP = interaction.options.getInteger('pool');
        const moderatorXP = interaction.options.getInteger('moderator');
        const dailyXP = interaction.options.getInteger('daily');

        let levelConfig = await LevelConfig.findOne({ where: { ServerID: interaction.guildId } });

        if (!levelConfig) {  //INSERT

          levelConfig = await LevelConfig.create({
            ServerID: interaction.guildId,
            TextXP: textXP,
            VoiceXP: voiceXP,
            ReactionXP: reactionXP,
            GiveawayXP: giveawayXP,
            PoolXP: poolXP,
            ModeratorXP: moderatorXP,
            DailyXP: dailyXP
          });

        } else  //UPDATE
        {

          levelConfig.TextXP = textXP;
          levelConfig.VoiceXP = voiceXP;
          levelConfig.ReactionXP = reactionXP;
          levelConfig.GiveawayXP = giveawayXP;
          levelConfig.PoolXP = poolXP;
          levelConfig.ModeratorXP = moderatorXP;
          levelConfig.DailyXP = dailyXP;

          await levelConfig.save();
        }

        await interaction.reply({ content: 'XP config updated successfully.', ephemeral: true });

        break;

      case "enable":

        let levelConfig2 = await LevelConfig.findOne({ where: { ServerID: interaction.guildId } });

        if (!levelConfig2) {  //INSERT

          levelConfig2 = await LevelConfig.create({
            ServerID: interaction.guildId,
            Status: true
          });

          await interaction.reply({ content: `The Levelling System is now enabled`, ephemeral: true, });

        } else  //UPDATE
        {

          if (levelConfig2.Status === false) {

            await LevelConfig.update({ Status: true }, { where: { ServerID: interaction.guildId } });

            await interaction.reply({ content: `The Levelling System is now enabled`, ephemeral: true, });

          }
          else {

            await LevelConfig.update({ Status: false }, { where: { ServerID: interaction.guildId } });

            await interaction.reply({ content: `The Levelling System is now disabled`, ephemeral: true, });

          }
        }

        break;

      case "rolemultiplier":

        const Operation = interaction.options.getInteger('operation');
        const Role = interaction.options.getRole('role');
        const Boost = interaction.options.getInteger('boost') || 1;

        if (Operation == 0) { //INSERT / UPDATE

          // Find or create the role data for the current guild and role ID
          const [roleData, created] = await LevelRoleMultiplier.findOrCreate({
            where: { ServerID: interaction.guildId, RoleID: Role.id },
            defaults: { Boost }
          });

          // If the role data already existed, update the Boost value
          if (!created) {
            roleData.Boost = Boost;
            await roleData.save();
          }

          await interaction.reply({ content: `The operation was succesfully completed.`, ephemeral: true });

        } else if (Operation == 1) { //DELETE

          // Delete the role data for the current guild and role ID
          const rowsDeleted = await LevelRoleMultiplier.destroy({ where: { ServerID: interaction.guildId, RoleID: Role.id } });

          if (rowsDeleted > 0)
            await interaction.reply({ content: `The role was succesfully deleted.`, ephemeral: true });
          else
            await interaction.reply({ content: `The Role is not in the list`, ephemeral: true });

        }
        else { //List

          let Description;

          const roleMultipliers = await LevelRoleMultiplier.findAll({
            where: { ServerID: interaction.guildId },
          });

          if (roleMultipliers.length > 0) {
            for (const roleMultiplier of roleMultipliers) {
              const role = interaction.guild.roles.cache.get(
                roleMultiplier.RoleID
              );

              Description += `<@&${role.id}> - ${roleMultiplier.Boost}x XP Boost \n`;
            }

            Description = Description.substring(9, Description.length - 2);

            let embed = new EmbedBuilder()
              .setTitle("Role Multiplier List")
              .setDescription(Description)
              .setColor('Green');

            await interaction.reply({ embeds: [embed], ephemeral: true });

          }
          else
            await interaction.reply({ content: 'The list is empty.', ephemeral: true });

        }

        break;

    }
  },
};
