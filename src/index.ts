#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import * as program from 'commander';

import {SrBot, DiscordConfig} from './SrBot';
import {StatsGenerator} from './StatsGenerator';
import {PlayerFile} from './types';

const PLAYER_FILE: string = './res/players.json';
const DISCORD_CONFIG: string = './res/config.json';

program
    .command('start')
    .action(() => {
        const config: DiscordConfig = JSON.parse(fs.readFileSync(path.resolve(DISCORD_CONFIG), 'utf8'));
        const bot = new SrBot(config);
    });

program
    .command('generate')
    .action(() => {
        const resolvedFilePath = path.resolve(PLAYER_FILE);
        const playerStats = new StatsGenerator('us', 'pc');

        console.log(`Updating players in file ${resolvedFilePath}`);

        const fileData: PlayerFile = JSON.parse(fs.readFileSync(resolvedFilePath, 'utf8'));
        playerStats.fetch(fileData)
            .then((writeOut: PlayerFile) => fs.writeFileSync(resolvedFilePath, JSON.stringify(writeOut, null, 4), 'utf8'))
            .then(() => console.log('Done!'))
            .catch(err => {
                throw new Error(err);
            });
    });

program.parse(process.argv);
