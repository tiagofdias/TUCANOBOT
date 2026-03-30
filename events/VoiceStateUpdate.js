const { Events, ChannelType, Collection, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, PermissionOverwrites, Permissions } = require('discord.js');
const TempVCS = require('../models/TempVCS');
const RoleStatus = require('../models/RoleStatus');
const VoiceLogs = require('../models/VoiceLogs');
const ActiveRoles = require('../models/ActiveRoles');
const ActiveRolesConfig = require('../models/ActiveRolesConfig');
const CacheManager = require('../utils/CacheManager');
let voiceManager = new Collection();

module.exports = {
  name: Events.VoiceStateUpdate,
  async execute(oldState, newState) {
        if (global.DATABASE_OFFLINE) return console.debug('[Safe Mode] Skipping VoiceStateUpdate.js - database offline');


    const { member, guild } = oldState;
    const newChannel = newState.channel;
    const oldChannel = oldState.channel;

    //Isto tudo é para verificar se a role do bot tá no topo da hierarquia.
    ///////////////////////////////////////////////////////////
    const client = member.client;
    const guild2 = client.guilds.cache.get(member.guild.id);
    // Get all the roles in the server as an array
    const roles = Array.from(guild2.roles.cache.values());
    // assume `roles` is an array of all roles in the hierarchy
    let highestRole = null;
    roles.forEach(role => { if (!highestRole || role.position > highestRole.position) highestRole = role; });

    if (highestRole.name !== 'Toucan Bot') return member.user.send('The toucan Bot role needs to be the highest role in the hierarchy for this to work.');

    //////////////////////////////////////////////////////////

    //Join
    if (newChannel) {

      if (newChannel.type === 2) { //IN A VOICE CHANNEL

        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const hours = String(currentDate.getHours()).padStart(2, '0');
        const minutes = String(currentDate.getMinutes()).padStart(2, '0');
        const seconds = String(currentDate.getSeconds()).padStart(2, '0');

        const formattedTime = `${hours}:${minutes}:${seconds}`;
        const formattedDate = `${year}-${month}-${day}`;

        //ACTIVE POINTS BONUS
        const QueryVoiceLogsToday = await VoiceLogs.findAll({ where: { ServerID: guild.id, MemberID: newState.member.id, Date: formattedDate }, })

        if (QueryVoiceLogsToday.length === 0) {

          const currentDate = new Date();
          currentDate.setDate(currentDate.getDate() - 1);
          const year = currentDate.getFullYear();
          const month = String(currentDate.getMonth() + 1).padStart(2, '0');
          const day = String(currentDate.getDate()).padStart(2, '0');

          const formattedDates = `${year}-${month}-${day}`;

          const QueryVoiceLogsYesterday = await VoiceLogs.findAll({ where: { ServerID: guild.id, MemberID: newState.member.id, Date: formattedDates }, })

          if (QueryVoiceLogsYesterday.length > 0) {

            //DAR BONUS

            const QueryActiveRolesConfig = await CacheManager.getOrFetch(
              CacheManager.keys.activeRolesConfig(guild.id),
              () => ActiveRolesConfig.findOne({ where: { ServerID: guild.id } })
            );

            if (QueryActiveRolesConfig && QueryActiveRolesConfig.Enabled === true) {

              const activeRole = await ActiveRoles.findOne({
                where: { ServerID: guild.id, MemberID: newState.member.id },
              });

              if (activeRole) {
                activeRole.Points += QueryActiveRolesConfig.BonusPoints;

                // Teto mínimo
                if (activeRole.Points < 0) activeRole.Points = 0;

                //Teto máximo
                if (activeRole.Points > QueryActiveRolesConfig.PointsCeiling) activeRole.Points = QueryActiveRolesConfig.PointsCeiling;

                await activeRole.save();

                //Role - Limite
                const role = guild.roles.cache.get(QueryActiveRolesConfig.RoleID);

                if (activeRole.Points >= QueryActiveRolesConfig.PointsLimit) await newState.member.roles.add(role);
                else await newState.member.roles.remove(role);

              }

            }
          }
        }

        //VOICE LOGS

        try {
          await VoiceLogs.create({ ServerID: guild.id, MemberID: newState.member.id, Type: true, Date: formattedDate, Hours: formattedTime });
        } catch (error) {
          console.error('Failed to create a voice log:', error);
        }

        //in a Stage Channel
        const QueryRoleStatus2 = await CacheManager.getOrFetch(
          CacheManager.keys.roleStatus(guild.id, 6),
          () => RoleStatus.findOne({ where: { ServerID: guild.id, Roletype: 6 } })
        );
        if (QueryRoleStatus2) newState.member.roles.remove(QueryRoleStatus2.RoleID);

        //in a VC role
        const QueryRoleStatus = await CacheManager.getOrFetch(
          CacheManager.keys.roleStatus(newChannel.guild.id, 7),
          () => RoleStatus.findOne({ where: { ServerID: newChannel.guild.id, Roletype: 7 } })
        );

        if (QueryRoleStatus) {

          const everyoneRole = newChannel.guild.roles.everyone;
          const permissions = newChannel.permissionsFor(everyoneRole);
          const canViewChannel = permissions.has(PermissionFlagsBits.ViewChannel);

          if (canViewChannel) newState.member.roles.add(QueryRoleStatus.RoleID); else newState.member.roles.remove(QueryRoleStatus.RoleID);

        }

      } else if (newChannel.type === 13) { //STAGE CHANNEL

        //in a VC role
        const QueryRoleStatus2 = await CacheManager.getOrFetch(
          CacheManager.keys.roleStatus(guild.id, 7),
          () => RoleStatus.findOne({ where: { ServerID: guild.id, Roletype: 7 } })
        );
        if (QueryRoleStatus2) newState.member.roles.remove(QueryRoleStatus2.RoleID);

        //in a Stage Channel role
        const QueryRoleStatus = await CacheManager.getOrFetch(
          CacheManager.keys.roleStatus(newChannel.guild.id, 6),
          () => RoleStatus.findOne({ where: { ServerID: newChannel.guild.id, Roletype: 6 } })
        );

        if (QueryRoleStatus) {

          const everyoneRole = newChannel.guild.roles.everyone;
          const permissions = newChannel.permissionsFor(everyoneRole);
          const canViewChannel = permissions.has(PermissionFlagsBits.ViewChannel);

          if (canViewChannel) newState.member.roles.add(QueryRoleStatus.RoleID); else newState.member.roles.remove(QueryRoleStatus.RoleID);

        }

      }
    }

    //Leave
    if (oldChannel) {

      if (oldChannel.type === 2 && newChannel == null || oldChannel.type === 13 && newChannel == null) {

        //VOICE LOGS

        try {
          const currentDate = new Date();
          const year = currentDate.getFullYear();
          const month = String(currentDate.getMonth() + 1).padStart(2, '0');
          const day = String(currentDate.getDate()).padStart(2, '0');
          const hours = String(currentDate.getHours()).padStart(2, '0');
          const minutes = String(currentDate.getMinutes()).padStart(2, '0');
          const seconds = String(currentDate.getSeconds()).padStart(2, '0');

          const formattedTime = `${hours}:${minutes}:${seconds}`;
          const formattedDate = `${year}-${month}-${day}`;

          await VoiceLogs.create({ ServerID: guild.id, MemberID: newState.member.id, Type: false, Date: formattedDate, Hours: formattedTime });
        } catch (error) {
          console.error('Failed to create a voice log:', error);
        }

        //in a VC role
        const QueryRoleStatus = await CacheManager.getOrFetch(
          CacheManager.keys.roleStatus(guild.id, 7),
          () => RoleStatus.findOne({ where: { ServerID: guild.id, Roletype: 7 } })
        );
        if (QueryRoleStatus) newState.member.roles.remove(QueryRoleStatus.RoleID);

        //in a Stage Channel
        const QueryRoleStatus2 = await CacheManager.getOrFetch(
          CacheManager.keys.roleStatus(guild.id, 6),
          () => RoleStatus.findOne({ where: { ServerID: guild.id, Roletype: 6 } })
        );
        if (QueryRoleStatus2) newState.member.roles.remove(QueryRoleStatus2.RoleID);

      }
    }

    /////////////////////////////////////////
    if (oldChannel?.type === 2 && newChannel?.type === 2) {
      const everyoneRole = newChannel.guild.roles.everyone;
      const permissions = newChannel.permissionsFor(everyoneRole);
      const canViewChannel = permissions.has(PermissionFlagsBits.ViewChannel);

      //Screen Share
      const QueryRoleStatus = await CacheManager.getOrFetch(
        CacheManager.keys.roleStatus(newChannel.guild.id, 3),
        () => RoleStatus.findOne({ where: { ServerID: newChannel.guild.id, Roletype: 3 } })
      );

      if (QueryRoleStatus) {

        if (canViewChannel && newState.streaming) newState.member.roles.add(QueryRoleStatus.RoleID);
        else newState.member.roles.remove(QueryRoleStatus.RoleID);

      }

      //Recording
      const QueryRoleStatus2 = await CacheManager.getOrFetch(
        CacheManager.keys.roleStatus(newChannel.guild.id, 5),
        () => RoleStatus.findOne({ where: { ServerID: newChannel.guild.id, Roletype: 5 } })
      );

      if (QueryRoleStatus2) {

        if (canViewChannel && newState.selfVideo) newState.member.roles.add(QueryRoleStatus2.RoleID);
        else newState.member.roles.remove(QueryRoleStatus2.RoleID);

      }
    }

    ////////////////////////////////////

    let query = null;
    if (newChannel != null) query = await TempVCS.findOne({ where: { ServerID: newChannel.guild.id, VCID: newChannel.id } });

    if (oldChannel !== newChannel && newChannel && query) {

      const voiceChannel = await guild.channels.create({
        name: "Your Mom's Room",
        type: ChannelType.GuildVoice,
        parent: newChannel.parent,
        userLimit: query.UserLimit,
        bitrate: query.BitRate * 1000
      })

      voiceManager.set(member.id, voiceChannel.id);

      await newChannel.permissionOverwrites.edit(member, {
        Connect: false
      });

      setTimeout(() => {
        newChannel.permissionOverwrites.delete(member);
      }, 30000)

      return setTimeout(async () => {
        // Check if member is still connected to voice before moving
        if (!member.voice.channel) {
          // Member disconnected, clean up the empty channel
          voiceChannel.delete().catch(() => null);
          voiceManager.set(member.id, null);
          return;
        }
        
        try {
          await member.voice.setChannel(voiceChannel);
        } catch (error) {
          console.error('Failed to move member to temp VC:', error.message);
          voiceChannel.delete().catch(() => null);
          voiceManager.set(member.id, null);
          return;
        }

        // ✅ Step 1: Give the channel creator ManageChannels permission
        voiceChannel.permissionOverwrites.edit(member, {
          Connect: true,
          ManageChannels: true
        });

        // ✅ Give @everyone role ManageChannels permission so all members can use the panel
        voiceChannel.permissionOverwrites.edit(guild.id, {
          ManageChannels: true
        });

        let embed = new EmbedBuilder()
          .setTitle("🔊 | Temporary Voice Channel's Panel")
          .setDescription(`You can customise your channel with this interaction panel.
              
              🔒 | Switches your channel's privacy.
              👀 | Switches your channel's visibility.
              📹 | Switches the streaming permissions.
              🎙️ | Switches the push to talk mode.
              ➕ | Increase by 1 your channel's user limit.
              ➖ | Decrease by 1 your channel's user limit.
              
              **All server members can use these controls.**
              `)
          .setColor('Red');

        /*  :region: | Change your channel's region.
            :name: | Edit your channel's name.
            :host: | Claims the channel's hosting. */

        //Botões
        const row = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('bttPrivacy')
              .setEmoji('🔒')
              //.setEmoji('<:faze:722543777155383317>')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('bttVisibility')
              .setLabel('👀')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('bttStreaming')
              .setLabel('📹')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('bttPushToTalk')
              .setLabel('🎙️')
              .setStyle(ButtonStyle.Primary),
          )
        const row2 = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('bttIncreaseUserLimit')
              .setLabel('➕')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('bttDecreaseUserLimit')
              .setLabel('➖')
              .setStyle(ButtonStyle.Primary),
          )

        voiceChannel.send({ embeds: [embed], components: [row, row2] });

        const collector = voiceChannel.createMessageComponentCollector();

        //Evento do bttPrivacy
        collector.on('collect', async i => {

          // ✅ Step 2: Add Permission Checks - Only channel owner or users with ManageChannels permission
          const hasManagePermission = voiceChannel.permissionsFor(i.member).has(PermissionFlagsBits.ManageChannels);
          const isChannelOwner = voiceManager.get(i.member.id) === voiceChannel.id;
          const isServerOwner = i.member.guild.ownerId === i.member.id;
          
          if (!hasManagePermission && !isChannelOwner && !isServerOwner) {
            return i.reply({ 
              content: '❌ You don\'t have permission to control this voice channel. Only the channel owner or users with "Manage Channels" permission can use these buttons.', 
              ephemeral: true 
            });
          }

          //Verificar qual foi o botão premido

          switch (i.customId) {

            case 'bttPrivacy':

              //Lock e Unlock - Toogle

              const connectAllowed = voiceChannel.permissionsFor(voiceChannel.guild.id).has(PermissionFlagsBits.Connect);

              await voiceChannel.permissionOverwrites.edit(guild.id, {
                Connect: !connectAllowed,
              });

              if (!connectAllowed)
                i.reply({ content: 'The voice channel is now unlocked', ephemeral: true });
              else
                i.reply({ content: 'The voice channel is now locked', ephemeral: true });

              break;

            case 'bttVisibility':

              //Mostra e esconde o VC - Toogle
              if (voiceChannel.permissionsFor(voiceChannel.guild.id).has(PermissionFlagsBits.ViewChannel)) {

                await voiceChannel.permissionOverwrites.edit(guild.id, {
                  ViewChannel: false,
                })

                i.reply({ content: 'The voice channel is now hidden', ephemeral: true })
              }
              else {

                await voiceChannel.permissionOverwrites.edit(guild.id, {
                  ViewChannel: true,
                })

                i.reply({ content: 'The voice channel can now be seen by everyone', ephemeral: true })
              }

              break;

            case 'bttStreaming':

              if (voiceChannel.permissionsFor(voiceChannel.guild.id).has(PermissionFlagsBits.Stream)) {

                await voiceChannel.permissionOverwrites.edit(guild.id, {
                  Stream: false,
                })

                i.reply({ content: 'From now on, you cannot stream inside this vocie channel.', ephemeral: true })
              }
              else {

                await voiceChannel.permissionOverwrites.edit(guild.id, {
                  Stream: true,
                })

                i.reply({ content: 'You can now stream inside this voice channel.', ephemeral: true })
              }

              break;

            case 'bttPushToTalk':

              if (voiceChannel.permissionsFor(voiceChannel.guild.id).has(PermissionFlagsBits.UseVAD)) {

                await voiceChannel.permissionOverwrites.edit(guild.id, {
                  UseVAD: false,
                })

                i.reply({ content: 'You need to have push to talk enabled inside this voice channel.', ephemeral: true })
              }
              else {

                await voiceChannel.permissionOverwrites.edit(guild.id, {
                  UseVAD: true,
                })

                i.reply({ content: 'From now on, you can speak without push to talk.', ephemeral: true })
              }

              break;

            case 'bttIncreaseUserLimit':

              const currentLimit = voiceChannel.userLimit;
              voiceChannel.setUserLimit(currentLimit + 1);

              i.reply({ content: 'The voice channel size was increased by 1.', ephemeral: true })

              break;


            case 'bttDecreaseUserLimit':

              const currentLimit2 = voiceChannel.userLimit;
              voiceChannel.setUserLimit(currentLimit2 - 1);

              i.reply({ content: 'The voice channel size was decreased by 1.', ephemeral: true })

              break;

          }
        })
      }, 100)
    }

    const jointocreate = voiceManager.get(member.id);
    const members = oldChannel?.members
      .filter((m) => !m.user.bot)
      .map((m) => m.id)

    if (oldChannel && oldChannel.type === 2 && !newChannel) {

      //Screenshare
      const QueryRoleStatus = await RoleStatus.findOne({ where: { ServerID: oldChannel.guild.id, Roletype: 3 }, })
      if (QueryRoleStatus) newState.member.roles.remove(QueryRoleStatus.RoleID);

      //Recording
      const QueryRoleStatus2 = await RoleStatus.findOne({ where: { ServerID: guild.id, Roletype: 5 }, })
      if (QueryRoleStatus2) newState.member.roles.remove(QueryRoleStatus2.RoleID);
    }

    if (jointocreate && oldChannel && oldChannel.id === jointocreate && (!newChannel || newChannel.id !== jointocreate)) {

      if (members.length > 0) {

        let randomID = members[Math.floor(Math.random() * members.length)];
        let randomMember = guild.members.cache.get(randomID);

        // Check if randomMember is still connected to voice
        if (!randomMember || !randomMember.voice.channel) {
          voiceManager.set(member.id, null);
          oldChannel.delete().catch(() => null);
          return;
        }

        randomMember.voice.setChannel(oldChannel).then((v) => {
          //oldChannel.setName(randomMember.user.username).catch((e) => null);
          
          // ✅ Step 3 & 4: Proper Permission Management during channel transfer
          // Remove permissions from old owner
          oldChannel.permissionOverwrites.delete(member).catch((e) => null);
          
          // Give permissions to new owner
          oldChannel.permissionOverwrites.edit(randomMember, {
            Connect: true,
            ManageChannels: true
          });

          // ✅ Ensure @everyone still has ManageChannels permission
          oldChannel.permissionOverwrites.edit(guild.id, {
            ManageChannels: true
          });
        })

        voiceManager.set(member.id, null)
        voiceManager.set(randomMember.id, oldChannel.id)

      } else {

        voiceManager.set(member.id, null)
        oldChannel.delete().catch((e) => null)

      }
    }
  },
};