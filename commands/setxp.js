const { SlashCommandBuilder } = require('@discordjs/builders');

const Level = require('../models/Level');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setxp')
        .setDescription('Set the XP of a user.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to set the XP for.')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('xp')
                .setDescription('The amount of XP to set. Can be a positive (add) or negative value (remove).')
                .setRequired(true)),

    async execute(interaction) {

        const userId = interaction.options.getUser('user').id;
        let xpToSet = interaction.options.getInteger('xp');

        const checkbot = interaction.options.get('user').user;
        if (checkbot && checkbot.bot) return interaction.reply({ content: 'Bots cannot be ranked.', ephemeral: true });

        try {

            // Find the record to get the current level
            const query = await Level.findOne({
                where: { ServerID: interaction.guild.id, MemberID: userId }
            });

            const querycount = await Level.count({
                where: { ServerID: interaction.guild.id, MemberID: userId }
            });

            if (querycount > 0) {
         
                let newXP = query.xp + xpToSet;

                // Calculate the new level based on the XP
                let newLevel = Math.floor(newXP / 20);

                if (newXP <= 0) {
                    newXP = 0;
                    newLevel = 1;
                }

                await Level.update({ xp: newXP, level: newLevel }, {
                    where: { ServerID: interaction.guild.id, MemberID: userId }
                });

                // Check if the new level is greater than the current level
                await interaction.reply({ content: `Success. ${interaction.options.getUser('user')} is now in level ${newLevel}!`, ephemeral: true });
            }
            else { //INSERT

                let newLevel = Math.floor(xpToSet / 20);

                if (xpToSet <= 0) {
                    xpToSet = 0;
                    newLevel = 1;
                }

                 await Level.create({
                    ServerID: interaction.guild.id,
                    MemberID: userId,
                    xp: xpToSet,
                    level: newLevel
                });

                await interaction.reply({ content: `Success. ${interaction.options.getUser('user')} is now in level ${newLevel} with ${xpToSet} XP!`, ephemeral: true });
            }

        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'An error occurred while setting the XP.', ephemeral: true });
        }
    },
};