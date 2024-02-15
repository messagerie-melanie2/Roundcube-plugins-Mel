import { module_bnum } from "./bnum/module_bnum.js";
import { MetapageModule } from "./metapage_module.js";

export class MetapageCalendarModule extends MetapageModule {
    constructor() {
        super();
    }

    main() {
        super.main();

        module_bnum.exec_modules();
    }
}