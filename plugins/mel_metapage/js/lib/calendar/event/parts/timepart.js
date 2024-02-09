import { MelHtml } from "../../../html/JsHtml/MelHtml.js";
import { FakePart, Parts } from "./parts.js";

export class TimePartManager {
    constructor($start_date, $start_time, $start_select, $end_date, $end_time, $end_select, $allDay) {
        this.start = new TimePart($start_time, $start_select);
        this.end = new TimePart($end_time, $end_select);
        this._$start_date = $start_date;
        this._$end_date = $end_date;
        this.$allDay = $allDay;
    }

    init(event) {
        if (event.allDay) {
            this.start.init(moment().startOf('day'));
            this.end.init(moment().startOf('day'));
            this.$allDay[0].checked = true;
        }
        else {
            this.start.init(moment(event.start));
            this.end.init(moment(event.end), (moment(event.start).format('DD/MM/YYYY') === moment(event.end).format('DD/MM/YYYY') ? moment(event.start).format('HH:mm')  : null));
            this.$allDay[0].checked = false;
        }

        if ($._data(this.start._$fakeField[0], 'events' )?.change?.length <= 1) {
            this.start._$fakeField.on('change', () => {
                let start = moment(`${this._$start_date.val()} ${this.start._$fakeField.val()}`, 'DD/MM/YYYY HH:mm');
                let end = moment(`${this._$end_date.val()} ${this.end._$fakeField.val()}`, 'DD/MM/YYYY HH:mm');

                if (start > end) {
                    end = moment(start).add(TimePart.INTEVERVAL, 'm');
                    this.end.reinit(end, end.format('HH:mm'));
                }
                //this.end.reinit
            });
        }
    }
}

class TimePart extends FakePart{
    constructor($time_field, $time_select) {
        super($time_field, $time_select, Parts.MODE.change);

    }

    init(val, min = null) {
        if (0 === this._$fakeField.children().length) {
            if (!!min) {
                min = min.split(':');
                min = moment().startOf('day').add(+min[0], 'H').add(+min[1], 'm');
            }

            let base = moment().startOf('day');
            let next = moment().startOf('day').add(1, 'd');
            let formatted_text = null;

            while (base < next) {
                if (!min || base > min) {
                    formatted_text = base.format('HH:mm')
                    MelHtml.start.option({value:formatted_text}).text(formatted_text).end().generate().appendTo(this._$fakeField);
                }

                base  = base.add(TimePart.INTEVERVAL, 'm');
            }
        }

        this._$fakeField.val(val.format('HH:mm'));
    }

    reinit(val, min){
        this._$fakeField.empty();
        this.init(val, min);
    } 

    onChange(e) {

    }
}

TimePart.INTEVERVAL = 15;