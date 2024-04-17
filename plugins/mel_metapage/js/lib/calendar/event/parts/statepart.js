/**
 * @module EventView/Parts/State
 * @local StatePart
 */

import { Parts } from "./parts.js";
export {StatePart}

/**
 * @class
 * @classdesc Représentation de l'état de l'évènement (public/privé etc...)
 * @extends Parts
 * @frommodule EventView/Parts
 */
class StatePart extends Parts {
    /**
     * 
     * @param {external:jQuery} $select Champs qui contient les données
     * @param {external:jQuery} $icon Icône qui changera selon la valeur du champs
     */
    constructor($select, $icon) {
        super($select, Parts.MODE.change);

        /**
         * Icône
         * @type {external:jQuery}
         * @member
         * @package
         */
        this._$icon = $icon;

        this._$field.tooltip({
            trigger:'hover'
        });
    }

    /**
     * Met  à jours le champ
     * @param {string} val Valeur qui permettra de changer l'icône
     * @override
     */
    onUpdate(val) {
        const keys = Object.keys(StatePart.CLASSES);

        for (const iterator of keys) {
            this._$icon.removeClass(StatePart.CLASSES[iterator]);
        }

        this._$icon.addClass(StatePart.ICONS_CLASSES[val] ?? '');
    }

    /**
     * Action qui sera appelé lorsque le champ changera de valeur.
     * @param  {...any} args 
     * @override
     */
    onChange(...args) {
        const [e] = args;
        let $target = $(e.currentTarget);
        this.onUpdate($target.val());
    }
}

/**
 * Liste des classes pour les différents états
 * @static
 * @enum {string}
 * @readonly
 */
StatePart.CLASSES = {
    green:'edit-radio-free',
    red:'edit-radio-busy',
    yellow:'edit-radio-wait',
    blue:'edit-radio-telework',
    orange:'edit-radio-noworking'
};

/**
 * Listes des status lié à leurs classes
 * @static
 * @enum {StatePart.CLASSES}
 * @readonly
 */
StatePart.ICONS_CLASSES = {
    CONFIRMED:StatePart.CLASSES.red,
    CANCELLED:StatePart.CLASSES.green,
    TENTATIVE:StatePart.CLASSES.yellow,
    FREE:StatePart.CLASSES.green,
    TELEWORK:StatePart.CLASSES.blue,
    VACATION:StatePart.CLASSES.orange
};