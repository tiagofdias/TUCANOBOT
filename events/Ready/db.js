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

                // config.init(db); // initiates the table config
                // config.sync(); //creates the table, if it doesn't already exist

                AutoDelete.init(db);
                AutoDelete.sync();

                VanityRoles.init(db);
                VanityRoles.sync();

                RoleStatus.init(db);
                RoleStatus.sync();

                PersistantRoles.init(db);
                PersistantRoles.sync();

                PersistantRoles2.init(db);
                PersistantRoles2.sync();

                AutoRole.init(db);
                AutoRole.sync();

                AutoPublish.init(db);
                AutoPublish.sync();

                Suggestions.init(db);
                Suggestions.sync();

                TempVCS.init(db);
                TempVCS.sync();

                Level.init(db);
                Level.sync();

                LevelConfig.init(db);
                LevelConfig.sync();

                LevelRoleMultiplier.init(db);
                LevelRoleMultiplier.sync();

                BenficaDay.init(db);
                BenficaDay.sync();

                Birthday.init(db);
                Birthday.sync();

                BirthdayConfig.init(db);
                BirthdayConfig.sync();

                ActiveRoles.init(db);
                ActiveRoles.sync();

                ActiveRolesConfig.init(db);
                ActiveRolesConfig.sync();

                VoiceLogs.init(db);
                VoiceLogs.sync();

                console.log(`Ready! Logged in as ${client.user.tag}`);
            })
            .catch(err => console.log(err));
    },
};
