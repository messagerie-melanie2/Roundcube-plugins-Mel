import { MelEnumerable } from '../../../mel_metapage/js/lib/classes/enum.js';
import { isNullOrUndefined } from '../../../mel_metapage/js/lib/mel.js';
import {
  MelObject,
  WrapperObject,
} from '../../../mel_metapage/js/lib/mel_object.js';
import { WorkspaceModuleBlock } from './WebComponents/workspace_module_block.js';

export class WorkspaceObject extends MelObject {
  constructor() {
    super();
  }

  main() {
    super.main();
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

  switch_workspace_page(page) {}

  /**
   *
   * @param {string} action
   * @param {Object<string, string>} [params={}]
   * @param {string} [type='GET']
   * @returns {Promise<?any>}
   */
  async http_workspace_call(action, params = {}, type = 'GET') {
    params ??= {};
    params._uid = this.uid;

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

  static GetWorkspaceData() {
    return workspaceData.Instance;
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

class CurrentWorkspaceData {
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

  app_loaded(service) {
    return (
      rcmail.env.current_workspace_services_actives[service] &&
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
