import { WrapperObject } from '../../../mel_metapage/js/lib/BaseObjects/WrapperObject.js';
import {
  BnumMessage,
  eMessageType,
} from '../../../mel_metapage/js/lib/classes/bnum_message.js';
import { MelEnumerable } from '../../../mel_metapage/js/lib/classes/enum.js';
import { FramesManager } from '../../../mel_metapage/js/lib/classes/frame_manager.js';
import { EMPTY_STRING } from '../../../mel_metapage/js/lib/constants/constants.js';
import { isNullOrUndefined } from '../../../mel_metapage/js/lib/mel.js';
import { BnumEvent } from '../../../mel_metapage/js/lib/mel_events.js';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { NavBarManager } from './navbar.generator.js';
import { WorkspaceModuleBlock } from './WebComponents/workspace_module_block.js';

/**
 * @module Workspace/Object
 */

/**
 * @callback OnActionReceivedCallback
 * @param {WorkspaceObjectData} data
 * @returns {void}
 */

export class WorkspaceObject extends MelObject {
  constructor() {
    super();
  }

  main() {
    super.main();

    /**
     * @type {BnumEvent<OnActionReceivedCallback>}
     */
    this.onactionreceived = new BnumEvent();

    this.rcmail().addEventListener('workspace.object.call', (obj) => {
      this.onactionreceived.call(obj);
    });
  }

  loadModule() {
    this.main.loaded = true;
  }

  get loaded() {
    return this.main.loaded ?? false;
  }

  /**
   * @type {CurrentWorkspaceData}
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
   *
   * @param {string} action
   * @param {Object<string, string>} [params={}]
   * @param {string} [type='GET']
   * @returns {Promise<?any>}
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
   *
   * @param {string} action
   * @param {Object<string, string>} [params={}]
   * @returns {Promise<?any>}
   */
  async http_workspace_post(action, params = {}) {
    return await this.http_workspace_call(action, params, 'POST');
  }

  /**
   *
   * @param {string} key
   * @param {Object<string, string>} [params={}]
   * @returns {Promise<?any>}
   */
  async http_workspace_param_post(key, params = {}) {
    params ??= {};
    params._key = key;
    return await this.http_workspace_post('param', params);
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

  async switchState(task, state, container) {
    container.style.display = state ? 'none' : EMPTY_STRING;

    await this.http_workspace_post('update_module_visibility', {
      _key: task,
      _state: state,
    });

    BnumMessage.DisplayMessage(
      'Visibilitée changée avec succès',
      eMessageType.Confirmation,
    );
  }

  isDisabled(task) {
    return [true, 'true'].includes(
      this.get_env('workspace_modules_visibility')?.[task],
    );
  }

  static GetWorkspaceData() {
    return workspaceData.Instance;
  }

  static SendToParent(key, data, { task = null } = {}) {
    let rtn = false;

    if (parent !== window && !!parent) {
      parent.postMessage({ key, data, task });
      rtn = true;
    }

    return rtn;
  }

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
}

class WorkspaceObjectData {
  #workspace = null;
  #data = null;
  #context = null;
  #key = null;
  constructor(workspace, key, { data = null, context = window } = {}) {
    this.#workspace = workspace;
    this.#data = data;
    this.#context = context;
    this.#key = key;
  }

  get key() {
    return this.#key;
  }

  get workspace() {
    return this.#workspace;
  }

  get data() {
    return this.#data;
  }

  get context() {
    return this.#context;
  }

  get helper() {
    return MelObject.Empty();
  }
}

class WorkspaceUser {
  #email = null;
  #name = null;
  #fullname = null;
  #external = false;

  constructor(user) {
    this.#email = user.email;
    this.#name = user.name;
    this.#fullname = user.fullname;
    this.#external = user.is_external;
  }

  get email() {
    return this.#email;
  }

  /**
   * @type {string}
   */
  get name() {
    return this.#name;
  }

  get fullname() {
    return this.#fullname;
  }

  get external() {
    return this.#external;
  }
}

class WorkspaceUsers {
  #users = {};
  /**
   *
   * @param  {...WorkspaceUser} users
   */
  constructor(...users) {
    for (const element of users) {
      this.#users[element.email] = element;
    }
  }

  get emails() {
    return Object.keys(this.#users);
  }

  /**
   *
   * @returns {WorkspaceUser[]}
   */
  toArray() {
    return [...this];
  }

  toEnumerable() {
    return new MelEnumerable(this.generator.bind(this));
  }

  /**
   *
   * @param {*} email
   * @returns {WorkspaceUser}
   */
  get(email) {
    return this.#users[email];
  }

  *generator() {
    for (const key of Object.keys(this.#users)) {
      yield this.#users[key];
    }
  }

  *[Symbol.iterator]() {
    yield* this.generator();
  }
}

export class CurrentWorkspaceData {
  #users = null;
  constructor() {
    if (typeof rcmail.env.current_workspace_services_actives === 'string')
      rcmail.env.current_workspace_services_actives = JSON.parse(
        rcmail.env.current_workspace_services_actives,
      );
  }

  get uid() {
    return rcmail.env.current_workspace_uid;
  }

  get title() {
    return rcmail.env.current_workspace_title;
  }

  /**
   * @type {WorkspaceUsers}
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

  get isPublic() {
    return rcmail.env.current_workspace_is_public;
  }

  get color() {
    return rcmail.env.current_workspace_color;
  }

  get services() {
    return rcmail.env.current_workspace_services_actives;
  }

  app_loaded(service) {
    return (
      this.services[service] &&
      (rcmail.env.current_workspace_services_enabled?.[service] !== false ||
        isNullOrUndefined(
          rcmail.env.current_workspace_services_enabled?.[service],
        ))
    );
  }
}

/**
 * @type {WrapperObject<CurrentWorkspaceData>}
 */
const workspaceData = new WrapperObject(CurrentWorkspaceData);

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
