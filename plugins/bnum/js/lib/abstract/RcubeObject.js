import { EMPTY_STRING } from '../constants/constants';

export { RcubeObject };

/**
 * @callback RcubeEventCallback
 * @param {?Object<string, *>} args Arguments fournient par le trigger
 * @return {?* | void}
 */

class RcubeObject {
  constructor(...args) {}

  main() {
    this._p_initListeners();
    this._p_main();
    this._p_exports();
    return this;
  }

  _p_initListeners() {}

  /**
   * @abstract
   * Cette fonction est appelé dans le constructeur de MelObject.
   *
   * Mettez votre code ici.
   * @protected
   */
  _p_main() {}

  _p_exports() {}

  /**
   * @type {rcube_webmail}
   * @readonly
   */
  get rcube() {
    return this.rcmail();
  }

  /**
   * Récupère "rcmail" | les fonctions utiles à roundcube
   * @param {boolean} top Si on doit récupérer rcmail sur frame principale ou non
   * @returns {rcube_webmail}
   * @protected
   */
  rcmail(useTopContext = false) {
    return useTopContext ? (top ?? parent ?? window).rcmail : window.rcmail;
  }

  open_compose_step({ to = undefined, subject = undefined } = {}) {
    let config = {};

    if (to) config.to = to;
    if (subject) config.subject = subject;

    this.rcmail().open_compose_step(config);
  }

  /**
   * Récupère une clé sous forme de texte.
   * @param {string} key_text Clé
   * @param {string} [plugin=''] Plugin d'où provient le texte traduit
   * @returns {string}
   * @protected
   */
  gettext(key_text, plugin = '') {
    return this.rcube.gettext(key_text, plugin);
  }

  /**
   * Ajoute un écouteur
   * @param {string} key Clé de l'écouteur
   * @param {RcubeEventCallback} callback Fonction
   * @param {Object} [options={}]
   * @param {?string} [options.callback_key=null] Clé qui permet de retrouver le callback
   * @returns {this} Chaînage
   * @protected
   */
  listen(key, callback, { callback_key = null } = {}) {
    if (callback_key)
      this.rcube.add_event_listener_ex(key, callback_key, callback);
    else this.rcube.addEventListener(key, callback);

    return this;
  }

  /**
   * Appèle un évènement
   * @param {string} key Clé lié aux écouteurs
   * @param {Object} [args={}] Arguments à transmettre aux écouteurs
   * @returns {?(void | any)}
   * @protected
   */
  trigger(key, args = {}) {
    return this.rcube.triggerEvent(key, args ?? {});
  }

  /**
   * Récupère une variable d'environnement de roundcube
   * @param {string} key Nom de la variable
   * @returns {?any}
   * @protected
   */
  get_env(key) {
    return this.rcube.env[key] ?? this.rcmail(true)?.env?.[key];
  }

  /**
   * Modifie une variable d'environnement de rcmail
   * @param {string} key Clé pour retrouver la donnée
   * @param {*} value Valeur à mettre en mémoire
   * @returns {this} Chaînage
   * @protected
   */
  set_env(key, value) {
    this.rcube.env[key] = value;
    return this;
  }

  /**
   * Selectionne une frame
   * @param {string} frame Nom de la frame
   * @param {Object} [options={}]
   * @param {boolean} [options.jQuery=true] Si on récupère en jQuery ou non
   * @returns {HTMLIFrameElement | external:jQuery}
   * @protected
   */
  select_frame(frame, { jQuery = true } = {}) {
    const SELECTOR = `.${frame}-frame`;

    let returnData;
    if (jQuery) {
      const $ = (top ?? window).$;

      returnData = $(SELECTOR);
    } else returnData = document.querySelector(SELECTOR);

    return returnData;
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
   * @param {Object} [param1={}] action => Nom de l'action ('index' si non renseigné), params => Autres paramètres
   * @param {!string} [param1.action=''] => Nom de l'action (index si non renseigné)
   * @param {?Object<string, string>} [param1.params=null] Autres paramètres
   * @param {boolean} [removeIsFromIframe=false] Si on supprime `is_from=iframe` qui correspond à l'url à l'intérieur des frames
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

    return this.rcmail().get_task_url(
      url,
      window.location.origin + window.location.pathname,
    );
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
    this.rcube.display_message(
      text || `${elementToCopy} copier dans le presse-papier.`,
      'confirmation',
    );

    return this;
  }

  /**
   * Envoie une notification BNUM
   * @param {*} notification
   * @protected
   */
  send_notification(notification) {
    this.trigger('plugin.push_notification', notification);
  }

  /**
   * Change l'url du document en cours
   * @param {string} url Nouvelle url
   * @returns {this} Chaînage
   */
  switch_url(url) {
    window.location.href = url;
    return this;
  }

  /**
   * Change l'url du document en cours via les tâches, actions et paramètres
   * @param {string} task
   * @param {*} options
   * @returns
   */
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
   * @type {Readonly<EmptyRcubeObject>}
   * @readonly
   * @static
   */
  static get Empty() {
    if (!this._empty) this._empty = Object.freeze(new EmptyRcubeObject());

    return this._empty;
  }

  static Start(...args) {
    return new this.prototype.constructor(...args).main();
  }
}

/**
 * @class
 * @classdesc Donne divers fonction d'aide pour programmer.
 * @extends RcubeObject
 */
class EmptyRcubeObject extends RcubeObject {
  /**
   * Constructeur de la classe
   */
  constructor() {
    super();
  }

  /**
   * Récupère "rcmail" | les fonctions utiles à roundcube
   * @param {boolean} top Si on doit récupérer rcmail sur frame principale ou non
   * @returns {rcube_webmail}
   * @public
   */
  rcmail(useTopContext = false) {
    return super.rcmail(useTopContext);
  }

  /**
   * Récupère une clé sous forme de texte.
   * @param {string} key_text Clé
   * @param {string} [plugin=''] Plugin d'où provient le texte traduit
   * @returns {string}
   * @public
   */
  gettext(key_text, plugin = '') {
    return super.gettext(key_text, plugin);
  }

  /**
   * Ajoute un écouteur
   * @param {string} key Clé de l'écouteur
   * @param {RcubeEventCallback} callback Fonction
   * @param {Object} [options={}]
   * @param {?string} [options.callback_key=null] Clé qui permet de retrouver le callback
   * @returns {this} Chaînage
   * @public
   */
  listen(key, callback, { callback_key = null } = {}) {
    return super.listen(key, callback, { callback_key });
  }

  /**
   * Appèle un évènement
   * @param {string} key Clé lié aux écouteurs
   * @param {Object} [args={}] Arguments à transmettre aux écouteurs
   * @returns {?(void | any)}
   * @public
   */
  trigger(key, args = {}) {
    return super.trigger(key, args);
  }

  /**
   * Récupère une variable d'environnement de roundcube
   * @param {string} key Nom de la variable
   * @returns {?any}
   * @public
   */
  get_env(key) {
    return super.get_env(key);
  }

  /**
   * Modifie une variable d'environnement de rcmail
   * @param {string} key Clé pour retrouver la donnée
   * @param {*} value Valeur à mettre en mémoire
   * @returns {this} Chaînage
   * @public
   */
  set_env(key, value) {
    return super.set_env(key, value);
  }

  /**
   * Selectionne une frame
   * @param {string} frame Nom de la frame
   * @param {Object} [options={}]
   * @param {boolean} [options.jQuery=true] Si on récupère en jQuery ou non
   * @returns {HTMLIFrameElement | external:jQuery}
   * @public
   */
  select_frame(frame, { jQuery = true } = {}) {
    super.select_frame(frame, { jQuery });
  }

  /**
   * Selectionne toutes les frames qui ne sont pas parmis les frames définie en arguments
   * @param  {...string} frames Frames à écarter
   * @generator
   * @yield {Node}
   * @return {Generator<Node>}
   * @public
   */
  *select_frame_except(...frames) {
    yield* super.select_frame_except(...frames);
  }

  /**
   * Récupère une url à partir d'une tâche et d'une action
   * @param {string} task Nom de la tâche
   * @param {Object} [param1={}] action => Nom de l'action ('index' si non renseigné), params => Autres paramètres
   * @param {!string} [param1.action=''] => Nom de l'action (index si non renseigné)
   * @param {?Object<string, string>} [param1.params=null] Autres paramètres
   * @param {boolean} [removeIsFromIframe=false] Si on supprime `is_from=iframe` qui correspond à l'url à l'intérieur des frames
   * @returns {string}
   * @public
   */
  url(
    task,
    { action = EMPTY_STRING, params = null, removeIsFromIframe = false },
  ) {
    return super.url(task, { action, params, removeIsFromIframe });
  }

  /**
   * Récupère l'objet UI de la skin elastic
   * @returns {Mel_Elastic}
   * @public
   */
  get_skin() {
    return super.get_skin();
  }

  /**
   * Récupère un objet Mel_CSS_Style_Sheet pour ajouter du css custom
   * @returns {Mel_CSS_Style_Sheet}
   * @public
   */
  get_custom_rules() {
    return super.get_custom_rules();
  }

  /**
   * Génère un loader du bnum
   * @param {string} id id du loader
   * @param {!boolean} absoluteCentered Centrer verticalement et horizontalement ?
   * @returns {mel_html}
   * @public
   */
  generate_loader(id, absoluteCentered = true) {
    return super.generate_loader(id, absoluteCentered);
  }

  /**
   * Copie un texte dans le press(papier)
   * @param {string} elementToCopy Texte à mettre dans le presse papier
   * @param {Object} [options={}]
   * @param {?string} [options.text=null] Texte à afficher lorsque la copie a été effectuée
   * @public
   */
  copy_to_clipboard(elementToCopy, { text = null } = {}) {
    return super.copy_to_clipboard(elementToCopy, { text });
  }

  /**
   * Envoie une notification BNUM
   * @param {*} notification
   * @public
   */
  send_notification(notification) {
    super.send_notification(notification);
  }

  switch_url(url) {
    return super.switch_url(url);
  }

  switch_task(task, { action = null, params = {} }) {
    return super.switch_task(task, { action, params });
  }
}
