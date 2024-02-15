import { MelHtml } from "../html/JsHtml/MelHtml";
import { NotifierObject } from "./NotifierObject";

/**
 * Permet de visualiser un "NotifierObject".
 * 
 * L'élément html générer est mis à jours lorsque la référence est mise à jours
 * 
 * Pour chaque propriétés observer par l'objet, une méthode "_prop_update_<nom de la propriété>" est appelée.
 */
export class VisualiserObject {
    /**
     * Constructeur de la classe
     * @param {NotifierObject} ref Objet de référence
     */
    constructor(ref) {
        /**
         * @type {NotifierObject}
         */
        this.ref = ref;
        this.$ref = null;
        this.ref.on_prop_update.push(this._on_prop_update.bind(this));

        let $ref = this._p_draw().generate();
        Object.defineProperty(this, '$ref', {
            get() {
                return $ref;
            },
        });
    }

    _on_prop_update(name, value, ref) {
        this[`_prop_update_${name}`](value, ref);
    }

    /**
     * Retourne l'élément en jshtml
     * @protected
     * @returns {MelHtml}
     */
    _p_draw() {
        return MelHtml.start;
    }

    /**
     * Met à jours l'objet
     */
    update() {}
}

export class VisualiserObjectEx extends VisualiserObject {
    /**
     * 
     * @param {NotifierObject} ref 
     */
    constructor(ref) {
        super(ref);
    }

    _on_prop_update() {
        this.update();
    }

    update() {
        super.update();
    }
}