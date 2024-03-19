/**
 * @module EventView/Parts/Sensitivity
 */
import { FakePart, Parts } from "./parts.js";

/**
 * @class
 * @classdesc Gère la partie sensibilité d'un événement.
 * @extends FakePart
 * @frommodule EventView/Parts
 */
export class SensitivityPart extends FakePart {
    /**
     * 
     * @param {external:jQuery} $select Champ qui contiendra la valeur de la sensibilité qui sera sauveardé.
     * @param {external:jQuery} $button Champ visuel, il modifiera la valeur du select.
     * @param {external:jQuery} $icon Span de l'icon. L'icône changera seront la valeur du champ.
     * @param {external:jQuery | GlobalModal} $dialog Dialogue, son titre sera modifié selon sa sensibilitée.
     */
    constructor($select, $button, $icon, $dialog) {
        super($select, $button, Parts.MODE.click);

        /**
         * Icône
         * @type {external:jQuery} 
         * @package
         * @member
         */
        this._$icon = $icon;
        /**
         * La modale qui contient la vue.
         * @type {external:jQuery | GlobalModal}
         * @package
         * @member
         */
        this._$dialog = $dialog;
        /**
         * Titre originale de la modale
         * @type {string}
         * @package
         * @readonly
         * @member
         */
        this._title = this._$dialog.dialog('option', 'title') || 'Créer un évènement';

        this._$fakeField.tooltip({
            trigger:'hover'
        });
    }

    /**
     * Change l'icon et le titre de la modale.	
     * @override
     * @param {SensitivityPart.STATES} val 
     * @frommoduleparam EventView/Parts/Sensitivity val {@linkto SensitivityPart} {@membertype .} 
     */
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

    /**
     * Modifie le titre de la modale.
     * @param {string} title Nouveau titre 
     */
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

    /**
     * Est appelé lorsque l'on cliquera sur le bouton.
     * @override
     * @param  {...any} args Le premier est un {@link Event}
     */
    onClick(...args) {
        const [e] = args;
        let $e = $(e.currentTarget);

        if ($e.attr('aria-valuenow') === SensitivityPart.STATES.private) $e.attr('aria-valuenow', SensitivityPart.STATES.public)
        else $e.attr('aria-valuenow', SensitivityPart.STATES.private)

        this._$field.val($e.attr('aria-valuenow')).change();
        this.onUpdate($e.attr('aria-valuenow'));
    }
}

/**
 * Liste des sensibilités.
 * @enum {string}
 * @static
 */
SensitivityPart.STATES = {
    private:'private',
    public:'public'
}

/**
 * Contient les icônes lié à la sensibilité.
 * @type {Object<SensitivityPart.STATES, string>}
 * @static
 * @frommoduleparam EventView/Parts/Sensitivity {@linkto SensitivityPart} {@membertype .}
 */
SensitivityPart.ICONS = {}
SensitivityPart.ICONS[SensitivityPart.STATES.private] = 'lock';
SensitivityPart.ICONS[SensitivityPart.STATES.public] = 'lock_open';
