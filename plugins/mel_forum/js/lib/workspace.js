import { FramesManager } from '../../../mel_metapage/js/lib/classes/frame_manager.js';
import { NavBarManager } from '../../../mel_workspace/js/lib/navbar.generator.js';
import { WorkspaceModuleBlock } from '../../../mel_workspace/js/lib/WebComponents/workspace_module_block.js';
import { WorkspaceObject } from '../../../mel_workspace/js/lib/WorkspaceObject.js';
import { BnumMessage } from '../../../mel_metapage/js/lib/classes/bnum_message.js';
import { EMPTY_STRING } from '../../../mel_metapage/js/lib/constants/constants.js';
import { BootstrapLoader } from '../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/bootstrap-loader.js';

export class ModuleForum extends WorkspaceObject {
  constructor() {
    super();
  }

  /**
   * Id du block qui affiche le module
   * @type {string}
   * @default 'module-forum-last'
   * @readonly
   */
  get moduleId() {
    return 'module-forum-last';
  }

  /**
   * Id du loader
   * @type {string}
   * @default 'forum-news-spinner-loader'
   * @readonly
   */
  get loaderId() {
    return 'forum-news-spinner-loader';
  }

  /**
   * Block qui affiche le module
   * @type {WorkspaceModuleBlock}
   * @readonly
   */
  get block() {
    return document.querySelector(`#${this.moduleId}`);
  }

  /**
   * Loader qui est affiché lorsque la frame des forum se charge
   * @type {?BootstrapLoader}
   * @readonly
   */
  get loader() {
    return document.querySelector(`#${this.loaderId}`);
  }

  main() {
    super.main();

    // Vérifiez si le module est chargé ou désactivé
    if (!this.loaded && !this.isDisabled('forum')) {
      this._start();
    } else if (this.isDisabled('forum')) {
      this.block.style.display = 'none';
    }

    // Ajout de l'écouteur via addListener()
    this.addListener();
  }

  /**
   * Ajoute un écouteur pour gérer les changements d'état de la barre de navigation.
   *
   * - Attend que `NavBarManager` soit prêt avant de continuer.
   * - Ajoute une gestion asynchrone des changements d'état via `onstatetoggle`.
   * - Désactive et réactive l'élément déclencheur pendant le traitement.
   * - Gère les états spécifiques de la tâche "forum" et initialise le composant principal si nécessaire.
   *
   * @returns {Promise<void>} Une promesse résolue une fois que l'écouteur est ajouté et opérationnel.
   */
  async addListener() {
    // Attendre que NavBarManager soit prêt
    await NavBarManager.WaitLoading();

    // Ajouter un écouteur sur le changement d'état
    NavBarManager.currentNavBar.onstatetoggle.push(async (...args) => {
      const [task, state, caller] = args;

      const loading = BnumMessage.DisplayMessage(
        this.gettext('loading'),
        'loading',
      );

      // Désactiver l'élément déclencheur pendant le traitement
      $(caller).addClass('disabled').attr('disabled', 'disabled');

      if (task === 'forum') {
        // Gestion des états
        await this.switchState(task, state.newState, this.block);

        if (!state.newState && !this.loaded) {
          this._main();
        }
      }

      // Réactiver l'élément déclencheur
      $(caller).removeClass('disabled').removeAttr('disabled');
      rcmail.hide_message(loading);
    });
  }

  /**
   * Affiche un loader si il n'existe pas
   * @returns {BootstrapLoader} Loader créé ou éxistant
   * @private
   */
  _show_loader() {
    let loader = this.loader;

    if (!loader) {
      loader = BootstrapLoader.Create({ center: true });

      loader.setAttribute('id', this.loaderId);

      this.block.appendContent(loader);
    } else loader.style.display = EMPTY_STRING;

    return loader;
  }

  /**
   * Supprime le loader si il existe.
   * @returns {ModuleForum} Chaîne
   * @private
   */
  _remove_loader() {
    let loader = this.loader;

    if (loader) {
      this.loader.remove();
      loader = null;
    }

    return this;
  }

  /**
   * Appeler dans `main`, charge la frame seulement lorsque la page sera chargée.
   * @private
   */
  _start() {
    this._show_loader();
    window.addEventListener('load', () => {
      this._main();
    });
  }

  _main() {
    if (!this.loader) this._show_loader();

    this.block.style.display = EMPTY_STRING;
    this.block.content.style.overflow = 'hidden';
    this.block.content.style.position = 'relative';

    let iframe = this.block.setIframeFromTask('forum', {
      action: 'new_posts',
      args: {
        _uid: this.workspace.uid,
      },
    });

    iframe.onload = this._remove_loader.bind(this);

    this.loadModule();
  }

  /**
   * Lance le module
   * @returns {ModuleForum}
   * @static
   */
  static Start() {
    return new ModuleForum();
  }
}

ModuleForum.Start();
