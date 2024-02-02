import { FakePart, Parts } from "./parts.js";

export class FreeBusyPart extends FakePart {
    constructor($select, $button, $icon, $dialog) {
        super($select, $button, Parts.MODE.click);

        this._$icon = $icon;
        this._$dialog = $dialog;
        this._title = this._$dialog.dialog('option', 'title');
    }

    onUpdate(val) {
        this._$icon.html(FreeBusyPart.ICONS[val] ?? '').parent().attr('aria-valuenow', val);

        switch (val) {
            case 'free':
                this._$dialog.dialog('option', 'title', this._title);
                break;

            case 'busy':
                this._$dialog.dialog('option', 'title', `${this._title} privé`);
                break;               
        
            default:
                break;
        }
    }

    onClick(...args) {
        const [e] = args;
        let $e = $(e.currentTarget);

        if ($e.attr('aria-valuenow') === 'busy') $e.attr('aria-valuenow', 'free')
        else $e.attr('aria-valuenow', 'busy')

        this._$field.val($e.attr('aria-valuenow')).change();
        this.onUpdate($e.attr('aria-valuenow'));
    }
}

FreeBusyPart.ICONS = {
    busy:'lock',
    free:'lock_open'
};