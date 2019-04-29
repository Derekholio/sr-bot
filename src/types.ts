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
export interface Server extends Locale {
    id: string;
    players: Player[];
    targetSR: number|null;
    teamName: string;
}

/**
 * Locale information for a server or player
 */
export type Locale = {
    platform: OverwatchAPI.PLATFORM;
    region: OverwatchAPI.REGION;
}

/**
 * Shape of the player configuration file
 */
export type OverwatchConfig = {
    timestamp: number;
    servers: Server[];
}


/** Shape of the discord configuration file. */
export type DiscordConfig = {
    token: string;
}

export type BugsnagConfig = {
    api_key: string;
}

/**
 * Paths to various configuration files
 */
export type ConfigurationLoc ={
    overwatch: string;
    discord: string;
    bugsnag: string;
}
