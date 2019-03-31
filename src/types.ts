/**
 * Player level configuration
 */
export type Player = {
    SR: number,
    player: string,
    private: boolean;
}

/**
 * Server level configuration
 */
export type Server = {
    id: string;
    players: Player[];
    targetSR: number;
}


/**
 * Shape of the player configuration file
 */
export type OverwatchConfig = {
    timestamp: number;
    region: OverwatchAPI.REGION;
    platform: OverwatchAPI.PLATFORM;
    servers: Server[];
}


/** Shape of the discord configuration file. */
export type DiscordConfig = {
    token: string;
}

/**
 * Paths to various configuration files
 */
export type ConfigurationLoc ={
    overwatch: string;
    discord: string;
}
