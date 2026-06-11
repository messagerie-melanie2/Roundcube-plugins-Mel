import { BnumPromise } from '../../../mel_metapage/js/lib/BnumPromise.js';
import { BnumLog } from '../../../mel_metapage/js/lib/classes/bnum_log.js';
import { FramesManager } from '../../../mel_metapage/js/lib/classes/frame_manager.js';
import { BnumConnector } from '../../../mel_metapage/js/lib/helpers/bnum_connections/bnum_connections.js';
import { pipe } from '../../../mel_metapage/js/lib/helpers/pipe.js';
import { HTMLTabsElement } from '../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/tab_web_element.js';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { AIndexWorkspaceUI } from './abstract_index_workspace_ui.js';
import { connectors } from './connectors.js';

/**
 * Liste des modes de visualisations
 * @enum {string}
 * @package
 */
const EVisuMode = {
  /**
   * Les espaces seront représenter sous forme de cards
   * @type {string}
   * @constant
   * @default 'cards'
   */
  cards: 'cards',
  /**
   * Les espaces seront représenter sous forme de liste
   * @type {string}
   * @constant
   * @default 'list'
   */
  list: 'list',
};
//#region Constants

/**
 * Si le système d'overflow est actif ou non pour les paneaux
 * @default true
 * @type {boolean}
 * @constant
 * @package
 */
const OVERFLOW_ENABLED = true;
/**
 * Valeur du display de la div qui contient le panel
 * @default 'var(--workspace-panel-overflow-system-display, block)'
 * @type {string}
 * @constant
 * @package
 */
const OVERFLOW_CSS_DISPLAY =
  'var(--workspace-panel-overflow-system-display, block)';
/**
 * Valeur de la prop' overflow de la div qui contient le panel
 * @default 'var(--workspace-panel-overflow-system, auto)'
 * @type {string}
 * @constant
 * @package
 */
const OVERFLOW_CSS_PROP = 'var(--workspace-panel-overflow-system, auto)';
//#endregion

let _registeredUI = AIndexWorkspaceUI;

export function registerWorkspaceUI(impl) {
  _registeredUI = impl;
}

export class IndexWorkspace extends MelObject {
  #_uiCache;
  /**
   * @type {AIndexWorkspaceUI}
   */
  get #_ui() {
    return (this.#_uiCache ??= new _registeredUI());
  }
  constructor() {
    super();
    this.#_main();
  }

  #_main() {
    if (document.readyState !== 'loading') this.#_start();
    else document.addEventListener('DOMContentLoaded', this.#_start.bind(this));
  }

  async #_start() {
    const result = await BnumPromise.Wait(() => {
      this.trigger('mel_workspace.index.register_ui', {
        registerFunction: registerWorkspaceUI,
      });

      return _registeredUI !== AIndexWorkspaceUI;
    });

    if (!result.resolved)
      BnumLog.error(
        'IndexWorkspace/#_start',
        'Impossible de trouver une implémentation de AIndexWorkspaceUI',
        result.msg,
      );

    this.#_loadDocumentsInBackground();
    this.#_setListeners();
    this.#_initMode();
  }

  #_initMode() {
    this.#_ui.initVueMode();
  }

  #_setListeners() {
    this.#_ui.addListeners({
      connectors: {
        set_visu_mode: connectors.set_visu_mode,
        publics_search_count: connectors.publics_search_count,
      },
    });
  }

  #_switchPageInBackground(page) {
    FramesManager.Instance.switch_frame(page, { changepage: false });
  }

  #_loadDocumentsInBackground() {
    const page = 'stockage';

    if (!this.#_hasFrame(page)) {
      BnumLog.info(
        'Workspace/Index',
        'Chargement des documents en arrière plan...',
      );
      this.#_switchPageInBackground(page);
    }
  }

  #_hasFrame(page) {
    return FramesManager.Instance.has_frame(page);
  }
}
