import { BnumLog } from "../classes/bnum_log";
import { MelObject } from "../mel_object";
import { WaitSomething } from "../mel_promise";

export class MelCalendar extends MelObject {
    constructor() {
        super();
    }

    main() {
        super.main();
        BnumLog.info('MelCalendar/main', 'Starting calendar module');
        this._add_on_load();
        MelCalendar.rerender();
    }

    _add_on_load() {
        this.on_frame_loaded(async (...args) => {
            this._rerender_on_load(...args);
        }, {frame:'calendar', callback_key:'MelCalendar/_add_on_load/on_frame_loaded'});
        return this;
    }

    async _rerender_on_load(...args) {
        const {eClass:frame_name, changepage, isAriane, querry:frame, id, first_load} = args;
            
        if ('calendar' === frame_name) { 
            await MelCalendar.rerender();
        }
    }

    static async rerender() {
        BnumLog.info('MelCalendar/rerender', 'Wainting #calendar....');
        let resolved = (await new WaitSomething(() => this.select('#calendar').length > 0)).resolved;

        if (resolved) {
            BnumLog.info('MelCalendar/rerender', '#calendar found !');
            let $calendar = $('#calendar');
            $calendar.fullCalendar('rerenderEvents');
            $calendar.fullCalendar('updateViewSize', true); 
        }   
        else {
            BnumLog.warning('MelCalendar/rerender', '#calendar not found !')
        }  
    }
}