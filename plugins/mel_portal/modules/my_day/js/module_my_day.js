export { ModuleMyDay };
import { html_events } from "../../../../mel_metapage/js/lib/html/html_events.js";
import { BaseStorage } from "../../../../mel_metapage/js/lib/classes/base_storage.js";
import { BnumLog } from "../../../../mel_metapage/js/lib/classes/bnum_log.js";
import { BaseModule } from "../../../js/lib/module.js";
import { MelEnumerable } from "../../../../mel_metapage/js/lib/classes/enum.js";

const TOP_KEY = 'my_day_listeners';
const LISTENER_KEY = mel_metapage.EventListeners.calendar_updated.after;
const MODULE_ID = 'My_day';
const MAX_SIZE = 3;
class ModuleMyDay extends BaseModule{
    constructor(load_module = true) {
        super(load_module);
    }

    start() {
        super.start();
        this._init()
            .set_listeners()
            .set_title_action('calendar');
    }

    end() {
        super.end();
        this.generate();
    }

    _init() {
        this.max_size = MAX_SIZE;
        this._timeouts = new BaseStorage();
        return this;
    }

    set_listeners() {
        this.add_event_listener(LISTENER_KEY, () => {
            this.clear_timeout().generate();
        }, {callback_key:TOP_KEY});

        return this;
    }

    async check_storage_datas() {
        let storage = this.load(mel_metapage.Storage.calendar_all_events);
        if (!storage) {
            const top = true;
            await this.rcmail(top).triggerEvent(mel_metapage.EventListeners.calendar_updated.get);
            storage = this.load(mel_metapage.Storage.calendar_all_events);
        }

        return storage;
    }

    async generate() {
        const now = moment();
        const events = MelEnumerable.from((await this.check_storage_datas()) ?? []).where(x => moment(x.end) > now && 'free' !== x.free_busy).orderBy(x => moment(x.start)).take(this.max_size);
        let $contents = this.select_module_content().html(EMPTY_STRING);

        if (events.any()) {
            let ul = new mel_html2('ul', {attribs:{class:'ignore-bullet'}});
            let next_end_date = null;

            for (const event of events) {
                if (!next_end_date) next_end_date = moment(event.end);
                else if (next_end_date > moment(event.end)) next_end_date = moment(event.end);

                ul.addContent(new mel_html2('li', {contents:[new html_events(event)]}));
            }

            BnumLog.info('MyDay/generate', 'timeout lunched');
            const timeout_id = setTimeout(() => {
                this.ontimeout();
            }, next_end_date - moment());
            this._timeouts.add('timeout', timeout_id);

            ul.create($contents);
        }
        else {
            new mel_html2('div', {
                attribs:{class:'melv2-event'},
                contents:[
                    new mel_html('p', {}, "Pas d'évènements dans les 7 prochains jours !")
                ]
            }).create($contents);
        }
    }

    clear_timeout() {
        const timeout = this._timeouts.get('timeout');
        clearTimeout(timeout);
        
        this._timeouts.clear();
        BnumLog.info('MyDay/clear_timeout', 'timeout cleared');
        return this;
    }

    async ontimeout() {
        BnumLog.info('MyDay/ontimeout', 'timeout touched');
        this.clear_timeout().generate();
    }

    module_id() {
        let id = super.module_id();

        if (!!id) id += `_${MODULE_ID}`;
        else id = MODULE_ID;

        return id;
    }
}