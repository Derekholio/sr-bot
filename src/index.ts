#!/usr/bin/env node
import * as path from 'path';
import * as program from 'commander';
import {SrBot} from './SrBot';
import {StatsGenerator} from './StatsGenerator';
import {ConfigurationLoc} from './types';

/**
 * Configuration file locations
 */
const configs: ConfigurationLoc = {
    /**
     * Player Configuration
     */
    overwatch: path.resolve('./res/overwatch.json'),
    /**
     * Discord Configuration
     */
    discord: path.resolve('./res/discord.json'),
    /**
     * Bugsnag Configuration
     */
    bugsnag: path.resolve('./res/bugsnag.json')
};

program
    .command('start')
    .action(() => {
        const bot = new SrBot(configs);
    });

program
    .command('generate')
    .action(() => {
        const statsGenerator = new StatsGenerator(configs.overwatch);
    });

program.parse(process.argv);
