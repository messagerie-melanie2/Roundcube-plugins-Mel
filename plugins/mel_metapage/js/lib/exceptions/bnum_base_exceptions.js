import { BnumLog } from "../classes/bnum_log.js";

export class BnumException extends Error {
    constructor(errored_item, message, ...args) {
        super(message);
        this.errored_item = null;
        this.args = [];
        Object.defineProperties(this, {
            errored_item: {
                get() {
                    return errored_item;
                }
            },
            args: {
                get() {
                    return args;
                }
            }
        });
    }

    _log(function_name, {type = BnumLog.LogLevels.error, force = false, debug = false}) {
        const class_name = this.constructor.name;

        if (force) {
            var loglevel = BnumLog.log_level;
            BnumLog.set_log_level(BnumLog.LogLevels.trace);
        }

        switch (type) {
            case BnumLog.LogLevels.error:
                BnumLog.error(function_name, `{${class_name}}`, this.message, ...this.items());
                break;

            case BnumLog.LogLevels.fatal:
                BnumLog.fatal(function_name, `{${class_name}}`, this.message, ...this.items());
                break;

            default:
                BnumLog.warning('BnumException/_log', 'Le log level ne peut être que "error" ou "fatal".', 'loglevel : ', type,  'force traces ? : ', force, 'enabled debugger ? :', debug);
                
                if (force) {
                    BnumLog.set_log_level(loglevel);
                }

                return this._log(function_name, {force, debug, type:BnumLog.LogLevels.error});
        }

        if (debug) BnumLog.debugger(function_name, `{${class_name}}`, ...this.args);
        else BnumLog.debug(function_name, `{${class_name}}`, ...this.args);

        if (force) {
            BnumLog.set_log_level(loglevel);
        }
    }

    * items() {
        yield this.errored_item;
    }

    log(function_name) {
        this._log(function_name, {});
    } 

    log_fatal(function_name, {enable_debugging = false}) {
        this._log(function_name, {type: BnumLog.LogLevels.fatal, force:true, debug:enable_debugging});
    }

    complete_logs(function_name) {
        this._log(function_name, {force:true});
    }

    static IsBnumError(error) {
        return error instanceof BnumException;
    }
}