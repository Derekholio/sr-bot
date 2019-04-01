import * as fs from 'fs';
import * as path from 'path';

export function writeJsonFile<T>(filePath: string, data: T){
    fs.writeFileSync(path.resolve(filePath), JSON.stringify(data, null, 4), 'utf8');
}
