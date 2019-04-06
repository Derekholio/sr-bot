import bugsnag from '@bugsnag/js';
import {Client} from '@bugsnag/node/dist/types/bugsnag-core';
import {BugsnagConfig} from '../types';

export class BugsnagClient {
    private static client : Client;

    static Configure(config : BugsnagConfig) : void {
        this.client = bugsnag(config.api_key);
    }

    static Instance() : Client {
        return this.client;
    }
}
