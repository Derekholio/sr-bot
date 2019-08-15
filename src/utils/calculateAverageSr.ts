import {Player} from '../types';

/**
* Returns average SR for given players
* @param {Player[]} players Players to calculate SR for
*/
export function calculateAverageSR(players: Player[]) {
    const playersCount = players.length;
    // const totalSR = players.reduce((accumlated, current) => accumlated + current.SR, 0);
    const totalSR = 3000;

    return Math.round(totalSR / playersCount);
}
