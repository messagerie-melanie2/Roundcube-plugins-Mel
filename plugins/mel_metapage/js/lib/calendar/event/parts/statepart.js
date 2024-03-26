import { Parts } from "./parts.js";
export {StatePart}

/**
 * @class
 * @classdesc Représentation de l'état de l'évènement
 * @memberof EventView
 */
class StatePart extends Parts {
    constructor($select, $icon) {
        super($select, Parts.MODE.change);

        this._$icon = $icon;

        this._$field.tooltip({
            trigger:'hover'
        });
    }

    onUpdate(val) {
        const keys = Object.keys(StatePart.CLASSES);

        for (const iterator of keys) {
            this._$icon.removeClass(StatePart.CLASSES[iterator]);
        }

        this._$icon.addClass(StatePart.ICONS_CLASSES[val] ?? '');
    }

    onChange(...args) {
        const [e] = args;
        let $target = $(e.currentTarget);
        this.onUpdate($target.val());
    }
}

StatePart.CLASSES = {
    green:'edit-radio-free',
    red:'edit-radio-busy',
    yellow:'edit-radio-wait',
    blue:'edit-radio-telework',
    orange:'edit-radio-noworking'
};

StatePart.ICONS_CLASSES = {
    CONFIRMED:StatePart.CLASSES.red,
    CANCELLED:StatePart.CLASSES.green,
    TENTATIVE:StatePart.CLASSES.yellow,
    FREE:StatePart.CLASSES.green,
    TELEWORK:StatePart.CLASSES.blue,
    VACATION:StatePart.CLASSES.orange
};