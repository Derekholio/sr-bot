#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import * as program from 'commander';

import {SrBot, DiscordConfig} from './SrBot';
import {StatsGenerator} from './StatsGenerator';
import {PlayerFile} from './types';
import {getJsonFile} from './utils/getJsonFile';

/**
 * Configuration file locations
 */
export const CONFIG = {
    /**
     * Player Configuration
     */
    PLAYER: './res/players.json',
    /**
     * Discord Configuration
     */
    DISCORD: './res/config.json'
};

program
    .command('start')
    .action(() => {
        const config: DiscordConfig = getJsonFile<DiscordConfig>(CONFIG.DISCORD);
        const bot = new SrBot(config);
    });

program
    .command('generate')
    .action(() => {
        const resolvedFilePath = path.resolve(CONFIG.PLAYER);
        const playerStats = new StatsGenerator('us', 'pc');

        console.log(`Updating players in file ${resolvedFilePath}`);

        const fileData: PlayerFile = getJsonFile<PlayerFile>(CONFIG.DISCORD);
        playerStats.fetch(fileData)
            .then((writeOut: PlayerFile) => fs.writeFileSync(resolvedFilePath, JSON.stringify(writeOut, null, 4), 'utf8'))
            .then(() => console.log('Done!'))
            .catch(err => {
                throw new Error(err);
            });
    });

program.parse(process.argv);
