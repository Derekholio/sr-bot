import * as path from 'path';
import * as fs from 'fs';

export function getJsonFile<T>(filePath: string): T {
    const pathResolved = path.resolve(filePath);
    try {
        return JSON.parse(fs.readFileSync(pathResolved, 'utf8'));
    } catch (err) {
        throw new Error(err);
    }
}
