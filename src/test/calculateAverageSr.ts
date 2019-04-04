import {calculateAverageSR} from '../utils/calculateAverageSr';
import {Player} from '../types';
import * as chai from 'chai';

describe('calculateAverageSr', () => {
    it('should calculate average SR for players', () => {
        const expected = 2000;
        const players:Player[] = [
            {
                SR: 1000,
                player: 'test',
                private: false
            },
            {
                SR: 2000,
                player: 'test',
                private: false
            },
            {
                SR: 3000,
                player: 'test',
                private: false
            }
        ];

        const result = calculateAverageSR(players);
        chai.expect(result).to.be.equal(expected);
    });
});
