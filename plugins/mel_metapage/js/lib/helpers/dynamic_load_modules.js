import { BnumModuleLoadFunctionNotFound } from "../exceptions/helpers_exceptions.js";

export class BnumModules {
    static _context() {
        let context = null;
        if (!!window?.loadJsModule) context = window;
        else if (!!parent?.loadJsModule) context = parent;
        else if (!!top?.loadJsModule) context = top;
        else throw new BnumModuleLoadFunctionNotFound();

        return context;
    }

    static async load(plugin, name, path = BnumModules.BASE_PATH){
        return await BnumModules._context().loadJsModule(plugin, name, path);
    }
}

BnumModules.BASE_PATH = '';
BnumModules.VERSION = '';

Object.defineProperties(BnumModules, {
    BASE_PATH: {
        get() {
            return BnumModules._context().jsModulesBasePath;
        }
    },
    VERSION: {
        get() {
            return BnumModules._context().scriptVersion;
        }
    }
});