import { custom_alarm_dialog } from "../../../../../skins/mel_elastic/js_templates/custom_alarm.js";
import { MelEnumerable } from "../../../classes/enum.js";
import { RcmailDialog, RcmailDialogButton } from "../../../classes/modal.js";
import { EMPTY_STRING } from "../../../constants/constants.js";
import { MelHtml } from "../../../html/JsHtml/MelHtml.js";
import { Alarm } from "../../alarms.js";
import { FakePart, Parts } from "./parts.js";

class AlarmData {
    constructor(value) {
        this.value = value;
        this.offset = EMPTY_STRING;

        Object.defineProperty(this, 'offset', {
            get:() => {
                if (this.value >= (60*24*7)) {
                    return '-W';
                }
                else if (this.value >= (60*24)) {
                    return '-D';
                }
                else if (this.value >= 60) {
                    return '-H';
                }
                else {
                    return '-M';
                }
            }
        });
    }

    getTime(include_week = false) {
        let val;
        switch (this.offset) {
            case '-W':
                if (include_week) {
                    val = this.value/60/24/7;
                    break;
                }
            case '-D':
                val = this.value/60/24;
                break;
        
            case '-H':
                val = this.value/60;
                break;

            case '-M':
                val = this.value;
                break;

            default:
                val = 0;
                break;
        }

        return val;
    }

    toString() {
        let val = this.getTime(true);

        let offset = EMPTY_STRING;
        const has_s = val > 1;

        switch (this.offset) {
            case '-W':
                offset = `semaine${has_s ? 's' : ''}`;

                if (~~val !== val) {
                    const tmp = Math.round((val - (~~val)) * 7);
                    val = ~~val;

                    if (1 === val) offset = offset.slice(0, offset.length-1);

                    offset += ` et ${tmp} jour${tmp >= 2 ? 's' : ''}`;
                }

                break;
            case '-D':
                offset = `jour${val > 1 ? 's' : ''}`;

                if (~~val !== val) {
                    const tmp = Math.round((val - (~~val)) * 24);
                    val = ~~val;

                    if (1 === val) offset = offset.slice(0, offset.length-1);

                    offset += ` et ${tmp} heure${tmp >= 2 ? 's' : ''}`;
                }
                break;
            case '-H':
                offset = `heure${val > 1 ? 's' : ''}`;

                if (~~val !== val) {
                    const tmp = Math.round((val - (~~val)) * 60);
                    val = ~~val;

                    if (1 === val) offset = offset.slice(0, offset.length-1);

                    offset += ` et ${tmp} minute${tmp >= 2 ? 's' : ''}`;
                }
                break;
        
            default:
                offset = `minute${val > 1 ? 's' : ''}`;
                break;
        }

        return `${val} ${offset}`;
    }

    static From(val, offset) {
        switch (offset) {
            case '-W':
                val *= 7;
            case '-D':
                val *= 24;
            case '-H':
                val *= 60;

            default:
                break;
        }

        return new AlarmData(val);
    }
}

export class AlarmPart extends FakePart {
    constructor($alarm_type, $alarm_offset, $alarf_offset_type, $alarm) {
        super($alarm_offset, $alarm, Parts.MODE.change);
        this._$fieldAlarmType = $alarm_type;
        this._$fieldAlarmOffsetType = $alarf_offset_type;

        this._$fakeField.tooltip({
            title:() => {
                const val = this._$fakeField.val();
                
                if (!!(val || false) && 0 !== val && '0' !== val) return `Rappel de ${this._$fakeField.find('option:selected').text()} avant`;
                else return 'Aucun rappel';
            },
            trigger:'hover'
        });
    }

    init(event) {
        this._$fakeField.html(EMPTY_STRING);
        let options_alarms = AlarmPart.PREDEFINED
        let val = 0;

        if (!!event.alarms)
        {
            const alarm = new Alarm(event.alarms);

            if (0 !== alarm.getTime()) {
                const time = alarm.getTime()/1000/60;
                val = time;

                if (!MelEnumerable.from(AlarmPart.PREDEFINED).where(x => x.value === time).any()) {
                    const data = new AlarmData(time);
                    const str = data.toString();
                    options_alarms = MelEnumerable.from(options_alarms).aggregate({
                        value:data.value,
                        label:str
                    }).orderBy(x => -1 === x.value ? Number.POSITIVE_INFINITY : x.value);
                }
            } 

        }
        else if (!!rcmail.env.calendar_default_alarm_offset) {
            event.alarms = rcmail.env.calendar_default_alarm_offset;
            event.alarms = `${event.alarms[0]}PT${event.alarms.slice(1)}:DISPLAY`;
            return this.init(event);
        }

        let $option;
        for (const alarm of options_alarms) {
            $option = MelHtml.start.option({value:alarm.value}).text(alarm.label).end().generate().appendTo(this._$fakeField);

            if (alarm.value === val) {
                $option.attr('selected', 'selected');
            }
        }

        $option = null;


        return this;
    }

    onUpdate(val) {
        switch (val) {
            case undefined:
            case null:
            case 0:
                this._$field.val(0);
                this._$fieldAlarmType.val(EMPTY_STRING).change();
                this._$fieldAlarmOffsetType.val('-M').change();         
                break;

            case -1:
                this._startModalCustomAlarm(val);
                break;
        
            default:
                const alarm = new AlarmData(val);
                this._$fieldAlarmType.val('DISPLAY').change();
                this._$field.val(alarm.getTime());
                this._$fieldAlarmOffsetType.val('-W' === alarm.offset ? '-D' : alarm.offset).change();
                break;
        }
    }

    onChange(...args) {
        let $e = $(args[0].currentTarget);

        this.onUpdate(+($e.val()));
    }

    _startModalCustomAlarm() {
        let $dialog = new RcmailDialog(custom_alarm_dialog, {
            title:'Alarme personnalisée',
            'buttons':[
                new RcmailDialogButton('Valider', {
                    click:() => {
                        let offset = $dialog._$dialog.find('select').attr('disabled', 'disabled').addClass('disabled').val();
                        let value = +($dialog._$dialog.find('input').attr('disabled', 'disabled').addClass('disabled').val());

                        if ('-W' === offset) {
                            offset = '-D';
                            value *= 7;
                        }

                        const alarm = AlarmData.From(value, offset);
                        this.onUpdate(alarm.value);
                        if (!MelEnumerable.from(AlarmPart.PREDEFINED).where(x => x.value === alarm.value).any()) {
                            this._$fakeField.html(EMPTY_STRING);
                            let enu = MelEnumerable.from(AlarmPart.PREDEFINED).aggregate([{
                                value:alarm.value,
                                label:alarm.toString()
                            }]).orderBy(x => -1 === x.value ? Number.POSITIVE_INFINITY : x.value).toArray();
    
                            for (const iterator of enu) {
                                MelHtml.start.option({value:iterator.value}).text(iterator.label).end().generate().appendTo(this._$fakeField);
                            }
                        }

                        setTimeout(() => {
                            this._$fakeField.val(alarm.value);
                            $dialog.destroy();
                        }, 10);
                    }
                })
            ]
        });

        $($dialog._$dialog).on( "dialogbeforeclose", ( event, ui ) => {
            this._$fakeField.val(0);
        });
    }
}

AlarmPart.PREDEFINED = [
    {label:'Aucune', value:0},
    {label:'5 minutes', value:5},
    {label:'10 minutes', value:10},
    {label:'15 minutes', value:15},
    {label:'30 minutes', value:30},
    {label:'1 heure', value:60},
    {label:'2 heures', value:120},
    {label:'12 heures', value:(60*12)},
    {label:'1 jour', value:(60*24)},
    {label:'1 semaine', value:(60*24*7)},
    {label:'Personnalisé', value:-1}
];

