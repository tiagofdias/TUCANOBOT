const express = require('express');
const router = express.Router();
const { requireAuth, requireGuildPermission } = require('./guilds');

const Suggestions = require('../models/Suggestions');
const TempVCS = require('../models/TempVCS');
const VanityRoles = require('../models/VanityRoles');
const RoleStatus = require('../models/RoleStatus');
const Maintenance = require('../models/Maintenance');
const CHATGPT = require('../models/CHATGPT');
const CacheManager = require('../utils/CacheManager');

// ============ SUGGESTIONS ============
// Model has: IDSuggestions, ServerID, ChannelID (no Status field)

router.get('/:guildId/suggestions', requireAuth, requireGuildPermission, async (req, res) => {
    try {
        const config = await Suggestions.findOne({ where: { ServerID: req.params.guildId } });
        
        if (!config) {
            return res.json({ ServerID: req.params.guildId, ChannelID: null });
        }

        const botClient = global.discordClient;
        const guild = botClient?.guilds.cache.get(req.params.guildId);

        res.json({
            id: config.IDSuggestions,
            ServerID: config.ServerID,
            ChannelID: config.ChannelID,
            channelName: config.ChannelID ? guild?.channels.cache.get(config.ChannelID)?.name : null
        });
    } catch (error) {
        console.error('Error fetching suggestions:', error);
        res.status(500).json({ error: 'Failed to fetch suggestions config' });
    }
});

router.put('/:guildId/suggestions', requireAuth, requireGuildPermission, async (req, res) => {
    try {
        const { ChannelID } = req.body;
        
        const existing = await Suggestions.findOne({ where: { ServerID: req.params.guildId } });
        
        if (existing) {
            await existing.update({ ChannelID });
            return res.json(existing);
        }

        const config = await Suggestions.create({
            ServerID: req.params.guildId,
            ChannelID
        });

        res.json(config);
    } catch (error) {
        console.error('Error updating suggestions:', error);
        res.status(500).json({ error: 'Failed to update suggestions config' });
    }
});

router.delete('/:guildId/suggestions', requireAuth, requireGuildPermission, async (req, res) => {
    try {
        await Suggestions.destroy({ where: { ServerID: req.params.guildId } });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting suggestions:', error);
        res.status(500).json({ error: 'Failed to delete suggestions config' });
    }
});

// ============ TEMP VCS ============
// Model has: ServerID, VCID (unique), UserLimit, BitRate

router.get('/:guildId/tempvcs', requireAuth, requireGuildPermission, async (req, res) => {
    try {
        const config = await TempVCS.findOne({ where: { ServerID: req.params.guildId } });
        
        if (!config) {
            return res.json({ ServerID: req.params.guildId, VCID: null, UserLimit: 5, BitRate: 96000 });
        }

        const botClient = global.discordClient;
        const guild = botClient?.guilds.cache.get(req.params.guildId);

        res.json({
            ServerID: config.ServerID,
            VCID: config.VCID,
            vcName: config.VCID ? guild?.channels.cache.get(config.VCID)?.name : null,
            UserLimit: config.UserLimit,
            BitRate: config.BitRate
        });
    } catch (error) {
        console.error('Error fetching tempvcs:', error);
        res.status(500).json({ error: 'Failed to fetch temp VCs config' });
    }
});

router.put('/:guildId/tempvcs', requireAuth, requireGuildPermission, async (req, res) => {
    try {
        const { VCID, UserLimit, BitRate } = req.body;
        
        const existing = await TempVCS.findOne({ where: { ServerID: req.params.guildId } });
        
        if (existing) {
            await existing.update({
                VCID: VCID !== undefined ? VCID : existing.VCID,
                UserLimit: UserLimit !== undefined ? UserLimit : existing.UserLimit,
                BitRate: BitRate !== undefined ? BitRate : existing.BitRate
            });
            return res.json(existing);
        }

        const config = await TempVCS.create({
            ServerID: req.params.guildId,
            VCID: VCID || req.params.guildId, // VCID is required and unique
            UserLimit: UserLimit || 5,
            BitRate: BitRate || 96000
        });

        res.json(config);
    } catch (error) {
        console.error('Error updating tempvcs:', error);
        res.status(500).json({ error: 'Failed to update temp VCs config' });
    }
});

// ============ VANITY ROLES ============
// Model has: IDVanity, ServerID, RoleID, CustomStatus

router.get('/:guildId/vanityroles', requireAuth, requireGuildPermission, async (req, res) => {
    try {
        const roles = await VanityRoles.findAll({ where: { ServerID: req.params.guildId } });
        
        const botClient = global.discordClient;
        const guild = botClient?.guilds.cache.get(req.params.guildId);

        const enriched = roles.map(r => ({
            id: r.IDVanity,
            roleId: r.RoleID,
            roleName: guild?.roles.cache.get(r.RoleID)?.name || 'Unknown',
            roleColor: guild?.roles.cache.get(r.RoleID)?.hexColor || '#ffffff',
            customStatus: r.CustomStatus
        }));

        res.json(enriched);
    } catch (error) {
        console.error('Error fetching vanityroles:', error);
        res.status(500).json({ error: 'Failed to fetch vanity roles' });
    }
});

router.post('/:guildId/vanityroles', requireAuth, requireGuildPermission, async (req, res) => {
    try {
        const { roleId, customStatus } = req.body;
        const role = await VanityRoles.create({
            ServerID: req.params.guildId,
            RoleID: roleId,
            CustomStatus: customStatus
        });
        
        CacheManager.delete(CacheManager.keys.vanityRoles(req.params.guildId));

        res.json(role);
    } catch (error) {
        console.error('Error creating vanityrole:', error);
        res.status(500).json({ error: 'Failed to add vanity role' });
    }
});

router.delete('/:guildId/vanityroles/:id', requireAuth, requireGuildPermission, async (req, res) => {
    try {
        await VanityRoles.destroy({ 
            where: { IDVanity: req.params.id }
        });
        
        CacheManager.delete(CacheManager.keys.vanityRoles(req.params.guildId));

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting vanityrole:', error);
        res.status(500).json({ error: 'Failed to delete vanity role' });
    }
});

// ============ ROLE STATUS ============
// Model has: IDStatusRoles, ServerID, RoleID (unique), Roletype (integer)

router.get('/:guildId/rolestatus', requireAuth, requireGuildPermission, async (req, res) => {
    try {
        const configs = await RoleStatus.findAll({ where: { ServerID: req.params.guildId } });
        
        const botClient = global.discordClient;
        const guild = botClient?.guilds.cache.get(req.params.guildId);

        const enriched = configs.map(c => ({
            id: c.IDStatusRoles,
            roleId: c.RoleID,
            roleName: guild?.roles.cache.get(c.RoleID)?.name || 'Unknown',
            roleColor: guild?.roles.cache.get(c.RoleID)?.hexColor || '#ffffff',
            roleType: c.Roletype
        }));

        res.json(enriched);
    } catch (error) {
        console.error('Error fetching rolestatus:', error);
        res.status(500).json({ error: 'Failed to fetch role status configs' });
    }
});

router.post('/:guildId/rolestatus', requireAuth, requireGuildPermission, async (req, res) => {
    try {
        const { roleId, roleType } = req.body;
        const config = await RoleStatus.create({
            ServerID: req.params.guildId,
            RoleID: roleId,
            Roletype: roleType || 0
        });

        CacheManager.delete(CacheManager.keys.roleStatus(req.params.guildId, roleType || 0));
        CacheManager.delete(CacheManager.keys.allRoleStatus(req.params.guildId));

        res.json(config);
    } catch (error) {
        console.error('Error creating rolestatus:', error);
        res.status(500).json({ error: 'Failed to add role status' });
    }
});

router.delete('/:guildId/rolestatus/:id', requireAuth, requireGuildPermission, async (req, res) => {
    try {
        const toDelete = await RoleStatus.findOne({ where: { IDStatusRoles: req.params.id } });
        if (toDelete) {
            const roleType = toDelete.Roletype;
            await toDelete.destroy();
            CacheManager.delete(CacheManager.keys.roleStatus(req.params.guildId, roleType));
            CacheManager.delete(CacheManager.keys.allRoleStatus(req.params.guildId));
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting rolestatus:', error);
        res.status(500).json({ error: 'Failed to delete role status' });
    }
});

// ============ MAINTENANCE ============
// Model has: ServerID, RoleID (unique), Status (boolean)

router.get('/:guildId/maintenance', requireAuth, requireGuildPermission, async (req, res) => {
    try {
        const configs = await Maintenance.findAll({ where: { ServerID: req.params.guildId } });
        
        const botClient = global.discordClient;
        const guild = botClient?.guilds.cache.get(req.params.guildId);

        const enriched = configs.map(c => ({
            roleId: c.RoleID,
            roleName: guild?.roles.cache.get(c.RoleID)?.name || 'Unknown',
            status: c.Status
        }));

        res.json(enriched);
    } catch (error) {
        console.error('Error fetching maintenance:', error);
        res.status(500).json({ error: 'Failed to fetch maintenance config' });
    }
});

router.put('/:guildId/maintenance', requireAuth, requireGuildPermission, async (req, res) => {
    try {
        const { roleId, status } = req.body;
        
        const existing = await Maintenance.findOne({ 
            where: { ServerID: req.params.guildId, RoleID: roleId } 
        });
        
        if (existing) {
            await existing.update({ Status: status });
            return res.json(existing);
        }

        const config = await Maintenance.create({
            ServerID: req.params.guildId,
            RoleID: roleId,
            Status: status
        });

        res.json(config);
    } catch (error) {
        console.error('Error updating maintenance:', error);
        res.status(500).json({ error: 'Failed to update maintenance config' });
    }
});

// ============ CHATGPT ============
// Model has: IDCHATGPT, ServerID, ChannelID (unique) - no Status field

router.get('/:guildId/chatgpt', requireAuth, requireGuildPermission, async (req, res) => {
    try {
        const config = await CHATGPT.findOne({ where: { ServerID: req.params.guildId } });
        
        if (!config) {
            return res.json({ ServerID: req.params.guildId, ChannelID: null });
        }

        const botClient = global.discordClient;
        const guild = botClient?.guilds.cache.get(req.params.guildId);

        res.json({
            id: config.IDCHATGPT,
            ServerID: config.ServerID,
            ChannelID: config.ChannelID,
            channelName: config.ChannelID ? guild?.channels.cache.get(config.ChannelID)?.name : null
        });
    } catch (error) {
        console.error('Error fetching chatgpt:', error);
        res.status(500).json({ error: 'Failed to fetch ChatGPT config' });
    }
});

router.put('/:guildId/chatgpt', requireAuth, requireGuildPermission, async (req, res) => {
    try {
        const { ChannelID } = req.body;
        
        const existing = await CHATGPT.findOne({ where: { ServerID: req.params.guildId } });
        
        if (existing) {
            await existing.update({ ChannelID });
            return res.json(existing);
        }

        const config = await CHATGPT.create({
            ServerID: req.params.guildId,
            ChannelID
        });

        res.json(config);
    } catch (error) {
        console.error('Error updating chatgpt:', error);
        res.status(500).json({ error: 'Failed to update ChatGPT config' });
    }
});

router.delete('/:guildId/chatgpt', requireAuth, requireGuildPermission, async (req, res) => {
    try {
        await CHATGPT.destroy({ where: { ServerID: req.params.guildId } });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting chatgpt:', error);
        res.status(500).json({ error: 'Failed to delete ChatGPT config' });
    }
});

module.exports = router;
