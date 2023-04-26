import * as loader from "./loader.js";
export { ModuleLoader };
import { Mel_Promise } from "../../../mel_metapage/js/lib/mel_promise";

class ModuleLoader {
    constructor() {
        this._modules = [];
    }

    static Instance() {
        if (!ModuleLoader._instance) ModuleLoader._instance = new ModuleLoader();
        return ModuleLoader._instance;
    }

    static addModule(callback, ...args) {
        this.Instance()._modules.push({callback, args});
    }

    static async load() {
        let promises = [];
        const modules = this.Instance()._modules;
        let current;
        for (let index = 0, len = modules.length; index < len; ++index) {
            const element = modules[index];
            if (isAsync(element.callback)) current = element.callback(...element.args);
            else {
                current = new Mel_Promise(element.callback, element.args);
            }

            promises.push(current);
        }
        current = undefined;
        await Promise.allSettled(promises);
        ModuleLoader._instance = undefined;
    }
}

{
    const keys = Object.keys(loader);
    for (let index = 0, len = keys.length, key = keys[index]; index < len; ++index, key = keys[index]) {
        const module = loader[key];
        new module();
    }
}