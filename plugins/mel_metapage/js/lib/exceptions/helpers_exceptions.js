import { BnumException } from "./bnum_base_exceptions.js";

export class BnumModuleException extends BnumException {
    constructor(errored_item, message) {
        super(errored_item, message);
    }
}

export class BnumModuleLoadFunctionNotFound extends BnumModuleException {
    constructor() {
        super({current:window, parent_context:parent, top_context:top}, 'La fonction "loadJsModule" n\'a pas été trouvée.');
    }
}