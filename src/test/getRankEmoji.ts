import {getRankEmoji} from '../utils/getRankEmoji';
import * as chai from 'chai';

const bronzeEmoji = '<:ow_bronze:561738884409458701>';
const silverEmoji = '<:ow_silver:561738499611688971>';
const goldEmoji = '<:ow_gold:561738679220174878>';
const platEmoji = '<:ow_plat:561737404097101833>';
const diamondEmoji = '<:ow_diamond:561738187085578269>';
const masterEmoji = '<:ow_masters:561739221711192065>';
const gmEmoji = '<:ow_grand_masters:561751122952323083>';

function test(data: any){
    describe('getRankEmoji', () => {
        data.forEach(function(testValue: any){
            it(testValue.itPhrase, () => {
                const actual = getRankEmoji(testValue.sr);
                chai.expect(actual).to.be.equal(testValue.expected);
            });
        });
    });
}

const data = [
    {
        itPhrase: 'should return bronze emoji',
        sr: 500,
        expected: bronzeEmoji
    },
    {
        itPhrase: 'should return silver emoji',
        sr: 1850,
        expected: silverEmoji
    },
    {
        itPhrase: 'should return gold emoji',
        sr: 2450,
        expected: goldEmoji
    },
    {
        itPhrase: 'should return plat emoji',
        sr: 2700,
        expected: platEmoji
    },
    {
        itPhrase: 'should return diamond emoji',
        sr: 3200,
        expected: diamondEmoji
    },
    {
        itPhrase: 'should return masters emoji',
        sr: 3999,
        expected: masterEmoji
    },
    {
        itPhrase: 'should return grand masters emoji',
        sr: 4350,
        expected: gmEmoji
    }
];

test(data);
