import * as Discord from 'discord.js';
import {getRankEmoji} from './utils/getRankEmoji';
import {DiscordConfig, ConfigurationLoc, Server} from './types';
import {getJsonFile} from './utils/getJsonFile';
import {StatsGenerator} from './StatsGenerator';
import {log} from './utils/logger';
import {calculateAverageSR} from './utils/calculateAverageSr';

/**
 * Enum of available commands
 */
enum COMMAND {
    BASE = '!SR',
    TEAM = 'TEAM'
}

/**
 * Defines the Hex color used in the Discord embed message
 */
const HEX_EMBED_COLOR = 0x0019FF;

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
        log('CLIENT', 'Initializing Discord Client', 'INFO');
        const client = new Discord.Client();

        client.login(config.token)
            .then(() => {
                client.on('message', message => this.onClientMessageHandler(message));
                log('CLIENT', 'Discord Client Successfully Initialized', 'SUCCESS');
            })
            .catch(err => {
                log('CLIENT ERROR', err, 'ERROR');
                throw new Error(err);
            });

        client.on('disconnect', (e) => log('CLIENT', 'Disconnected!', 'WARN'));
        client.on('error', (e) => log('CLIENT ERROR', e, 'ERROR'));
        return client;
    }

    /**
     * Handles when the client receives a message.
     * @param message The message received
     */
    private onClientMessageHandler(message: Discord.Message): void {
        if (message.author.bot || !message.content.toUpperCase().startsWith(COMMAND.BASE)) {
            return;
        }

        this.commandHandler(message);
    }

    /**
     * Creates a discord embed message
     * @param {Discord.Message} message
     */
    private createEmbedMessage(message: Discord.Message): String | Discord.RichEmbed {
        const serverId = message.member.guild.id;
        const requestedServer = this.statsGenerator.getServer(serverId);

        if (!requestedServer) {
            return 'Server not configured';
        }

        const players = requestedServer.players;

        // Embed Construction
        const embed = new Discord.RichEmbed()
            .setTitle(`Leaderboard: ${requestedServer.teamName}`)
            .setColor(HEX_EMBED_COLOR)
            .setFooter(`Last updated: ${new Date(this.statsGenerator.getLastResult().timestamp).toUTCString()}`)
            .setAuthor('SR Bot', undefined, 'https://github.com/Derekholio/sr-bot');

        players.forEach((player) => {
            embed.addField(player.player, `${player.SR}${player.private ? ' [PRIVATE]' : ''} ${getRankEmoji(player.SR)}`);
        });

        // Team Stats Construction
        const average = calculateAverageSR(players);
        let teamStatsMessage = `Average SR: ${average}`;

        if (requestedServer.targetSR) {
            const playersCount = players.length;
            const target = requestedServer.targetSR;
            const max = Math.abs((average * playersCount) - (target * (playersCount + 1)));
            teamStatsMessage += `\nTarget SR: ${target}\nMax add: ${max}`;
        }
        embed.addField('Team Stats', teamStatsMessage);

        return embed;
    }


    /**
     * Sends a messase to the provided discord channel.
     * @param channel Discord message channel to send message to
     * @param message Message to be sent
     */
    private sendToChannel(channel: Discord.TextChannel | Discord.DMChannel | Discord.GroupDMChannel, message: any) {
        log('CLIENT', `Sending to chat: ${JSON.stringify(message)}`, 'INFO');
        channel.send(message);
    }

    /**
     * Handles commands sent from discord
     * @param message Incoming discord message
     */
    private commandHandler(message: Discord.Message): void {
        const serverId = message.member.guild.id;
        const server = this.statsGenerator.getServer(serverId);
        const [command, ...params] = [...message.content.split(' ').slice(1)];

        log('CLIENT', `New request from ${message.author.username}: ${message.content}`, 'INFO');

        if (!server) {
            this.sendToChannel(message.channel, 'Server not configured');
            return;
        }

        // If just !sr
        if (!command) {
            this.sendToChannel(message.channel, this.createEmbedMessage(message));
            return;
        }

        switch (command.toUpperCase()) {
            case COMMAND.TEAM: {
                let outMessage;

                if (params[0]) {
                    const teamName = params.join(' ');
                    this.statsGenerator.updateServerProperty(serverId, 'teamName', teamName);
                    outMessage = `Team name updated: ${teamName}`;
                } else {
                    outMessage = `Team name: ${server && server.teamName || 'NOT SET'}`;
                }

                this.sendToChannel(message.channel, outMessage);
                break;
            }
            default:
                // command not found
                break;
        }
    }
}


