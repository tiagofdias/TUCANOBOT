
require('dotenv').config();

//First, lets require the database definition file:
const db = require('./database/database');

const { Client, GatewayIntentBits, ActivityType, EmbedBuilder, Events, Collection, GuildVoice, GuildMember, GuildPresences, Guilds, GuildMembers, ChannelType, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ActionRowBuilder, Routes, REST, Component, ComponentType } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const commands = [];
// Grab all the command files from the commands directory you created earlier
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildPresences,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildMembers,
	]
});

client.commands = new Collection();

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	commands.push(command.data.toJSON());
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

// and deploy your commands!
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

///////////////////////////////////// CROSS ROLES
let Server1;
let Server2;
/* client.on(Events.InteractionCreate, async interaction => {

	// Check if the interaction is from the select menu
	if (interaction.isStringSelectMenu() || interaction.isButton()) {

		switch (interaction.customId) {

			case 'server1':
				Server1 = interaction.values[0];
				await interaction.deferUpdate();
				break;

			case 'server2':
				Server2 = interaction.values[0];
				await interaction.deferUpdate();
				break;

			case 'bttNext':

				if (Server1 !== "" && Server2 !== "") {
					if (Server1 !== Server2) {

						console.log(Server1 + " " + Server2);
					}
					else await interaction.reply("The server 1 and the server 2 must be different");
				}
				else await interaction.reply("Fill all the fields");

				break;

			case 'bttCancel':

				Server1 = "";
				Server2 = "";

				await interaction.reply("The operation was cancelled");

				break;
		}
		// Check if the selected menu is the server select menu
		 if (interaction.customId === 'server1') {
		  // Get the selected value from the interaction
		  Server1 = interaction.values[0];
  
		  await interaction.deferReply();
		  await interaction.followUp(`Server with ID ${Server1} was selected.`);
		} 
	}

}) */

/* client.on("interactionCreate", async (interaction) => {

	if (interaction.isStringSelectMenu() || interaction.isButton()) {

		switch (interaction.customId) {

			case 'server1':
				await interaction.deferUpdate();
				break;

			case 'server2':
				await interaction.deferUpdate();
				break;

		}

		const message = interaction.message; // get the message object
		const selectMenus = message.components.filter(component => component.components);
		const firstRow = message.components[0].components;
		
		for (const component of firstRow) {
		
			  firstSelectMenuValue = component.data.value;
			  console.log(firstSelectMenuValue)
			  break; // break out of the loop once the first select menu value is found
			
		  }

		// Check if any select menu is empty
		const emptySelectMenus = selectMenus.filter(selectMenu => selectMenu.options.length === 0);

		if (emptySelectMenus.length > 0) {
			const emptySelectMenuNames = emptySelectMenus.map(selectMenu => selectMenu.customId);
			await interaction.reply(`The select menus "${emptySelectMenuNames.join(", ")}" are empty.`);
		} else {
			// Handle button click and select menus as desired
			if (interaction.customId === "bttNext") {
				await interaction.reply("You clicked the button!");

				// Get selected values from each select menu
				const selectMenu1Values = selectMenus[0].values;
				const selectMenu2Values = selectMenus[1].values;

				// Do something with the selected values
				console.log(selectMenu1Values);
				console.log(selectMenu2Values);
			}
		}
	}
});
 */

// Log in to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);