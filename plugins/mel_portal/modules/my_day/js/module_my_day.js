export { ModuleMyDay };
    import { html_events } from "../../../../mel_metapage/js/lib/calendar/html_events";
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
        super.end();
        this.generate();
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
        let storage = this.load('all_events');
        if (!storage) {
            this.trigger_event(mel_metapage.EventListeners.calendar_updated.get, {}, {top:true});
            storage = this.load('all_events');
        }

        return storage;
    }

    generate() {
        const events = this.check_storage_datas() ?? [];
        let $contents = this.select_module_content().html(EMPTY_STRING);

        if (events.length > 0) {
            let ul = new mel_html2('ul', {});
            const len = events.length > 3 ? 3 : events.length;
            for (let index = 0; index < len; ++index) {
                const event = events[index];
                ul.addContent(new mel_html2('li', {contents:[new html_events(event)]}));
            }
            ul.create($contents);
        }
        else {
            $contents.html("Pas d'évènements aujourd'hui ainsi que dans les 7 prochains jours !");
        }
    }

    module_id() {
        let id = super.module_id();

        if (!!id) id += `_${MODULE_ID}`;
        else id = MODULE_ID;

        return id;
    }
}