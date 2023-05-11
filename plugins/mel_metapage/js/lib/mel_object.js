export { MelObject };
import { Mel_Ajax } from "../../../mel_metapage/js/lib/mel_promise";
import { Cookie } from "./classes/cookies";
import { Top } from "./top";

/**
 * @abstract
 * Classe de base du framework bnum.
 * 
 * Donne divers fonction d'aide pour programmer.
 */
class MelObject {
    /**
     * Constructeur de la classe
     * @param  {...any} args Arguments de la classe
     */
    constructor(...args) {
        this.main(...args);
    }

    /**
     * @abstract 
     * Cette fonction est appelé dans le constructeur de MelObject.
     * 
     * Mettez vôtre code ici.
     * @param  {...any} args Arguments de la fonction
     */
    main(...args) {}

    /**
     * Récupère "rcmail" | les fonctions utiles à roundcube
     * @param {boolean} top Si on doit récupérer rcmail sur frame principale ou non
     * @returns {rcube_webmail}
     */
    rcmail(top = false) {
        return (top && !!Top.top()?.rcmail) ? Top.top().rcmail : window.rcmail;
    }

    /**
     * Ajoute un écouteur qui pourra être appelé plus tard.
     * @param {string} key Clé qui permettra d'appeller l'écouteur 
     * @param {function} callback Fonction qui sera appelée
     * @param {{top:boolean}} param2 Si on doit récupérer rcmail sur frame principale ou non
     */
    add_event_listener(key, callback, {top = false, condition = true}) {

        let can_call = false;
        
        if (top && !Top.has(`event_listener_${key}`))
        {
            if (typeof condition === 'function' ? condition() : condition) {
                can_call = true;
                Top.add(`event_listener_${key}`, true);
            }
        }
        else if (!top) can_call = true;

        if (can_call) this.rcmail(top).addEventListener(key, callback);
    }

    /**
     * Trigger un écouteur
     * @param {string} key Clé qui appelera tout les écouteurs lié à cette clé
     * @param {*} args  Arguments qui sera donnée aux écouteurs
     * @param {Object} options Options
     * @param {boolean} options.top Si on doit récupérer rcmail sur frame principale ou non
     * @returns 
     */
    trigger_event(key, args, {top = false}){
        return this.rcmail(top).triggerEvent(key, args);
    }

    /**
     * Action à faire lorsqu'une frame est chargée
     * @param {function} callback Function à éffectuer
     * @param {Object} options Options de la fonction
     * @param {string} options.frame any pour toute n'importe quelle frame, sinon mettre le nom de la frame
     * @param {function | null} options.condition Condition custom pour charger la frame
     */
    on_frame_loaded(callback, {frame = 'any', condition = null}) {
        const top = true;
        this.add_event_listener('frame_loaded', callback, {
            top,
            condition:() => {
                return condition?.() ?? ('any' === frame || this.rcmail().env.task === frame);
            }
        });
    }

    /**
     * Récupère une variable d'environnement de roundcube
     * @param {string} key Nom de la variable
     * @returns 
     */
    get_env(key) {
        return rcmail.env[key] ?? top?.rcmail?.env?.[key];
    }

    /**
     * Change de page
     * @param {string} frame Nom de la page
     * @param {{action:string|null, params:Object, update:boolean, force_update:boolean}} param1 
     * @async cette fonction est asynchrone, utilisez then ou l'opérateur await
     */
    async change_frame(frame, {
        action = null,
        params = {},
        update = true,
        force_update = false
    }) {
        await mel_metapage.Functions.change_page(frame, action, params, update, force_update);
    }

    /**
     * Vérifie si une frame est déjà chargée ou non
     * @param {string} frame Nom de la frame
     * @returns {boolean}
     */
    have_frame(frame) {
        return this.select_frame(frame).length > 0;
    }

    /**
     * Selectionne une frame
     * @param {string} frame Nom de la frame
     * @returns {$}
     */
    select_frame(frame) {
        const $ = (top ?? window).$;

        return $(`.${frame}-frame`);
    }

    /**
     * Récupère une url à partir d'une tâche et d'une action
     * @param {string} task Nom de la tâche
     * @param {{action:string, params:Object|null}} param1 action => Nom de l'action ('index' si non renseigné), params => Autres paramètres
     * @returns {string}
     */
    url(task, {action = EMPTY_STRING, params = null})
    {
        return mel_metapage.Functions.url(task, action, params);
    }

    /**
     * Effectue un appel ajax avec les options spécifiées.
     * @param {Object} options - Les options pour l'appel HTTP.
     * @param {string} options.url - L'URL à appeler.
     * @param {function} [options.on_success=() => {}] - La fonction à appeler en cas de succès.
     * @param {function} [options.on_error=(...args) => {console.error('###[http_call]', ...args)}] - La fonction à appeler en cas d'erreur.
     * @param {Object} [options.params=null] - Les paramètres à envoyer dans la requête.
     * @param {string} [options.type='POST'] - Le type de requête HTTP à effectuer.
     * @returns {Mel_Ajax}
     */
    http_call({url, on_success = () => {}, on_error = (...args) => {console.error('###[http_call]', ...args)}, params = null, type = 'POST'}){
        return new Mel_Ajax({
            type,
            url,
            success:on_success,
            failed:on_error,
            datas:params
        });
    }

    /**
     * Effectue un appel ajax vers les serveurs de l'application
     * @param {Object} options - Les options pour l'appel HTTP.
     * @param {string} options.task - Tache
     * @param {string} options.action - Action
     * @param {function} [options.on_success=() => {}] - La fonction à appeler en cas de succès.
     * @param {function} [options.on_error=(...args) => {console.error('###[http_call]', ...args)}] - La fonction à appeler en cas d'erreur.
     * @param {Object} [options.params=null] - Les paramètres à envoyer dans la requête.
     * @param {string} [options.type='POST'] - Le type de requête HTTP à effectuer.
     * @returns {Mel_Ajax}
     */
    http_internal_call({task, action, on_success = () => {}, on_error = (...args) => {console.error('###[http_internal_call]', ...args)}, params = null, type = 'POST'}){
        return this.http_call({
            type,
            on_error,
            on_success, 
            params:(type === 'GET' ? null : params),
            url:this.url(task, {action:action, params:(type === 'GET' ? params : null)})
        })
    }

    /**
     * Effectue un appel ajax POST vers les serveurs de l'application
     * @param {Object} options - Les options pour l'appel HTTP.
     * @param {string} options.task - Tache
     * @param {string} options.action - Action
     * @param {function} [options.on_success=() => {}] - La fonction à appeler en cas de succès.
     * @param {function} [options.on_error=(...args) => {console.error('###[http_call]', ...args)}] - La fonction à appeler en cas d'erreur.
     * @param {Object} [options.params=null] - Les paramètres à envoyer dans la requête.
     * @returns {Mel_Ajax}
     */
    http_internal_post({task, action, on_success = () => {}, on_error = (...args) => {console.error('###[http_internal_post]', ...args)}, params = null})
    {
        return this.http_internal_call({
            task,
            action,
            on_success,
            on_error,
            params,
            type:'POST'
        })
    }

    /**
     * Effectue un appel ajax GET vers les serveurs de l'application
     * @param {Object} options - Les options pour l'appel HTTP.
     * @param {string} options.task - Tache
     * @param {string} options.action - Action
     * @param {function} [options.on_success=() => {}] - La fonction à appeler en cas de succès.
     * @param {function} [options.on_error=(...args) => {console.error('###[http_call]', ...args)}] - La fonction à appeler en cas d'erreur.
     * @param {Object} [options.params=null] - Les paramètres à envoyer dans la requête.
     * @returns {Mel_Ajax}
     */
    http_internal_get({task, action, on_success = () => {}, on_error = (...args) => {console.error('###[http_internal_post]', ...args)}, params = null})
    {
        return this.http_internal_call({
            task,
            action,
            on_success,
            on_error,
            params,
            type:'GET'
        })
    }

    /**
     * Sauvegarde des données dans le stockage local
     * @param {string} key Clé qui permettra de retrouver les données sauvegarder 
     * @param {*} contents Données qui seront sauvegarder
     * @returns Chaînage
     */
    save(key, contents) {
        mel_metapage.Storage.set(key, contents);
        return this;
    }

    /**
     * Charge des données dans le stockage local
     * @param {string} key Clé qui permet de retrouver les données 
     * @param {*} default_value Valeur par défaut si la donnée n'éxiste pas 
     * @returns 
     */
    load(key, default_value = null) {
        return mel_metapage.Storage.get(key, default_value);
    }

    /**
     * Récupère l'objet UI de la skin elastic
     * @returns {Mel_Elastic}
     */
    get_skin() {
        return window.MEL_ELASTIC_UI;
    }

    /**
     * Récupère un objet Mel_CSS_Style_Sheet pour ajouter du css custom
     * @returns {Mel_CSS_Style_Sheet}
     */
    get_custom_rules() {
        return this.get_skin().css_rules;
    }

    /**
     * Génère un loader du bnum
     * @param {string} id id du loader 
     * @param {boolean} absoluteCentered Centrer verticalement et horizontalement ?
     * @returns {mel_html}
     */
    generate_loader(id, absoluteCentered = true) {
        return this.get_skin().create_loader(id, absoluteCentered, false);
    }

    /**
     * Séléctionne un document dom au format jquery
     * @param {string} selector Selecteur au format jquery
     * @returns {$}
     */
    select(selector) {
        return $(selector);
    }

    /**
     * Copy un texte dans le press(papier)
     * @param {string} text Texte à mettre dans le presse papier 
     * @returns Chaînage
     */
    copy_to_clipboard(text) {
        mel_metapage.Functions.copy(text);
        return this;
    }

    /**
     * Insert un cookie
     * @param {string} key Clé qui permet d'identifier la données mise en cookie
     * @param {string} name Donnée à mettre en cookie 
     * @param {Date | false} expire Date d'expiration, false pour aucune
     * @returns {Cookie} Cookie créer
     */
    cookie_set(key, name, expire = false) {
        return Cookie.set_cookie(key, name, expire);
    }

    /**
     * Récupère un cookie
     * @param {string} key Indentifiant de la donnée 
     * @returns {Cookie}
     */
    cookie_get(key) {
        return Cookie.get_cookie(key);
    }

    /**
     * Supprime un cookie
     * @param {string} key Indentifiant du cookie à supprimer
     * @returns {Cookie} Cookie supprimer
     */
    cookie_remove(key) {
        return Cookie.remove_cookie(key);
    }

    static Empty() {
        return new MelObject();
    }
}
