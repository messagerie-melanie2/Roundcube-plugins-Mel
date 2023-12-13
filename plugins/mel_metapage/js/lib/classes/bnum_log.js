export class BnumLog {
    static _log(log_level ,log_func, prepend_text, function_name, ...args) {
        if (log_level >= BnumLog.log_level) {
            log_func(`${moment().format('DD/MM/YYYY HH:mm:ss.SSS')} ${prepend_text}[${function_name}]`, ...args);
        }
    }

    static log(function_name, prepend_text, ...args) {
        this._log(BnumLog.LogLevels.trace ,console.log, prepend_text, function_name, ...args);
    }

    static info(function_name, ...args) {
        const PREPEND_TEXT = EMPTY_STRING;
        this._log(BnumLog.LogLevels.trace ,console.info, PREPEND_TEXT, function_name, ...args);
    }

    static debug(function_name, ...args) {
        const PREPEND_TEXT = '- dbg -';
        this._log(BnumLog.LogLevels.debug ,console.debug, PREPEND_TEXT, function_name, ...args);
    }

    static debugger(function_name, ...args) {
        debugger;
        this.debug(function_name, ...args);
    }

    static warning(function_name, ...args) {
        const PREPEND_TEXT = '/!\\';
        this._log(BnumLog.LogLevels.warning ,console.warn, PREPEND_TEXT, function_name, ...args);
    }

    static error(function_name, ...args) {
        const PREPEND_TEXT = '###';
        this._log(BnumLog.LogLevels.error ,console.error, PREPEND_TEXT, function_name, ...args);
    }

    static fatal(function_name, ...args) {
        const PREPEND_TEXT = 'FATAL';
        this._log(BnumLog.LogLevels.fatal ,console.error, PREPEND_TEXT, function_name, ...args);
    }

    static set_log_level(log_level) {
        this.log_level = log_level;
    }
}

Object.defineProperty(BnumLog, 'LogLevels', {
    enumerable: false,
    configurable: false,
    writable: false,
    value:MelEnum.createEnum('LogLevels', {
        log:-1,
        trace:0,
        debug:1,
        warning:2,
        error:3,
        fatal:4
    }, false)
});

BnumLog.log_level = BnumLog.LogLevels.log;