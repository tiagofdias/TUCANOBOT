const path = require('path');
const db = require(path.join(__dirname, '..', '..', 'database', 'database'));
const AutoDelete = require(path.join(__dirname, '..', '..', 'models', 'AutoDelete'));
const VanityRoles = require(path.join(__dirname, '..', '..', 'models', 'VanityRoles'));
const RoleStatus = require(path.join(__dirname, '..', '..', 'models', 'RoleStatus'));
const PersistantRoles = require(path.join(__dirname, '..', '..', 'models', 'PersistantRoles'));
const PersistantRoles2 = require(path.join(__dirname, '..', '..', 'models', 'PersistantRoles2'));
const AutoRole = require(path.join(__dirname, '..', '..', 'models', 'AutoRole'));
const AutoPublish = require(path.join(__dirname, '..', '..', 'models', 'AutoPublish'));
const Suggestions = require(path.join(__dirname, '..', '..', 'models', 'Suggestions'));
const TempVCS = require(path.join(__dirname, '..', '..', 'models', 'TempVCS'));
const Level = require(path.join(__dirname, '..', '..', 'models', 'Level'));
const LevelConfig = require(path.join(__dirname, '..', '..', 'models', 'LevelConfig'));
const LevelRoleMultiplier = require(path.join(__dirname, '..', '..', 'models', 'LevelRoleMultiplier'));
const BenficaDay = require(path.join(__dirname, '..', '..', 'models', 'Benfica'));
const Birthday = require(path.join(__dirname, '..', '..', 'models', 'Birthday'));
const BirthdayConfig = require(path.join(__dirname, '..', '..', 'models', 'BirthdayConfig'));
const ActiveRoles = require(path.join(__dirname, '..', '..', 'models', 'ActiveRoles'));
const ActiveRolesConfig = require(path.join(__dirname, '..', '..', 'models', 'ActiveRolesConfig'));
const VoiceLogs = require(path.join(__dirname, '..', '..', 'models', 'VoiceLogs'));

const { Events } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        db.authenticate()
            .then(async () => {
                // Initialize all models (this is lightweight, just sets up the model)
                AutoDelete.init(db);
                VanityRoles.init(db);
                RoleStatus.init(db);
                PersistantRoles.init(db);
                PersistantRoles2.init(db);
                AutoRole.init(db);
                AutoPublish.init(db);
                Suggestions.init(db);
                TempVCS.init(db);
                Level.init(db);
                LevelConfig.init(db);
                LevelRoleMultiplier.init(db);
                BenficaDay.init(db);
                Birthday.init(db);
                BirthdayConfig.init(db);
                ActiveRoles.init(db);
                ActiveRolesConfig.init(db);
                VoiceLogs.init(db);

                // ONLY sync tables when SYNC_DATABASE=true (for initial setup)
                // Syncing 18+ tables on every startup causes massive delays and interaction timeouts
                if (process.env.SYNC_DATABASE === 'true') {
                    console.log('Syncing database tables...');
                    await db.sync();
                    console.log('Database sync complete');
                }

                console.log(`Ready! Logged in as ${client.user.tag}`);
            })
            .catch(err => {
                global.DATABASE_OFFLINE = true;
                console.log('[DB] Database connection failed - Safe Mode activated:', err.message || err);
            });
    },
};
