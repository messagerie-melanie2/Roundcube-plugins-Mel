export {MetapageModule};
import { MelObject } from "../mel_object";

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

