import { EMPTY_STRING } from '../../../../plugins/mel_metapage/js/lib/constants/constants.js';
import {
  DsCssProperty,
  DsCssRule,
  DsDocument,
  HTMLBnumFolder,
} from '../ds-module-bnum';
import ABridge from './ABridge.js';
import BridgeEvents from './BridgeEvents.js';
import BridgeRc from './BridgeRc.js';

/**
 * Pont principal entre le design system et Roundcube.
 * Initialise les listeners, patchs et menus contextuels pour l'intégration Bnum.
 */
export default class BridgeMail extends ABridge {
  #_melFolderSpaceRule = null;

  get folderSpaceRule() {
    return (this.#_melFolderSpaceRule ??= new DsCssRule(HTMLBnumFolder.TAG));
  }

  constructor() {
    super();
  }

  _p_onInit() {
    if (this.rcmail()) {
      if (!window.bridgeMail) this.export('bridgeMail', this);
      return this.#_onInit();
    }
    return this;
  }

  _p_onReady() {
    return this.#_onReady();
  }

  /**
   * Appelé lorsque le DOM est prêt.
   * @private
   */
  #_onReady() {
    return this.#_onInitListeners();
  }

  /**
   * Appelé lors de l'initialisation de l'application.
   * @private
   */
  #_onInit() {
    return this.#_onInitMail();
  }

  /**
   * Initialise les comportements spécifiques à la messagerie.
   * @private
   */
  #_onInitMail() {
    if (this.get_env('task') === 'mail')
      return this.#_updateMailboxSelector()
        .#_updateFolder()
        .#_updateStyleFromParameters();

    return this;
  }

  /**
   * Met à jour le sélecteur de boîte aux lettres pour le menu contextuel.
   * @private
   */
  #_updateMailboxSelector() {
    const mailboxlist = this.get_env('context_menu')?.mailboxlist;

    if (mailboxlist) mailboxlist.selector = 'bnum-folder.mailbox';
    return this;
  }

  /**
   * Met à jour les dossiers personnalisés et applique les patchs nécessaires.
   * @private
   */
  #_updateFolder() {
    const BNUM_FOLDER_TAG = HTMLBnumFolder.TAG;
    if (!(this.get_env('mailbox') && document.querySelector(BNUM_FOLDER_TAG)))
      return this;

    // On ajoute les bon selecteurs aux dossiers
    const folders = document.querySelectorAll(BNUM_FOLDER_TAG);
    for (const folder of folders) {
      folder.addEventListener(
        'bnum-folder:select',
        (e) => void BridgeEvents.Instance.onFolderSelect(e),
      );

      folder.addEventListener(
        'bnum-folder:toggle',
        (e) => void BridgeEvents.Instance.onFolderToggle(e),
      );
    }

    BridgeRc.Instance
      // Mettre à jours les non-lu sur les bnum-folder
      .patch(BridgeRc.Instance.patch_set_unread_count_display)
      // Modifier le get_node de treelist
      .patch(BridgeRc.Instance.patch_get_node, {
        target: BridgeRc.Instance.treelist,
      });

    // Fix Junk folder ID
    const emptyMailbox = this.get_env('mailboxes')?.[EMPTY_STRING];
    if (emptyMailbox?.class?.includes?.('junk')) {
      emptyMailbox.id = 'Ind&AOk-sirables';
    }

    return this.#_updateContextMenuFolder();
  }

  /**
   * Met à jour le menu contextuel des dossiers personnalisés.
   * @private
   */
  #_updateContextMenuFolder() {
    const menu = this.rcmail().contextmenu.init(
      {
        menu_name: 'folderlist',
        menu_source: '#mailboxoptionsmenu',
        list_object: null,
      },
      {
        activate: (p) => {
          p.enabled = true;
          return p;
        },
      },
    );

    void BridgeEvents.Instance.delegate(
      document,
      'contextmenu',
      '#mailboxlist bnum-folder.mailbox',
      BridgeEvents.Instance.onFolderContextMenu.bind(
        BridgeEvents.Instance,
        menu,
      ),
    );

    void BridgeRc.Instance.replace(BridgeRc.Instance.patch_init_folder, {
      target: this.rcmail().contextmenu,
    });

    this.listen(
      'menu-open',
      (...args) => void BridgeEvents.Instance.onMenuOpen(...args),
    );

    this.rcmail().contextmenu.init_folder('#mailboxlist bnum-folder', {
      menu_source: ['#rcmfoldermenu > ul', '#mailboxoptions-menu > ul > li'],
    });

    return this;
  }

  /**
   * Initialise les listeners globaux (drag/drop, clics, etc.).
   * @private
   */
  #_onInitListeners() {
    BridgeEvents.Instance.delegate(
      document,
      'dragover',
      HTMLBnumFolder.TAG,
      BridgeEvents.Instance.onMailDragOver.bind(BridgeEvents.Instance),
    ).delegate(
      document,
      'drop',
      HTMLBnumFolder.TAG,
      BridgeEvents.Instance.onMailDrop.bind(BridgeEvents.Instance),
    );

    this.listen(
      'responseafterlist',
      BridgeEvents.Instance.onResponseAfterList.bind(
        BridgeEvents.Instance,
        this.#_addListenersOnRowMail.bind(this),
      ),
    );

    return this;
  }

  /**
   * Ajoute les listeners sur chaque ligne de mail (clic, drag, etc.).
   * @private
   */
  #_addListenersOnRowMail() {
    const rcmail = this.rcmail();

    if (rcmail.message_list.draggable) rcmail.message_list.draggable = false;

    for (const e of document.querySelectorAll('#messagelist tbody tr')) {
      if (typeof $ !== 'undefined') $(e).off('mouseup').off('mousedown');

      e.setAttribute('draggable', true);
      e.addEventListener(
        'click',
        BridgeEvents.Instance.onMailClick.bind(BridgeEvents.Instance),
      );
      e.addEventListener(
        'dblclick',
        BridgeEvents.Instance.onMailDblClick.bind(BridgeEvents.Instance),
      );
      e.addEventListener(
        'dragstart',
        BridgeEvents.Instance.onMailDragStart.bind(BridgeEvents.Instance),
      );
      e.addEventListener(
        'dragend',
        BridgeEvents.Instance.onMailDragEnd.bind(BridgeEvents.Instance),
      );
    }

    return this;
  }

  #_updateStyleFromParameters() {
    const mailConfig = this.get_env('mel_metapage_mail_configs');

    if (mailConfig) {
      const mel_folder_space = 'mel-folder-space';

      let generalPadding = new DsCssProperty(
        '--bnum-folder-title-padding',
        EMPTY_STRING,
      );
      let balPadding = new DsCssProperty(
        '--bnum-folder-bal-title-padding',
        EMPTY_STRING,
      );

      switch (mailConfig[mel_folder_space]) {
        case this.getLocalization('larger', { plugin: 'mel_metapage' }):
          generalPadding.value =
            'var(--bnum-folder-title-padding-larger, 15px 15px)';
          balPadding.value =
            'var(--bnum-folder-bal-title-padding-larger, 20px 15px)';
          break;

        case this.getLocalization('smaller', { plugin: 'mel_metapage' }):
          generalPadding.value =
            'var(--bnum-folder-title-padding-smaller, 5px 15px)';
          balPadding.value =
            'var(--bnum-folder-bal-title-padding-smaller, 10px 15px)';
          break;
        default:
          generalPadding.value = 'var(--bnum-folder-title-padding)';
          balPadding.value = 'var(--bnum-folder-bal-title-padding)';
          break;
      }

      DsDocument.instance.styleSheets.add(
        mel_folder_space,
        this.folderSpaceRule
          .addProperty(generalPadding)
          .addProperty(balPadding),
      );
    }

    return this;
  }
}
