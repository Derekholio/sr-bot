import * as Discord from 'discord.js';
import {getRankEmoji} from './utils/getRankEmoji';
import {DiscordConfig, ConfigurationLoc, Server} from './types';
import {getJsonFile} from './utils/getJsonFile';
import {StatsGenerator} from './StatsGenerator';
import {log} from './utils/logger';
import {calculateAverageSR} from './utils/calculateAverageSr';
import {validateInput} from './utils/validateInput';
import {BugsnagClient} from './utils/BugsnagClient';
import {isValidUsername} from './utils/isValidUsername';

/**
 * Enum of available commands
 */
enum COMMAND {
    BASE = '!SR',
    TEAM = 'TEAM',
    SET = 'SET',
    ADD = 'ADD',
    REMOVE = 'REMOVE'
}

/**
 * Enum of updatable commands
 */
enum UPDATABLE_COMMAND {
    TEAM = 'TEAM',
    REGION = 'REGION',
    PLATFORM = 'PLATFORM'

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
        BugsnagClient.Configure(getJsonFile(configs.bugsnag));
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
                log('CLIENT', err, 'ERROR');
                throw new Error(err);
            });

        client.on('disconnect', e => log('CLIENT', 'Disconnected!', 'WARN'));
        client.on('error', e => log('CLIENT', e, 'ERROR'));
        client.on('reconnecting', ()=> log('CLIENT', 'Connecting...', 'ERROR'));
        client.on('resume', ()=> log('CLIENT', 'Connected', 'SUCCESS'));

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

        // If just !sr request
        if (!command) {
            this.sendToChannel(message.channel, this.createEmbedMessage(message));
            return;
        }

        // Non admin user attempted a set command
        if (command.toUpperCase() === COMMAND.SET && !this.isServerAdmin(message.member.permissions)) {
            log('CLIENT', `Non-admin user ${message.author.username} attempted set command`, 'WARN');
            return;
        }

        switch (command.toUpperCase()) {
            case COMMAND.SET: {
                // !sr set ####

                const settableParams = params.slice(1);
                switch (params[0].toUpperCase()) {
                    case UPDATABLE_COMMAND.TEAM: {
                        // !sr set team ####
                        const teamName = settableParams.join(' ');
                        this.processUpdateCommand(message, 'teamName', teamName);
                        break;
                    }
                    case UPDATABLE_COMMAND.REGION: {
                        // !sr set region ####
                        const region = settableParams[0].toLowerCase() as OverwatchAPI.REGION;
                        this.processUpdateCommand(message, 'region', region, ['cn', 'eu', 'global', 'kr', 'us']);
                        break;
                    }
                    case UPDATABLE_COMMAND.PLATFORM: {
                        // !sr set platform ####
                        const platform = settableParams[0].toLowerCase() as OverwatchAPI.PLATFORM;
                        this.processUpdateCommand(message, 'platform', platform, ['pc', 'psn', 'xbl']);
                        break;
                    }
                    default:
                        // unsettable command
                        break;
                }
                break;
            }
            case COMMAND.TEAM: {
                // !sr team

                this.sendToChannel(message.channel, `Team name: ${server && server.teamName || 'NOT SET'}`);
                break;
            }
            case COMMAND.ADD: {
                const username = params[0];
                if (isValidUsername(username)){
                    const serverId = message.member.guild.id;
                    this.statsGenerator.addPlayer(serverId, username);
                    this.sendToChannel(message.channel, `Added ${username} to your roster`);
                } else {
                    this.sendToChannel(message.channel, `Invalid username: ${username}`);
                }
                break;
            }
            case COMMAND.REMOVE: {
                const username = params[0];
                if (isValidUsername(username)){
                    const serverId = message.member.guild.id;
                    this.statsGenerator.removePlayer(serverId, username);
                    this.sendToChannel(message.channel, `Removed ${username} to your roster`);
                } else {
                    this.sendToChannel(message.channel, `Invalid username: ${username}`);
                }
                break;
            }
            default:
                // command not found
                break;
        }
    }

    /**
     * Checks if a user is an admin.
     * @param user Username to check
     */
    private isServerAdmin(permission: Discord.Permissions): boolean {
        return permission.has('ADMINISTRATOR') || permission.has('MANAGE_GUILD');
    }

    /**
     * Handles common tasks for when an update/set command is called.  This will validate the inputs and send a standardized message to chat.
     * @param message Incoming Discord message
     * @param property The server property to be updated or set
     * @param updateValue The value of property to be updated or set
     * @param validation Optional. Array of strings or single string of expected inputs. If none are matched an error message will be sent to chat.
     */
    private processUpdateCommand<K extends keyof Server>(message: Discord.Message, property: K, updateValue: Server[K], validation?: Server[K]|Server[K][]) {
        const serverId = message.member.guild.id;
        if (!validation || validateInput(updateValue, validation)) {
            this.statsGenerator.updateServerProperty(serverId, property, updateValue);
            this.sendToChannel(message.channel, `${property} updated: ${updateValue}`);
        } else {
            this.sendToChannel(message.channel, `Invalid ${property}: ${updateValue}. Expecting ${Array.isArray(validation) ?
                validation.join(' | ') : validation}`);
        }
    }
}


