/**
 * @module EventView/Parts
 * @local Parts
 * @local FakePart
 */

export {Parts, FakePart}

/**
 * @abstract
 * @class
 * @classdesc Représentation d'une partie de la vue de la création/édition d'un évènement. Il gère les actions visuels et comportements de cette partie.
 */
class Parts {
    /**
     * Constructeur de la classe. Il demande le champs qui sera gérer ainsi que son "mode de fonctionnement". (cad, si il est actionner par un clique ou un changement d'état)
     * @param {$} $field Champs qui sera gérer par cette classe.
     * @param  {...Parts.MODE} modes Mode de fonctionnement.
     */
    constructor($field, ...modes) {
        /**
         * Champ qui sera gérer par cette partie. Ce champ sera utiliser pour sauvegarder les données qui lui sont liés.
         * @protected
         * @member
         * @type {$}
         */
        this._$field = $field;
        this._p_initField(modes);
    }

    /**
     * Met à jours le champ
     * @abstract
     * @param {*} new_value Nouvelle valeur du champ
     */
    onUpdate(new_value)  {
        throw "Abstract !";
    }

    /**
     * Action qui sera appelé lorsque le champ changera de valeur.
     * 
     * En général, appelle {@link Parts~onUpdate}
     * @abstract
     * @param  {...any} args Le premier argument est généralement un `Event`
     */
    onChange(...args)  {
        throw "Abstract !";
    }

    /**
     * Action qui sera appelé lorsque l'on cliquera sur le champ
     * 
     * En général, appelle {@link Parts~onUpdate}
     * @abstract
     * @param  {...any} args Le premier argument est généralement un `Event`
     */
    onClick(...args)  {
        throw "Abstract !";
    }

    /**
     * Action qui sera appelé lorsque le champ changera de valeur alors que le focus est toujours dessus.
     * 
     * En général, appelle {@link Parts~onUpdate}
     * @abstract
     * @param  {...any} args Le premier argument est généralement un `Event`
     */
    onInput(...args)  {
        throw "Abstract !";
    }

    /**
     * Récupère le champ
     * @protected
     * @returns {$} 
     */
    _p_get_field() {
        return this._$field;
    }

    /**
     * Initialise le champ en fonction des modes défini dans le constructeur.
     * @protected
     * @param {Parts.MODE[]} modes 
     */
    _p_initField(modes) {
        let $field = this._p_get_field();

        if (!!$field) {
            for (const mode of modes) {
                switch (mode) {
                    case Parts.MODE.click:
                        this._p_try_add_event($field, 'click', this.onClick.bind(this));
                        break;
    
                    case Parts.MODE.change:
                        this._p_try_add_event($field, 'change', this.onChange.bind(this));
                        break;
    
                    case Parts.MODE.input:
                        this._p_try_add_event($field, 'input', this.onInput.bind(this));
                        break;
                
                    default:
                        break;
                }
            }
        }

    }

    /**
     * @callback EventCallback
     * @param {Event}
     * @returns {void}
     */

    /**
     * Essaye d'ajouter l'évènement lié aux modes au champ
     * @protected
     * @param {$} $field 
     * @param {string} event Nom de l'évènement que l'on souhaite ajouter {exemple : 'click'}
     * @param {EventCallback} callback 
     * @returns {$} Champ modifié
     */
    _p_try_add_event($field, event, callback) {
        if (!$._data($field[0], 'events' )?.[event]) {
            $field.on(event, callback);
        }
        else {
            $field.off(event);
            $field.on(event, callback);
        }

        return $field;
    }

}

/**
 * @class
 * @classdesc Représentation d'une partie de la vue d'évènement. Cette partie contient un champs visuel qui modifie le champ qui sera utiliser pour la sauvegarde de l'évènement.
 * @extends Parts
 */
class FakePart extends Parts {
    /**
     * 
     * @param {$} $fields 
     * @param {*} $fakeField 
     * @param  {...Parts.MODE} modes 
     */
    constructor($fields, $fakeField, ...modes) {
        super($fields, ...modes);
        this._$fakeField = $fakeField;
        this._p_initField(modes);
    }

    /**
     * Initialise le champs visuel à partir de l'évènement
     * @abstract
     * @param {*} event Evènement du plugin `Calendar`
     */
    init(event) {
        throw "Abstract !";
    }

    /**
     * Récupère le champ principal
     * @protected
     * @returns {$}
     */
    _p_get_field() {
        return this._$fakeField;
    }
}

/**
 * Mode de fonctionnements disponible pour un champ
 * @static
 * @enum {Symbol}
 */
Parts.MODE = {
    change:Symbol(),
    click:Symbol(),
    input:Symbol()
};