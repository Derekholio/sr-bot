import * as fs from 'fs';
import * as path from 'path';

/**
 * Writes JSON data to the provided file
 * @param filePath Path to the file to write
 * @param data Data to write into the file
 */
export function writeJsonFile<T>(filePath: string, data: T){
    fs.writeFileSync(path.resolve(filePath), JSON.stringify(data, null, 4), 'utf8');
}
