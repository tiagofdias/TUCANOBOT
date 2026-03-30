const express = require('express');
const router = express.Router();
const { requireAuth, requireGuildPermission } = require('./guilds');

const Level = require('../models/Level');
const LevelConfig = require('../models/LevelConfig');
const LevelRoleMultiplier = require('../models/LevelRoleMultiplier');
const CacheManager = require('../utils/CacheManager');

// Get level config for a guild
router.get('/:guildId/levels/config', requireAuth, requireGuildPermission, async (req, res) => {
    try {
        let config = await LevelConfig.findOne({ where: { ServerID: req.params.guildId } });
        
        if (!config) {
            config = { 
                ServerID: req.params.guildId,
                TextXP: 10, 
                VoiceXP: 2, 
                ReactionXP: 0,
                GiveawayXP: 0,
                PoolXP: 0,
                ModeratorXP: 0,
                DailyXP: 0,
                Status: false 
            };
        }
        
        res.json(config);
    } catch (error) {
        console.error('Error fetching level config:', error);
        res.status(500).json({ error: 'Failed to fetch level config' });
    }
});

// Update level config
router.put('/:guildId/levels/config', requireAuth, requireGuildPermission, async (req, res) => {
    try {
        const { TextXP, VoiceXP, ReactionXP, GiveawayXP, PoolXP, ModeratorXP, DailyXP, Status } = req.body;
        
        const [config, created] = await LevelConfig.findOrCreate({
            where: { ServerID: req.params.guildId },
            defaults: { ServerID: req.params.guildId }
        });

        await config.update({
            TextXP: TextXP ?? config.TextXP,
            VoiceXP: VoiceXP ?? config.VoiceXP,
            ReactionXP: ReactionXP ?? config.ReactionXP,
            GiveawayXP: GiveawayXP ?? config.GiveawayXP,
            PoolXP: PoolXP ?? config.PoolXP,
            ModeratorXP: ModeratorXP ?? config.ModeratorXP,
            DailyXP: DailyXP ?? config.DailyXP,
            Status: Status ?? config.Status
        });

        CacheManager.delete(CacheManager.keys.levelConfig(req.params.guildId));

        res.json(config);
    } catch (error) {
        console.error('Error updating level config:', error);
        res.status(500).json({ error: 'Failed to update level config' });
    }
});

// Get leaderboard
router.get('/:guildId/levels/leaderboard', requireAuth, requireGuildPermission, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 25;
        const offset = parseInt(req.query.offset) || 0;

        const leaderboard = await Level.findAll({
            where: { ServerID: req.params.guildId },
            order: [['xp', 'DESC']],
            limit,
            offset
        });

        const total = await Level.count({ where: { ServerID: req.params.guildId } });

        // Get usernames from Discord
        const botClient = global.discordClient;
        const guild = botClient?.guilds.cache.get(req.params.guildId);
        
        const enrichedLeaderboard = await Promise.all(leaderboard.map(async (entry, index) => {
            let username = 'Unknown User';
            let avatar = null;
            
            try {
                const member = await guild?.members.fetch(entry.MemberID).catch(() => null);
                if (member) {
                    username = member.user.username;
                    avatar = member.user.displayAvatarURL({ size: 64 });
                }
            } catch (e) {}
            
            return {
                rank: offset + index + 1,
                memberId: entry.MemberID,
                username,
                avatar,
                xp: entry.xp,
                level: entry.level
            };
        }));

        res.json({ leaderboard: enrichedLeaderboard, total });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

// Get role multipliers
router.get('/:guildId/levels/multipliers', requireAuth, requireGuildPermission, async (req, res) => {
    try {
        const multipliers = await LevelRoleMultiplier.findAll({
            where: { ServerID: req.params.guildId }
        });

        // Enrich with role names
        const botClient = global.discordClient;
        const guild = botClient?.guilds.cache.get(req.params.guildId);

        const enriched = multipliers.map(m => {
            const role = guild?.roles.cache.get(m.RoleID);
            return {
                id: m.id,
                roleId: m.RoleID,
                roleName: role?.name || 'Unknown Role',
                roleColor: role?.hexColor || '#ffffff',
                boost: m.Boost
            };
        });

        res.json(enriched);
    } catch (error) {
        console.error('Error fetching multipliers:', error);
        res.status(500).json({ error: 'Failed to fetch multipliers' });
    }
});

// Add role multiplier
router.post('/:guildId/levels/multipliers', requireAuth, requireGuildPermission, async (req, res) => {
    try {
        const { roleId, boost } = req.body;

        const [multiplier, created] = await LevelRoleMultiplier.findOrCreate({
            where: { ServerID: req.params.guildId, RoleID: roleId },
            defaults: { ServerID: req.params.guildId, RoleID: roleId, Boost: boost }
        });

        if (!created) {
            await multiplier.update({ Boost: boost });
        }

        CacheManager.delete(CacheManager.keys.levelRoleMultipliers(req.params.guildId));

        res.json({ success: true });
    } catch (error) {
        console.error('Error adding multiplier:', error);
        res.status(500).json({ error: 'Failed to add multiplier' });
    }
});

// Delete role multiplier
router.delete('/:guildId/levels/multipliers/:roleId', requireAuth, requireGuildPermission, async (req, res) => {
    try {
        await LevelRoleMultiplier.destroy({
            where: { ServerID: req.params.guildId, RoleID: req.params.roleId }
        });
        
        CacheManager.delete(CacheManager.keys.levelRoleMultipliers(req.params.guildId));
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting multiplier:', error);
        res.status(500).json({ error: 'Failed to delete multiplier' });
    }
});

module.exports = router;
