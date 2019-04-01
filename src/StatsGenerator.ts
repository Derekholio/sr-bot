import * as overwatch from 'overwatch-api';
import {OverwatchConfig, Player, Server, Locale} from './types';
import {getJsonFile} from './utils/getJsonFile';
import {writeJsonFile} from './utils/writeJsonFile';

export class StatsGenerator {
    private config: {path: string, data: OverwatchConfig};
    private lastResult: OverwatchConfig;

    constructor(configPath: string) {
        this.config = {
            path: configPath,
            data: getJsonFile(configPath)
        };

        this.lastResult = this.config.data;
        this.fetchAndWrite();
    }

    /**
     * Returns the last cached stats result.  Updated on every fetch call.
     */
    public getLastResult() {
        return this.lastResult;
    }

    /**
     * Fetches updated stats and writes them to file.  Use fetch() for data only.
     */
    public async fetchAndWrite(): Promise<void> {
        console.log(`Updating players in file ${this.config.path}`);

        const results = await this.fetch();
        writeJsonFile(this.config.path, results);
        console.log('Done!');
    }

    /**
     * Returns updated player information based on the provided player file
     */
    public async fetch(): Promise<OverwatchConfig> {
        const updates: Server[] = await Promise.all(this.config.data.servers.map((server) => this.processServer(server)))
            .catch((err) => {
                throw new Error(err);
            });

        return this.lastResult = {...this.config.data, servers: updates, timestamp: Date.now()};
    }

    /**
     * Starts the automatic fetchAndWrite timer.
     */
    public startTimer(timeout: number = 60 * 60 * 1000) {
        setTimeout(() => {
            this.fetchAndWrite();
        }, timeout);
    }


    /**
     * Gets user data from overwatch API
     * @param {string} player Player username
     */
    private async getOverwatchProfileAsync(playerId: string, serverInfo: Locale) {
        return new Promise<OverwatchAPI.Profile>((resolve, reject) => {
            overwatch.getProfile(serverInfo.platform, serverInfo.region, playerId.replace('#', '-'), (error, data) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(data);
                }
            });
        });
    }

    /**
     * Combine old player data with new API player data
     * @param {Player} playerData Player object from data file
     */
    private async collatePlayerData(playerData: Player, locale: Locale): Promise<Player> {
        if (!playerData.player) {
            throw new Error(`Missing username! ${playerData}`);
        }

        const conditionalData: Partial<Player> = {};
        const player: OverwatchAPI.Profile|null = await this.getOverwatchProfileAsync(playerData.player, locale).catch(err => {
            console.log(`Profile Not Found: ${playerData.player}`);
            return null;
        });

        if (player){
            if (player.competitive.rank && player.competitive.rank > 0) {
                conditionalData.SR = player.competitive.rank;
                if (player.competitive.rank !== playerData.SR) {
                    console.log(`${player.username} SR: ${(playerData.SR - player.competitive.rank) * -1}`);
                }
            } else {
                conditionalData.private = true;
            }
        }

        return {...playerData, ...conditionalData};
    }

    /**
     * Process each player of the server object
     * @param {Server} server Server object from data file
     */
    private async processServer(server: Server): Promise<Server> {
        const players: Player[] = await Promise.all(server.players.map((player) => {
            return this.collatePlayerData(player, {platform: server.platform, region: server.region});
        }));

        return {...server, players};
    }
}


