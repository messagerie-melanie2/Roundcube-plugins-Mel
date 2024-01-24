import { MainMetapageModule } from "../mel_metapage/js/lib/metapages_actions/metapage_module.js";

export class CalendarMetapageConnector extends MainMetapageModule {
    constructor() {
        super();
    }

    main() {
        super.main();
    }

    _create_action(args) {
        args.config.top_center = args.manager.create_button('calendar_add_on', 'Un évènement', function(e){
            mm_create_calendar(e);
            args.manager.hide();
        });

        return args;
    }
}