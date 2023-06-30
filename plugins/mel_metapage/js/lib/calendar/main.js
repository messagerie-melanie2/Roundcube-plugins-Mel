import { BnumLog } from "../classes/bnum_log.js";
import { MelObject } from "../mel_object.js";
import { WaitSomething } from "../mel_promise.js";

export class MelCalendar extends MelObject {
    constructor() {
        super();
    }

    main() {
        super.main();
        BnumLog.info('MelCalendar/main', 'Starting calendar module');
        this._add_on_load();
        MelCalendar.rerender({helper_object:this});
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
            await MelCalendar.rerender({helper_object:this});
        }
    }

    static async rerender({
        helper_object = null,
        action_list = MelCalendar.initial_actions()
    }) {
        BnumLog.info('MelCalendar/rerender', 'Wainting #calendar....');
        const helper = helper_object ?? MelObject.Empty();
        let resolved = (await new WaitSomething(() => helper.select('#calendar').length > 0)).resolved;

        if (resolved) {
            BnumLog.info('MelCalendar/rerender', '#calendar found !');
            let $calendar = $('#calendar');

            for (const iterator of action_list) {
                $calendar.fullCalendar(iterator.action, ...iterator.args);
            }
        }   
        else {
            BnumLog.warning('MelCalendar/rerender', '#calendar not found !')
        }  
    }

    static initial_actions() {
        return [
            new MelCalendarAction('rerenderEvents'),
            new MelCalendarAction('updateViewSize', true)
        ];
    }

    static create_action(action, ...args) {
        return new MelCalendarAction(action, ...args);
    }
}

export class MelCalendarAction {
    constructor(action, ...args) {
        Object.defineProperties(this, {
            action: {
                get: () => action,
                configurable: true
            },          
            args: {
                get: () => args,
                configurable: true
            },      
        });
    }
}