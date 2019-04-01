export enum LogLevel {
    'NORMAL',
    'INFO',
    'WARN',
    'ERROR'
}

/**
 * Logs a formatted message to the console
 * @param prefix Log Prefix [Prefix]
 * @param message Log Message
 * @param timestamp Log time with message
 * @param level Log Level (log, info, warn, error)
 */
export function log(prefix: string, message: string, level?: LogLevel): void {
    const out = `[${new Date().toLocaleTimeString()}] [${prefix}] ${message}`;

    switch (level) {
        case LogLevel.INFO:
            console.info(out);
            break;
        case LogLevel.WARN:
            console.warn(out);
            break;
        case LogLevel.ERROR:
            console.error(out);
            break;
        default:
            console.log(out);
            break;
    }
}
