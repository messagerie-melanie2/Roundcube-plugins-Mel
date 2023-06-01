export {MetapageModule};
import { BaseStorage } from "../classes/base_storage";
import { AsyncMelObject } from "../mel_object";
import { WaitSomething } from "../mel_promise";

/**
 * Classe de base pour les modules d'actiones de Mel_Metapage
 * @abstract
 * @author Delphin Tommy
 */
class MetapageModule extends AsyncMelObject {
    constructor(...args) {
        super(...args);
        MetapageModule.Modules.add(this.constructor.name, this);
    }

    /**
     * @async
     * @abstract 
     * Cette fonction est appelé dans le constructeur de MetapageModule.
     * 
     * Mettez vôtre code ici.
     * @param  {...any} args Arguments de la fonction
     */
    async main(...args) {
        await super.main(...args);
    }

    /**
     * @async
     * Charge un module d'action de mel_metapage
     * @param {string} module_name Nom de la classe du module
     * @param {number} wainting_time_in_s Combien de temps on attend le chargement du module en secondes
     * @returns {Promise<MetapageModule>} Module
     */
    async load_other_module(module_name, wainting_time_in_s = 5){
        return await MetapageModule.load_module(module_name, wainting_time_in_s);
    }

    /**
     * @async
     * Charge un module d'action de mel_metapage
     * @param {string} module_name Nom de la classe du module
     * @param {number} wainting_time_in_s Combien de temps on attend le chargement du module en secondes
     * @returns {Promise<MetapageModule>} Module
     */
    static async load_module(module_name, wainting_time_in_s = 5) {
        return await this.Modules.load_module(module_name, wainting_time_in_s);
    }
}

class MetapageModuleManager extends BaseStorage {
    constructor() {
        super();
    }

    async load_module(key, wainting_time_in_s = 5) {
        let module = this.get(key);

        if (!module) {
            await WaitSomething(() => !!this.get(key), wainting_time_in_s);
            module = this.get(key);
        }

        return await module;
    }
}

MetapageModule.Modules = new MetapageModuleManager();