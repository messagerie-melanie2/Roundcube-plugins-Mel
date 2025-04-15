import { WrapperObject } from '../../../../mel_metapage/js/lib/BaseObjects/WrapperObject.js';
import {
  BnumMessage,
  eMessageType,
} from '../../../../mel_metapage/js/lib/classes/bnum_message.js';
import { MelEnumerable } from '../../../../mel_metapage/js/lib/classes/enum.js';
import { FramesManager } from '../../../../mel_metapage/js/lib/classes/frame_manager.js';
import { EMPTY_STRING } from '../../../../mel_metapage/js/lib/constants/constants.js';
import { isNullOrUndefined } from '../../../../mel_metapage/js/lib/mel.js';
import { BnumEvent } from '../../../../mel_metapage/js/lib/mel_events.js';
import { MelObject } from '../../../../mel_metapage/js/lib/mel_object.js';
import { NavBarManager } from './navbar.generator.js';
import { WorkspaceModuleBlock } from '../WebComponents/workspace_module_block.js';
import { BnumConnector } from '../../../../mel_metapage/js/lib/helpers/bnum_connections/bnum_connections.js';
import { connectors } from '../connectors.js';
import { BnumPromise } from '../../../../mel_metapage/js/lib/BnumPromise.js';

export { WorkspaceObject, CurrentWorkspaceData };

/**
 * Contient les classes et fonctionnalités éssentiels pour une application lié à un espace.
 * @module Workspace/Object
 * @local OnActionReceivedCallback
 * @local MethodCallback
 * @local WorkspaceObject
 * @local CurrentWorkspaceData
 * @local WorkspaceObjectData
 * @local WorkspaceUser
 * @local WorkspaceUsers
 */

/**
 * @callback OnActionReceivedCallback
 * @param {WorkspaceObjectData} data
 * @returns {void}
 */

/**
 * @callback MethodCallback
 * @return {void}
 */

/**
 * @class
 * @classdesc Contient les données et fonctions utiles pour les classes/modules qui implémentent les espaces de travail
 * @extends MelObject
 * @abstract
 * @hideconstructor
 */
class WorkspaceObject extends MelObject {
  constructor() {
    super();
  }

  /**
   * Contient le code de la fonction
   * @virtual
   * @override
   */
  main() {
    super.main();

    /**
     * Appelé lorsqu'une frame de l'espace envoie des données à l'espace via {@link WorkspaceObject.SendToWorkspace}
     * @type {BnumEvent<OnActionReceivedCallback>}
     * @event
     * @frommodule Workspace/Object {@linkto OnActionReceivedCallback}
     */
    this.onactionreceived = new BnumEvent();

    this.rcmail().addEventListener('workspace.object.call', (obj) => {
      this.onactionreceived.call(obj);
    });
  }

  /**
   * Indique au module qu'il a fini son chargement
   */
  loadModule() {
    this.main.loaded = true;
  }

  /**
   * Etat du module si il a fini de chargé ou non.
   * @type {boolean}
   * @readonly
   */
  get loaded() {
    return this.main.loaded ?? false;
  }

  /**
   * Données de l'espace en cours
   * @type {CurrentWorkspaceData}
   * @readonly
   */
  get workspace() {
    return workspaceData.Instance;
  }

  /**
   * Récupère le module d'un espace via son id.
   * @param {string} id Id du module à récupérer
   * @returns {WorkspaceModuleBlock}
   * @protected
   */
  _p_module_block(id) {
    return document.querySelector(`#${id}`);
  }

  /**
   * A ajouter dans un `NavBarManager.AddEventListener().OnBeforeSwitch`.
   *
   * Permet de passer un élément en mode plein écran
   * @param {string} task Tâche passé par `OnBeforeSwitch`
   * @param {string} askedTask Tâche que l'on souhaite gérer
   * @param {import('../WebComponents/workspace_module_block.js').WorkspaceModuleBlock} module
   * @param {?import('../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/pressed_button_web_element.js').PressedButton} visibilityButton
   * @param {Object} [options={}]
   * @param {?function} [options.onSetFullScreen=null] Appelé lorsqu'on passe en mode plein écran
   * @param {?function} [options.onUnsetFullScreen=null] Appelé lorsqu'on quitte le mode plein écran
   * @returns {Promise<{_break: boolean} | void>}
   * @async
   * @protected
   */
  async _p_set_full_screen_event(
    task,
    askedTask,
    module,
    visibilityButton,
    { onSetFullScreen = null, onUnsetFullScreen = null } = {},
  ) {
    visibilityButton ??= { length: false };

    if (task === askedTask) {
      //On cache tout les autres modules
      for (const element of document.querySelectorAll(
        WorkspaceModuleBlock.Tag,
      )) {
        element.classList.add('hidden-because-other-in-fullscreen-mode');
      }

      await NavBarManager.GoToHome({}, this.workspace);
      top.history.replaceState(
        {},
        document.title,
        MelObject.Empty().url('workspace', {
          action: 'workspace',
          params: {
            _uid: this.workspace.uid,
            _page: task,
            _force_bnum: 1,
          },
          removeIsFromIframe: true,
        }),
      );

      if (visibilityButton.length)
        visibilityButton.addClass('disabled').attr('disabled', 'disabled');

      this.showBlock(module);

      if (!this.loaded) this._main();

      module.classList.remove('hidden-because-other-in-fullscreen-mode');
      module.setAttribute('data-fullscreen', 'true');

      if (onSetFullScreen)
        onSetFullScreen({ module, task, askedTask, visibilityButton });

      return { _break: true, askedTask };
    } else if (module.hasAttribute('data-fullscreen')) {
      if (visibilityButton.length)
        visibilityButton.removeClass('disabled').removeAttr('disabled');

      module.removeAttribute('data-fullscreen');

      if (onUnsetFullScreen)
        onUnsetFullScreen({ module, task, askedTask, visibilityButton });

      if (this.isDisabled(askedTask)) {
        this.hideBlock(module);
      }
    }
  }

  /**
   * Ajoute un listener qui gère lorsque l'on passe un élément en mode plein écran
   * @param {string} askedTask Tâche que l'on souhaite gérer
   * @param {import('../WebComponents/workspace_module_block.js').WorkspaceModuleBlock} module
   * @param {?import('../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/pressed_button_web_element.js').PressedButton} visibilityButton
   * @param {Object} [options={}]
   * @param {?function} [options.onSetFullScreen=null] Appelé lorsqu'on passe en mode plein écran
   * @param {?function} [options.onUnsetFullScreen=null] Appelé lorsqu'on quitte le mode plein écran
   * @returns {Promise<void>}
   * @async
   * @protected
   */
  async _p_set_full_screen_listener(
    askedTask,
    module,
    visibilityButton,
    { onSetFullScreen = null, onUnsetFullScreen = null } = {},
  ) {
    await BnumPromise.Wait(() => !!NavBarManager.currentNavBar);
    NavBarManager.AddEventListener().OnBeforeSwitch(async (args) => {
      const { task } = args;
      return await this._p_set_full_screen_event(
        task,
        askedTask,
        module,
        visibilityButton,
        {
          onSetFullScreen,
          onUnsetFullScreen,
        },
      );
    }, askedTask);
  }

  /**
   * Permet un changement de frame de l'espace de travail
   * @param {string} page Tâche
   * @param {Object} [param1={}] Arguments qui permettra à la frame de changer de page au besoin
   * @param {?string} [param1.action=null] Action de la nouvelle frame. `null` par défaut
   * @param {Object<string, *>} [param1.newArgs={}] Arguments de l'url. Object vide par défaut.
   * @returns {Promise<void>}
   * @async
   */
  async switch_workspace_page(page, { action = null, newArgs = {} } = {}) {
    NavBarManager.currentNavBar.select(page, { background: true });

    if (!newArgs) newArgs = {};

    if (action) newArgs['_action'] = action;

    if (!Object.keys(newArgs).length) newArgs = null;

    await NavBarManager.SwitchPage(page, {
      workspace: this.workspace,
      manualConfig: newArgs,
    });
  }

  /**
   * Effectue un appel api lié à la tâche des espaces de travail
   * @param {string} action Action que l'on souhaite "taper".
   * @param {Object<string, string>} [params={}] Paramètres de l'url
   * @param {string} [type='GET'] Type d'appel
   * @returns {Promise<?any>}
   * @async
   */
  async http_workspace_call(action, params = {}, type = 'GET') {
    params ??= {};
    params._uid = this.workspace.uid;

    let data = null;
    let errored = false;
    await this.http_internal_call({
      task: 'workspace',
      on_success: (sData) => {
        data = sData;
      },
      on_error: (...args) => {
        errored = args;
      },
      params,
      action,
      type,
    });

    if (errored) throw errored;

    return data;
  }

  /**
   * Effectue un appel api "POST" lié à la tâche des espaces de travail
   * @param {string} action Action que l'on souhaite "taper".
   * @param {Object<string, string>} [params={}] Paramètres de l'url
   * @returns {Promise<?any>}
   */
  async http_workspace_post(action, params = {}) {
    return await this.http_workspace_call(action, params, 'POST');
  }

  /**
   * Récupère un paramètre d'un espace de travail
   * @param {string} key Clé du paramètre
   * @param {Object<string, string>} [params={}] Paramètres de l'url
   * @returns {Promise<?any>}
   */
  async http_workspace_param_post(key, params = {}) {
    params ??= {};
    params._key = key;
    return await this.http_workspace_post('param', params);
  }

  /**
   * Sauvegarde un paramètre dans un espace
   *
   * @param {string} key
   * @param {string | number | boolean} value
   * @returns {Promise<('ok' | 'denied')>}
   * @async
   * @throws {Error} If denied
   */
  async save_params(key, value) {
    const response = await BnumConnector.connect(connectors.params_set, {
      params: {
        _uid: this.workspace.uid,
        _key: key,
        _value: value,
      },
    });

    if (response.datas === 'denied') throw new Error('Denied');

    return response.datas;
  }

  /**
   * Récupère un paramètre sauvegarder dans un espace
   *
   * @param {string} key
   * @returns {Promise<any | 'denied'>}
   * @async
   * @throws {Error} If denied
   */
  async get_params(key) {
    const response = await BnumConnector.connect(connectors.params_get, {
      params: {
        _uid: this.workspace.uid,
        _key: key,
      },
    });

    if (response.datas === 'denied') throw new Error('Denied');

    return response.datas;
  }

  /**
   *
   * @param {Object} [param0={}]
   * @returns {WorkspaceModuleBlock}
   */
  createModuleElement({
    title = null,
    button = null,
    buttonText = null,
    buttonIcon = null,
  } = {}) {
    let node = document.createElement('bnum-workspace-module');

    if (title) node.setAttribute('data-title', title);

    if (button) {
      node.setAttribute('data-button', button);

      if (buttonText) node.setAttribute('data-button-text', buttonText);

      if (buttonIcon) node.setAttribute('data-button-icon', buttonIcon);
    }

    return node;
  }

  /**
   * Change l'état d'un module
   * @param {string} task Module à changer d'état
   * @param {boolean} state Nouvel état
   * @param {WorkspaceModuleBlock} container Container du module
   * @return {Promise<void>}
   * @async
   */
  async switchState(task, state, container) {
    if (state) this.hideBlock(container);
    else this.showBlock(container);

    await this.http_workspace_post('update_module_visibility', {
      _key: task,
      _state: state,
    });

    this.rcmail().env.workspace_modules_visibility[task] = state;

    BnumMessage.DisplayMessage(
      'Visibilitée changée avec succès',
      eMessageType.Confirmation,
    );
  }

  /**
   * Vérifie si un des modules de l'espace est désactivé ou non
   * @param {string} task Module à vérifier
   * @returns {boolean}
   */
  isDisabled(task) {
    return [true, 'true'].includes(
      this.get_env('workspace_modules_visibility')?.[task],
    );
  }

  /**
   * Cache le block et aggrandit les autres
   * @param {WorkspaceModuleBlock} module
   * @returns {this} Chaînage
   */
  hideBlock(module) {
    module.parentElement.style.display = 'none';
    const children = MelEnumerable.from(
      module.parentElement.parentElement.children,
    ).where((x) => x.style.display !== 'none');

    for (const element of children) {
      element.setAttribute(
        'data-initial-classes',
        element.getAttribute('class'),
      );
      element.classList.remove(...element.classList.values());

      element.classList.add(`col-${12 / children.count()}`);
    }

    return this;
  }

  /**
   * Affiche un block et affiche correctement les autres blocks
   * @param {WorkspaceModuleBlock} module
   * @returns {this} Chaînage
   */
  showBlock(module) {
    module.parentElement.style.display = EMPTY_STRING;
    const children = MelEnumerable.from(
      module.parentElement.parentElement.children,
    ).where((x) => x.style.display !== 'none');

    //Il n'y a pas d'éléments cachés
    if (
      children.count() === module.parentElement.parentElement.children.length
    ) {
      for (const element of children.where((x) =>
        x.hasAttribute('data-initial-classes'),
      )) {
        element.setAttribute(
          'class',
          element.getAttribute('data-initial-classes'),
        );
        element.removeAttribute('data-initial-classes');
      }
    } else {
      //Il reste des éléments cachés
      for (const element of children) {
        if (!element.hasAttribute('data-initial-classes')) {
          element.setAttribute(
            'data-initial-classes',
            element.getAttribute('class'),
          );
        }
        element.classList.remove(...element.classList.values());

        element.classList.add(`col-${12 / children.count()}`);
      }
    }

    return this;
  }

  /**
   * Ajoute un callback lors du refresh de la frame
   * @param {MethodCallback} callback
   * @return {this} Chaînage
   * @override
   */
  on_refresh(callback) {
    this.rcmail().addEventListener('mel_metapage_refresh', callback);
    return this;
  }

  /**
   * Récupère les données de l'espace en cours
   * @returns {CurrentWorkspaceData}
   * @static
   */
  static GetWorkspaceData() {
    return workspaceData.Instance;
  }

  /**
   * Envoie des données à la frame parente
   * @param {string} key Clé qui permettra de récupérer les données dans la frame parente
   * @param {*} data Données à envoyer
   * @param {Object} [options={}]
   * @param {?string} [options.task=null] Ne pas utiliser.
   * @returns {boolean} Si des messages ont été envoyé à une frame parente, alors `true` sera renvoyé.
   * @static
   * @todo Rendre la tâche utile
   */
  static SendToParent(key, data, { task = null } = {}) {
    let rtn = false;

    if (parent !== window && !!parent) {
      parent.postMessage({ key, data, task });
      rtn = true;
    }

    return rtn;
  }

  /**
   * Envoie des données à la frame des espaces de travail
   * @param {string} key
   * @param {*} data Données à envoyer
   * @param {Object} [options={}]
   * @param {?string} [options.task=null] Ne pas utiliser.
   * @returns {boolean} Si des messages ont été envoyé, alors `true` sera renvoyé.
   * @static
   * @todo Rendre la tâche utile
   */
  static SendToWorkspace(key, data, { task = null } = {}) {
    const frame = FramesManager.Instance.get_frame('workspace', {
      jquery: false,
    });

    if (frame) {
      frame.contentWindow.postMessage({ key, data, task });
      return true;
    }

    return false;
  }

  /**
   * Ajoute un observer sur le html pour savoir si la page est affiché dans un espace de travail ou non.
   * @param {(data:{style: 'none' | 'flex', mutation:MutationRecord}) => void} onUpdated
   * @param {Object} [param1={}]
   * @param {?HTMLElement} [param1.targetNode=null]
   * @param {string} [param1.displayOnShow='flex']
   * @returns {MutationObserver}
   */
  static TryObserveHtml(
    onUpdated,
    { targetNode = null, displayOnShow = 'flex' } = {},
  ) {
    // Selectionne le noeud dont les mutations seront observées
    targetNode ??= document.querySelector('html');

    // Options de l'observateur (quelles sont les mutations à observer)
    let config = { attributes: true, childList: false, subtree: false };

    // Créé une instance de l'observateur lié à la fonction de callback
    let observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'class'
        ) {
          let style;
          if (document.querySelector('html').classList.contains('mwsp'))
            style = 'none';
          else style = displayOnShow;

          onUpdated({ style, mutation });
          break;
        }
      }
    });

    observer.observe(targetNode, config);

    return observer;
  }
}

/**
 * @class
 * @classdesc Objet qui contient les données envoyé par une frame enfante qui implémente un {@link WorkspaceObject}
 * @package
 */
class WorkspaceObjectData {
  #workspace = null;
  #data = null;
  #context = null;
  #key = null;
  /**
   * Assigne les arguments aux variable privés
   * @param {CurrentWorkspaceData} workspace Données de l'espace
   * @param {string} key Clé de la données
   * @param {Object} [options={}]
   * @param {?any} [options.data=null] Données envoyer par la frame enfant
   * @param {Window | undefined} [options.context=window] Context de la frame qui a envoyer les données
   */
  constructor(workspace, key, { data = null, context = window } = {}) {
    this.#workspace = workspace;
    this.#data = data;
    this.#context = context;
    this.#key = key;
  }

  /**
   * Clé des données
   * @type {string}
   * @readonly
   */
  get key() {
    return this.#key;
  }

  /**
   * Données de l'espace
   * @type {CurrentWorkspaceData}
   * @readonly
   */
  get workspace() {
    return this.#workspace;
  }

  /**
   * Données envoyé par la frame enfant
   * @type {?any}
   * @readonly
   */
  get data() {
    return this.#data;
  }

  /**
   * Context de la frame enfant
   * @type {Window | undefined}
   * @readonly
   * @deprecated Ne fonctionne pas
   */
  get context() {
    return this.#context;
  }

  /**
   * Fonctions d'aide
   * @type {EmptyMelObject}
   * @readonly
   */
  get helper() {
    return MelObject.Empty();
  }
}

/**
 * @class
 * @classdesc Données d'un utilisateur
 * @package
 */
class WorkspaceUser {
  #email = null;
  #name = null;
  #fullname = null;
  #external = false;
  /**
   * Fractionne à partir d'une donnée brute
   * @param {{email:string, name:string, fullname:string, is_external:boolean}} user Utilisateur brute à convertir en données structurée
   */
  constructor(user) {
    this.#email = user.email;
    this.#name = user.name;
    this.#fullname = user.fullname;
    this.#external = user.is_external;
  }

  /**
   * Email de l'utilisateur
   * @type {string}
   * @readonly
   */
  get email() {
    return this.#email;
  }

  /**
   * Nom de l'utilisateur
   * @type {string}
   * @readonly
   */
  get name() {
    return this.#name;
  }

  /**
   * Nom complet de l'utilisateur
   * @type {string}
   * @readonly
   */
  get fullname() {
    return this.#fullname;
  }

  /**
   * Si il s'agit d'un utilisateur externe ou non
   * @type {boolean}
   * @readonly
   */
  get external() {
    return this.#external;
  }
}

/**
 * @class
 * @classdesc Liste des utilisateurs d'un espace.
 * @package
 */
class WorkspaceUsers {
  #users = {};
  /**
   * Récupère la liste des utilisateurs
   * @param  {...WorkspaceUser} users
   * @frommoduleparam  Workspace/Object users {@linkto WorkspaceUser}
   */
  constructor(...users) {
    for (const element of users) {
      this.#users[element.email] = element;
    }
  }

  /**
   * Liste des adresses emails des utilisateurs
   * @type {string[]}
   * @readonly
   */
  get emails() {
    return Object.keys(this.#users);
  }

  /**
   * Récupère les utilisateurs sous la forme d'un tableau
   * @returns {WorkspaceUser[]}
   */
  toArray() {
    return [...this];
  }

  /**
   * Convertit la liste des utilisateurs en énumerable
   * @returns {MelEnumerable}
   * @frommodulereturn MelLinq
   */
  toEnumerable() {
    return new MelEnumerable(this.generator.bind(this));
  }

  /**
   * Récupère Un utilisateur à partir de son email
   * @param {string} email
   * @returns {WorkspaceUser}
   */
  get(email) {
    return this.#users[email];
  }

  /**
   * Enumère les utilisateurs
   * @yields {WorkspaceUser}
   */
  *generator() {
    for (const key of Object.keys(this.#users)) {
      yield this.#users[key];
    }
  }

  /**
   * Enumère les utilisateurs
   * @yields {WorkspaceUser}
   */
  *[Symbol.iterator]() {
    yield* this.generator();
  }
}

/**
 * @class
 * @classdesc Données de l'espace
 * @package
 */
class CurrentWorkspaceData {
  #users = null;
  #workspace_created = null;
  /**
   * Constructeur de la classe.
   *
   * Parse "current_workspace_services_actives" en objet si c'est une chaîne de charactères.
   */
  constructor() {
    if (typeof rcmail.env.current_workspace_services_actives === 'string')
      rcmail.env.current_workspace_services_actives = JSON.parse(
        rcmail.env.current_workspace_services_actives,
      );
  }

  /**
   * Id de l'espace de travail
   * @type {string}
   * @readonly
   */
  get uid() {
    return rcmail.env.current_workspace_uid;
  }

  /**
   * Titre de l'espace
   * @type {string}
   * @readonly
   */
  get title() {
    return rcmail.env.current_workspace_title;
  }

  /**
   * Utilisateurs de l'espace
   * @type {WorkspaceUsers}
   * @readonly
   */
  get users() {
    if (!this.#users) {
      this.#users = new WorkspaceUsers(
        ...MelEnumerable.from(rcmail.env.current_workspace_users).select(
          (x) => new WorkspaceUser(x.value),
        ),
      );
    }
    return this.#users;
  }

  /**
   * Si l'espace est public ou non
   * @type {boolean}
   * @readonly
   */
  get isPublic() {
    return rcmail.env.current_workspace_is_public;
  }

  /**
   * Couleur de l'espace
   * @type {string}
   * @readonly
   */
  get color() {
    return rcmail.env.current_workspace_color;
  }

  /**
   * Liste des services de l'espace
   * @type {Object<string, string | Object<string, any> | boolean | number>}
   * @readonly
   */
  get services() {
    return rcmail.env.current_workspace_services_actives;
  }

  /**
   * Date de création de l'espace
   * @type {external:moment}
   * @readonly
   */
  get created() {
    if (!this.#workspace_created)
      this.#workspace_created = moment(rcmail.env.current_workspace_created);

    return this.#workspace_created;
  }

  /**
   * Récupère l'information si une application est chargée ou non
   * @param {string} service
   * @returns {boolean}
   */
  app_loaded(service) {
    return (
      this.services[service] &&
      (rcmail.env.current_workspace_services_enabled?.[service] !== false ||
        isNullOrUndefined(
          rcmail.env.current_workspace_services_enabled?.[service],
        ))
    );
  }

  reloadUsers() {
    this.#users = null;
    return this;
  }
}

/**
 * Singleton des données de l'espace pour éviter de recréer un objet à chaque fois.
 * @type {WrapperObject<CurrentWorkspaceData>}
 * @constant
 * @package
 * @frommodule Workspace/Object {@linkto CurrentWorkspaceData}
 */
const workspaceData = new WrapperObject(CurrentWorkspaceData);

/**
 * Propriété de l'objet "window" à ajouter pour indiquer que le listener "message" à déjà été ajouter.
 * @type {string}
 * @constant
 * @package
 */
const window_prop_data = 'wspobjlsn';
if (!window[window_prop_data]) {
  window.addEventListener(
    'message',
    (event) => {
      if (true) {
        rcmail.triggerEvent(
          'workspace.object.call',
          new WorkspaceObjectData(
            WorkspaceObject.GetWorkspaceData(),
            event.data.key,
            {
              data: event.data.data,
              context: event.data.task
                ? FramesManager.Instance.get_frame(event.data.task, {
                    jquery: false,
                  })?.contentWindow
                : undefined,
            },
          ),
        );
      }
    },
    false,
  );

  window[window_prop_data] = true;
}
