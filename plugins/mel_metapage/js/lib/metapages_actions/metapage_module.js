import { BaseStorage } from "../classes/base_storage";
import { AsyncMelObject } from "../mel_object";
import { WaitSomething } from "../mel_promise";

export class MetapageModule extends AsyncMelObject {
    constructor(...args) {
        super(...args);
        MetapageModule.Modules.add(this.constructor.name, this);
    }

    async main(...args) {
        await super.main(...args);
    }

    async load_module(module_name, wainting_time_in_s = 5){
        return await MetapageModule.Modules.load_module(module_name, wainting_time_in_s);
    }
}

class MetapageModuleManager extends BaseStorage {
    constructor() {
        super();
    }

    async load_module(key, wainting_time_in_s = 5) {
        let module = this.get(key);

        if (!module) {
            await WaitSomething(() => !!this.get(key), wainting_time_in_s);
            module = this.get(key);
        }

        return await module;
    }
}

MetapageModule.Modules = new MetapageModuleManager();