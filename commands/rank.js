const { SlashCommandBuilder, ApplicationCommandOptionType, AttachmentBuilder, } = require('discord.js');
const { Op, Sequelize, QueryTypes } = require('sequelize');

const canvacord = require('canvacord');
const calculateLevelXp = require('../utils/calculateLevelXp');
const Level = require('../models/Level');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('gets the rank of a user.')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to get the rank for.')
        .setRequired(true)),

  async execute(interaction) {

    if (!interaction.inGuild()) {
      interaction.reply('You can only run this command inside a server.');
      return;
    }

    const Member = interaction.options.get('user')?.value;

    const checkbot = interaction.options.get('user').user;
    if (checkbot && checkbot.bot) return interaction.reply({ content: 'Bots cannot be ranked.', ephemeral: true });

    await interaction.deferReply();

    const member = await interaction.guild.members.fetch(Member);

    const count = await Level.findOne({ where: { ServerID: interaction.guildId.toString(), MemberID: Member }, order: [['xp', 'DESC'],], });

    let level = count.level;
    let currentXP = count.xp;
    let requiredXP = calculateLevelXp(level + 1);
    let username = member.user.username;
    let discriminator = member.user.discriminator;
    let status;

    try{
      status = member.presence.status;
    }
    catch{
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
    const attachment = new AttachmentBuilder(data);
    interaction.editReply({ files: [attachment] });

  },
}; 