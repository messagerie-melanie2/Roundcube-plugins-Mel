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
import { PressedButton } from '../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/pressed_button_web_element.js';
import { EMPTY_STRING } from '../../../mel_metapage/js/lib/constants/constants.js';
import { BootstrapLoader } from '../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/bootstrap-loader.js';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';

import { FramesManager } from '../../../mel_metapage/js/lib/classes/frame_manager.js';
import { BnumMessage } from '../../../mel_metapage/js/lib/classes/bnum_message.js';
import { HTMLMelButton } from '../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/HTMLMelButton.js';
import { HTMLButtonGroup } from '../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/HTMLButtonGroup.js';
import { WorkspaceModuleBlock } from '../../../mel_workspace/js/lib/WebComponents/workspace_module_block.js';
import { WorkspaceObject } from '../../../mel_workspace/js/lib/program/WorkspaceObject.js';
import { NavBarManager } from '../../../mel_workspace/js/lib/program/navbar.generator.js';
import { BnumPromise } from '../../../mel_metapage/js/lib/BnumPromise.js';
import { MelEnumerable } from '../../../mel_metapage/js/lib/classes/enum.js';
import { HTMLAlternateDropDownElement } from '../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/dropdown/HTMLDropDownElement.js';
import HTMLBnumButton from '../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/button/HTMLBnumButton.js';

const ENABLE_DIRECT_SELECT = false;

/**
 * Classe représentant le module Nextcloud.
 * @class
 * @extends WorkspaceObject
 */
class NextcloudModule extends WorkspaceObject {
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
   * Retourne le conteneur du module.
   * @type {WorkspaceModuleBlock}
   * @readonly
   */
  get moduleContainer() {
    return document.querySelector('#module-nc');
  }

  /**
   * Retourne le dropdown du module.
   * @type {HTMLAlternateDropDownElement}
   * @readonly
   */
  get dropdown() {
    return this.moduleContainer.querySelector(HTMLAlternateDropDownElement.TAG);
  }

  /**
   * Retourne la date de création du workspace.
   * @type {external:Moment}
   * @readonly
   */
  get createdDate() {
    if (this.get_env('current_workspace_nc_start'))
      return moment(this.get_env('current_workspace_nc_start'));
    else return this.workspace.created;
  }

  /**
   * @type {string}
   * @readonly
   */
  get storageKey() {
    return `nc_join_${this.workspace.uid}`;
  }

  /**
   * Méthode principale du module.
   * @override
   */
  main() {
    super.main();

    NavBarManager.AddEventListener().OnAfterSwitch((args) => {
      const { task } = args;
      let nextCloudFrame = FramesManager.Instance.get_frame('stockage', {
        jquery: false,
      }).contentWindow.document.getElementById('mel_nextcloud_frame');

      if (
        task === 'stockage' && // Si il s'agit de la tâche de stockage
        (!FramesManager.Instance.has_frame('stockage') || // Si la frame n'éxiste pas ou
          // Si l'id dans l'url n'est pas le bon
          !nextCloudFrame.contentWindow.location.href.includes(
            `dossiers-${this.workspace.uid}`,
          ))
      ) {
        nextCloudFrame.src = `${Nextcloud.index_url}/apps/files?dir=/dossiers-${this.workspace.uid}`;
      }
    }, 'stockage');

    BnumPromise.Start(async () => {
      await NavBarManager.WaitLoading();
      // Ajouter le listener pour le plein écran
      await this._p_set_full_screen_listener(
        'stockage',
        document.getElementById('module-nc'),
        $(NavBarManager.currentNavBar.mainDiv).find(
          '[data-task="stockage"] .visibility-icon',
        ),
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
  }

  /**
   * Méthode principale asynchrone du module.
   * @param {?BootstrapLoader} loader Loader pré-éxistant
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
    this.moduleContainer.addEventListener('event:custom:refresh', async () => {
      const id = BnumMessage.DisplayLoadingMessage();
      await this._on_refresh();
      BnumMessage.ClearMessage(id);
    });

    this.on_refresh(this._on_refresh.bind(this));

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
       * @type {RoundriveFile | RoundriveFolder}
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
   * Configure le dropdown.
   * @private
   */
  #_setupDropDown() {
    this.dropdown.addEventListener('custom:event:change', (e) => {
      const { value } = e.detail;

      let pan = this.moduleContainer.querySelector('.module-block-favorite');
      switch (value) {
        case 'favorites':
          this.moduleContainer.content.style.display = 'none';
          if (pan) {
            pan.style.display = null;
            $(pan).focus();
          } else {
            this.dropdown.disable();
            this.moduleContainer.disableRefreshButton();
            pan = document.createElement('div');
            pan.classList.add(
              'module-block-favorite',
              'module-block-content-alt',
            );
            pan.appendChild(
              BootstrapLoader.Create({ mode: 'block', center: true }),
            );
            pan.setAttribute('tabindex', '0');
            this.moduleContainer.appendChild(pan);
            this.#_appendFavorites(pan).then(() => {
              pan.querySelector(BootstrapLoader.TAG).remove();
              this.dropdown.enable();
              this.moduleContainer.enableRefreshButton();
              $(pan).focus();
            });
          }

          break;

        default:
          this.moduleContainer.content.style.display = null;
          $(this.moduleContainer.content).focus();
          if (pan) pan.style.display = 'none';
          break;
      }
    });
  }

  /**
   * Charge les favoris.
   * @param {?Generator<RoundriveFile | RoundriveFolder, void, RoundriveFile | RoundriveFolder>} additionnalGenerator
   * @returns {AsyncGenerator<RoundriveFile | RoundriveFolder, void, RoundriveFile | RoundriveFolder>}
   * @async
   */
  async *#_loadFavorites(additionnalGenerator = null) {
    let favorites;
    await this.http_internal_post({
      task: 'roundrive',
      action: 'get_favorites',
      params: {
        _directory: 'dossiers-' + this.workspace.uid,
      },
      on_success(response) {
        if (typeof response === 'string') response = JSON.parse(response);
        favorites = response;
      },
    });

    if (favorites) {
      yield* MelEnumerable.from(favorites).select((x) => {
        x.favorite = true;
        return x.type === 'dir' ? new RoundriveFolder(x) : new RoundriveFile(x);
      });
    }

    if (additionnalGenerator) yield* additionnalGenerator;
  }

  /**
   * Ajoute les éléments favoris à un élément
   * @param {T} parentElement
   * @returns {Promise<T>}
   * @private
   * @template {HTMLElement} T
   */
  async #_appendFavorites(parentElement) {
    for await (const element of this.#_loadFavorites()) {
      parentElement.appendChild(NextcloudModule.CreateRoundriveTag(element));
    }

    return parentElement;
  }

  /**
   * Tente de rafraîchir les éléments favoris.
   *
   * Si le dropdown est sur "favorites", recharge les favoris et les ajoute au conteneur.
   *
   * Sinon, supprime le conteneur des favoris s'il existe.
   *
   * @private
   * @async
   * @returns {Promise<void>}
   */
  async #_tryRefreshFavorites() {
    let contents = this.moduleContainer.querySelector('.module-block-favorite');

    if (this.dropdown.value === 'favorites') {
      await this.#_appendFavorites($(contents).html(EMPTY_STRING)[0]);
      contents.querySelector(BootstrapLoader.TAG)?.remove?.();
    } else if (contents) contents.remove();
  }

  /**
   * Rafraîchit le module.
   * @returns {Promise<void>}
   */
  async _on_refresh() {
    this.moduleContainer.disableRefreshButton();
    this.dropdown.disable();
    const folder = `/dossiers-${this.workspace.uid}`;
    let drive = new Roundrive(folder);

    try {
      let favoritePromise = this.#_tryRefreshFavorites();
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

      await favoritePromise;

      favoritePromise = null;
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
   * Crée un tag Roundrive.
   * @param {RoundriveFile | RoundriveFolder} element - L'élément Roundrive.
   * @returns {FolderTag | FileTag} Le tag créé.
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
   * Retourne les données de l'espace en cours
   * @returns {WorkspaceObject}
   * @static
   */
  static Workspace() {
    return new WorkspaceObject().workspace;
  }

  /**
   * Démarre le module Nextcloud.
   * @returns {NextcloudModule} Une instance de NextcloudModule.
   */
  static Start() {
    return new NextcloudModule();
  }
}

class ABaseNextcloudTag extends HtmlCustomDataTag {
  #itemData = null;
  #id = null;
  constructor({ mode = EWebComponentMode.div } = {}) {
    super({ mode });
  }

  get tagId() {
    if (!this.#id) this.#id = this.generateId('nc');

    return this.#id;
  }

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

  get filename() {
    return this.itemData.data.name.fullname;
  }

  get elementIcon() {
    return this.querySelector(`#icon-${this.tagId}`);
  }

  /**
   * @type {RoundriveFile | RoundriveFolder}
   */
  get itemData() {
    return this.#itemData ?? { data: {} };
  }

  get mainContainer() {
    return this.querySelector(`#nc-container-${this.tagId}`);
  }

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

  _p_create_container() {
    return null;
  }

  _p_append_to_container(...items) {
    return items;
  }

  setItemFileData(data) {
    if (!this.#itemData) {
      this.#itemData = data;
      return true;
    }

    return false;
  }
}

class AActionNextcloudTag extends ABaseNextcloudTag {
  constructor({ mode = EWebComponentMode.div } = {}) {
    super({ mode });
  }

  _p_main() {
    super._p_main();

    let button = this._p_create_button(document.createElement('button'));
    this.appendChild(button);

    button = null;
  }

  _p_create_container() {
    return super._p_create_container();
  }

  _p_create_button(button) {
    return button;
  }
}

class FolderTag extends ABaseNextcloudTag {
  #state = FolderTag.EState.close;
  #loaded = false;
  #container = null;
  constructor() {
    super();
  }

  get state() {
    return this.#state;
  }

  get isOpen() {
    return this.state === FolderTag.EState.open;
  }

  get rightIcon() {
    return this.querySelector(`#folder-right-icon-${this.tagId}`);
  }

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

  _p_append_to_container(...args) {
    let container = document.createElement('div');
    container.append(...super._p_append_to_container(...args));

    container.classList.add('nc-left-container');

    return [container];
  }

  #_li(...nodes) {
    let li = document.createElement('li');
    li.append(...nodes);

    return li;
  }

  async #_on_pressed(state, caller) {
    if (!this.#loaded) {
      try {
        await this._on_pressed_unloaded();
      } catch (error) {
        this._p_save_into_data('icon', 'folder_off');
        this.elementIcon.icon = this.icon;
        this.rightIcon.remove();
        /**
         * background-color: transparent !important;
color: var(--main-text-color);
border: none;
         */
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

class FileTag extends AActionNextcloudTag {
  constructor() {
    super();
  }

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

  _p_append_to_container(...args) {
    let container = document.createElement('div');
    container.append(...super._p_append_to_container(...args));

    container.classList.add('nc-left-container');
    container.style.display = 'flex';
    container.style.alignItems = 'center';

    return [container];
  }

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
