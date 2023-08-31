import { MelObject } from "../../mel_metapage/js/lib/mel_object.js";

/** La classe `ParapheurAction` est une sous-classe de `MelObject` qui fournit des méthodes pour
effectuer des requêtes HTTP GET et POST avec des paramètres spécifiés et gérer les rappels de
réussite et d'erreur. */
export class ParapheurAction extends MelObject {
    constructor(){
        super();
    }

/**
 * La fonction "call" effectue une requête HTTP GET avec les paramètres spécifiés et gère les rappels
 * de réussite et d'erreur.
 * @param {string} action - Le paramètre « action » est une chaîne qui représente l'action ou l'opération
 * spécifique qui doit être effectuée. Il peut s'agir d'un nom de fonction ou d'un mot-clé indiquant
 * l'action souhaitée à exécuter.
 * @param {function} on_success - Une fonction de rappel qui sera exécutée lorsque l'action sera terminée avec
 * succès.
 * @param {Object} param
 * @param {function} param.on_error - Une fonction de rappel qui sera exécutée lorsque l'action échoue.
 * @param {Object} param.params - Un objet contenant les paramètres qui seront envoyés avec la requête HTTP.
 * @returns {Mel_Ajax} La fonction `call` renvoie le résultat de l'appel de la fonction `http_internal_get` avec
 * les paramètres fournis.
 */
    call(action, on_success, {
        on_error = (...args) => { console.error(...args); },
        params = {}
    }){
        return this.http_internal_get({
            task: 'parapheur',
            action,
            params,
            on_success,
            on_error
        });
    }

/**
 * La fonction "post" envoie une requête HTTP POST avec les paramètres spécifiés et gère les rappels de
 * réussite et d'erreur.
 * @param {string} action - Le paramètre "action" est une chaîne qui représente l'action spécifique que vous
 * souhaitez effectuer. Il peut s'agir d'un nom ou d'un identifiant pour une opération ou une tâche
 * spécifique que vous souhaitez exécuter.
 * @param {function} on_success - Le paramètre on_success est une fonction de rappel qui sera exécutée lorsque la
 * requête HTTP aboutira. Il prend généralement les données de réponse comme argument et peut être
 * utilisé pour gérer la réponse réussie du serveur.
 * @param {Object} param
 * @param {function} param.on_error - Une fonction de rappel qui sera exécutée lorsque l'action échoue.
 * @param {Object} param.params - Un objet contenant les paramètres qui seront envoyés avec la requête HTTP.
 * @returns le résultat de l'appel de la fonction `http_internal_post` avec les paramètres fournis.
 */
    post(action, on_success, {
        on_error = (...args) => { console.error(...args); },
        params = {}
    }){
        return this.http_internal_post({
            task: 'parapheur',
            action,
            params,
            on_success,
            on_error
        });
    }
}