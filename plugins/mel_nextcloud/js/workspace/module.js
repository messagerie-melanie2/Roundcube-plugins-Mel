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
import { MelEnumerable } from '../../../mel_metapage/js/lib/classes/enum.js';
import { Random } from '../../../mel_metapage/js/lib/classes/random.js';

export class NextcloudModule extends WorkspaceObject {
  constructor() {
    super();
  }

  get moduleContainer() {
    return document.querySelector('#module-nc');
  }

  main() {
    super.main();
    this._main();
  }

  async _main() {
    const folder = `/dossiers-${this.workspace.uid}`;
    let roundrive = new Roundrive(folder);
    await roundrive.load();

    /**
     * @type {RoundriveFile | RoundriveFolder}
     */
    for (const element of roundrive) {
      if (
        element.data.name.filename !== EMPTY_STRING &&
        element.data.name.filename[0] !== '.'
      ) {
        this.moduleContainer.appendChild(
          NextcloudModule.CreateRoundriveTag(element),
        );
      }
    }

    roundrive = null;
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
}

class ABaseNextcloudTag extends HtmlCustomDataTag {
  #itemData = null;
  #id = null;
  constructor({ mode = EWebComponentMode.div } = {}) {
    super({ mode });
  }

  get tagId() {
    if (!this.#id)
      this.#id =
        this.#id = `nc-${Random.random_string(Random.intRange(1, 10))}`;

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

  _p_main() {
    super._p_main();

    let icon = document.createElement('bnum-icon');
    icon.setAttribute('data-icon', this.icon);
    icon.setAttribute('id', `icon-${this.tagId}`);

    let title = document.createElement('span');
    title.appendChild(this.createText(this.filename));

    let container =
      this._p_create_container() || document.createElement('span');
    container.append(icon, title);
    container.style.width = '100%';
    container.style.display = 'flex';

    this.appendChild(container);

    icon = null;
    title = null;
    container = null;
  }

  _p_create_container() {
    return null;
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

  _p_main() {
    super._p_main();
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

  #_li(...nodes) {
    let li = document.createElement('li');
    li.append(...nodes);

    return li;
  }

  async #_on_pressed() {
    if (!this.#loaded) await this._on_pressed_unloaded();
    else this._on_pressed_loaded();

    this.#_update_icon();
  }

  #_update_icon() {
    if (this.isOpen) {
      this._p_save_into_data('icon', 'folder_open');
    } else {
      this._p_save_into_data('icon', 'folder');
    }

    this.elementIcon.icon = this.icon;
  }

  async _on_pressed_unloaded() {
    this.#state = FolderTag.EState.open;

    let container = document.createElement('ul');
    await this.itemData.load();

    let element;
    /**@type {RoundriveFile | RoundriveFolder} */
    let loaded;
    for (loaded of this.itemData) {
      switch (loaded.data.type) {
        case Roundrive.EItemType.directory:
          element = document.createElement('bnum-folder');
          break;

        default:
          element = document.createElement('bnum-file');
          break;
      }

      element.setItemFileData(loaded);

      container.appendChild(this.#_li(element));
      element = null;
    }

    this.appendChild(container);

    this.#container = container;
    this.#loaded = true;
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
}

{
  const TAG = 'bnum-file';
  if (!customElements.get(TAG)) customElements.define(TAG, FileTag);
}
