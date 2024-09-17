const { Events, ChannelType, Collection, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, PermissionOverwrites, Permissions } = require('discord.js');

let voiceManager = new Collection();

module.exports = {
  name: Events.VoiceStateUpdate,
  async execute(oldState, newState) {

    const { member, guild } = oldState;
    const newChannel = newState.channel;
    const oldChannel = oldState.channel;

    if (oldChannel !== newChannel && newChannel && newChannel.id === '1086594094756794438') {

      const sourceCategory = newChannel.parent;

      const voiceChannel = await guild.channels.create({
        name: "Your Mom's Room",
        type: ChannelType.GuildVoice,
        parent: newChannel.parent,
        /*             permissionOverwrites: [
                      //O HOST
                      {
                        id: member.id,
                        allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.ReadMessageHistory],
                        deny: [PermissionFlagsBits.ManageChannels],
                      },
                      // @EVERYONE
                      {
                        id: guild.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
                      },
                    ],   */
        userLimit: '5',
        bitrate: 96000
      })

      voiceManager.set(member.id, voiceChannel.id);

      await newChannel.permissionOverwrites.edit(member, {
        Connect: false
      });

      setTimeout(() => {
        newChannel.permissionOverwrites.delete(member);
      }, 30000)

      return setTimeout(() => {
        member.voice.setChannel(voiceChannel);

        let embed = new EmbedBuilder()
          .setTitle("🔊 | Temporary Voice Channel's Panel")
          .setDescription(`You can customise your channel with this interaction panel.
              
              🔒 | Switches your channel's privacy.
              👀 | Switches your channel's visibility.
              📹 | Switches the streaming permissions.
              🎙️ | Switches the push to talk mode.
              ➕ | Increase by 1 your channel's user limit.
              ➖ | Decrease by 1 your channel's user limit.
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
              // .setEmoji('<:7980_joker:718089036002230429>')
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

          //Verificar qual foi o botão premido

          switch (i.customId) {

            case 'bttPrivacy':

             /*  //Lock e Unlock - Toogle

              const connectAllowed = voiceChannel.permissionsFor(voiceChannel.guild.id).has(PermissionFlagsBits.Connect);

              await voiceChannel.permissionOverwrites.edit(guild.id, {
                Connect: !connectAllowed,
              });

              if (!connectAllowed)
                i.reply({ content: 'The voice channel is now unlocked', ephemeral: true });
              else
                i.reply({ content: 'The voice channel is now locked', ephemeral: true });

              break; */

            case 'bttVisibility':

             /*  //Mostra e esconde o VC - Toogle
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

              break; */

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

    if (jointocreate && oldChannel.id === jointocreate && (!newChannel || newChannel.id !== jointocreate)) {
      if (members.length > 0) {

        let randomID = members[Math.floor(Math.random() * members.length)];
        let randomMember = guild.members.cache.get(randomID);

        randomMember.voice.setChannel(oldChannel).then((v) => {
          //oldChannel.setName(randomMember.user.username).catch((e) => null);
          oldChannel.permissionOverwrites.edit(randomMember, {
            Connect: true,
            ManageChannels: true
          })
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