import * as overwatch from 'overwatch-api';
import {PlayerFile, Player, Server} from './types';

export class StatsGenerator {
    private region: OverwatchAPI.REGION;
    private platform: OverwatchAPI.PLATFORM;

    constructor(region: OverwatchAPI.REGION, platform: OverwatchAPI.PLATFORM) {
        this.region = region;
        this.platform = platform;
    }

    /**
     * Returns updated player information based on the provided player file
     * @param fileData The loaded player file data
     */
    public async fetch(fileData: PlayerFile): Promise<PlayerFile> {
        const updates: Server[] = await Promise.all(fileData.servers.map((server) => this.processServer(server)))
            .catch((err) => {
                throw new Error(err);
            });

        return {...fileData, servers: updates};
    }

    /**
     * Gets user data from overwatch API
     * @param {string} player Player username
     */
    private async getOverwatchProfileAsync(playerId: string) {
        return new Promise<OverwatchAPI.Profile>((resolve, reject) => {
            overwatch.getProfile(this.platform, this.region, playerId.replace('#', '-'), (error, data) => {
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
     * @param {*} playerData Player object from data file
     */
    private async collatePlayerData(playerData: Player): Promise<Player> {
        if (!playerData.player) {
            throw new Error(`Missing username! ${playerData}`);
        }

        const conditionalData: Partial<Player> = {};
        const player: OverwatchAPI.Profile|null = await this.getOverwatchProfileAsync(playerData.player).catch(err => { console.error(err); return null});

        if(player){
            if (player.competitive.rank && player.competitive.rank > 0) {
                conditionalData.SR = player.competitive.rank;
            } else {
                conditionalData.private = true;
            }
        }
        
        return {...playerData, ...conditionalData};
    }

    /**
     * Process each player of the server object
     * @param {*} server Server object from data file
     */
    private async processServer(server: Server): Promise<Server> {
        const players: Player[] = await Promise.all(server.players.map((player) => this.collatePlayerData(player)));
        
        return {...server, players};
    }
}


