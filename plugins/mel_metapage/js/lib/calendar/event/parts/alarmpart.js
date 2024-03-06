import { custom_alarm_dialog } from "../../../../../skins/mel_elastic/js_templates/custom_alarm.js";
import { MelEnumerable } from "../../../classes/enum.js";
import { RcmailDialog, RcmailDialogButton } from "../../../classes/modal.js";
import { EMPTY_STRING } from "../../../constants/constants.js";
import { MelHtml } from "../../../html/JsHtml/MelHtml.js";
import { isDecimal } from "../../../mel.js";
import { Alarm } from "../../alarms.js";
import { FakePart, Parts } from "./parts.js";

/**
 * Contient les données d'un rappel
 * @class
 * @classdesc Contient les données d'un rappel. Sa valeur et son "unitée" (minutes, heures, jours etc....) 
 */
class AlarmData {
    /**
     * 
     * @param {number} value Durée en minutes
     */
    constructor(value) {
        /**
         * Durée en minutes
         * @member
         * @type {number}
         */
        this.value = value;
        /**
         * Unitée de la durée 
         * 
         * Peut être : ``-W`` pour semaine, ``-D`` pour jour, ``-H`` pour heure, ``-M`` pour minute
         * @member
         * @readonly
         * @type {string}
         */
        this.offset = EMPTY_STRING;

        Object.defineProperty(this, 'offset', {
            get:() => {
                if (this.value >= (60*24*7)) {
                    return AlarmData.OFFSETS.WEEK;
                }
                else if (this.value >= (60*24)) {
                    return  AlarmData.OFFSETS.DAY;
                }
                else if (this.value >= 60) {
                    return  AlarmData.OFFSETS.HOUR;
                }
                else {
                    return  AlarmData.OFFSETS.MINUTE;
                }
            }
        });
    }

    /**
     * Récupère le texte d'une valeur sous format : x unite et x sous unités.
     * 
     * Prend en compte les pluriels.
     * 
     * Dans la localization du plugin, il doit y avoir les clés suivantes : `text_key`, `text_key_plurial`, `text_key_after`, `text_key_after_plurial`.
     * 
     * (Remplacez ``text_key`` par le nom de la clé que vous voulez utiliser, exemple : ``week`` pour la semaine, ``day`` pour la journée etc...)
     * 
     * `_plurial` signifie le pluriel
     * 
     * `_after` signifie l'affichage de la deuxième unitée de temps. Celle ci doit contenir `%0`.
     * 
     * example : `hour` => heure, `hour_plurial` => heures, `hour_after` =>  et %0 minute, `hour_after_plurial` =>  et %0 minutes
     * 
     * @private
     * @param {number} multiplier Le multiplier qui permet de déduire le nombre de sous unitées sous forme entière (ex: 7 pour les semaines, 24 pour les jours etc...)
     * @param {number} val Valeur du rappel en minute
     * @param {string} text_key Clé qui sera utiliser par `rcmail.gettext()`
     * @returns {{text:string, value:number}}
     */
    _getText(val, multiplier, text_key) {
        let has_s = val > 1;
        let offset = rcmail.gettext(`${text_key}${has_s ? '_plurial' : EMPTY_STRING}`, 'mel_metapage');

        if (isDecimal(val)) {
            const tmp = Math.round((val - (~~val)) * multiplier);
            val = ~~val;
            has_s = tmp > 1;

            if (1 === val) offset = offset.slice(0, offset.length - 1);

            offset += rcmail.gettext(`${text_key}_after${has_s ? '_plurial' : EMPTY_STRING}`, 'mel_metapage').replaceAll('%0', tmp);
        }

        return {text:offset, value:val};
    }

    /**
     * Récupère le temps convertit à partir de l'unitée.
     * @param {boolean} include_week Par défaut : ``false``. Si ``true``, inclut les semaines dans le calcul. 
     * @returns {number}
     */
    getTime(include_week = false) {
        let val;
        switch (this.offset) {
            case AlarmData.OFFSETS.WEEK:
                if (include_week) {
                    val = this.value/60/24/7;
                    break;
                }
            case AlarmData.OFFSETS.DAY:
                val = this.value/60/24;
                break;
        
            case AlarmData.OFFSETS.HOUR:
                val = this.value/60;
                break;

            case AlarmData.OFFSETS.MINUTE:
                val = this.value;
                break;

            default:
                val = 0;
                break;
        }

        return val;
    }

    /**
     * Affiche la donnée en texte lisible et compréhensible pour un être humain.
     * @returns {string}
     */
    toString() {
        let val = this.getTime(true);
        let text_key = EMPTY_STRING;
        let multiplier = 0;

        switch (this.offset) {
            case AlarmData.OFFSETS.WEEK:
                text_key = 'week';
                multiplier = 7;

                break;
            case AlarmData.OFFSETS.DAY:
                text_key = 'day';
                multiplier = 24;
                break;
            case AlarmData.OFFSETS.HOUR:
                text_key = 'hour';
                multiplier = 60;
                break;
        
            default:
                text_key = 'minutes';
                break;
        }

        const {text, value} = this._getText(val, multiplier, text_key);
        const offset = text;
        val = value;

        return `${val} ${offset}`;
    }

    /**
     * Créer une instance de ``AlarmData`` à partir d'une durée et d'une unitée.
     * @static
     * @param {number} val Durée en minutes 
     * @param {string} offset Unitée de la durée. Peut être : ``-W`` pour semaine, ``-D`` pour jour, ``-H`` pour heure, ``-M`` pour minute
     * @returns {AlarmData}
     * @see {@link AlarmData.OFFSETS}
     */
    static From(val, offset) {
        switch (offset) {
            case AlarmData.OFFSETS.WEEK:
                val *= 7;
            case AlarmData.OFFSETS.DAY:
                val *= 24;
            case AlarmData.OFFSETS.HOUR:
                val *= 60;

            default:
                break;
        }

        return new AlarmData(val);
    }
}

/**
 * Enumerable des unitées
 * @static
 * @readonly
 * @enum {string}
 * @see {@link AlarmData.From}
 */
AlarmData.OFFSETS = {
    WEEK:'-W',
    DAY:'-D',
    HOUR:'-H',
    MINUTE:'-M'
}

/**
 * Partie de la vue qui gère les rappels
 * @class
 * @classdesc Partie de la vue qui gère les rappels, elle fait le lien entre le champs de base qui est un ensemble de 3 champs et le champ visuel qui est un `select`
 * @extends FakePart
 */
export class AlarmPart extends FakePart {
    /**
     * 
     * @param {$} $alarm_type Champ qui gère le type d'alarme
     * @param {$} $alarm_offset Champ qui gère la durée de l'alarme
     * @param {$} $alarf_offset_type Champ qui gère l'unitée de l'alarme
     * @param {$} $alarm Champ visuel qui sera afficher à la place du champ de base
     */
    constructor($alarm_type, $alarm_offset, $alarf_offset_type, $alarm) {
        super($alarm_offset, $alarm, Parts.MODE.change);
        /**
         * Champ qui gère le type d'alarme
         * @type {$}
         */
        this._$fieldAlarmType = $alarm_type;
        /**
         * Champ qui gère l'unitée de l'alarme
         * @type {$}
         */
        this._$fieldAlarmOffsetType = $alarf_offset_type;

        //Génère le tooltip du champs
        this._$fakeField.tooltip({
            title:() => {
                const val = this._$fakeField.val();
                
                if (!!(val || false) && 0 !== val && '0' !== val) return rcmail.gettext('rappel_of', 'mel_metapage').replaceAll('%0', this._$fakeField.find('option:selected').text());
                else return rcmail.gettext('no_rappel', 'mel_metapage');
            },
            trigger:'hover'
        });
    }

    /**
     * Initialise la classe par rapport à l'évènement
     * @param {*} event Evènement de plugin `calendar` 
     * @returns {AlarmPart} Chaînage
     */
    init(event) {
        this._$fakeField.html(EMPTY_STRING);
        let options_alarms = AlarmPart.PREDEFINED
        let val = 0;

        // Ajoute une option si une alarm existe déjà
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
            //Si il y a un rappel par défaut et pas de rappel dans l'évènement, on le rajoute
            event.alarms = rcmail.env.calendar_default_alarm_offset;
            event.alarms = `${event.alarms[0]}PT${event.alarms.slice(1)}:DISPLAY`;
            return this.init(event);
        }

        //Génère les options du select
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

    /**
     * Action qui sera effectué lors de la mise à jour du champ visuel
     * @param {string} val Valeur du select
     * @override
     */
    onUpdate(val) {
        switch (val) {
            case undefined:
            case null:
            case 0:
                this._$field.val(0);
                this._$fieldAlarmType.val(EMPTY_STRING).change();
                this._$fieldAlarmOffsetType.val(AlarmData.OFFSETS.MINUTE).change();         
                break;

            case -1:
                this._startModalCustomAlarm(val);
                break;
        
            default:
                const alarm = new AlarmData(val);
                this._$fieldAlarmType.val('DISPLAY').change();
                this._$field.val(alarm.getTime());
                this._$fieldAlarmOffsetType.val(AlarmData.OFFSETS.WEEK === alarm.offset ? AlarmData.OFFSETS.DAY : alarm.offset).change();
                break;
        }
    }

    /**
     * Action qui sera appelé lors de la mise à jour du champ visuel
     * 
     * Appele la fonction @see {@link AlarmPart~onUpdate}
     * @param  {...any} args 
     * @event
     * @override
     */
    onChange(...args) {
        let $e = $(args[0].currentTarget);

        this.onUpdate(+($e.val()));
    }

    /**
     * Ouvre une boîte de dialogue pour choisir une alarme personnalisée
     * @private
     */
    _startModalCustomAlarm() {
        let $dialog = new RcmailDialog(custom_alarm_dialog, {
            title:rcmail.gettext('custom_alarm_title', 'mel_metapage'),
            'buttons':[
                new RcmailDialogButton(rcmail.gettext('validate'), {
                    click:() => {
                        let offset = $dialog._$dialog.find('select').attr('disabled', 'disabled').addClass('disabled').val();
                        let value = +($dialog._$dialog.find('input').attr('disabled', 'disabled').addClass('disabled').val());

                        if (AlarmData.OFFSETS.WEEK === offset) {
                            offset = AlarmData.OFFSETS.DAY;
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

/**
 * Liste des rappels prédéfinis
 * @type {Array<{label:string, value:number}>}
 */
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

