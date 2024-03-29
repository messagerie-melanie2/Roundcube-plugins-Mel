import { FakePart, Parts } from "./parts.js";

export class SensitivityPart extends FakePart {
    constructor($select, $button, $icon, $dialog) {
        super($select, $button, Parts.MODE.click);

        this._$icon = $icon;
        this._$dialog = $dialog;
        this._title = this._$dialog.dialog('option', 'title') || 'Créer un évènement';

        this._$fakeField.tooltip({
            trigger:'hover'
        });
    }

    onUpdate(val) {
        this._$icon.html(SensitivityPart.ICONS[val] ?? '').parent().attr('aria-valuenow', val);

        switch (val) {
            case SensitivityPart.STATES.public:
                this.update_dialog_title(this._title);
                break;

            case SensitivityPart.STATES.private:
                this.update_dialog_title(`${this._title} privé`);
                break;               
        
            default:
                break;
        }
    }

    update_dialog_title(title) {
        if (!this._$dialog.on_click_minified) {
            try {
                this._$dialog.dialog('option', 'title', title);
            } catch (error) {
                this._$dialog.parent().parent().find('ui-dialog-titlebar .ui-dialog-title').text(title);
            }
        }
        else {
            this._$dialog.editTitle(title);
        }
    }

    onClick(...args) {
        const [e] = args;
        let $e = $(e.currentTarget);

        if ($e.attr('aria-valuenow') === SensitivityPart.STATES.private) $e.attr('aria-valuenow', SensitivityPart.STATES.public)
        else $e.attr('aria-valuenow', SensitivityPart.STATES.private)

        this._$field.val($e.attr('aria-valuenow')).change();
        this.onUpdate($e.attr('aria-valuenow'));
    }
}

SensitivityPart.STATES = {
    private:'private',
    public:'public'
}

SensitivityPart.ICONS = {}
SensitivityPart.ICONS[SensitivityPart.STATES.private] = 'lock';
SensitivityPart.ICONS[SensitivityPart.STATES.public] = 'lock_open';
