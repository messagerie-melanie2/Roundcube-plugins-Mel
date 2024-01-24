export {MetapageModule, MainMetapageModule};
import { MelObject } from "../mel_object.js";

/**
 * Classe de base pour les modules d'actiones de Mel_Metapage
 * @abstract
 * @author Delphin Tommy
 */
class MetapageModule extends MelObject {
    constructor(...args) {
        super(...args);
    }

    /**
     * @abstract 
     * Cette fonction est appelé dans le constructeur de MetapageModule.
     * 
     * Mettez vôtre code ici.
     * @param  {...any} args Arguments de la fonction
     */
    main(...args) {
        super.main(...args);
        
    }
}

class MainMetapageModule extends MetapageModule {
    constructor(...args) {
        super(...args);
    }

    /**
     * @abstract 
     * Cette fonction est appelé dans le constructeur de MetapageModule.
     * 
     * Mettez vôtre code ici.
     * @param  {...any} args Arguments de la fonction
     */
    main(...args) {
        super.main(...args);
        this._set_create_action();
    }

    _set_create_action() {

        this.add_event_listener('create_modal.init', (args) => {
            this._create_action(args);

            return args;
        }, {});
    }

    _create_action(args) {
        throw 'Not implemented';
    }
}