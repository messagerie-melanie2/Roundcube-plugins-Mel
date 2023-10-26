import { Connector } from "./connector.js";
import { Connectors } from "./connectors.js";

export {BnumConnector};

/**
 * Classe d'aide pour les connexion front-back
 * 
 * Utilisez `BnumConnector.connect` ou `BnumConnector.force_connect` pour faire des actions avec le back.
 * 
 * `BnumConnector.connectors` contient les différents connecteurs à mettre en premier argument des deux fonctions précédements cités.
 * 
 * Utilisez `BnumConnector.is_on_progress` pour savoir si les données récupérés d'un connecteur sont lié à un connecteur pas encore implémenté.
 */
class BnumConnector {
    constructor() {
    }

    /**
     * Connecte le front avec le back
     * 
     * Récupère ou envoi des données au serveur
     * @param {Connector} connector Connecteur qui contient les informations pour faire le lien avec le back
     * @param {Object} param0
     * @param {*} param0.params Paramètres additionnels 
     * @param {*} param0.default_return Valeur de retour par défaut
     * @returns {Promise<{datas: any | null, has_error: boolean, error: any | null}>} Retourne les données récupérés ou null si il y a une erreur
     */
    static async connect(connector, {
        params = null,
        default_return = null
    }) {
        if (!connector) connector = Connector.in_work();

        return await connector.connect({params, default_return});
    }

    /**
     * Connecte le front avec le back
     * 
     * Récupère ou envoi des données au serveur, ignore les erreurs.
     * @param {Connector} connector Connecteur qui contient les informations pour faire le lien avec le back
     * @param {Object} param0
     * @param {*} param0.params Paramètres additionnels 
     * @param {*} param0.default_return Valeur de retour par défaut
     * @returns {Promise<{datas: any | null, has_error: boolean, error: any | null}>} Retourne les données récupérés ou null si il y a une erreur
     */
    static async force_connect(connector, {
        params = null,
        default_return = null
    }) {
        if (!connector) connector = Connector.in_work();

        return await connector.connect({params, default_return});
    }

    /**
     * Vérifie si les données de `connect` proviennent d'un connecteur non implémenté.
     * @param {{datas: any | null, has_error: boolean, error: any | null}} data 
     * @returns {boolean}
     */
    static is_on_progress(data) {
        return data.has_error && 'Connector is in progress' === data.error;
    }
}

/**
 * @type {Connectors}
 */
BnumConnector.connectors = null;

Object.defineProperties(BnumConnector, {
    connectors: {
        get: function() {
            return Connectors;
        },
        configurable: false
    },
});