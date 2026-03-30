const express = require('express');
const router = express.Router();
const { requireAuth, requireGuildPermission } = require('./guilds');

const AutoDelete = require('../models/AutoDelete');
const AutoPublish = require('../models/AutoPublish');
const AutoRole = require('../models/AutoRole');
const AutoScreenshot = require('../models/AutoScreenshot');
const CacheManager = require('../utils/CacheManager');

// ============ AUTO DELETE ============

router.get('/:guildId/autodelete', requireAuth, requireGuildPermission, async (req, res) => {
    try {
        const rules = await AutoDelete.findAll({ where: { ServerID: req.params.guildId } });
        
        const botClient = global.discordClient;
        const guild = botClient?.guilds.cache.get(req.params.guildId);

        const enriched = rules.map(r => ({
            id: r.IDAutoDelete,
            channelId: r.ChannelID,
            channelName: guild?.channels.cache.get(r.ChannelID)?.name || 'Unknown',
            seconds: r.Seconds
        }));

        res.json(enriched);
    } catch (error) {
        console.error('Error fetching autodelete:', error);
        res.status(500).json({ error: 'Failed to fetch auto-delete rules' });
    }
});

router.post('/:guildId/autodelete', requireAuth, requireGuildPermission, async (req, res) => {
    try {
        const { channelId, seconds } = req.body;
        const rule = await AutoDelete.create({
            ServerID: req.params.guildId,
            ChannelID: channelId,
            Seconds: seconds || 5
        });
        res.json(rule);
    } catch (error) {
        console.error('Error creating autodelete:', error);
        res.status(500).json({ error: 'Failed to create auto-delete rule' });
    }
});

router.delete('/:guildId/autodelete/:channelId', requireAuth, requireGuildPermission, async (req, res) => {
    try {
        await AutoDelete.destroy({ 
            where: { ServerID: req.params.guildId, ChannelID: req.params.channelId }
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting autodelete:', error);
        res.status(500).json({ error: 'Failed to delete auto-delete rule' });
    }
});

// ============ AUTO PUBLISH ============

router.get('/:guildId/autopublish', requireAuth, requireGuildPermission, async (req, res) => {
    try {
        const channels = await AutoPublish.findAll({ where: { ServerID: req.params.guildId } });
        
        const botClient = global.discordClient;
        const guild = botClient?.guilds.cache.get(req.params.guildId);

        const enriched = channels.map(c => ({
            id: c.IDAutoPublish,
            channelId: c.ChannelID,
            channelName: guild?.channels.cache.get(c.ChannelID)?.name || 'Unknown'
        }));

        res.json(enriched);
    } catch (error) {
        console.error('Error fetching autopublish:', error);
        res.status(500).json({ error: 'Failed to fetch auto-publish channels' });
    }
});

router.post('/:guildId/autopublish', requireAuth, requireGuildPermission, async (req, res) => {
    try {
        const { channelId } = req.body;
        const channel = await AutoPublish.create({
            ServerID: req.params.guildId,
            ChannelID: channelId
        });
        res.json(channel);
    } catch (error) {
        console.error('Error creating autopublish:', error);
        res.status(500).json({ error: 'Failed to add auto-publish channel' });
    }
});

router.delete('/:guildId/autopublish/:channelId', requireAuth, requireGuildPermission, async (req, res) => {
    try {
        await AutoPublish.destroy({ 
            where: { ServerID: req.params.guildId, ChannelID: req.params.channelId }
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting autopublish:', error);
        res.status(500).json({ error: 'Failed to delete auto-publish channel' });
    }
});

// ============ AUTO ROLE ============
// Note: AutoRole model uses serverId (lowercase), botRoleId, userRoleId

router.get('/:guildId/autorole', requireAuth, requireGuildPermission, async (req, res) => {
    try {
        const config = await AutoRole.findOne({ where: { serverId: req.params.guildId } });
        
        if (!config) {
            return res.json({ serverId: req.params.guildId, botRoleId: null, userRoleId: null });
        }

        const botClient = global.discordClient;
        const guild = botClient?.guilds.cache.get(req.params.guildId);

        res.json({
            serverId: config.serverId,
            botRoleId: config.botRoleId,
            botRoleName: config.botRoleId ? guild?.roles.cache.get(config.botRoleId)?.name : null,
            userRoleId: config.userRoleId,
            userRoleName: config.userRoleId ? guild?.roles.cache.get(config.userRoleId)?.name : null
        });
    } catch (error) {
        console.error('Error fetching autorole:', error);
        res.status(500).json({ error: 'Failed to fetch auto-roles' });
    }
});

router.put('/:guildId/autorole', requireAuth, requireGuildPermission, async (req, res) => {
    try {
        const { botRoleId, userRoleId } = req.body;
        
        const [config, created] = await AutoRole.findOrCreate({
            where: { serverId: req.params.guildId },
            defaults: { serverId: req.params.guildId }
        });

        await config.update({
            botRoleId: botRoleId !== undefined ? botRoleId : config.botRoleId,
            userRoleId: userRoleId !== undefined ? userRoleId : config.userRoleId
        });

        CacheManager.delete(CacheManager.keys.autoRole(req.params.guildId));

        res.json(config);
    } catch (error) {
        console.error('Error updating autorole:', error);
        res.status(500).json({ error: 'Failed to update auto-roles' });
    }
});

// ============ AUTO SCREENSHOT ============

router.get('/:guildId/autoscreenshot', requireAuth, requireGuildPermission, async (req, res) => {
    try {
        const config = await AutoScreenshot.findOne({ where: { ServerID: req.params.guildId } });
        
        if (!config) {
            return res.json({ ServerID: req.params.guildId, ChannelID: null });
        }

        const botClient = global.discordClient;
        const guild = botClient?.guilds.cache.get(req.params.guildId);

        res.json({
            ServerID: config.ServerID,
            ChannelID: config.ChannelID,
            channelName: config.ChannelID ? guild?.channels.cache.get(config.ChannelID)?.name : null
        });
    } catch (error) {
        console.error('Error fetching autoscreenshot:', error);
        res.status(500).json({ error: 'Failed to fetch auto-screenshot config' });
    }
});

router.put('/:guildId/autoscreenshot', requireAuth, requireGuildPermission, async (req, res) => {
    try {
        const { channelId } = req.body;
        
        const [config, created] = await AutoScreenshot.findOrCreate({
            where: { ServerID: req.params.guildId },
            defaults: { ServerID: req.params.guildId, ChannelID: channelId }
        });

        if (!created) {
            await config.update({ ChannelID: channelId });
        }

        res.json(config);
    } catch (error) {
        console.error('Error updating autoscreenshot:', error);
        res.status(500).json({ error: 'Failed to update auto-screenshot config' });
    }
});

module.exports = router;
