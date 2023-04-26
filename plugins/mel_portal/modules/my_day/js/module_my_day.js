export { ModuleMyDay };
import { Top } from "../../../../mel_metapage/js/lib/top";
import { BaseModule } from "../../../js/lib/module";

const TOP_KEY = 'my_day_listeners';
const LISTENER_KEY = mel_metapage.EventListeners.calendar_updated.get;
const MODULE_ID = 'My_day';
class ModuleMyDay extends BaseModule{
    constructor(load_module = true) {
        super(load_module);
    }

    start() {
        super.start();
        this.set_listeners();
        this.set_title_action();
    }

    end() {

    }

    set_title_action(){
        this.select_module_title().attr('href', '#').click(() => {
            this.change_frame('calendar', {update: false, force_update: false});
        });
        return this;
    }

    set_listeners() {
        if (!Top.has(TOP_KEY)) {
            this.add_event_listener(LISTENER_KEY, () => {
                new ModuleMyDay(false).generate();
            }, {top:true});
            Top.add(TOP_KEY);
        }
        return this;
    }

    check_storage_datas() {
        
    }

    generate() {}

    module_id() {
        let id = super.module_id();

        if (!!id) id += `_${MODULE_ID}`;
        else id = MODULE_ID;

        return id;
    }
}