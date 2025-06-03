import {
  BnumHtmlIcon,
  EWebComponentMode,
  HtmlCustomDataTag,
} from '../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/js_html_base_web_elements.js';
import {
  Roundrive,
  RoundriveFile,
  RoundriveFolder,
} from '../../../roundrive/roundrive_module.js';
import { EMPTY_STRING } from '../../../mel_metapage/js/lib/constants/constants.js';
import { BootstrapLoader } from '../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/bootstrap-loader.js';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { FramesManager } from '../../../mel_metapage/js/lib/classes/frame_manager.js';
import { BnumMessage } from '../../../mel_metapage/js/lib/classes/bnum_message.js';
import { HTMLButtonGroup } from '../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/HTMLButtonGroup.js';
import { WorkspaceObject } from '../../../mel_workspace/js/lib/program/WorkspaceObject.js';
import { NavBarManager } from '../../../mel_workspace/js/lib/program/navbar.generator.js';
import { BnumPromise } from '../../../mel_metapage/js/lib/BnumPromise.js';
import { MelEnumerable } from '../../../mel_metapage/js/lib/classes/enum.js';
import { HTMLAlternateDropDownElement } from '../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/dropdown/HTMLDropDownElement.js';
import HTMLBnumButton from '../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/button/HTMLBnumButton.js';
import { BnumConnector } from '../../../mel_metapage/js/lib/helpers/bnum_connections/bnum_connections.js';
import { NcWspConnectors } from './connectors.js';

const ENABLE_DIRECT_SELECT = false;

/**
 * Classe représentant le module Nextcloud.
 * Cette classe gère l'intégration de Nextcloud dans l'espace de travail.
 * @class
 * @extends WorkspaceObject
 */
class NextcloudModule extends WorkspaceObject {
  /**
   * Constructeur de la classe NextcloudModule.
   * Initialise le module et configure les événements nécessaires.
   */
  constructor() {
    super();

    if (!this.loaded && !this.isDisabled('stockage')) {
      let loader = BootstrapLoader.Create({ mode: 'block', center: true });
      this.dropdown.disable();

      let contents = this.moduleContainer.querySelector(
        '.module-block-content',
      );
      contents.style.position = 'relative';
      contents.appendChild(loader);
      contents = null;

      window.addEventListener(
        'load',
        function (ld) {
          this._main(ld);
        }.bind(this, loader),
      );

      loader = null;
    } else {
      this.hideBlock(this.moduleContainer);
    }
  }

  /**
   * Retourne le conteneur du module Nextcloud.
   * @type {WorkspaceModuleBlock}
   * @readonly
   */
  get moduleContainer() {
    return document.querySelector('#module-nc');
  }

  /**
   * Retourne le dropdown associé au module.
   * @type {HTMLAlternateDropDownElement}
   * @readonly
   */
  get dropdown() {
    return this.moduleContainer.querySelector(HTMLAlternateDropDownElement.TAG);
  }

  /**
   * Retourne la date de création de l'espace de travail.
   * @type {external:Moment}
   * @readonly
   */
  get createdDate() {
    if (this.get_env('current_workspace_nc_start'))
      return moment(this.get_env('current_workspace_nc_start'));
    else return this.workspace.created;
  }

  /**
   * Retourne la clé de stockage utilisée pour sauvegarder l'état du module.
   * @type {string}
   * @readonly
   */
  get storageKey() {
    return `nc_join_${this.workspace.uid}`;
  }

  /**
   * Méthode principale du module.
   * Initialise les composants et configure les événements.
   * @override
   */
  main() {
    super.main();

    BnumPromise.Start(async () => {
      await NavBarManager.WaitLoading();
      // Ajouter le listener pour le plein écran
      await this._p_set_full_screen_listener(
        'stockage',
        document.getElementById('module-nc'),
        $(NavBarManager.currentNavBar.mainDiv).find(
          '[data-task="stockage"] .visibility-icon',
        ),
        {
          onSetFullScreen: () => {
            document.querySelector('#module-nc .see-all').innerCustomText =
              this.gettext('open_documents', 'mel_nextcloud');
          },
          onUnsetFullScreen: () => {
            document.querySelector('#module-nc .see-all').innerCustomText =
              this.gettext('see_all', 'mel_workspace');
          },
        },
      );
      NavBarManager.currentNavBar.onstatetoggle.push(async (...args) => {
        const [task, state, caller] = args;
        const loading = BnumMessage.DisplayMessage(
          this.gettext('loading'),
          'loading',
        );
        let $caller = $(caller);
        $caller.addClass('disabled').attr('disabled', 'disabled');

        if (task === 'stockage') {
          await this.switchState(task, state.newState, this.moduleContainer);

          if (!state.newState && !this.loaded) {
            let contents = this.moduleContainer.querySelector(
              '.module-block-content',
            );
            contents.style.position = 'relative';
            contents = null;
            //this.showBlock(this.moduleContainer);
            await this._main();
          }
        }

        $caller.removeClass('disabled').removeAttr('disabled');
        this.rcmail().hide_message(loading);
      });
    });

    this.moduleContainer
      .querySelector('.see-all')
      .addEventListener('click', async () => {
        const url = `${Nextcloud.index_url}/apps/files?dir=/dossiers-${this.workspace.uid}`;

        await FramesManager.Instance.switch_frame('stockage', {
          args: FramesManager.Instance.has_frame('stockage')
            ? null
            : { _param: url },
        });

        let nextCloudFrame = FramesManager.Instance.get_frame('stockage', {
          jquery: false,
        }).contentWindow.document.getElementById('mel_nextcloud_frame');

        if (
          !nextCloudFrame.contentWindow.location.href.includes(
            `dossiers-${this.workspace.uid}`,
          )
        ) {
          nextCloudFrame.src = url;
        }

        nextCloudFrame = null;
      });
  }

  /**
   * Méthode principale asynchrone du module.
   * Charge les données et configure les éléments visuels.
   * @param {?BootstrapLoader} loader Loader pré-existant.
   */
  async _main(loader = null) {
    var continueExec = true;
    this.loadModule();
    this.#_setupDropDown();

    if (loader) {
      loader.remove();
      loader = null;
    }

    this.dropdown.disable();
    loader = BootstrapLoader.Create({ mode: 'block', center: true });
    const folder = `/dossiers-${this.workspace.uid}`;
    let roundrive = new Roundrive(folder);
    let contents = this.moduleContainer.querySelector('.module-block-content');

    contents.setAttribute('tabindex', '0');
    contents.style.position = 'relative';
    contents.appendChild(loader);
    this.moduleContainer.disableRefreshButton();
    this.moduleContainer.style.display = EMPTY_STRING;

    // Ajout d'un événement personnalisé pour rafraîchir le module
    this.moduleContainer.addEventListener('event:custom:refresh', async () => {
      const id = BnumMessage.DisplayLoadingMessage();
      await this.action_on_refresh();
      BnumMessage.ClearMessage(id);
    });

    this.on_refresh(this.action_on_refresh.bind(this));

    try {
      await roundrive.load();
      this.unload(this.storageKey);
    } catch (error) {
      this._on_error();
      continueExec = false;
    }

    if (continueExec) {
      continueExec = false;
      /**
       * Parcours des éléments chargés depuis Roundrive.
       * On ignore les fichiers ou dossiers cachés (nom commençant par un point).
       */
      for (const element of roundrive) {
        if (
          element.data.name.filename !== EMPTY_STRING &&
          element.data.name.filename[0] !== '.'
        ) {
          if (loader) {
            this.moduleContainer.enableRefreshButton();
            loader.remove();
            loader = null;
          }
          contents.appendChild(NextcloudModule.CreateRoundriveTag(element));

          if (!continueExec) continueExec = true;
        }
      }

      // Si aucun document n'est trouvé, afficher un message d'information
      if (!continueExec) {
        contents.appendChild(
          $('<p>Aucun document...</p>').css({
            'margin-top': '5px',
          })[0],
        );
      }
    }

    continueExec = null;

    if (loader) {
      this.moduleContainer.enableRefreshButton();
      loader.remove();
      loader = null;
    }

    this.dropdown.enable();

    roundrive = null;
    contents = null;
  }

  /**
   * Configure le dropdown pour gérer les différentes vues (favoris, corbeille, etc.).
   * @private
   */
  #_setupDropDown() {
    this.dropdown.addEventListener('custom:event:change', (e) => {
      const { value } = e.detail;

      this.moduleContainer.content.style.display = 'none';
      this.moduleContainer
        .querySelectorAll('.module-block-content-alt')
        .forEach((altContentItem) => {
          altContentItem.style.display = 'none';
        });

      switch (value) {
        case 'favorites':
          this.#_panelAction('module-block-favorite', this.#_loadFavorites());
          break;

        case 'trash':
          this.#_panelAction('module-block-trash', this.#_loadTrashes());
          break;

        default:
          this.moduleContainer.content.style.display = null;
          $(this.moduleContainer.content).focus();
          break;
      }
    });
  }

  /**
   * Gère l'affichage d'un panneau spécifique (favoris, corbeille, etc.).
   * @param {string} itemClass Classe CSS de l'élément à afficher.
   * @param {AsyncGenerator} elements Générateur des éléments à afficher.
   * @private
   */
  async #_panelAction(itemClass, elements) {
    const selector = `.${itemClass}`;

    let pan = this.moduleContainer.querySelector(selector);

    if (pan) {
      // Si le panneau existe déjà, on le rend visible
      pan.style.display = null;
      $(pan).focus();
    } else {
      this.dropdown.disable();
      this.moduleContainer.disableRefreshButton();

      // Création d'un nouveau panneau avec un loader
      pan = document.createElement('div');
      pan.classList.add(itemClass, 'module-block-content-alt');
      pan.appendChild(BootstrapLoader.Create({ mode: 'block', center: true }));
      pan.setAttribute('tabindex', '0');

      this.moduleContainer.appendChild(pan);
      await this.#_appendElements(pan, elements);

      // Suppression du loader une fois les éléments chargés
      pan.querySelector(BootstrapLoader.TAG).remove();

      this.dropdown.enable();
      this.moduleContainer.enableRefreshButton();

      $(pan).focus();
    }

    pan = null;
  }

  /**
   * Charge des données additionnelles depuis un connecteur.
   * @param {string} connector Nom du connecteur à utiliser.
   * @param {Object} [options={}] Options pour le chargement des données.
   * @param {?string} [options.variableToAdd=null] Nom de la variable à ajouter aux données.
   * @param {?any} [options.variableValue=null] Valeur de la variable à ajouter.
   * @param {?AsyncGenerator} [options.additionnalGenerator=null] Générateur additionnel.
   * @returns {AsyncGenerator<RoundriveFile | RoundriveFolder>}
   * @private
   */
  async *#_loadAdditionnalData(
    connector,
    {
      variableToAdd = null,
      variableValue = null,
      additionnalGenerator = null,
    } = {},
  ) {
    const response = await BnumConnector.connect(connector, {
      params: { _directory: 'dossiers-' + this.workspace.uid },
    });

    // Les données peuvent être retournées sous forme de chaîne JSON ou d'objet
    let items =
      typeof response.datas === 'string'
        ? JSON.parse(response.datas)
        : response.datas;

    if (items) {
      // Transformation des données en objets RoundriveFile ou RoundriveFolder
      yield* MelEnumerable.from(items).select((x) => {
        if (variableToAdd) x[variableToAdd] = variableValue;
        return x.type === 'dir' ? new RoundriveFolder(x) : new RoundriveFile(x);
      });
    }

    // Ajout des données supplémentaires si un générateur additionnel est fourni
    if (additionnalGenerator) yield* additionnalGenerator;
  }

  /**
   * Ajoute des éléments à un conteneur HTML.
   * @param {HTMLElement} parentElement Élément parent auquel ajouter les éléments.
   * @param {AsyncGenerator<RoundriveFile | RoundriveFolder>} elements Générateur des éléments à ajouter.
   * @returns {Promise<HTMLElement>}
   * @private
   */
  async #_appendElements(parentElement, elements) {
    for await (const element of elements) {
      parentElement.appendChild(NextcloudModule.CreateRoundriveTag(element));
    }

    return parentElement;
  }

  /**
   * Charge les éléments favoris.
   * @returns {AsyncGenerator<RoundriveFile | RoundriveFolder>}
   * @private
   */
  async *#_loadFavorites() {
    yield* this.#_loadAdditionnalData(NcWspConnectors.favorites, {
      variableToAdd: 'favorite',
      variableValue: true,
    });
  }

  /**
   * Charge les éléments de la corbeille.
   * @returns {AsyncGenerator<RoundriveFile | RoundriveFolder>}
   * @private
   */
  async *#_loadTrashes() {
    yield* this.#_loadAdditionnalData(NcWspConnectors.trashes, {
      variableToAdd: 'trash',
      variableValue: true,
    });
  }

  /**
   * Tente de rafraîchir les éléments d'une vue spécifique.
   * @param {string} value Valeur de la vue à rafraîchir.
   * @param {HTMLElement} contents Conteneur des éléments.
   * @param {AsyncGenerator<RoundriveFile | RoundriveFolder>} elements Générateur des éléments à rafraîchir.
   * @returns {Promise<void>}
   * @private
   */
  async #_tryRefresh(value, contents, elements) {
    if (this.dropdown.value === value) {
      await this.#_appendElements($(contents).html(EMPTY_STRING)[0], elements);
      contents.querySelector(BootstrapLoader.TAG)?.remove?.();
    } else if (contents) contents.remove();
  }

  /**
   * Rafraîchit le module en rechargeant les données.
   * @returns {Promise<void>}
   */
  async action_on_refresh() {
    this.moduleContainer.disableRefreshButton();
    this.dropdown.disable();
    const folder = `/dossiers-${this.workspace.uid}`;
    let drive = new Roundrive(folder);

    try {
      const otherContentsPromises = [
        this.#_tryRefresh(
          'favorites',
          this.moduleContainer.querySelector('.module-block-favorite'),
          this.#_loadFavorites(),
        ),
        this.#_tryRefresh(
          'trash',
          this.moduleContainer.querySelector('.module-block-trash'),
          this.#_loadTrashes(),
        ),
      ];
      await drive.load();
      this.unload(this.storageKey);

      let documents = document.createElement('div');
      for (const element of drive) {
        if (
          element.data.name.filename !== EMPTY_STRING &&
          element.data.name.filename[0] !== '.'
        ) {
          documents.appendChild(NextcloudModule.CreateRoundriveTag(element));
        }
      }

      let contents = this.moduleContainer.querySelector(
        '.module-block-content',
      );
      $(contents).html($(documents).children());

      documents.remove();

      await Promise.allSettled(otherContentsPromises);

      contents = null;
      documents = null;
    } catch (error) {
      this._on_error();
    }

    this.moduleContainer.enableRefreshButton();
    this.dropdown.enable();
  }

  /**
   * Gère les erreurs de chargement.
   * Affiche un message d'erreur ou tente de recharger les données.
   * @private
   */
  _on_error() {
    let contents = this.moduleContainer.querySelector('.module-block-content');
    contents.innerHTML = EMPTY_STRING;
    if (this.createdDate.add(10, 'm') > moment()) {
      contents.appendChild($('<p>Création en cours....</p>')[0]);
    } else {
      if (this.load(this.storageKey, false)) {
        if (moment(this.load(this.storageKey)).add(10, 'm') > moment())
          contents.appendChild($('<p>Synchronisation en cours...</p>')[0]);
        else
          contents.appendChild(
            $(
              '<p>Impossible de charger les documents pour le moment...</p>',
            )[0],
          );
      } else {
        this.save(this.storageKey, moment());
        this._on_error();
      }
    }
  }

  /**
   * Crée un tag HTML pour un élément Roundrive.
   * @param {RoundriveFile | RoundriveFolder} element Élément Roundrive.
   * @returns {FolderTag | FileTag} Tag HTML correspondant.
   * @static
   */
  static CreateRoundriveTag(element) {
    let node;

    switch (element.data.type) {
      case Roundrive.EItemType.directory:
        node = document.createElement('bnum-folder');
        break;

      default:
        node = document.createElement('bnum-file');
        break;
    }

    node.setItemFileData(element);

    return node;
  }

  /**
   * Retourne un objet Workspace vide.
   * @type {WorkspaceObject}
   * @readonly
   * @static
   */
  static get EmptyWorkspaceObject() {
    return new WorkspaceObject();
  }

  /**
   * Retourne les données de l'espace de travail en cours.
   * @returns {WorkspaceObject}
   * @static
   */
  static Workspace() {
    return new WorkspaceObject().workspace;
  }

  /**
   * Démarre le module Nextcloud.
   * @returns {NextcloudModule} Instance de NextcloudModule.
   * @static
   */
  static Start() {
    return new NextcloudModule();
  }
}

/**
 * Classe de base pour les tags Nextcloud.
 * Fournit des fonctionnalités communes pour les éléments HTML personnalisés.
 * @class
 * @extends HtmlCustomDataTag
 */
class ABaseNextcloudTag extends HtmlCustomDataTag {
  #itemData = null;
  #id = null;

  /**
   * Constructeur de la classe ABaseNextcloudTag.
   * @param {Object} [options={}] Options pour le tag.
   * @param {EWebComponentMode} [options.mode=EWebComponentMode.div] Mode du composant web.
   */
  constructor({ mode = EWebComponentMode.div } = {}) {
    super({ mode });
  }

  /**
   * Retourne l'identifiant unique du tag.
   * @type {string}
   * @readonly
   */
  get tagId() {
    if (!this.#id) this.#id = this.generateId('nc');

    return this.#id;
  }

  /**
   * Retourne l'icône associée au tag.
   * @type {string}
   * @readonly
   */
  get icon() {
    let icon = this._p_get_data('icon') || false;

    if (!icon) {
      switch (this.itemData.data.type) {
        case Roundrive.EItemType.directory:
          icon = 'folder';
          break;

        default:
          if (this.itemData.data.mimetype) {
            if (this.itemData.data.mimetype.includes('image')) icon = 'image';
            else if (this.itemData.data.mimetype.includes('audio'))
              icon = 'audio_file';
            else if (this.itemData.data.mimetype.includes('video'))
              icon = 'video_file';
            else if (this.itemData.data.mimetype.includes('text')) {
              if (this.itemData.data.mimetype.includes('javascript'))
                icon = 'javascript';
              else if (this.itemData.data.mimetype.includes('html'))
                icon = 'html';
              else if (this.itemData.data.mimetype.includes('css'))
                icon = 'css';
              else if (this.itemData.data.mimetype.includes('php'))
                icon = 'php';
              else if (this.itemData.data.mimetype.includes('calendar'))
                icon = 'event';
              else icon = 'description';
            } else if (this.itemData.data.mimetype.includes('font'))
              icon = 'brand_family';
            else if (this.itemData.data.mimetype.includes('application')) {
              if (
                this.itemData.data.mimetype.includes(
                  'vnd.android.package-archive',
                )
              )
                icon = 'apk_document';
              else icon = 'draft';
            }
          }
          break;
      }

      if (icon) {
        this.data('icon', icon);
        icon = this.icon;
      }
    }

    return icon || 'unknown_document';
  }

  /**
   * Retourne le nom complet du fichier ou dossier.
   * @type {string}
   * @readonly
   */
  get filename() {
    return this.itemData.data.name.fullname;
  }

  /**
   * Retourne l'élément HTML de l'icône.
   * @type {HTMLElement}
   * @readonly
   */
  get elementIcon() {
    return this.querySelector(`#icon-${this.tagId}`);
  }

  /**
   * Données associées à l'élément (fichier ou dossier).
   * @type {RoundriveFile | RoundriveFolder}
   * @readonly
   */
  get itemData() {
    return this.#itemData ?? { data: {} };
  }

  /**
   * Retourne le conteneur principal du tag.
   * @type {HTMLElement}
   * @readonly
   */
  get mainContainer() {
    return this.querySelector(`#nc-container-${this.tagId}`);
  }

  /**
   * Méthode principale pour initialiser le tag.
   * @protected
   */
  _p_main() {
    super._p_main();

    this.setAttribute('nextcloud', this.itemData.data.uid);

    let icon = document.createElement('bnum-icon');
    icon.setAttribute('data-icon', this.icon);
    icon.setAttribute('id', `icon-${this.tagId}`);
    icon.classList.add('nc-icon');

    let title = document.createElement('span');
    title.appendChild(this.createText(this.filename));

    let container =
      this._p_create_container() || document.createElement('span');
    container.append(...this._p_append_to_container(icon, title));
    container.classList.add('nc-container');
    container.setAttribute('id', `nc-container-${this.tagId}`);

    this.appendChild(container);

    icon = null;
    title = null;
    container = null;
  }

  /**
   * Crée un conteneur HTML pour le tag.
   * Peut être surchargée par les classes dérivées.
   * @protected
   * @returns {?HTMLElement} Conteneur HTML.
   */
  _p_create_container() {
    return null;
  }

  /**
   * Ajoute des éléments au conteneur HTML.
   * Peut être surchargée par les classes dérivées.
   * @protected
   * @param {...HTMLElement} items Éléments à ajouter.
   * @returns {HTMLElement[]} Liste des éléments ajoutés.
   */
  _p_append_to_container(...items) {
    return items;
  }

  /**
   * Définit les données associées à l'élément.
   * @param {RoundriveFile | RoundriveFolder} data Données de l'élément.
   * @returns {boolean} Indique si les données ont été définies avec succès.
   */
  setItemFileData(data) {
    if (!this.#itemData) {
      this.#itemData = data;
      return true;
    }

    return false;
  }
}

/**
 * Classe pour les tags Nextcloud avec des actions.
 * Étend ABaseNextcloudTag pour ajouter des boutons d'action.
 * @class
 * @extends ABaseNextcloudTag
 */
class AActionNextcloudTag extends ABaseNextcloudTag {
  /**
   * Constructeur de la classe AActionNextcloudTag.
   * @param {Object} [options={}] Options pour le tag.
   * @param {EWebComponentMode} [options.mode=EWebComponentMode.div] Mode du composant web.
   */
  constructor({ mode = EWebComponentMode.div } = {}) {
    super({ mode });
  }

  /**
   * Méthode principale pour initialiser le tag.
   * Ajoute un bouton d'action.
   * @protected
   */
  _p_main() {
    super._p_main();

    let button = this._p_create_button(document.createElement('button'));
    this.appendChild(button);

    button = null;
  }

  /**
   * Crée un conteneur HTML pour le tag.
   * Peut être surchargée par les classes dérivées.
   * @protected
   * @returns {?HTMLElement} Conteneur HTML.
   */
  _p_create_container() {
    return super._p_create_container();
  }

  /**
   * Crée un bouton HTML pour le tag.
   * Peut être surchargée par les classes dérivées.
   * @protected
   * @param {HTMLButtonElement} button Bouton HTML à personnaliser.
   * @returns {HTMLButtonElement} Bouton personnalisé.
   */
  _p_create_button(button) {
    return button;
  }
}

/**
 * Classe représentant un dossier dans Nextcloud.
 * Permet d'afficher et de gérer les dossiers.
 * @class
 * @extends ABaseNextcloudTag
 */
class FolderTag extends ABaseNextcloudTag {
  #state = FolderTag.EState.close;
  #loaded = false;
  #container = null;

  /**
   * Constructeur de la classe FolderTag.
   */
  constructor() {
    super();
  }

  /**
   * Retourne l'état actuel du dossier (ouvert ou fermé).
   * @type {Symbol}
   * @readonly
   */
  get state() {
    return this.#state;
  }

  /**
   * Indique si le dossier est ouvert.
   * @type {boolean}
   * @readonly
   */
  get isOpen() {
    return this.state === FolderTag.EState.open;
  }

  /**
   * Retourne l'icône de droite associée au dossier.
   * @type {HTMLElement}
   * @readonly
   */
  get rightIcon() {
    return this.querySelector(`#folder-right-icon-${this.tagId}`);
  }

  /**
   * Méthode principale pour initialiser le tag.
   * Configure les événements et les icônes.
   * @protected
   */
  _p_main() {
    super._p_main();

    this.mainContainer.setAttribute(
      'title',
      `Ouvrir le dossier "${this.filename}"`,
    );

    let icon = document.createElement('bnum-icon');
    icon.setAttribute('data-icon', 'chevron_right');
    icon.setAttribute('id', `folder-right-icon-${this.tagId}`);

    this.mainContainer.appendChild(icon);

    icon = null;
  }

  /**
   * Crée un conteneur HTML pour le dossier.
   * @protected
   * @returns {HTMLElement} Conteneur HTML.
   */
  _p_create_container() {
    /**
     * @type {PressedButton}
     */
    let container = document.createElement('bnum-pressed-button');
    container.classList.add(
      'mel-button',
      'no-margin-button',
      'no-button-margin',
      'bckg',
      'true',
    );

    container.ontoggle.push(this.#_on_pressed.bind(this));

    return container;
  }

  /**
   * Ajoute des éléments au conteneur HTML.
   * @protected
   * @param {...HTMLElement} args Éléments à ajouter.
   * @returns {HTMLElement[]} Liste des éléments ajoutés.
   */
  _p_append_to_container(...args) {
    let container = document.createElement('div');
    container.append(...super._p_append_to_container(...args));

    container.classList.add('nc-left-container');

    return [container];
  }

  /**
   * Créer un élément li et ajoute les nœuds spécifiés.
   * @param  {...HTMLElement} nodes
   * @returns {HTMLLIElement}
   */
  #_li(...nodes) {
    let li = document.createElement('li');
    li.append(...nodes);

    return li;
  }

  /**
   * Gère l'événement de clic sur le dossier.
   * Charge les données si nécessaire.
   * @private
   * @param {boolean} state État du bouton.
   * @param {HTMLElement} caller Élément déclencheur.
   */
  async #_on_pressed(state, caller) {
    if (!this.#loaded) {
      try {
        await this._on_pressed_unloaded();
      } catch (error) {
        // En cas d'erreur, désactiver le bouton et afficher une icône d'erreur
        this._p_save_into_data('icon', 'folder_off');
        this.elementIcon.icon = this.icon;
        this.rightIcon.remove();
        $(caller).css('--disabled-mel-button-color', 'transparent');
        caller.style.color = 'var(--main-text-color)';
        caller.style.border = 'none';
        this.disable({ node: caller });
        this.removeAttribute('title');
        return null;
      }
    } else this._on_pressed_loaded();

    this.#_update_icon();
  }

  /**
   * Met à jour l'icône du dossier en fonction de son état.
   * @private
   */
  #_update_icon() {
    if (this.isOpen) {
      this._p_save_into_data('icon', 'folder_open');
      this.rightIcon.icon = 'keyboard_arrow_down';
    } else {
      this._p_save_into_data('icon', 'folder');
      this.rightIcon.icon = 'chevron_right';
    }

    this.elementIcon.icon = this.icon;
  }

  /**
   * Charge les données du dossier si elles ne sont pas encore chargées.
   * @protected
   * @returns {Promise<void>}
   */
  async _on_pressed_unloaded() {
    this.#state = FolderTag.EState.open;

    let container = document.createElement('ul');
    container.classList.add('ignore-bullet');

    let loader = BootstrapLoader.Create({ mode: 'block', center: false });

    this.appendChild(loader);

    const unload = rcmail.unload;
    rcmail.unload = true;
    try {
      await this.itemData.load();
    } catch (error) {
      if (loader) {
        loader.remove();
        loader = null;
      }

      container.remove();
      container = null;
      rcmail.unload = unload;
      this.#state = FolderTag.EState.close;
      throw error;
    }
    rcmail.unload = unload;

    let it = 0;
    let element;
    /**@type {RoundriveFile | RoundriveFolder} */
    let loaded;
    for (loaded of this.itemData) {
      if (
        loaded.data.name.filename !== EMPTY_STRING &&
        loaded.data.name.filename?.[0] !== '.'
      ) {
        switch (loaded.data.type) {
          case Roundrive.EItemType.directory:
            element = document.createElement('bnum-folder');
            break;

          default:
            element = document.createElement('bnum-file');
            break;
        }

        element.setItemFileData(loaded);
        element.classList.add('child-element');

        container.appendChild(this.#_li(element));

        element = null;

        ++it;
      }
    }

    if (loader) {
      loader.remove();
      loader = null;
    }

    this.appendChild(container);

    this.#container = container;
    this.#loaded = true;

    if (it === 0) throw new Error('No one was load');
  }

  /**
   * Gère l'affichage du dossier lorsqu'il est déjà chargé.
   * @protected
   */
  _on_pressed_loaded() {
    if (this.isOpen) {
      this.#container.style.display = 'none';
      this.#state = FolderTag.EState.close;
      this.mainContainer.setAttribute(
        'title',
        `Ouvrir le dossier "${this.filename}"`,
      );
    } else {
      this.#container.style.display = EMPTY_STRING;
      this.#state = FolderTag.EState.open;
      this.mainContainer.setAttribute(
        'title',
        `Fermer le dossier "${this.filename}"`,
      );
    }
  }
}

FolderTag.EState = {
  open: Symbol(),
  close: Symbol(),
};

{
  const TAG = 'bnum-folder';
  if (!customElements.get(TAG)) customElements.define(TAG, FolderTag);
}

/**
 * Classe représentant un fichier dans Nextcloud.
 * Permet d'afficher et de gérer les fichiers.
 * @class
 * @extends AActionNextcloudTag
 */
class FileTag extends AActionNextcloudTag {
  /**
   * Constructeur de la classe FileTag.
   */
  constructor() {
    super();
  }

  /**
   * Crée un conteneur HTML pour le fichier.
   * Configure les événements pour ouvrir le fichier.
   * @protected
   * @returns {HTMLElement} Conteneur HTML.
   */
  _p_create_container() {
    /**
     * @type {PressedButton}
     */
    let container = HTMLBnumButton.StartCreate.setNoBackgroundVariation()
      .setIconMargin(0)
      .setIconPos('right')
      .setSquare()
      .generate();
    container.setAttribute('title', `Ouvrir le fichier "${this.filename}"`);

    container.onclick = async () => {
      await FramesManager.Instance.switch_frame('stockage');
      FramesManager.Instance.get_frame('stockage', { jquery: false })
        .contentWindow.$('iframe')
        .attr(
          'src',
          `${MelObject.Empty().get_env('nextcloud_url')}/apps/files?dir=/${this.itemData.data.dirname}&openfile=${this.itemData.data.uid}`,
        );
    };

    return container;
  }

  /**
   * Ajoute des éléments au conteneur HTML.
   * @protected
   * @param {...HTMLElement} args Éléments à ajouter.
   * @returns {HTMLElement[]} Liste des éléments ajoutés.
   */
  _p_append_to_container(...args) {
    let container = document.createElement('div');
    container.append(...super._p_append_to_container(...args));

    container.classList.add('nc-left-container');
    container.style.display = 'flex';
    container.style.alignItems = 'center';

    return [container];
  }

  /**
   * Crée un bouton HTML pour le fichier.
   * Configure les actions associées au bouton.
   * @protected
   * @param {HTMLButtonElement} button Bouton HTML à personnaliser.
   * @returns {HTMLButtonElement} Bouton personnalisé.
   */
  _p_create_button(button) {
    const helper = MelObject.Empty();
    let itemsToAdd = [];
    button = super._p_create_button(button);

    button.classList.add(
      'mel-button',
      'no-margin-button',
      'no-button-margin',
      'bckg',
      'true',
    );

    button.setAttribute('title', 'Copier le lien interne du fichier');

    button.onclick = helper.copy_to_clipboard.bind(
      helper,
      helper.url('stockage', {
        action: 'index',
        params: {
          _params: `/apps/files?dir=/${this.itemData.data.dirname}&openfile=${this.itemData.data.uid}`,
        },
        removeIsFromIframe: true,
      }),
      { text: "L'url a été copié dans le presse papier !" },
    );

    let icon = document.createElement('bnum-icon');
    icon.icon = 'content_copy';

    button.appendChild(icon);

    button.style.borderRadius = '5px';

    itemsToAdd.push(button);

    if (ENABLE_DIRECT_SELECT) {
      /**
       * @type {HTMLButtonElement}
       */
      let other = button.cloneNode();
      other.textContent = EMPTY_STRING;
      other.appendChild(BnumHtmlIcon.Create({ icon: 'account_tree' }));
      other.setAttribute('title', "Ouvrir dans l'arborescence");
      other.onclick = () => {
        NextcloudModule.EmptyWorkspaceObject.switch_workspace_page(
          'stockage',
        ).then(() => {
          FramesManager.Instance.get_frame('stockage', { jquery: false })
            .contentWindow.$('iframe')
            .attr(
              'src',
              `${rcmail.env.nextcloud_url}/apps/files?dir=/${this.itemData.data.dirname}&fileid=${this.itemData.data.uid}`,
            );
        });
      };

      itemsToAdd = [other, ...itemsToAdd];
    }

    let group = HTMLButtonGroup.CreateNode([]);
    group.navigator.append(...itemsToAdd);

    group.onloaded.push((caller) => {
      caller.removeClass('btn-group-vertical').addClass('btn-group');
      caller.onloaded.clear();
    });

    return group;
  }
}

{
  const TAG = 'bnum-file';
  if (!customElements.get(TAG)) customElements.define(TAG, FileTag);
}
//https://mel.din.developpement-durable.gouv.fr/recette/?_task=stockage&_action=index&_params=dossiers-dev-du-bnum-1/Comment%20utiliser%20build_mel.sh%20%3f.txt&_is_from=iframe

NextcloudModule.Start();
