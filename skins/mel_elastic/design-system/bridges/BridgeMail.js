import ABaseMelObject from '../../../../plugins/mel_metapage/js/lib/base_mel_object.js';
import { MelEnumerable } from '../../../../plugins/mel_metapage/js/lib/classes/enum.js';
import { EMPTY_STRING } from '../../../../plugins/mel_metapage/js/lib/constants/constants.js';
import { AvatarElement } from '../../../../plugins/mel_metapage/js/lib/html/JsHtml/CustomAttributes/avatar.js';
import {
  DsCssProperty,
  DsCssRule,
  DsDocument,
  HTMLBnumAvatarAction,
  HTMLBnumButtonIcon,
  HTMLBnumFolder,
} from '../ds-module-bnum';
import ABridge from './ABridge.js';
import BridgeCommands from './BridgeCommands.js';
import BridgeEvents from './BridgeEvents.js';
import BridgeRc from './BridgeRc.js';
import { CONFIG_FOLDER_SPACE as CFS } from './constants.js';

const LOCALIZATION_PLUGIN = 'mel_metapage';
const CONFIG_FOLDER_SPACE = CFS;
const ICON_AVATAR_HOVER = 'check_box';
const ICON_AVATAR_HOVER_2 = 'check_box_outline_blank';

/**
 * @typedef ActionSettings
 * @property {number} order
 * @property {string} icon
 * @property {ActionCallback} onclick
 * @property {ActionCallback} onstart
 * @property {ActionCallback} onhover
 */

/**
 * @callback ActionCallback
 * @this {HTMLElement}
 * @param {import("../ds-module-bnum.js").HTMLBnumButtonIcon} caller
 * @param {ActionSettings} settings
 * @param {Event} e
 * @returns {void}
 */

/**
 * Pont principal entre le Design System Bnum et Roundcube.
 *
 * Cette classe gère l'intégration des dossiers personnalisés, la gestion des styles,
 * l'initialisation des listeners (drag & drop, clics, menus contextuels) et les patchs
 * nécessaires pour l'affichage et l'interactivité des dossiers dans l'interface mail.
 *
 * Elle applique également les configurations de style selon les paramètres utilisateurs
 * et assure la compatibilité avec certains comportements historiques (ex : dossier Junk).
 *
 * @class BridgeMail
 * @extends ABridge
 */
export default class BridgeMail extends ABridge {
  static #_CSS_VARS = {
    GEN_TITLE: '--bnum-folder-title-padding',
    BAL_TITLE: '--bnum-folder-bal-title-padding',
  };

  static #_DEFAULTS = {
    general: 'var(--bnum-folder-title-padding, 10px 15px)',
    bal: 'var(--bnum-folder-bal-title-padding, 15px 15px)',
  };

  static #_SELECTORS = {
    MESSAGES_ROWS: '#messagelist tbody tr',
    MESSAGES_CONTAINER: '#messagelist tbody',
    MAILBOX_OPTIONS: '#mailboxoptionsmenu',
    BNUM_FOLDER: HTMLBnumFolder.TAG,
    BNUM_FOLDER_MAILBOX: `${HTMLBnumFolder.TAG}.mailbox`,
    MAILBOXES_FOLDERS: `#mailboxlist ${HTMLBnumFolder.TAG}`,
    MAILBOXES_FOLDERS_MAILBOX: `#mailboxlist ${HTMLBnumFolder.TAG}.mailbox`,
    MENU_SOURCES: ['#rcmfoldermenu > ul', '#mailboxoptions-menu > ul > li'],
  };

  static #_ENVS = {
    TASK: 'task',
    CONTEXT_MENU: 'context_menu',
    MAILBOX: 'mailbox',
    MAILBOXES: 'mailboxes',
    MMP_CONFIGS: 'mel_metapage_mail_configs',
  };

  // Hack spécifique pour corriger l'ID du dossier Junk (Dette technique documentée)
  static #_LEGACY_JUNK_ID = 'Ind&AOk-sirables';

  #_melFolderSpaceRule = null;

  /**
   * Récupère la règle CSS utilisée pour le style des dossiers personnalisés.
   * @returns {DsCssRule}
   */
  get folderSpaceRule() {
    return (this.#_melFolderSpaceRule ??= new DsCssRule(HTMLBnumFolder.TAG));
  }

  /**
   * Constructeur de la classe BridgeMail.
   */
  constructor() {
    super();
  }

  /**
   * Méthode appelée lors de l'initialisation du pont.
   * @returns {BridgeMail}
   */
  _p_onInit() {
    if (!this.rcmail()) return this;

    if (!window.bridgeMail) this.export('bridgeMail', this);

    return this.#_onInit();
  }

  /**
   * Méthode appelée lorsque le DOM est prêt.
   * @returns {BridgeMail}
   */
  _p_onReady() {
    return this.#_onReady();
  }

  /**
   * Appelé lorsque le DOM est prêt.
   * Initialise les listeners globaux.
   * @private
   * @returns {BridgeMail}
   */
  #_onReady() {
    return this.#_onInitListeners().#_onRegisterCommands();
  }

  /**
   * Appelé lors de l'initialisation de l'application.
   * @private
   * @returns {BridgeMail}
   */
  #_onInit() {
    return this.#_onInitMail();
  }

  /**
   * Initialise les comportements spécifiques à la messagerie.
   * @private
   * @returns {BridgeMail}
   */
  #_onInitMail() {
    if (this.get_env(BridgeMail.#_ENVS.TASK) === 'mail')
      return this.#_updateMailboxSelector()
        .#_updateFolder()
        .#_updateStyleFromParameters();

    return this;
  }

  /**
   * Met à jour le sélecteur de boîte aux lettres pour le menu contextuel.
   * @private
   * @returns {BridgeMail}
   */
  #_updateMailboxSelector() {
    const mailboxlist = this.get_env(
      BridgeMail.#_ENVS.CONTEXT_MENU,
    )?.mailboxlist;

    if (mailboxlist)
      mailboxlist.selector = BridgeMail.#_SELECTORS.BNUM_FOLDER_MAILBOX;
    return this;
  }

  /**
   * Met à jour les dossiers personnalisés et applique les patchs nécessaires.
   * @private
   * @returns {BridgeMail}
   */
  #_updateFolder() {
    const { BNUM_FOLDER } = BridgeMail.#_SELECTORS;

    if (
      !(
        this.get_env(BridgeMail.#_ENVS.MAILBOX) &&
        document.querySelector(BNUM_FOLDER)
      )
    )
      return this;
    const bridge = BridgeEvents.Instance;
    bridge
      .delegate(
        document,
        'bnum-folder:select',
        BNUM_FOLDER,
        bridge.onFolderSelect.bind(bridge),
      )
      .delegate(
        document,
        'bnum-folder:toggle',
        BNUM_FOLDER,
        bridge.onFolderToggle.bind(bridge),
      );

    BridgeRc.Instance
      // Mettre à jours les non-lu sur les bnum-folder
      .patch(BridgeRc.Instance.patch_set_unread_count_display)
      // Modifier le get_node de treelist
      .patch(BridgeRc.Instance.patch_get_node, {
        target: BridgeRc.Instance.treelist,
      });

    this.#_fixLegacyJunkFolder();

    return this.#_updateContextMenuFolder();
  }

  /**
   * Corrige l'ID du dossier indésirable si nécessaire (legacy).
   * @private
   */
  #_fixLegacyJunkFolder() {
    const emptyMailbox = this.get_env(BridgeMail.#_ENVS.MAILBOXES)?.[
      EMPTY_STRING
    ];
    if (emptyMailbox?.class?.includes('junk')) {
      emptyMailbox.id = BridgeMail.#_LEGACY_JUNK_ID;
    }
  }

  /**
   * Met à jour le menu contextuel des dossiers personnalisés.
   * @private
   * @returns {BridgeMail}
   */
  #_updateContextMenuFolder() {
    // On réinitialise le contextmenu pour prendre en compte les nouveaux dossiers
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

    BridgeEvents.Instance.delegate(
      document,
      'contextmenu',
      BridgeMail.#_ENVS.MAILBOXES_FOLDERS_MAILBOX,
      BridgeEvents.Instance.onFolderContextMenu.bind(
        BridgeEvents.Instance,
        menu,
      ),
    );

    BridgeRc.Instance.replace(BridgeRc.Instance.patch_init_folder, {
      target: this.rcmail().contextmenu,
    });

    this.listen(
      'menu-open',
      (...args) => void BridgeEvents.Instance.onMenuOpen(...args),
    );

    this.rcmail().contextmenu.init_folder(BridgeMail.#_ENVS.MAILBOXES_FOLDERS, {
      menu_source: BridgeMail.#_ENVS.MENU_SOURCES,
    });

    return this;
  }

  /**
   * Initialise les listeners globaux (drag/drop, clics, etc.).
   * @private
   * @returns {BridgeMail}
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
        this.#_setupMessageListHooks.bind(this),
      ),
    );

    this.listen('responseaftersearch', this.#_setupMessageListHooks.bind(this));

    return this;
  }

  /**
   * Enregistre les commandes personnalisées utilisées par BridgeMail.
   * @returns {this} Chaînage
   */
  #_onRegisterCommands() {
    const key = 'update_mail_css';

    BridgeCommands.Instance.command_register(
      key,
      BridgeCommands.Instance.command_update_mail_css,
      { args: [this.updateFolderStyle.bind(this)] },
    );

    return this;
  }

  /**
   * Configure l'interactivité de la liste des messages (drag & drop, clics, etc.).
   * @private
   * @returns {BridgeMail}
   */
  #_setupMessageListHooks() {
    const rcmail = this.rcmail();
    if (!rcmail?.message_list) return this;

    if (rcmail.message_list.draggable) {
      rcmail.message_list.draggable = false;
    }

    const tbody = document.querySelector(
      BridgeMail.#_SELECTORS.MESSAGES_CONTAINER,
    );
    if (!tbody) return this;

    if (typeof $ !== 'undefined') {
      $(BridgeMail.#_SELECTORS.MESSAGES_ROWS).off('mouseup mousedown');
    }

    const rows = tbody.querySelectorAll('tr');
    for (let i = 0, len = rows.length; i < len; i++) {
      this.#_update_row(rows[i]).setAttribute('draggable', 'true');
    }

    if (tbody.dataset.hasBridgeListeners) return this;

    tbody.addEventListener(
      'click',
      (e) => {
        const row = e.target.closest('tr');
        if (row) BridgeEvents.Instance.onMailClick(e);
      },
      true,
    );

    tbody.addEventListener('dblclick', (e) => {
      const row = e.target.closest('tr');
      if (row) BridgeEvents.Instance.onMailDblClick(e);
    });

    tbody.addEventListener('dragstart', (e) => {
      const row = e.target.closest('tr');
      if (row) BridgeEvents.Instance.onMailDragStart(e);
    });

    tbody.addEventListener('dragend', (e) => {
      const row = e.target.closest('tr');
      if (row) BridgeEvents.Instance.onMailDragEnd(e);
    });

    tbody.dataset.hasBridgeListeners = 'true';

    return this;
  }

  /**
   * Vérifie si une ligne de mail est séléctionné
   * @param {string | HTMLElement} rowOrRowId
   * @returns {boolean}
   */
  #_isSelected(rowOrRowId) {
    return (
      (typeof rowOrRowId === 'string'
        ? document.getElementById(rowOrRowId)
        : rowOrRowId
      )?.classList?.contains?.('selected') ?? false
    );
  }
  /**
   * Vérifie si une ligne de mail est séléctionné
   * @param {string | HTMLElement} rowOrRowId
   * @returns {string}
   */
  #_getIcon(rowOrRowId, { inverted = false } = {}) {
    var isSelected = this.#_isSelected(rowOrRowId);

    if (inverted) isSelected = !isSelected;

    return !isSelected ? ICON_AVATAR_HOVER_2 : ICON_AVATAR_HOVER;
  }

  /**
   * @private
   * @param {string | HTMLElement} rowOrRowId
   * @returns {typeof ICON_AVATAR_HOVER | typeof ICON_AVATAR_HOVER_2}
   */
  _getIcon(rowOrRowId, { inverted = false } = {}) {
    return this.#_getIcon(rowOrRowId, { inverted });
  }

  /**
   *
   * @param {Readonly<HTMLElement>} row
   */
  #_update_row(row) {
    {
      /**
       * @type {HTMLElement}
       */
      const msgicon = row.querySelector('.msgicon');

      if (msgicon) {
        msgicon.style.opacity = 0;
        msgicon.style.pointerEvents = 'none';
      }
    }

    const avatar = AvatarElement.Create({
      email: row.querySelector('.rcmContactAddress')?.getAttribute?.('title'),
    }).addClass('mail-avatar--avatar');

    /**
     * @type {import("../ds-module-bnum.js").HTMLBnumButtonIcon}
     */
    const action = HTMLBnumButtonIcon.Create('add')
      .attr('id', `action-of-${row.id}`)
      .addClass('mail-avatar--action');

    action.addEventListener(
      'click',
      /**
       *
       * @param {string} rowId
       * @param {(row: string | HTMLElement, ?{inverted?:boolean}) => (typeof ICON_AVATAR_HOVER | typeof ICON_AVATAR_HOVER_2)} getIcon
       * @param {MouseEvent} e
       * @this BridgeMail
       */
      function (rowId, getIcon, e) {
        e.stopImmediatePropagation();
        e.stopPropagation();
        e.preventDefault();

        const updateButton = document.querySelector(`#${rowId} .selection`);

        if (updateButton) {
          this.icon = getIcon(rowId, { inverted: true });
          updateButton.click();
        } else
          throw new Error(
            'Impossible de trouver le bouton pour changer le status du mail !',
          );
      }.bind(action, row.id, this._getIcon.bind(this)),
    );

    /**
     * @type {import("../ds-module-bnum.js").HTMLBnumAvatarAction}
     */
    const avatarContainer = HTMLBnumAvatarAction.Create({ avatar, action });
    avatarContainer
      .data('row-id', row.id)
      .addClass('mail-avatar')
      .onEnter.push((caller) => {
        /**
         * @type {string}
         */
        const rowId = caller.data('row-id');
        /**
         * @type {import("../ds-module-bnum.js").HTMLBnumButtonIcon}
         */
        const avatarAction = document.getElementById(`action-of-${rowId}`);

        if (avatarAction) {
          avatarAction.icon = this.#_getIcon(rowId);
        } else
          throw new Error(
            `Impossible de trouver l'élément : action-of-${rowId}`,
          );
      });

    const rowActions = document.createElement('div');
    rowActions.classList.add('row-actions');

    /**
     * @type {Record<string, ActionSettings>}
     */
    const actions = {
      unread: {
        order: 0,
        icon: 'mail',
        onclick(_, __, e) {
          e.stopImmediatePropagation();
          e.stopPropagation();
          e.preventDefault();

          this.querySelector('.msgicon').click();
        },
        onstart(caller) {
          caller.classList.add('unread-action');
        },
      },
      flag: {
        order: 2,
        icon: 'flag_check',
        onclick(_, __, e) {
          e.stopImmediatePropagation();
          e.stopPropagation();
          e.preventDefault();
          const text =
            this.querySelector('.flags .flag .unflagged') ??
            this.querySelector('.flags .flag .flagged');

          if (text) text.click();
        },
        onstart(caller) {
          caller.classList.add('flag-action');
        },
      },
      unflag: {
        order: 3,
        icon: 'flag',
        onclick(_, __, e) {
          e.stopImmediatePropagation();
          e.stopPropagation();
          e.preventDefault();
          const text =
            this.querySelector('.flags .flag .flagged') ??
            this.querySelector('.flags .flag .unflagged');

          if (text) text.click();
        },
        onstart(caller) {
          caller.classList.add('unflag-action');
        },
      },
      delete: {
        order: 4,
        icon: 'delete',
        onclick(_, __, e) {
          e.stopImmediatePropagation();
          e.stopPropagation();
          e.preventDefault();

          const helper = ABaseMelObject.Empty();
          const selectedsCount = helper
            .rcmail()
            .message_list.get_selection().length;
          const isSelected = this.classList.contains('selected');
          const isOnlySelected = isSelected && selectedsCount === 1;

          if (selectedsCount >= 1 && !isOnlySelected) {
            if (
              !confirm(
                'Vous allez supprimer plusieurs autres messages avec celui-ci, êtes-vous sûr de faire ça ?',
              )
            ) {
              return;
            }
          }

          if (!this.classList.contains('selected'))
            document.querySelector(`#action-of-${this.id}`).click();

          helper.rcmail().delete_messages(e);
        },
        onstart(caller) {
          caller.classList.add('delete-action');
        },
      },
    };

    actions.read = {
      order: 1,
      icon: 'drafts',
      onclick: actions.unread.onclick,
      onstart(caller) {
        caller.classList.add('read-action');
      },
    };

    for (const { value: settings } of MelEnumerable.from(actions).orderBy(
      (x) => x.value.order,
    )) {
      // const settings = actions[key];
      const button = HTMLBnumButtonIcon.Create(settings.icon);

      settings.onstart?.call?.(row, button, settings);
      button.addEventListener(
        'click',
        settings.onclick.bind(row, button, settings),
      );

      button.classList.add('sub-action');

      rowActions.appendChild(button);
    }

    row.style.position = 'relative';
    row.prepend(avatarContainer, rowActions);

    return row;
  }

  /**
   * Met à jour dynamiquement le style des dossiers selon la configuration utilisateur.
   * @private
   * @returns {BridgeMail}
   */
  #_updateStyleFromParameters() {
    try {
      const { generalPadding, balPadding } = this.#_updateFolderStyle();
      const mel_folder_space = CONFIG_FOLDER_SPACE;

      DsDocument.Instance.styleSheets.add(
        mel_folder_space,
        this.folderSpaceRule
          .addProperty(generalPadding)
          .addProperty(balPadding),
      );
    } catch (error) {
      console.error('###BridgeMail: Style update failed', error);
    }

    return this;
  }

  /**
   * Permet de mettre à jour le style des dossiers à la volée.
   */
  updateFolderStyle() {
    try {
      // Guard clauses for external dependencies
      if (!this.folderSpaceRule) {
        console.warn('/!\\FolderStyler: folderSpaceRule is not initialized.');
        return;
      }

      const generalPadding = this.folderSpaceRule.get(0);
      const balPadding = this.folderSpaceRule.get(1);

      this.#_updateFolderStyle({ generalPadding, balPadding });
    } catch (error) {
      // Graceful degradation or logging strategy
      console.error('###FolderStyler: Failed to update folder style', error);
    }
  }
  /**
   * Applique les styles des dossiers selon la configuration.
   *
   * Note : Utilise une map pour séparer les données de la logique,
   * respectant ainsi le principe de responsabilité unique (SRP)
   * et facilitant la maintenance future.
   *
   * @param {Object} [param0={}]
   * @param {?DsCssProperty} [param0.generalPadding=null] - Propriété CSS pour le padding général.
   * @param {?DsCssProperty} [param0.balPadding=null] - Propriété CSS pour le padding des boîtes aux lettres.
   * @returns {{generalPadding: DsCssProperty, balPadding: DsCssProperty}}
   */
  #_updateFolderStyle({ generalPadding = null, balPadding = null } = {}) {
    // Récupération de la configuration
    const mailConfig = this.get_env(BridgeMail.#_ENVS.MMP_CONFIGS) ?? {};
    const configKey = mailConfig[CONFIG_FOLDER_SPACE];

    // Récupération ou création des props css
    const safeGeneral =
      generalPadding ??
      new DsCssProperty(BridgeMail.#_CSS_VARS.GEN_TITLE, EMPTY_STRING);
    const safeBal =
      balPadding ??
      new DsCssProperty(BridgeMail.#_CSS_VARS.BAL_TITLE, EMPTY_STRING);

    // Récupération de la startégie de style
    const styleStrategy = this.#_getStyleStrategyMap();

    // Application du style
    const appliedStyle = styleStrategy[configKey] ?? BridgeMail.#_DEFAULTS;

    // Maj des valeurs
    safeGeneral.value = appliedStyle.general;
    safeBal.value = appliedStyle.bal;

    return { generalPadding: safeGeneral, balPadding: safeBal };
  }

  /**
   * Génère la carte de configuration reliant les clés localisées aux valeurs CSS.
   * Séparer les données de la logique respecte le principe de responsabilité unique (SRP).
   * @returns {Object.<string, {general: string, bal: string}>}
   */
  #_getStyleStrategyMap() {
    const localizationContext = { plugin: LOCALIZATION_PLUGIN };

    return {
      [this.getLocalization('larger', localizationContext)]: {
        general: 'var(--bnum-folder-title-padding-larger, 15px 15px)',
        bal: 'var(--bnum-folder-bal-title-padding-larger, 20px 15px)',
      },
      [this.getLocalization('smaller', localizationContext)]: {
        general: 'var(--bnum-folder-title-padding-smaller, 5px 15px)',
        bal: 'var(--bnum-folder-bal-title-padding-smaller, 10px 15px)',
      },
    };
  }
}
