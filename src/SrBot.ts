import * as Discord from 'discord.js';
import {getRankEmoji} from './utils/getRankEmoji';
import {Player, DiscordConfig, ConfigurationLoc} from './types';
import {getJsonFile} from './utils/getJsonFile';
import {StatsGenerator} from './StatsGenerator';
import {log} from './utils/logger';

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
        log('CLIENT', 'Initializing Discord Client');
        const client = new Discord.Client();

        client.login(config.token)
            .then(() => {
                client.on('message', message => this.onClientMessageHandler(message));
                log('CLIENT', 'Discord Client Successfully Initialized');
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
            log('CLIENT', `New request from ${message.author.username}`);
            const serverId = message.member.guild.id;
            const requestedServer = this.statsGenerator.getLastResult().servers.find(server => serverId === server.id);

            if (!requestedServer) {
                message.channel.send('Sorry, this server has no players associated.');
            } else {
                const players = requestedServer.players;
                let text = this.buildSRTextList(players);

                if (requestedServer.targetSR) {
                    const playersCount = players.length;
                    const average = this.calculateAverageSR(players);
                    const target = requestedServer.targetSR;
                    const max = Math.abs((average * playersCount) - (target * (playersCount + 1)));

                    text += `\nAverage SR: ${average}`;
                    text += `\nTarget SR: ${target}`;
                    text += `\nMax add: ${max}`;
                } else {
                    const average = this.calculateAverageSR(players);
                    text += `\nAverage SR: ${average}`;
                }

                log('CLIENT', `Sent to Chat: ${text}`);
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
                const text = `\n${current.player} (${current.SR})${current.private ? ' [PRIVATE]' : ''} ${getRankEmoji(current.SR)}`;
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


