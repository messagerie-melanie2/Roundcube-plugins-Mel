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

class CurrentWorkspaceData {
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
