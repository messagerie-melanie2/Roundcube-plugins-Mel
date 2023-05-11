import { BaseModule } from "../../../js/lib/module";

const MODULE_ID = 'Headlines';
export class ModuleNew extends BaseModule {
    constructor(load_module = true) {
        super(load_module);
    }

    start() {
        super.start();

    }

    end() {
        this.select_headlines_by().css('display', 'none');
    }

    select_headlines_by() {
        return this.select_module().find('.headlines-by');
    }

    module_id() {
        let id = super.module_id();

        if (!!id) id += `_${MODULE_ID}`;
        else id = MODULE_ID;

        return id;
    }
}