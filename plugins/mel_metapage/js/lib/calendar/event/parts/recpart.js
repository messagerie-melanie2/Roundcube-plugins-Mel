/**
 * @module EventView/Parts/Reccursivity
 * 
 */
import { FakePart, Parts } from "./parts.js";

/**
 * @class
 * @classdesc Gère la partie récursivité d'un événement.
 * @extends FakePart
 * @frommodule EventView/Parts
 */
export class RecPart extends FakePart {
    /**
     * 
     * @param {external:jQuery} original Champ qui contiendra les données formattés du champs visuel. Sera utiliser pour la sauvegarde des données de l'évènement.
     * @param {external:jQuery} fake Champ qui contiendra les données visuels de la récursivité.
     */
    constructor(original, fake) {
        super(original, fake, Parts.MODE.change);

        this._$fakeField.tooltip({
            content:() => this._$fakeField.attr('title') || this._$fakeField.attr('data-original-title')
        });
    }

    /**
     * Intialise la partie.
     * @override
     * @param {*} event Evènement du plugin `Calendar`
     */
    init(event) {
    }

    /**
     * Met à jours le champ
     * @override
     * @param {string} val Nouvelle valeur du champ
     */
    onUpdate(val) {
        this._$field.val(val).change();
    }

    /**
     * Action qui sera appelé lorsque le champ changera de valeur.
     * @override
     * @param  {Event} e Données de l'évènement
     */
    onChange(e) {
        this.onUpdate(e.currentTarget.value);
    }

    /**
     * Libère les données qui doivent être libérés.
     */
    destroy() {
        this._$fakeField.tooltip('destroy');
    }
}