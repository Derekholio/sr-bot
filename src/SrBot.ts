import * as fs from 'fs';
import * as Discord from 'discord.js';

import {getRankEmoji} from './utils/getRankEmoji';
import {Player, PlayerFile} from './types';

export type DiscordConfig = {
    token: string
}

export class SrBot {
    private client: Discord.Client;

    constructor(config: DiscordConfig) {
        this.client = this.initializeClient(config);
    }

    /**
     * Initializes the discord client.
     * @param config Loaded dicord config file data
     */
    private initializeClient(config: DiscordConfig) {
        console.log('Initializing Discord Client');
        const client = new Discord.Client();

        client.login(config.token)
            .then(() => {
                client.on('message', message => this.onClientMessageHandler(message));
                console.log('Discord Client Successfully Initialized');
            });

        return client;
    }

    /**
     * Handles when the client receives a message.
     * @param message The message received
     */
    private onClientMessageHandler(message: Discord.Message): void {
        const isUserBot = message.author.bot;

        if (!isUserBot && message.content.toLowerCase().startsWith('!sr')) {
            this.processTextChat(message);
        }
    }

    /**
     * Processes a Discord message
     * @param {*} message
     */
    private processTextChat(message: Discord.Message) {
        if (message.content.toLowerCase() === '!sr') {
            const serverId = message.member.guild.id;
            const playerFile: PlayerFile = JSON.parse(fs.readFileSync('players.json', 'utf8'));
            const requestedServer = playerFile.servers.find(server => serverId === server.id);

            console.log(requestedServer);
            if (!requestedServer) {
                message.channel.send('Sorry, this server has no players associated.');
            } else {
                const players = requestedServer.players;
                const text = this.buildSRTextList(players);

                if (requestedServer.targetSR) {
                    const playersCount = players.length;
                    const average = this.calculateAverageSR(players);

                    const target = requestedServer.targetSR;

                    console.log((average * playersCount));
                    console.log((target * (playersCount + 1)));
                    const max = Math.abs((average * playersCount) - (target * (playersCount + 1)));

                    text.concat(`\n Average SR: ${average}`);
                    text.concat(`\n Target SR: ${target}`);
                    text.concat(`\n Max add: ${max}`);
                } else {
                    const average = this.calculateAverageSR(players);
                    text.concat(`\n Average SR: ${average}`);
                }

                message.channel.send(text);
            }
        }
    }

    /**
     * Returns a StringBuilder of the player's SR in descending order
     * @param {*} players List of players to build text from
     */
    private buildSRTextList(players: Player[]) {
        return players.sort((a: Player, b: Player) => (a.SR < b.SR) ? 1 : -1)
            .reduce((accumulated, current) => {
                const text = `\n ${current.player} (${current.SR})${current.private ? ' [PRIVATE]' : ''} ${getRankEmoji(current.SR)}`;
                return accumulated.concat(text);
            }, '');
    }

    /**
     * Returns average SR for given players
     * @param {*} players Players to calculate SR for
     */
    private calculateAverageSR(players: Player[]) {
        const playersCount = players.length;
        const totalSR = players.reduce((accumlated, current) => accumlated + current.SR, 0);

        return Math.round(totalSR / playersCount);
    }
}

