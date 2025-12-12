/* node:coverage ignore file -- @preserve */

export enum LogLevel {
    Trace,
    Debug,
    Info,
    Warning,
    Error,
    None
}

export type Logger =
    (level: LogLevel, message: unknown[], location?: string) => void | Promise<void>;

export let LOGGER: Logger = (level, m, _loc) => {
    if (Debug.level > level) return;

    let func: (...args: unknown[]) => void;
    switch (level) {
        case LogLevel.Trace:
        case LogLevel.Debug:
        case LogLevel.Info:
            func = console.info;
            break;
        case LogLevel.Warning:
            func = console.warn;
            break;
        case LogLevel.Error:
            func = console.error;
            break;
        case LogLevel.None:
            return;
    }
    func(...m);
};

export const Debug: {
    level: LogLevel,
    trace(...data: unknown[]): Promise<void>,
    debug(...data: unknown[]): Promise<void>,
    info(...data: unknown[]): Promise<void>,
    warn(...data: unknown[]): Promise<void>,
    error(...data: unknown[]): Promise<void>,
    assert(cond: boolean, file?: string, line?: number): asserts cond,
    early(file?: string, func?: string, line?: number): void,
    never(value?: never): never
} = {
    level: LogLevel.Warning,

    trace: async (...data) => await LOGGER(LogLevel.Trace, data),
    debug: async (...data) => await LOGGER(LogLevel.Debug, data),
    info:  async (...data) => await LOGGER(LogLevel.Info, data),
    warn:  async (...data) => await LOGGER(LogLevel.Warning, data),
    error: async (...data) => await LOGGER(LogLevel.Error, data),

    assert(x: boolean): asserts x {
        if (!x) {
            let error = new Error('assertion failed');
            this.error(error.stack);
            throw error;
        }
    },

    early(file?: string, func?: string, line?: number): void {
        func ??= 'unknown';
        file ??= '?';
        this.warn(LogLevel.Info, `<${func}> returned early `
            + (line ? `at line ${line}` : '(no location info)'), file);
    },

    never(x: never): never {
        const msg = `Unreachable code reached (never=${x})`;
        this.error(msg);
        const error = new Error(msg);
        throw error;
    },
}
