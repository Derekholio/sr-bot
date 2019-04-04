import 'colors';

/**
 * Different severity of logging.  Synonymous to console.log/info/war/error
 */
type LogLevel = 'NORMAL'|'INFO'|'WARN'|'ERROR'|'SUCCESS';

/**
 * Logs a formatted message to the console
 * @param prefix Log Prefix [Prefix]
 * @param message Log Message
 * @param timestamp Log time with message
 * @param level Log Level (log, info, warn, error)
 */
export function log(prefix: string, message: any, level: LogLevel = 'NORMAL'): void {
    let prefixColored = prefix;
    switch (level) {
        case 'SUCCESS':
            prefixColored = prefix.green;
            break;
        case 'INFO':
            prefixColored = prefix.blue;
            break;
        case 'WARN':
            prefixColored = prefix.yellow;
            break;
        case 'ERROR':
            prefixColored = prefix.red;
            break;
        default:
            prefixColored = prefix;
            break;
    }

    console.log(`[${new Date().toLocaleTimeString()}] [${prefixColored}] ${message}`);
}
