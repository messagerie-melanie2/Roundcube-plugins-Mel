import { MetapageModule } from "../metapage_module.js";
export {module_bnum};

let user_defined_modules = [
  'double_auth_modal',
  'main_nav_metrics'
];

class module_bnum extends MetapageModule {

    constructor() {
        super();
    }

    main() {
        super.main();
    }

    exec() {
        return this;
    }

    async exec_async() {};

    static async exec_modules() {
        if (user_defined_modules.length > 0) {
            for (const iterator of user_defined_modules) {
                var loaded = await window.loadJsModule('mel_metapage', iterator, '/js/lib/metapages_actions/bnum/');
    
                for (const key in loaded) {
                    if (Object.hasOwnProperty.call(loaded, key)) {
                        const element = loaded[key];
                        await (new element().exec()).exec_async();
                    }
                }
            }
        }

    }
}

