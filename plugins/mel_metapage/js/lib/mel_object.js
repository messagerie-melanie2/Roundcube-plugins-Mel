/**
 * @namespace MainObjects
 * @property {MelEventManager} MelEventManager
 * @property {MelObject} MelObject
 */

export { MelObject, WrapperObject };
import { Mel_Ajax } from '../../../mel_metapage/js/lib/mel_promise.js';
import { BaseStorage } from './classes/base_storage.js';
import { Cookie } from './classes/cookies.js';
import { EMPTY_STRING } from './constants/constants.js';
import { isNullOrUndefined } from './mel.js';
import { Top } from './top.js';

/**
 * La classe MelEventManager étend BaseStorage et permet d'ajouter, d'appeler et de supprimer des rappels pour des clés d'écoute spécifiques.
 * @class
 * @classdesc Système d'évènement. Les évènements sont toujours au context le plus haut.
 * @extends BaseStorage
 * @package
 * @frommodule BaseStorage {@membertype .}
 */
class MelEventManager extends BaseStorage {
  constructor() {
    super();

    const super_add = this.add;

    /**
     * La fonction ajoute un rappel à un écouteur dans un objet MelEvent.
     * @param {string} listener_key - Il s'agit d'une clé qui identifie un auditeur spécifique. Il est utilisé pour
     * récupérer l'objet MelEvent associé à l'écouteur.
     * @param {function} callback - La fonction qui sera exécutée lorsque l'événement est déclenché.
     * @param {?string} callback_key - Le paramètre callback_key est un paramètre facultatif qui représente un
     * identifiant unique pour la fonction de rappel ajoutée à l'objet MelEvent. S'il n'est pas fourni, la
     * fonction générera une clé unique pour le rappel.
     * @returns {MelEventManager} l'objet courant (`this`) après avoir ajouté le rappel à l'objet MelEvent associé à la clé
     * d'écouteur donnée.
     * @override
     */
    this.add = (listener_key, callback, callback_key = null) => {
      if (!this.has(listener_key))
        super_add.call(this, listener_key, new MelEvent());

      if (callback_key) this.get(listener_key).add(callback_key, callback);
      else this.get(listener_key).push(callback);
      return this;
    };
  }

  /**
   * La fonction "call" vérifie si une clé d'écoute existe et l'appelle avec des arguments si c'est le
   * cas.
   * @param {string} listener_key Le paramètre listener_key est une clé utilisée pour identifier une fonction
   * d'écouteur spécifique dans une collection de fonctions d'écouteur. Il est utilisé pour récupérer la
   * fonction d'écouteur de la collection et l'appeler avec les arguments fournis.
   * @param {...any} args args est un paramètre de repos qui permet à la fonction d'accepter n'importe quel
   * nombre d'arguments sous forme de tableau. Dans ce cas, la fonction est conçue pour recevoir
   * n'importe quel nombre d'arguments après le paramètre listener_key, qui sera transmis à la fonction
   * de rappel lors de son appel.
   * @returns {MelEventManager}  L'objet `this` est renvoyé.
   */
  call(listener_key, ...args) {
    if (this.has(listener_key)) {
      return this.get(listener_key).call(...args);
    }
  }

  /**
   * Cette fonction supprime un rappel d'un écouteur dans un objet JavaScript.
   * @param {string} listener_key Clé utilisée pour identifier l'écouteur dans l'objet Map.
   * @param {string} callback_key Le paramètre `callback_key` est un identifiant unique pour une fonction de
   * rappel spécifique qui a été ajoutée à un écouteur. Il est utilisé pour supprimer la fonction de
   * rappel correspondante de la liste des rappels de l'écouteur.
   * @returns {MelEventManager}  La méthode `remove_callback` renvoie l'instance de l'objet sur lequel elle a été appelée
   * (`this`).
   */
  remove_callback(listener_key, callback_key) {
    if (this.has(listener_key) && this.get(listener_key).has(callback_key)) {
      this.get(listener_key).remove(callback_key);
    }

    return this;
  }
}

/**
 * @abstract
 * Classe de base du framework bnum.
 *
 * Donne divers fonction d'aide pour programmer.
 * @class
 * @classdesc Donne divers fonction d'aide pour programmer.
 */
class MelObject {
  /**
   * Constructeur de la classe
   * @param  {...any} args Arguments de la classe
   */
  constructor(...args) {
    /**
     * @type {MelEventManager}
     * @package
     */
    this._listener = null;
    let _rc_data = null;
    /**
     * @type {{task:string}}
     * @package
     */
    this.rc_data = { task: '' };
    Object.defineProperties(this, {
      _listener: {
        get: function () {
          const KEY = 'MEL_OBJECT_LISTENER';

          if (!Top.has(KEY)) Top.add(KEY, new MelEventManager());

          return Top.get(KEY);
        },
        configurable: true,
      },
      rc_data: {
        get() {
          if (!_rc_data) {
            _rc_data = {};
            Object.defineProperties(_rc_data, {
              task: {
                get() {
                  return rcmail.env.current_task;
                },
                configurable: false,
              },
            });
          }

          return _rc_data;
        },
      },
    });
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
   * @protected
   */
  rcmail(top = false) {
    return top && !!Top.top()?.rcmail ? Top.top().rcmail : window.rcmail;
  }

  /**
   * Récupère une clé sous forme de texte.
   * @param {string} key_text Clé
   * @param {!string} plugin Plugin d'où provient le texte traduit
   * @returns {string}
   * @protected
   */
  gettext(key_text, plugin = '') {
    return this.rcmail().gettext(key_text, plugin);
  }

  /**
   * Ajoute un écouteur qui pourra être appelé plus tard.
   * @param {string} key Clé qui permettra d'appeller l'écouteur
   * @param {function} callback Fonction qui sera appelée
   * @param {Object} param2 Si on doit récupérer rcmail sur frame principale ou non
   * @param {?string} param2.callback_key Clé du callback
   * @param {!boolean} param2.condition Si on doit éxécuter ou non le listener
   * @protected
   */
  add_event_listener(key, callback, { callback_key = null, condition = true }) {
    let can_call = typeof condition === 'function' ? condition() : condition;

    if (can_call) this._listener.add(key, callback, callback_key);
  }

  /**
   * Trigger un écouteur
   * @param {string} key Clé qui appelera tout les écouteurs lié à cette clé
   * @param {any} args  Arguments qui sera donnée aux écouteurs
   * @returns {MelEventManager}
   * @protected
   */
  trigger_event(key, args) {
    return this._listener.call(key, args);
  }

  /**
   * Action à faire lorsqu'une frame est chargée
   * @param {function} callback Function à éffectuer
   * @param {Object} options Options de la fonction
   * @param {?string} options.frame any pour toute n'importe quelle frame, sinon mettre le nom de la frame
   * @param {?function} options.condition Condition custom pour charger la frame
   * @protected
   */
  on_frame_loaded(
    callback,
    { callback_key = null, frame = 'any', condition = null },
  ) {
    const KEY = 'frame_loaded';
    const SYSTEM_KEY = `[system]${KEY}`;
    if (!this._listener.has(SYSTEM_KEY)) {
      this.rcmail().addEventListener(KEY, (args) => {
        this.trigger_event(KEY, args);
      });
      this._listener.add(SYSTEM_KEY, true, SYSTEM_KEY);
    }

    this.add_event_listener(KEY, callback, {
      callback_key,
      condition: () => {
        return (
          condition?.() ?? (frame === 'any' || this.rcmail().env.task === frame)
        );
      },
    });
  }

  /**
   * Ajoute une action à faire lors du refresh du bnum
   * @param {Function} callback Fonction à appeller
   * @param {Object} options Options de la fonction
   * @param {?string} options.callback_key clé qui permet de supprimer/remettre la fonction au refresh d'une frame
   * @protected
   */
  on_refresh(callback, { callback_key = null }) {
    this.add_event_listener('mel_metapage_refresh', callback, {
      callback_key,
    });
  }

  /**
   * Ajoute une action à faire lorsqu'une frame est mise à jours
   * @param {function} callback Callback a=à appelé au refresh
   * @param {string} frame Nom de la frame
   * @param {Object} param2
   * @param {?string} options.callback_key clé qui permet de supprimer/remettre la fonction au refresh d'une frame
   * @protected
   */
  on_frame_refresh(callback, frame, { callback_key = null }) {
    this.add_event_listener(
      'on_frame_refresh',
      (args) => {
        const { rc } = args;

        if (frame === rc.env.task) {
          callback();
        }
      },
      {
        callback_key,
      },
    );
  }

  /**
   * Récupère une variable d'environnement de roundcube
   * @param {string} key Nom de la variable
   * @returns {?any}
   * @protected
   */
  get_env(key) {
    return rcmail.env[key] ?? top?.rcmail?.env?.[key];
  }

  /**
   * Change de page
   * @param {string} frame Nom de la page
   * @param {Object} param1
   * @param {?string} param1.action Action de la page
   * @param {Object<string, string>} param1.params Paramètres additionnels de la page
   * @param {!boolean} param1.update
   * @param {!boolean} param1.force_update
   * @async
   * @protected
   * @return {Promise<void>}
   * @deprecated
   */
  async change_frame(
    frame,
    { action = null, params = {}, update = true, force_update = false },
  ) {
    await mel_metapage.Functions.change_page(
      frame,
      action,
      params,
      update,
      force_update,
    );
  }

  async switch_frame(task, { changepage = true, args = null }) {
    await mel_metapage.Functions.change_frame(task, changepage, true, args);
  }

  /**
   * Vérifie si une frame est déjà chargée ou non
   * @param {string} frame Nom de la frame
   * @returns {boolean}
   * @protected
   */
  have_frame(frame) {
    return this.select_frame(frame).length > 0;
  }

  /**
   * Selectionne une frame
   * @param {string} frame Nom de la frame
   * @returns {external:jQuery}
   * @protected
   */
  select_frame(frame) {
    const $ = (top ?? window).$;

    return $(`.${frame}-frame`);
  }

  /**
   * Selectionne toutes les frames qui ne sont pas parmis les frames définie en arguments
   * @param  {...string} frames Frames à écarter
   * @generator
   * @yield {Node}
   * @return {Generator<Node>}
   * @protected
   */
  *select_frame_except(...frames) {
    const $ = (top ?? parent ?? window).$;

    for (const frame of $('iframe.mm-frame')) {
      if (!frames.find((x) => frame.classList.contains(`${x}-frame`)))
        yield frame;
    }
  }

  /**
   * Récupère une url à partir d'une tâche et d'une action
   * @param {string} task Nom de la tâche
   * @param {Object} param1 action => Nom de l'action ('index' si non renseigné), params => Autres paramètres
   * @param {!string} param1.action => Nom de l'action (index si non renseigné)
   * @param {?Object<string, string>} Autres paramètres
   * @returns {string}
   * @protected
   */
  url(task, { action = EMPTY_STRING, params = null }) {
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
   * @protected
   */
  http_call({
    url,
    on_success = () => {},
    on_error = (...args) => {
      console.error('###[http_call]', ...args);
    },
    params = null,
    type = 'POST',
  }) {
    return new Mel_Ajax({
      type,
      url,
      success: on_success,
      failed: on_error,
      datas: params,
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
   * @protected
   */
  http_internal_call({
    task,
    action,
    on_success = () => {},
    on_error = (...args) => {
      console.error('###[http_internal_call]', ...args);
    },
    params = null,
    type = 'POST',
  }) {
    return this.http_call({
      type,
      on_error,
      on_success,
      params: type === 'GET' ? null : params,
      url: this.url(task, {
        action: action,
        params: type === 'GET' ? params : null,
      }),
    });
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
   * @protected
   */
  http_internal_post({
    task,
    action,
    on_success = () => {},
    on_error = (...args) => {
      console.error('###[http_internal_post]', ...args);
    },
    params = null,
  }) {
    return this.http_internal_call({
      task,
      action,
      on_success,
      on_error,
      params,
      type: 'POST',
    });
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
   * @protected
   */
  http_internal_get({
    task,
    action,
    on_success = () => {},
    on_error = (...args) => {
      console.error('###[http_internal_post]', ...args);
    },
    params = null,
  }) {
    return this.http_internal_call({
      task,
      action,
      on_success,
      on_error,
      params,
      type: 'GET',
    });
  }

  /**
   * Sauvegarde des données dans le stockage local
   * @param {string} key Clé qui permettra de retrouver les données sauvegarder
   * @param {*} contents Données qui seront sauvegarder
   * @returns {MelObject} Chaînage
   * @protected
   */
  save(key, contents) {
    mel_metapage.Storage.set(key, JSON.stringify(contents));
    return this;
  }

  /**
   * Charge des données dans le stockage local
   * @param {string} key Clé qui permet de retrouver les données
   * @param {?any} default_value Valeur par défaut si la donnée n'éxiste pas
   * @returns {?any}
   * @protected
   */
  load(key, default_value = null) {
    try {
      return JSON.parse(mel_metapage.Storage.get(key)) ?? default_value;
    } catch (error) {
      return default_value;
    }
  }

  /**
   * Décharge une donnée dans le stockage local
   * @param {string} key clé dans le stockage
   * @protected
   */
  unload(key) {
    mel_metapage.Storage.remove(key);
  }

  /**
   * Récupère l'objet UI de la skin elastic
   * @returns {Mel_Elastic}
   * @protected
   */
  get_skin() {
    return window.MEL_ELASTIC_UI;
  }

  /**
   * Récupère un objet Mel_CSS_Style_Sheet pour ajouter du css custom
   * @returns {Mel_CSS_Style_Sheet}
   * @protected
   */
  get_custom_rules() {
    return this.get_skin().css_rules;
  }

  /**
   * Génère un loader du bnum
   * @param {string} id id du loader
   * @param {!boolean} absoluteCentered Centrer verticalement et horizontalement ?
   * @returns {mel_html}
   * @protected
   */
  generate_loader(id, absoluteCentered = true) {
    return this.get_skin().create_loader(id, absoluteCentered, false);
  }

  /**
   * Séléctionne un document dom au format jquery
   * @param {string} selector Selecteur au format jquery
   * @returns {external:jQuery}
   * @protected
   */
  select(selector) {
    return $(selector);
  }

  /**
   * Copy un texte dans le press(papier)
   * @param {!string} text Texte à mettre dans le presse papier
   * @returns {MelObject} Chaînage
   * @protected
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
   * @frommodulereturn Cookies {@membertype .}
   * @protected
   */
  cookie_set(key, name, expire = false) {
    return Cookie.set_cookie(key, name, expire);
  }

  /**
   * Récupère un cookie
   * @param {string} key Indentifiant de la donnée
   * @returns {Cookie}
   * @frommodulereturn Cookies {@membertype .}
   * @protected
   */
  cookie_get(key) {
    return Cookie.get_cookie(key);
  }

  /**
   * Supprime un cookie
   * @param {string} key Indentifiant du cookie à supprimer
   * @returns {Cookie} Cookie supprimer
   * @frommodulereturn Cookies {@membertype .}
   * @protected
   */
  cookie_remove(key) {
    return Cookie.remove_cookie(key);
  }

  /**
   * Renvoie vrai si la variable vaut `null` ou `undefined`.
   * @param {?any} item Variable à tester
   * @returns {boolean}
   * @protected
   */
  isNullOrUndefined(item) {
    return isNullOrUndefined(item);
  }

  /**
   * Envoie une notification BNUM
   * @param {*} notification
   * @protected
   */
  send_notification(notification) {
    this.rcmail().triggerEvent('plugin.push_notification', notification);
  }

  switch_url(url) {
    window.location.href = url;
    return this;
  }

  switch_task(task, { action = null, params = {} }) {
    return this.switch_url(this.url(task, { action, params }));
  }

  export(name = null) {
    window[name ?? this.get_class_name()] = this;
    return this;
  }

  delete_export(name = null) {
    window[name ?? this.get_class_name()] = null;
    return this;
  }

  get_class_name() {
    return this.constructor.name;
  }

  /**
   * Envoie un MelObject vide.
   * @returns {MelObject}
   * @static
   */
  static Empty() {
    return new MelObject();
  }
}

/**
 * @class
 * @classdesc Contient une instance d'un objet, utile pour la création d'un singleton.
 * @template {!Tt} T
 */
class WrapperObject {
  /**
   * Constructeur de la classe
   * @param {typeof T} TypeOfItem Classe
   * @param  {...any} args Argument pour instancier la classe
   */
  constructor(TypeOfItem, ...args) {
    /**
     * Instance de la classe
     * @private
     * @type {?T}
     */
    let _instance = null;
    /**
     * Renvoie un instance de classe
     * @type {T}
     * @member
     */
    this.Instance = null;

    Object.defineProperty(this, 'Instance', {
      get() {
        if (!_instance) _instance = new TypeOfItem(...args);

        return _instance;
      },
    });
  }

  /**
   * Contient une instance d'un objet, utile pour la création d'un singleton.
   * @static
   * @param {typeof T} typeofitem
   * @param  {...any} args
   * @returns {WrapperObject<T>}
   */
  static Create(typeofitem, ...args) {
    return new WrapperObject(typeofitem, ...args);
  }
}
