//First, lets require the database definition file:
const db = require('../database/database');
const AutoDelete = require('../models/AutoDelete');
const VanityRoles = require('../models/VanityRoles');
const RoleStatus = require('../models/RoleStatus');
const PersistantRoles = require('../models/PersistantRoles');
const PersistantRoles2 = require('../models/PersistantRoles2');
const CHATGPT = require('../models/CHATGPT');
const AutoRole = require('../models/AutoRole');
const AutoPublish = require('../models/AutoPublish');
const Suggestions = require('../models/Suggestions');
const AutoScreenshot = require('../models/AutoScreenshot');
const Level = require('../models/Level');
const { Events, ActivityType } = require('discord.js');
const { model } = require('../database/database');
const autorole = require('../commands/autorole');

let status = [
	{
	  name: 'with your Mom',
	  type: ActivityType.Playing,
	},
	{
	  name: 'your Mom Live',
	  type: ActivityType.Streaming,
	  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
	},
		{
	  name: 'GTA VI',
	  type: ActivityType.Streaming,
	  url: 'https://www.youtube.com/watch?v=npSctPLfIDo',
	},
	{
	  name: 'Mind games with the members',
	  type: ActivityType.Playing,
	},
	{
	  name: "Benfica",
	  type: ActivityType.Watching,
	},
	{
	  name: "Afonso wasting money",
	  type: ActivityType.Watching,
	},
	{
	  name: "PPAP videos",
	  type: ActivityType.Watching,
	},
	{
	  name: "Error 404: Motivation not found",
	  type: ActivityType.Watching,
	},
  ];
  

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		db.authenticate()
        .then(() => {
            console.log('Logged in to DB!');
			
			// Models are initialized in events/Ready/db.js
			// No need to sync here - tables already exist

			console.log(`Ready! Logged in as ${client.user.tag}`);

			setInterval(() => {
				let random = Math.floor(Math.random() * status.length);
				client.user.setActivity(status[random]);
			}, 10000);
        })
        .catch(err => {
			global.DATABASE_OFFLINE = true;
			console.log('[DB] Database connection failed - Safe Mode activated:', err.message || err);
		});

	},
};
