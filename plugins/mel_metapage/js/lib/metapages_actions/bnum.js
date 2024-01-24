import { BnumModules } from "../helpers/dynamic_load_modules.js";
import { module_bnum } from "./bnum/module_bnum.js";
import { MainMetapageModule } from "./metapage_module.js";

export class MetapageCalendarModule extends MainMetapageModule {
    constructor() {
        super();
    }

    main() {
        super.main();

        this.startup();

        module_bnum.exec_modules();
    }

    startup() {
        $('#button-create').click(async () => {
            FullscreenItem.close_if_exist();

            if (!window.mel_button_create_manager) {
                const {CreateManager} = await BnumModules.load('mel_metapage', 'create_manager', '/js/lib/metapages_actions/bnum/dynamic_call/');
                window.mel_button_create_manager = new CreateManager();
            }

            window.mel_button_create_manager.show();
        });
    }

    _create_action(args) {
        args.config.top_left = args.manager.create_button('mail', 'Une email', () => {
            rcmail.command('compose');
            args.manager.hide();
        });

        //debugage
        //TODO => Visio désactivable
        if (!window.visio_enabled) window.visio_enabled = true;

        if (!!window.visio_enabled){
            args.config.top_right = args.manager.create_button('video_call', 'Une visioconférence', () => {
                window.webconf_helper.go();
                args.manager.hide();
            });
        }

        return args;
    }
}