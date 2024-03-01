import { Parts } from "./parts.js";

export class StatePart extends Parts {
    constructor($select, $icon) {
        super($select, Parts.MODE.change);

        this._$icon = $icon;

        this._$field.tooltip({
            content:() => this._$field.attr('title') || this._$field.attr('data-original-title'),
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
    blue:'edit-radio-telework'
};

StatePart.ICONS_CLASSES = {
    CONFIRMED:StatePart.CLASSES.red,
    CANCELLED:StatePart.CLASSES.green,
    TENTATIVE:StatePart.CLASSES.yellow,
    FREE:StatePart.CLASSES.green,
    TELEWORK:StatePart.CLASSES.blue,
};