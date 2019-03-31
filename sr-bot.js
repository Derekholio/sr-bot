var fs = require('fs');
var Discord = require('discord.js');
var StringBuilder = require('node-stringbuilder');
var config = require("./config.json");

var bot = new Discord.Client();
bot.login(config.token);

bot.on('message', async message => {
	var isUserBot = message.author.bot;

	if (!isUserBot && message.content.toLowerCase().startsWith("!sr")) {
		processTextChat(message);
	}
});

//functions
/**
 * Returns a StringBuilder of the player's SR in descending order
 * @param {*} players List of players to build text from
 */
function buildSRTextList(players) {
	let text = new StringBuilder("");
	players.sort((a, b) => a.SR < b.SR);

	for (let player of players) {
		text.appendLine(`${player.player} (${player.SR}) ${player.private ? "[PRIVATE]" : ""}`);
	}

	text.appendLine();

	return text;
}

/**
 * Returns average SR for given players
 * @param {*} players Players to calculate SR for
 */
function calculateAverageSR(players) {
	let playersCount = players.length;
	let total = 0;
	players.forEach(function (player) {
		total += player.SR;
	});

	return Math.round(total / playersCount);
}

/**
 * Returns the matching server from the servers list - Returns null if no server is found
 * @param {*} id ID of the requested server
 * @param {*} servers List of servers to search
 */
function getServer(id, servers) {
	for (var server of servers) {
		if (server.id == id) {
			return server;
		}
	}

	return null;
}

/**
 * Processes a Discord message
 * @param {*} message 
 */
function processTextChat(message) {
	if (message.content.toLowerCase() == "!sr") {
		var serverId = message.member.guild.id;
		const servers = JSON.parse(fs.readFileSync('players.json', 'utf8'));
		var requestedServer = getServer(serverId, servers);
		console.log(requestedServer);
		if (!requestedServer) {
			message.channel.send("Sorry, this server has no players associated.");
		} else {
			const players = requestedServer.players;
			var text = buildSRTextList(players);

			if (requestedServer.targetSR !== null && requestedServer.targetSR !== undefined) {
				var playersCount = players.length;
				var average = calculateAverageSR(players);

				let target = requestedServer.targetSR;

				console.log((average * playersCount));
				console.log((target * (playersCount + 1)));
				let max = Math.abs((average * playersCount) - (target * (playersCount + 1)));

				text = new StringBuilder(text);
				text.appendLine(`Average SR: ${average}`);
				text.appendLine(`Target SR: ${target}`);
				text.appendLine(`Max add: ${max}`);
			} else {
				text = new StringBuilder(text);
				let average = calculateAverageSR(players);
				text.appendLine(`Average SR: ${average}`);
			}

			message.channel.send(text.toString());
		}

	}
}
//end functions