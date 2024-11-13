import {
  EWebComponentMode,
  HtmlCustomDataTag,
} from '../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/js_html_base_web_elements.js';
import { WorkspaceObject } from '../../../mel_workspace/js/lib/WorkspaceObject.js';
import {
  Roundrive,
  RoundriveFile,
  RoundriveFolder,
} from '../../../roundrive/roundrive_module.js';
import { PressedButton } from '../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/pressed_button_web_element.js';
import { EMPTY_STRING } from '../../../mel_metapage/js/lib/constants/constants.js';
import { BootstrapLoader } from '../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/bootstrap-loader.js';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { NavBarManager } from '../../../mel_workspace/js/lib/navbar.generator.js';
import { FramesManager } from '../../../mel_metapage/js/lib/classes/frame_manager.js';
import { Mel_Promise } from '../../../mel_metapage/js/lib/mel_promise.js';
import {
  BnumMessage,
  eMessageType,
} from '../../../mel_metapage/js/lib/classes/bnum_message.js';

class NextcloudModule extends WorkspaceObject {
  constructor() {
    super();

    if (!this.loaded && !this.isDisabled('stockage')) {
      let loader = BootstrapLoader.Create({ mode: 'block', center: true });
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
    } else this.moduleContainer.style.display = 'none';
  }

  get moduleContainer() {
    return document.querySelector('#module-nc');
  }

  main() {
    super.main();

    NavBarManager.AddEventListener().OnAfterSwitch((args) => {
      const { task } = args;

      if (task === 'stockage') {
        FramesManager.Instance.get_frame('stockage')[0].contentWindow.$(
          '#mel_nextcloud_frame',
        )[0].src =
          `${Nextcloud.index_url}/apps/files?dir=/dossiers-${this.workspace.uid}`;
      }
    }, 'stockage');

    new Promise(async (ok, nok) => {
      await Mel_Promise.wait(() => !!NavBarManager.currentNavBar);
      NavBarManager.currentNavBar.onstatetoggle.push(async (...args) => {
        const [task, state, caller] = args;
        const loading = BnumMessage.DisplayMessage(
          this.gettext('loading'),
          'loading',
        );
        $(caller).addClass('disabled').attr('disabled', 'disabled');
        if (task === 'stockage') {
          await this.switchState(task, state.newState, this.moduleContainer);

          if (!state.newState && !this.loaded) {
            let contents = this.moduleContainer.querySelector(
              '.module-block-content',
            );
            contents.style.position = 'relative';
            contents = null;
            await this._main();
          }
        }
        $(caller).removeClass('disabled').removeAttr('disabled');
        rcmail.clear_message(loading);
      });
      ok();
    });
  }

  /**
   *
   * @param {?BootstrapLoader} loader
   */
  async _main(loader = null) {
    this.loadModule();

    if (loader) {
      loader.remove();
      loader = null;
    }

    loader = BootstrapLoader.Create({ mode: 'block', center: true });

    const folder = `/dossiers-${this.workspace.uid}`;
    let roundrive = new Roundrive(folder);
    let contents = this.moduleContainer.querySelector('.module-block-content');

    contents.style.position = 'relative';
    contents.appendChild(loader);

    this.moduleContainer.style.display = EMPTY_STRING;

    await roundrive.load();

    /**
     * @type {RoundriveFile | RoundriveFolder}
     */
    for (const element of roundrive) {
      if (
        element.data.name.filename !== EMPTY_STRING &&
        element.data.name.filename[0] !== '.'
      ) {
        if (loader) {
          loader.remove();
          loader = null;
        }

        contents.appendChild(NextcloudModule.CreateRoundriveTag(element));
      }
    }

    if (loader) {
      loader.remove();
      loader = null;
    }

    roundrive = null;
    contents = null;
  }

  load() {
    super.load();

    this._main();
  }

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

  static Workspace() {
    return new WorkspaceObject().workspace;
  }

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
    } else {
      this.#container.style.display = EMPTY_STRING;
      this.#state = FolderTag.EState.open;
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

  _p_create_button(button) {
    const helper = MelObject.Empty();
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
    );

    let icon = document.createElement('bnum-icon');
    icon.icon = 'content_copy';

    button.appendChild(icon);

    button.style.borderRadius = '5px';

    return button;
  }
}

{
  const TAG = 'bnum-file';
  if (!customElements.get(TAG)) customElements.define(TAG, FileTag);
}
//https://mel.din.developpement-durable.gouv.fr/recette/?_task=stockage&_action=index&_params=dossiers-dev-du-bnum-1/Comment%20utiliser%20build_mel.sh%20%3f.txt&_is_from=iframe

NextcloudModule.Start();
