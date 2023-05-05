import { BaseModule } from "../../../js/lib/module";

export class ModuleLayout extends BaseModule {
    constructor(load_module = true) {
        super(load_module);
    }

    start() {

    }

    select_layout_content() {
        return this.select('#layout-content');
    }

    _create_hello() {}
}