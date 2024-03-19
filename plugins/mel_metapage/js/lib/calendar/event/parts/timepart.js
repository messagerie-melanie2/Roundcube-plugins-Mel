/**
 * @module EventView/Parts/DateTime
 * @local TimePartManager
 * @local TimePart
 */

import { DATE_FORMAT, DATE_HOUR_FORMAT, DATE_TIME_FORMAT } from "../../../constants/constants.dates.js";
import { EMPTY_STRING } from "../../../constants/constants.js";
import { MelHtml } from "../../../html/JsHtml/MelHtml.js";
import { GuestsPart } from "./guestspart.js";
import { CLASS_ALL_DAY } from "./parts.constants.js";
import { FakePart, Parts } from "./parts.js";

/**
 * @class
 * @classdesc Gère la partie lié à la date et à l'heure 
 */
export class TimePartManager {
    /**
     * 
     * @param {external:jQuery} $start_date Champ date de début
     * @param {external:jQuery} $start_time Champ heure de début
     * @param {external:jQuery} $start_select Champ visuel de l'heure de début
     * @param {external:jQuery} $end_date Champ date de fin
     * @param {external:jQuery} $end_time Champ haure de fin
     * @param {external:jQuery} $end_select Champ visuel de l'heure de fin
     * @param {external:jQuery} $allDay Checkbox "journée entière"
     */
    constructor($start_date, $start_time, $start_select, $end_date, $end_time, $end_select, $allDay) {
        /**
         * Partie qui gère l'heure de début
         * @type {TimePart}
         * @member
         */
        this.start = new TimePart($start_time, $start_select);
        /**
         * Partie qui gère l'heure de fin
         * @type {TimePart}
         * @member
         */
        this.end = new TimePart($end_time, $end_select);
        /**
         * Champ date de début
         * @package
         * @type {external:jQuery}
         * @member
         */
        this._$start_date = $start_date;
        /**
         * Champ date de fin
         * @package
         * @type {external:jQuery}
         * @member
         */
        this._$end_date = $end_date;
        /**
         * Checkbox journée entière
         * @type {external:jQuery}
         * @member
         */
        this.$allDay = $allDay;
        /**
         * Différence de temps entre la date de début et la date de fin
         * @type {number}
         * @member
         * @readonly
         */
        this.base_diff = 0;
        /**
         * Date de début
         * @type {external:moment}
         * @member
         * @readonly
         */
        this.date_start = null;
        /**
         * Date de fin
         * @type {external:moment}
         * @member
         * @readonly
         */
        this.date_end = null;

        Object.defineProperties(this, {
            date_start: {
                get:() => {
                    return moment(`${this._$start_date.val()} ${this.start._$fakeField.val()}`, DATE_TIME_FORMAT);
                }
            },
            date_end:{
                get:() => {
                    return moment(`${this._$end_date.val()} ${this.end._$fakeField.val()}`, DATE_TIME_FORMAT);
                }
            }
        })
    }

    /**
     * Initialise les champs.
     * @param {*} event Evènement du plugin `Calendar`
     */
    init(event) {
        //Journée entière
        if (event.allDay) {
            this.start.init(moment().startOf('day'), this.base_diff);
            this.end.init(moment().startOf('day'), this.base_diff);
            this.$allDay[0].checked = true;
        }
        else {
            //Si une date n'éxiste pas
            if (!event.start || !event.end) {
                const now = moment();
                
                if (!event.start) event.start = now;

                if (!event.end) {
                    event.end = moment(event.start).add(TimePart.INTERVAL, 'm');

                    if (event.start.format(DATE_FORMAT) !== event.end.format(DATE_FORMAT)) {
                        event.end = moment(event.start).endOf('d');

                        if (event.start.format(DATE_TIME_FORMAT) === event.end.format(DATE_TIME_FORMAT)) event.start = event.start.remove(1, 'm');
                    }
                }
            }

            //On initialise les champs
            this.start.init(moment(event.start), this.base_diff);
            this.end.reinit(moment(event.end), this.base_diff, (moment(event.start).format(DATE_FORMAT) === moment(event.end).format(DATE_FORMAT) ? moment(event.start).format(DATE_HOUR_FORMAT)  : null));
            this.$allDay[0].checked = false;
        }

        //Gestion des évènements
        if (($._data(this.start._$fakeField[0], 'events' )?.change?.length ?? 0) <= 1) {
            this.start._$fakeField.on('change', this._update_date.bind(this));
        }

        if (($._data(this.end._$fakeField[0], 'events' )?.change?.length ?? 0) <= 1) {
            this.end._$fakeField.on('change', () => {
                GuestsPart.UpdateDispos(this.date_start, this.date_end, this.$allDay.prop('checked'));
            });
        }

        if (($._data(this.$allDay[0], 'events' )?.change?.length ?? 0) === 0) {
            this.$allDay.on('change', this._on_all_day_changed.bind(this));
        }

        this.$allDay.change();

        rcmail.addEventListener('calendar.event_times_changed', this._update_date.bind(this));

        const _base_diff = (moment(`${this._$end_date.val()} ${this.end._$fakeField.val()}`, DATE_TIME_FORMAT) - moment(`${this._$start_date.val()} ${this.start._$fakeField.val()}`, DATE_TIME_FORMAT));///60/1000;

        Object.defineProperty(this, 'base_diff', {
            get() {return _base_diff;}
        });
    }

    /**
     * Action à faire lorsque la date est invalide
     * @param {external:jQuery} $field Champ concerné
     * @param {TimePartManager.WORDS} word Fin ou début ?
     * @returns {boolean}
     * @package
     */
    _invalid_action_date($field, word) {
        if (!moment($field.val(), DATE_FORMAT).isValid()) {
            rcmail.display_message(`Le date de ${word} n'est pas valide !`, 'error');
            $field.focus();
            return true;
        }

        return false;
    }

    /**
     * Action à faire lorsque l'heure est invalide
     * @param {TimePart} part Partie de l'heure concerné
     * @param {TimePartManager.WORDS} word Fin ou début ?
     * @returns {boolean}
     * @package
     */
    _invalid_action_time(part, word) {
        if (!part.is_valid()) {
            rcmail.display_message(`L'heure de ${word} n'est pas valide !`, 'error');
            part._$fakeField.focus();
            return true;
        }

        return false;
    }

    /**
     * Si les champs ont les valeurs attendus
     * @returns {boolean}
     */
    is_valid() {
        return this.start.is_valid() && this.end.is_valid() && moment(this._$start_date.val(), DATE_FORMAT).isValid() && moment(this._$end_date.val(), DATE_FORMAT).isValid()
    }

    /**
     * Action à faire lorsque les champs sont invalides
     */
    invalid_action() {
        this._invalid_action_date(this._$start_date, TimePartManager.WORDS.start) || 
        this._invalid_action_date(this._$end_date, TimePartManager.WORDS.end)     ||
        this._invalid_action_time(this.start, TimePartManager.WORDS.start)        ||
        this._invalid_action_time(this.end, TimePartManager.WORDS.end);
    }

    /**
     * Lorsque l'un des champs est modifié, mets à jours les champ de sauvegarde et réinitialise les selects si besoin.
     * @package
     * @returns {void}
     */
    _update_date() {
        //On évite de le faire plusieurs fois pour éviter les appels serveurs
        if (true === this._update_date.started) return;
        else this._update_date.started = true;

        //Prendre en compte le champs personnalisé
        if (this.start._$fakeField.val() === '-1' || this.end._$fakeField.val() === '-1') {
            this._update_date.started = false;
            return;
        }

        let start = moment(`${this._$start_date.val()} ${this.start._$fakeField.val()}`, DATE_TIME_FORMAT);
        let end = moment(`${this._$end_date.val()} ${this.end._$fakeField.val()}`, DATE_TIME_FORMAT);

        //Gestion du cas ou la date de début dépasse la date de fin
        if (start >= end) {
            end = moment(start).add(this.base_diff);
            this.end.reinit(end, this.base_diff, start.format(DATE_HOUR_FORMAT));
            this._$end_date.val(end.format(DATE_FORMAT)).change();

            //Si la date n'éxiste pas, on la réjoute dans le select
            if (!(this.end._$fakeField.val() || false)) {
                end = start.add(1, 'd').startOf('d').add(this.base_diff);
                this._$end_date.val(end.format(DATE_FORMAT));
                this.end._$fakeField.val(end.format(DATE_HOUR_FORMAT));
                this._update_date.started = false;
                this._update_date();
            }
        }
        else {
            //On réinitialise le select, seulement si on en a besoin
            let is_same_day = moment(start).startOf('day').format(DATE_FORMAT) === moment(end).startOf('day').format(DATE_FORMAT);
            let need_reinit = this.end._$fakeField.children().first().val() !== (is_same_day ? start.format(DATE_HOUR_FORMAT) : '00:00');

            if (need_reinit) this.end.reinit(end, this.base_diff, (is_same_day ? start.format(DATE_HOUR_FORMAT) : null));
        }

        GuestsPart.UpdateDispos(start, end, this.$allDay.prop('checked'));
        GuestsPart.UpdateFreeBusy(this);

        this._update_date.started = false;
    }

    /**
     * Lorsque la journée entière est coché ou décoché
     * @param {Event} e
     */
    _on_all_day_changed(e) {
        if ($(e.currentTarget)[0].checked) {
            this.start._$fakeField.css('display', 'none').parent().parent().addClass(CLASS_ALL_DAY);
            this.end._$fakeField.css('display', 'none').parent().parent().addClass(CLASS_ALL_DAY);

        }
        else {
            this.start._$fakeField.css('display', EMPTY_STRING).parent().parent().removeClass(CLASS_ALL_DAY);
            this.end._$fakeField.css('display', EMPTY_STRING).parent().parent().removeClass(CLASS_ALL_DAY);
        }
    }

    /**
     * Met à jour le select en ajoutant une option qui n'éxiste pas.
     * @param {string} select Id du select
     * @param {string} value Valeur à ajouter. Le format doit être 'HH:mm'
     * @static
     * @see {@link TimePart.UpdateOption}
     */
    static UpdateOption(select, value) {
        TimePart.UpdateOption(select, value);
    }

}

/**
 * Enumération qui contient les mots des actions invalides
 * @static
 * @enum {string}
 * @readonly
 */
TimePartManager.WORDS = {
    start:'début',
    end:'fin'
};

/**
 * @class
 * @classdesc Gère la partie lié à l'heure
 * @extends FakePart
 * @frommodule EventView/Parts
 */
class TimePart extends FakePart{
    /**
     * 
     * @param {external:jQuery} $time_field  Champ de sauvegarde
     * @param {external:jQuery} $time_select Champ visuel
     */
    constructor($time_field, $time_select) {
        super($time_field, $time_select, Parts.MODE.change);
    }

    /**
     * Intialise les champs
     * @param {string} val Date au format 'HH:mm'
     * @param {number} base_interval Interval entre la date de fin et la date de début
     * @param {?string} min Date au format 'HH:mm'. Le select ne pourra pas avoir une valeur inférieur à cette date. Optionnel
     * @override
     */
    init(val, base_interval, min = null) {
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
                    formatted_text = base.format(DATE_HOUR_FORMAT)
                    this._$fakeField.append(MelHtml.start.option({value:formatted_text}).text(formatted_text).end().generate());
                }

                base = base.add(TimePart.INTERVAL, 'm');
            }
        }

        //Gestion de la valeur du champ
        val = this._toTimeMoment(val);
        min = !!min ? this._toTimeMoment(min) : null;
        //Si la valeur est inférieur à la valeur minimum, on ajoute l'interval de base
        const formatted = !!min && val <= min ? moment(min).add(base_interval).format(DATE_HOUR_FORMAT) : val.format(DATE_HOUR_FORMAT);

        TimePart.UpdateOption(this._$fakeField.attr('id'), formatted);

        $(`#${this._$fakeField.attr('id')}`).val(formatted);

        //Si la valeur du champ de sauvegarde est différente de la valeur du champ visuel, on met à jours le champ de sauvegarde
        if (this._$field.val() !== $(`#${this._$fakeField.attr('id')}`).val()) {
            this._$field.val(formatted);
        }

        //Ajout de l'option "Personalisé"
        if (0 === this._$fakeField.find('option[value="-1"]').length) {
            this._$fakeField.append(MelHtml.start.option({value:-1}).text('Personnalisé').end().generate());
        }
    }

    /**
     * Retourne une heure au format 'DD/MM/YYYY HH:mm' en objet `moment`en utilisant la date d'aujourd'hui pour extraire 'DD/MM/YYYY'.
     * @param {string} val Date au format 'HH:mm' 
     * @returns {external:moment}
     */
    _toTimeMoment(val) {
        return moment(`${moment().startOf('year').format(DATE_FORMAT)} ${val.format(DATE_HOUR_FORMAT)}`);
    }

    /**
     * Vide le select puis appelle `init`
     * @param {string} val Date au format 'HH:mm'
     * @param {number} base_interval Interval entre la date de fin et la date de début
     * @param {?string} min Date au format 'HH:mm'. Le select ne pourra pas avoir une valeur inférieur à cette date. Optionnel
     */
    reinit(val, base_interval, min){
        this._$fakeField.empty();
        this.init(val, base_interval, min);
    } 

    /**
     * Action qui sera appelé lorsque le champ change de valeur.
     * @param {Event} e 
     * @override
     */
    onChange(e) {
        const val = $(e.currentTarget).val();

        if ('-1' === val) {
            $(`#fake-${this._$fakeField.attr('id')}`).css('display', '').val(this._$field.val()).off('change').on('change', (e) => {

                const val = $(e.currentTarget).val();
                if (val.includes(':') && moment(val, DATE_HOUR_FORMAT).isValid()) {
                    $(`#fake-${this._$fakeField.attr('id')}`).css('display', 'none').off('change');
                    this.init(moment(val, DATE_HOUR_FORMAT), TimePart.INTERVAL);
                    this._$fakeField.css('display', '').val(val).change();
                }
            });
            this._$fakeField.css('display', 'none');
        } else this._$field.val(val);
    }

    /**
     * Si le champ est valide ou non
     * @returns {boolean}
     */
    is_valid() {
        return this._$fakeField.val() !== EMPTY_STRING;
    }

    /**
     * Met à jour le select en ajoutant une option qui n'éxiste pas.
     * @param {string} select Id du select
     * @param {string} value Valeur à ajouter. Le format doit être 'HH:mm'
     * @static
     */
    static UpdateOption(select, value) {
        if ($(`#${select} [value="${value}"]`).length === 0) 
        {
            const current = moment(value, DATE_HOUR_FORMAT);

            for (const e of $(`#${select} option`)) {
                if (current < moment($(e).val(), DATE_HOUR_FORMAT)) {
                    $(e).before($('<option>').val(value).text(value));
                    break;
                }
            }
        }
    }
}

/**
 * Interval de temps par défaut
 * @static
 * @readonly
 * @type {number}
 * @default 15
 */
TimePart.INTERVAL = 15;