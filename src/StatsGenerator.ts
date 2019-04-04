import * as overwatch from 'overwatch-api';
import {OverwatchConfig, Player, Server, Locale} from './types';
import {getJsonFile} from './utils/getJsonFile';
import {writeJsonFile} from './utils/writeJsonFile';
import {log} from './utils/logger';
import {sortBy} from './utils/sortBy';

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
        const start = Date.now();
        log('UPDATE', `Begin update on ${this.config.path}`);

        const results = await this.fetch();
        writeJsonFile(this.config.path, results);

        const end = Date.now();
        log('UPDATE', `Finished update! Took ${(end - start) / 1000}s`);
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
     * Returns the Server config for a specific server id.
     * @param id Server Id
     */
    public getServer(id: String): Server|undefined {
        return this.lastResult.servers.find(server => server.id === id);
    }

    /**
     * Updates a top level server property.  Not really intended to update Players info.
     * @param serverId Id of server to update
     * @param property Server property to update
     * @param value New property value
     */
    public updateServerProperty<T extends keyof Server>(serverId: string, property: T, value: Server[T]) {
        const serverReference = this.getServer(serverId);
        if (serverReference) {
            // Straight mutation.  It's dirty but works for now.
            Object.assign(serverReference, {[property]: value});
            writeJsonFile<OverwatchConfig>(this.config.path, this.lastResult);
        }
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
            log('UPDATE ERROR', `${playerData.player} not found!`);
            return null;
        });

        if (player){
            if (player.competitive.rank && player.competitive.rank > 0) {
                conditionalData.SR = player.competitive.rank;
                if (player.competitive.rank !== playerData.SR) {
                    const change = (playerData.SR - player.competitive.rank) * -1;
                    log('UPDATE', `${player.username} SR Change: ${change > 0 ? '+' : ''}${change}`);
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

        return {...server, players: sortBy<Player>(players, 'SR')};
    }
}


