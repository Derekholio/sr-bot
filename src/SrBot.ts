import * as fs from 'fs';
import * as Discord from 'discord.js';

import {getRankEmoji} from './utils/getRankEmoji';
import {Player, OverwatchConfig, DiscordConfig, ConfigurationLoc} from './types';
import {getJsonFile} from './utils/getJsonFile';

import {StatsGenerator} from './StatsGenerator';

export class SrBot {
    private client: Discord.Client;
    private statsGenerator: StatsGenerator;

    constructor(configs: ConfigurationLoc) {
        this.statsGenerator = new StatsGenerator(configs.overwatch);
        this.statsGenerator.startTimer();

        this.client = this.initializeClient(getJsonFile(configs.discord));
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
            const requestedServer = this.statsGenerator.getLastResult().servers.find(server => serverId === server.id);

            console.log(requestedServer);
            if (!requestedServer) {
                message.channel.send('Sorry, this server has no players associated.');
            } else {
                const players = requestedServer.players;
                let text = this.buildSRTextList(players);

                if (requestedServer.targetSR) {
                    const playersCount = players.length;
                    const average = this.calculateAverageSR(players);

                    const target = requestedServer.targetSR;

                    console.log((average * playersCount));
                    console.log((target * (playersCount + 1)));
                    const max = Math.abs((average * playersCount) - (target * (playersCount + 1)));

                    text += `\n Average SR: ${average}`;
                    text += `\n Target SR: ${target}`;
                    text += `\n Max add: ${max}`;
                } else {
                    console.log('here');
                    const average = this.calculateAverageSR(players);
                    console.log(`Average: ${average}`);
                    console.log(text);
                    text += `\n Average SR: ${average}`;
                    console.log(text);
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


