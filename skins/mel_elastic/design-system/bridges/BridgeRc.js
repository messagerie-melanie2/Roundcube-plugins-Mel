import { EMPTY_STRING } from '../../../../plugins/mel_metapage/js/lib/constants/constants.js';
import { MelObject } from '../../../../plugins/mel_metapage/js/lib/mel_object.js';
import { HTMLBnumFolder } from '../ds-module-bnum';
import BridgeEvents from './BridgeEvents.js';

/**
 * Classe utilitaire pour patcher ou remplacer des méthodes de Roundcube.
 * Permet d'injecter des comportements personnalisés sans modifier le code source.
 */
export default class BridgeRc extends MelObject {
  static #_instance = null;
  /**
   * Accès à l'instance unique de BridgeRc.
   * @returns {BridgeRc}
   */
  static get Instance() {
    return (this.#_instance ??= new BridgeRc());
  }

  constructor() {
    super();
  }

  /**
   * Accès au treelist de Roundcube.
   * @returns {rcube_tree}
   */
  get treelist() {
    return BridgeEvents.Instance.treelist;
  }

  /**
   * Applique un patch automatique en utilisant le nom de la fonction fournie.
   * @param {Function} replacementFunc Fonction de remplacement
   * @param {Object} [param1={}]
   * @param {typeof rcube_webmail} [param1.target=this.rcmail()] Cible du patch
   * @returns {this}
   */
  patch(replacementFunc, { target = this.rcmail() } = {}) {
    const methodName = replacementFunc.name.replace(/^patch_/, EMPTY_STRING); // Récupère "set_unread_count_display"

    if (!target || typeof target[methodName] !== 'function') {
      console.error(
        `Impossible de patcher : la méthode "${methodName}" n'existe pas sur la cible.`,
      );
      return this;
    }

    // Protection : si la méthode a déjà un marqueur "isPatched", on ne fait rien
    if (target[methodName].__isPatched) {
      return this;
    }

    const oldMethod = target[methodName];

    target[methodName] = this.bind(target, oldMethod, replacementFunc);

    // On marque la fonction comme étant déjà patchée
    target[methodName].__isPatched = true;
    return this;
  }

  /**
   * Remplace complètement une méthode par une nouvelle.
   * @param {Function} replacementFunc Fonction de remplacement
   * @param {Object} [param1={}]
   * @param {typeof rcube_webmail} [param1.target=this.rcmail()] Cible du remplacement
   * @returns {this}
   */
  replace(replacementFunc, { target = this.rcmail() } = {}) {
    const methodName = replacementFunc.name.replace(/^patch_/, EMPTY_STRING); // Récupère "set_unread_count_display"

    if (!target || typeof target[methodName] !== 'function') {
      console.error(
        `Impossible de remplacer : la méthode "${methodName}" n'existe pas sur la cible.`,
      );
      return this;
    }

    // Protection : si la méthode a déjà un marqueur "isPatched", on ne fait rien
    if (target[methodName].__isReplaced) {
      return this;
    }

    target[methodName] = this.bind(target, () => {}, replacementFunc);

    // On marque la fonction comme étant déjà patchée
    target[methodName].__isReplaced = true;
    return this;
  }

  /**
   * Lie une ancienne et une nouvelle fonction pour permettre le fallback.
   * @param {Object} target
   * @param {AnyFunction} oldFn
   * @param {AnyFunction} newFn
   * @returns {AnyFunction}
   */
  bind(target, oldFn, newFn) {
    const boundNew = newFn.bind(this);
    return function (...args) {
      return boundNew(target, oldFn, ...args);
    };
  }

  /**
   * Patch : met à jour l'affichage du nombre de non-lus sur les dossiers personnalisés.
   */
  patch_set_unread_count_display(rcmailRef, old, folder, set_title) {
    try {
      old.call(rcmailRef, folder, set_title);
    } catch (error) {
      console.error(
        "Erreur lors de l'appel original set_unread_count_display",
        error,
      );
    }

    const mycount = this.get_env('unread_counts')[folder] || 0;
    document.querySelectorAll(`[folder-id="${folder}"]`).forEach((el) => {
      el.setAttribute('unread', mycount.toString());
    });
  }

  /**
   * Patch : retourne le noeud DOM d'un dossier, même pour les dossiers personnalisés.
   */
  patch_get_node(treeRef, oldFunction, folder) {
    return (
      oldFunction.call(treeRef, folder) ??
      document.querySelector(`${HTMLBnumFolder.TAG}[folder-id="${folder}"]`)
    );
  }

  /**
   * Patch : initialise le menu contextuel des dossiers personnalisés.
   */
  patch_init_folder(_, __, el, props, events) {
    const finalEvents = events || {};
    document.getElementById('rcm_folderlist')?.remove?.();
    this.get_env('contextmenus')['folderlist'] = undefined;

    const folderMenu = this.rcmail().contextmenu.init(
      { menu_name: 'folderlist', list_object: null, ...props },
      {
        beforeactivate: () => {
          this.get_env('contextmenu_messagecount_request')?.abort?.();
          this.update_env('contextmenu_messagecount_request', null);
        },
        activate: (p) => this.rcmail().contextmenu.activate_folder_commands(p),
        beforecommand: (p) => {
          const sourceId = this.get_env('context_menu_source_id');
          if (sourceId !== this.get_env('mailbox')) {
            if (['expunge', 'purge'].includes(p.command)) {
              this.rcmail()[p.command + '_mailbox'](sourceId);
              return { abort: true, result: true };
            } else if (p.command === 'mark-all-read') {
              this.rcmail().mark_all_read(sourceId);
              return { abort: true, result: true };
            }
          }
        },
        ...finalEvents,
      },
    );

    for (const element of document.querySelectorAll(el)) {
      element.addEventListener('click', (e) => {
        BridgeEvents.Instance.onFolderClick(e);
      });

      element.addEventListener('contextmenu', (e) => {
        BridgeEvents.Instance.onFolderContextMenu2(folderMenu, e);
      });
    }
  }
}
