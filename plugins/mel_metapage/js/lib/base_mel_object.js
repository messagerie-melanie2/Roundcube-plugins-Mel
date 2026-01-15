import { BnumPromise } from './BnumPromise.js';
import { Cookie } from './classes/cookies.js';
import { EMPTY_STRING } from './constants/constants.js';
import { isNullOrUndefined } from './mel.js';
import { Top } from './top.js';

/**
 * Classe abstraite qui contient des méthodes utiles pour les objets Mel
 * @abstract
 * @class
 */
export default class ABaseMelObject {
  constructor() {
    if (this.constructor.name === 'ABaseMelObject') {
      throw new Error("Can't instantiate abstract class!");
    }
  }

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
   * Ecoute un évènement roundcube
   * @param {string} key
   * @param {(arg: T) => TReturn} callback
   * @param {Object} [param2={}]
   * @param {?string} [param2.callbackKey=null]
   * @param {boolean} [param2.topRcmail=false]
   * @returns {this}
   * @template T
   * @template TReturn
   */
  listen(key, callback, { callbackKey = null, topRcmail = false } = {}) {
    if (callbackKey)
      this.rcmail(topRcmail).add_event_listener_ex(key, callbackKey, callback);
    else this.rcmail(topRcmail).addEventListener(key, callback);

    return this;
  }

  /**
   * Trigger un évènement roundcube
   * @param {string} key
   * @param {TValue} item
   * @param {Object} [options={}]
   * @param {boolean} [options.topRcmail=false] Si on doit récupérer rcmail sur frame en cours ou non
   * @returns {TReturn}
   * @template TValue
   * @template TReturn
   */
  trigger(key, item, { topRcmail = false } = {}) {
    return this.rcmail(topRcmail).triggerEvent(key, item);
  }

  /**
   * Ouvre une nouvelle fenêtre de composition d'email.
   * @param {Object} [param0={}]
   * @param {undefined | string} [param0.to=undefined]
   * @param {undefined | string} [param0.subject=undefined]
   */
  open_compose_step({ to = undefined, subject = undefined } = {}) {
    let config = {};

    if (to) config.to = to;
    if (subject) config.subject = subject;

    return this.rcmail().open_compose_step(config);
  }

  /**
   * Récupère une clé sous forme de texte.
   * @param {string} key_text Clé
   * @param {!string} plugin Plugin d'où provient le texte traduit
   * @returns {string}
   * @protected
   * @deprecated utilisez {@link getLocalization} à la place
   */
  gettext(key_text, plugin = EMPTY_STRING) {
    return this.rcmail().gettext(key_text, plugin);
  }

  /**
   * Récupère un texte via une clé, ce qui permet de l'afficher dans la bonne langue
   * @param {string} keyText Clé qui permet de retrouver le texte
   * @param {Object} [param1={}]
   * @param {string} [param1.plugin=EMPTY_STRING]
   * @param {?Object<string, string>} [param1.variables=null]
   * @returns {string}
   */
  getLocalization(keyText, { plugin = EMPTY_STRING, variables = null } = {}) {
    let text = this.rcmail().gettext(keyText, plugin);

    if (variables && Object.keys(variables).length) {
      for (const [key, value] of Object.entries(variables)) {
        text = text.replaceAll(`$${key}`, value);
      }
    }

    return text;
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
   * Met à jour une variable d'environnement de roundcube.
   * @param {string} key Nom de la variable à modifier
   * @param {*} newValue Nouvelle valeur à affecter
   * @param {Object} [param2={}] Options supplémentaires
   * @param {boolean} [param2.top=false] Si true, modifie la variable dans la frame principale
   * @returns {*} Ancienne valeur de la variable
   */
  update_env(key, newValue, { top = false } = {}) {
    const old = this.get_env(key);
    this.rcmail(top).env[key] = newValue;
    return old;
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
  url(
    task,
    { action = EMPTY_STRING, params = null, removeIsFromIframe = false },
  ) {
    const IFRAME = Object.freeze({ KEY: '_is_from', VALUE: 'iframe' });
    let url = task;

    if (!!action && action !== EMPTY_STRING) url += `&_action=${action}`;

    if (
      !removeIsFromIframe &&
      (window !== parent ||
        window.location.href.includes(`${IFRAME.KEY}=${IFRAME.VALUE}`))
    ) {
      if (!params || !Object.keys(params).length) params = {};

      params[IFRAME.KEY] = IFRAME.VALUE;
    }

    if (!!params && Object.keys(params).length) {
      for (const key of Object.keys(params)) {
        url += `&${key}=${params[key]}`;
      }
    }

    // if (removeIsFromIframe && url.includes('&_is_from=iframe'))
    //   url = url.replace('&_is_from=iframe', EMPTY_STRING);

    return this.rcmail().get_task_url(
      url,
      window.location.origin + window.location.pathname,
    );
  }

  /**
   * Effectue un appel ajax avec les options spécifiées.
   * @param {Object} options - Les options pour l'appel HTTP.
   * @param {string} options.url - L'URL à appeler.
   * @param {(data:T) => Y} [options.on_success=() => {}] - La fonction à appeler en cas de succès.
   * @param {(...args:any[]) => any[]} [options.on_error=(...args) => {console.error('###[http_call]', ...args)}] - La fonction à appeler en cas d'erreur.
   * @param {Object} [options.params=null] - Les paramètres à envoyer dans la requête.
   * @param {string | BnumPromise.Ajax.EAjaxMethod} [options.type=BnumPromise.Ajax.EAjaxMethod.post] - Le type de requête HTTP à effectuer.
   * @returns {BnumPromise<Y>}
   * @frommodulereturn BnumPromise
   * @protected
   * @template T
   * @template Y
   */
  http_call({
    url,
    on_success = () => {},
    on_error = (...args) => {
      console.error('###[http_call]', ...args);
    },
    params = null,
    type = BnumPromise.Ajax.EAjaxMethod.post,
  }) {
    return BnumPromise.Ajax.Call(url, {
      type,
      success: on_success,
      failed: on_error,
      data: params,
    });
  }

  /**
   * Effectue un appel ajax vers les serveurs de l'application
   * @param {Object} options - Les options pour l'appel HTTP.
   * @param {string} options.task - Tache
   * @param {string} options.action - Action
   * @param {(data:T) => Y} [options.on_success=() => {}] - La fonction à appeler en cas de succès.
   * @param {(...args:any[]) => any[]} [options.on_error=(...args) => {console.error('###[http_call]', ...args)}] - La fonction à appeler en cas d'erreur.
   * @param {Object} [options.params=null] - Les paramètres à envoyer dans la requête.
   * @param {string | BnumPromise.Ajax.EAjaxMethod} [options.type=BnumPromise.Ajax.EAjaxMethod.post] - Le type de requête HTTP à effectuer.
   * @returns {BnumPromise<Y>}
   * @protected
   * @frommodulereturn BnumPromise
   * @template T
   * @template Y
   */
  http_internal_call({
    task,
    action,
    on_success = () => {},
    on_error = (...args) => {
      console.error('###[http_internal_call]', ...args);
    },
    params = null,
    type = BnumPromise.Ajax.EAjaxMethod.post,
  }) {
    const isGet = ['GET', BnumPromise.Ajax.EAjaxMethod.get].includes(type);
    return this.http_call({
      type,
      on_error,
      on_success,
      params: isGet ? null : params,
      url: this.url(task, {
        action: action,
        params: isGet ? params : null,
      }),
    });
  }

  /**
   * Effectue un appel ajax POST vers les serveurs de l'application
   * @param {Object} options - Les options pour l'appel HTTP.
   * @param {string} options.task - Tache
   * @param {string} options.action - Action
   * @param {(data:T) => Y} [options.on_success=() => {}] - La fonction à appeler en cas de succès.
   * @param {(...args:any[]) => any[]} [options.on_error=(...args) => {console.error('###[http_call]', ...args)}] - La fonction à appeler en cas d'erreur.
   * @param {Object} [options.params=null] - Les paramètres à envoyer dans la requête.
   * @returns {BnumPromise<Y>}
   * @protected
   * @frommodulereturn BnumPromise
   * @template T
   * @template Y
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
   * @param {(data:T) => Y} [options.on_success=() => {}] - La fonction à appeler en cas de succès.
   * @param {(...args:any[]) => any[]} [options.on_error=(...args) => {console.error('###[http_call]', ...args)}] - La fonction à appeler en cas d'erreur.
   * @param {Object} [options.params=null] - Les paramètres à envoyer dans la requête.
   * @returns {BnumPromise<Y>}
   * @protected
   * @frommodulereturn BnumPromise
   * @template T
   * @template Y
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
   * Execute une commande roundcube
   * @param {string} command Commande à appeler
   * @param {Object} [param1={}] Options supplémentaires pour la commande
   * @param {*} [param1.props=undefined] Propriétés à passer à la commande
   * @param {*} [param1.obj=undefined] Objet à passer à la commande
   * @param {Event | null | undefined} [param1.event=undefined] Evènement à passer à la commande
   * @param {boolean | undefined} [param1.allow_disabled=undefined] Autoriser la commande même si désactivée
   * @returns {boolean} Retourne true si la commande a été exécutée, sinon false
   */
  execCommand(
    command,
    {
      props = undefined,
      obj = undefined,
      event = undefined,
      allow_disabled = undefined,
    } = {},
  ) {
    return this.rcmail().command(command, props, obj, event, allow_disabled);
  }

  /**
   * Sauvegarde des données dans le stockage local
   * @param {string} key Clé qui permettra de retrouver les données sauvegarder
   * @param {*} contents Données qui seront sauvegarder
   * @returns {this} Chaînage
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

  load_without_parsing(key, default_value = null) {
    return mel_metapage.Storage.get(key) ?? default_value;
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
   * Copie un texte dans le press(papier)
   * @param {string} elementToCopy Texte à mettre dans le presse papier
   * @param {Object} [options={}]
   * @param {?string} [options.text=null] Texte à afficher lorsque la copie a été effectuée
   * @protected
   */
  copy_to_clipboard(elementToCopy, { text = null } = {}) {
    function copyOnClick(val) {
      var tempInput = document.createElement('input');
      tempInput.value = val;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);
    }

    copyOnClick(elementToCopy);
    rcmail.display_message(
      text || `${elementToCopy} copier dans le presse-papier.`,
      'confirmation',
    );

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

  /**
   * Change l'url de la page courente
   * @param {string} url
   * @returns {this}
   */
  switch_url(url) {
    window.location.href = url;
    return this;
  }

  /**
   * Change l'url de la frame courente par une url bnum
   * @param {string} task
   * @param {Object} [options={}]
   * @param {?string} [options.action=null] Action à effectuer
   * @param {Object<string, string | number | boolean>} [options.params={}] Autres paramètres
   * @returns {this}
   */
  switch_task(task, { action = null, params = {} }) {
    return this.switch_url(this.url(task, { action, params }));
  }

  /**
   * Ajoute ce module à "window" pour être utilisable par tout le monde
   * @param {?string} name Clé pour le retrouver
   * @returns {this}
   */
  export(name = null) {
    window[name ?? this.get_class_name()] = this;
    return this;
  }

  /**
   * Supprime un module qui se trouve dans "window".
   * @param {?string} name Clé pour le retrouver
   * @returns {this}
   */
  delete_export(name = null) {
    window[name ?? this.get_class_name()] = null;
    return this;
  }

  /**
   * Récupère le nom de la classe en cours
   * @returns {string}
   */
  get_class_name() {
    return this.constructor.name;
  }

  /**
   * (async) Créer une promesse "Mel" qui contient des fonctionnalités en plus
   * @param {import('./BnumPromise.js').PromiseCallback<T> | import('./BnumPromise.js').PromiseCallbackAsync<T>} callback Peut être asynchrone. Fonction qui sera appelé.
   * @param  {...any} args Arguments du callback
   * @returns {BnumPromise<T>}
   * @async
   * @template T
   * @frommodulereturn BnumPromise
   */
  create_promise(callback, ...args) {
    return new BnumPromise(callback, ...args);
  }

  /**
   * (async) Attend qu'une condtion soit valide
   * @param {import('../../../mel_metapage/js/lib/mel_promise.js').WaitCallback | import('../../../mel_metapage/js/lib/mel_promise.js').WaitCallbackAsync} callback Function qui est appelé à chaque tick. Lorsque "true" est renvoyé, la boucle s'arrête
   * @param {Object} [options={}]
   * @param {number} [options.timeout=5] Au bout de combien de secondes la boucle s'arrête
   * @returns {BnumPromise<{ resolved: boolean; msg: (string | undefined); }>}
   * @async
   */
  wait_something(callback, { timeout = 5 } = {}) {
    return BnumPromise.Wait(callback, { timeout });
  }

  /**
   * (async) Attend x millisecondes
   * @param {number} ms Temps en millisecondes
   * @returns {BnumPromise<void>}
   * @async
   */
  sleep(ms) {
    return BnumPromise.Sleep(ms);
  }

  /**
   * Envoie un BaseMelObject vide.
   * @returns {Readonly<EmptyObject>}
   * @static
   */
  static Empty() {
    if (!this.Empty.obj) this.Empty.obj = Object.freeze(new EmptyObject());

    return this.Empty.obj;
  }
}

class EmptyObject extends ABaseMelObject {
  constructor() {
    super();
  }
}
