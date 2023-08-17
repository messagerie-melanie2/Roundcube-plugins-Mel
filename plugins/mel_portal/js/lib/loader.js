import { ModuleMyDay } from "../../modules/my_day/js/module_my_day.js";
import { ModuleMail } from "../../modules/mails/js/module_mail.js";
import { ModuleWorkspaces } from "../../modules/workspaces/js/main.js";
import { ModuleLayout } from "../../modules/layout/js/layout.js";
import { ModuleNew } from "../../modules/headlines/js/module_news.js";
import { ModuleLinks } from "../../modules/links/js/links.js";

const loader = {
    ModuleMyDay,
    ModuleMail,
    ModuleWorkspaces,
    ModuleLayout,
    ModuleNew,
    ModuleLinks
};

let _loaded = false;
let _modules = {};
export class Loader {
    static load() {
        if (!_loaded)
        {
            _loaded = true;
            const keys = Object.keys(loader);
            for (let index = 0, len = keys.length, key = keys[index]; index < len; ++index, key = keys[index]) {
                const module = loader[key];
                _modules[key] = new module();
            }
        }
    }

    static getModule(name) {
        return _modules[name];
    }

    static __get__(debug) {
        switch (debug) {
            case this.__debug__.loaded:
                return this.loaded;

            case this.__debug__.modules:
                return _modules;
        
            default:
                throw 'Not exist';
        }
    }

    static free() {
        _modules = null;
    }
}

Object.defineProperty(Loader, 'loaded', {
    enumerable: false,
    configurable: false,
    // writable: false,
    get: function() {
        return _loaded;
    },
});

Object.defineProperty(Loader, '__debug__', {
    enumerable: false,
    configurable: false,
    writable: false,
    value:{
        loaded:Symbol('loaded'),
        modules:Symbol('modules')
    }
});