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
 * Shape of the player config file
 */
export type PlayerFile = {
    servers: Server[];
}
