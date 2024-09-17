const { SlashCommandBuilder, ApplicationCommandOptionType, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { Op, Sequelize, QueryTypes } = require('sequelize');

const canvacord = require('canvacord');
const Level = require('../models/Level');
const canvatoplvl = require("@alfr3xd/discordcards");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('level')
    .setDescription('Get the rank or set the XP of a user.')
    .addSubcommand(subcommand =>
      subcommand
        .setName('rank')
        .setDescription('Get the rank of a user.')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('The user to get the rank for.')
            .setRequired(true),
        ),
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('toplvl')
        .setDescription('Shows the TOP 10 members with the most XP inside the server.')
    ),

  async execute(interaction) {

    if (!interaction.inGuild()) {
      interaction.reply('You can only run this command inside a server.');
      return;
    }

    switch (interaction.options.getSubcommand()) {

      case "rank":

        const checkbot = interaction.options.get('user').user;
        if (checkbot && checkbot.bot) return interaction.reply({ content: 'Bots cannot be ranked.', ephemeral: true });

        const Member = interaction.options.get('user')?.value;

        const member = await interaction.guild.members.fetch(Member);

        const count = await Level.findOne({ where: { ServerID: interaction.guildId.toString(), MemberID: Member }, order: [['xp', 'DESC'],], });

        if (count === null) return interaction.reply({ content: `This user doesn't have rank yet.`, ephemeral: true });

        let level = count.level;
        let currentXP = count.xplevel;
        let requiredXP = 3 * (level ** 2);
        let username = member.user.username;
        let discriminator = member.user.discriminator;
        let status;

        try {
          status = member.presence.status;
        }
        catch {
          status = 'offline'
        }

        //rank
        const position = await Level.sequelize.query(`
        SELECT COUNT(*) + 1 as position FROM Level WHERE ServerID = :serverId AND xp > ( SELECT xp FROM Level WHERE ServerID = :serverId AND MemberID = :memberId)`,
          {
            replacements: {
              serverId: interaction.guildId,
              memberId: Member
            },
            type: QueryTypes.SELECT
          });

        const rank = new canvacord.Rank()
          .setAvatar(member.user.displayAvatarURL({ size: 256 }))
          .setRank(position[0].position)
          .setLevel(level)
          .setCurrentXP(currentXP)
          .setRequiredXP(requiredXP)
          .setStatus(status)
          .setProgressBar('#00ffff', 'COLOR')
          .setUsername(username)
          .setDiscriminator(discriminator);

        const data = await rank.build();

        const attachment = new AttachmentBuilder(data, 'avatar.png');

        interaction.reply({ files: [attachment], ephemeral: true });

        break;

      case "toplvl":

        try {

          Level.findAll({
            where: { ServerID: interaction.guild.id },
            order: [['xp', 'DESC']],
            limit: 10
          }).then(async levels => {
            const leaderboardData = levels.map((level, index) => {
              const member = interaction.guild.members.cache.get(level.MemberID);
              if (member) {
                let requiredXP = 3 * (level.level ** 2);
                
                return {
                  avatar: member.user.avatarURL({ dynamic: true }),
                  tag: member.user.tag.split("#")[0],
                  level: level.level,
                  xp: level.xplevel,
                  max_xp: requiredXP,
                  top: index + 1
                };
              } else {
                return null;
              }
            }).filter(leaderboardEntry => leaderboardEntry !== null);

            const toplvl = new canvatoplvl.Ranking()
              .setUsersData(leaderboardData);

            const data2 = await toplvl.render();
           
            const attachment2 = new AttachmentBuilder(data2, 'avatar.png');

            interaction.reply({ files: [attachment2], ephemeral: true });
          });

        } catch (error) {
          console.error(error);
        }

        break;

    }
  },
};
