import ABaseMelObject from '../../../../plugins/mel_metapage/js/lib/base_mel_object.js';
import { BnumLog } from '../../../../plugins/mel_metapage/js/lib/classes/bnum_log.js';
import { MelEnumerable } from '../../../../plugins/mel_metapage/js/lib/classes/enum.js';
import { EMPTY_STRING } from '../../../../plugins/mel_metapage/js/lib/constants/constants.js';
import { AvatarElement } from '../../../../plugins/mel_metapage/js/lib/html/JsHtml/CustomAttributes/avatar.js';
import { MelObject } from '../../../../plugins/mel_metapage/js/lib/mel_object.js';
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

// ─── Constantes de module ────────────────────────────────────────────────────

const LOCALIZATION_PLUGIN = 'mel_metapage';
const CONFIG_FOLDER_SPACE = CFS;

/** Icône affichée sur l'avatar au survol selon l'état sélectionné. */
const ICON_SELECTED = 'check_box';
const ICON_UNSELECTED = 'check_box_outline_blank';

// ─── Définition des actions de ligne ────────────────────────────────────────

/**
 * @typedef ActionSettings
 * @property {number} order - Ordre d'affichage de l'action.
 * @property {string} icon - Nom de l'icône Material.
 * @property {string} cssClass - Classe CSS ajoutée au bouton.
 * @property {ActionCallback} onclick - Handler du clic.
 */

/**
 * @callback ActionCallback
 * @this {HTMLElement} La ligne `<tr>` parente.
 * @param {HTMLBnumButtonIcon} caller
 * @param {ActionSettings} settings
 * @param {(item: ?HTMLElement) => ?HTMLElement} ignoreCapture
 * @param {Event} e
 * @returns {void}
 */

/**
 * Définitions statiques des actions disponibles sur chaque ligne de message.
 * Séparées de la logique pour respecter le SRP et faciliter la maintenance.
 *
 * @type {ActionSettings[]}
 */
const ROW_ACTIONS = [
  {
    order: 0,
    icon: 'drafts',
    cssClass: 'unread-action',
    onclick(_, __, ignoreCapture, e) {
      e.stopImmediatePropagation();
      e.stopPropagation();
      e.preventDefault();
      ignoreCapture(this.querySelector('.msgicon'))?.click();
    },
  },
  {
    order: 1,
    icon: 'mail',
    cssClass: 'read-action',
    onclick(_, __, ignoreCapture, e) {
      e.stopImmediatePropagation();
      e.stopPropagation();
      e.preventDefault();
      ignoreCapture(this.querySelector('.msgicon'))?.click();
    },
  },
  {
    order: 2,
    icon: 'flag_check',
    cssClass: 'flag-action',
    onclick(_, __, ignoreCapture, e) {
      e.stopImmediatePropagation();
      e.stopPropagation();
      e.preventDefault();
      const flag =
        this.querySelector('.flags .flag .unflagged') ??
        this.querySelector('.flags .flag .flagged');
      ignoreCapture(flag)?.click();
    },
  },
  {
    order: 3,
    icon: 'flag',
    cssClass: 'unflag-action',
    onclick(_, __, ignoreCapture, e) {
      e.stopImmediatePropagation();
      e.stopPropagation();
      e.preventDefault();
      const flag =
        this.querySelector('.flags .flag .flagged') ??
        this.querySelector('.flags .flag .unflagged');
      ignoreCapture(flag)?.click();
    },
  },
  {
    order: 4,
    icon: 'delete',
    cssClass: 'delete-action',
    onclick(_, __, ignoreCapture, e) {
      e.stopImmediatePropagation();
      e.stopPropagation();
      e.preventDefault();

      const helper = ABaseMelObject.Empty();
      const selectedCount = helper.rcmail().message_list.get_selection().length;
      const isSelected = this.classList.contains('selected');
      const wouldDeleteOthers =
        selectedCount >= 1 && !(isSelected && selectedCount === 1);

      if (
        wouldDeleteOthers &&
        !confirm(
          'Vous allez supprimer plusieurs autres messages avec celui-ci, êtes-vous sûr ?',
        )
      ) {
        return;
      }

      if (!isSelected) {
        ignoreCapture(document.querySelector(`#action-of-${this.id}`))?.click();
      }

      helper.rcmail().delete_messages(e);
    },
  },
];

// ─── Classe principale ───────────────────────────────────────────────────────

/**
 * Pont principal entre le Design System Bnum et Roundcube.
 *
 * Gère l'intégration des dossiers personnalisés, les styles CSS dynamiques,
 * les listeners (drag & drop, clics, menus contextuels) et les patchs
 * nécessaires pour l'affichage et l'interactivité des dossiers dans l'interface mail.
 *
 * @class BridgeMail
 * @extends ABridge
 */
export default class BridgeMail extends ABridge {
  // ─── Constantes statiques privées ─────────────────────────────────────────

  static #CSS_VARS = {
    GEN_TITLE: '--bnum-folder-title-padding',
    BAL_TITLE: '--bnum-folder-bal-title-padding',
  };

  static #DEFAULTS = {
    general: 'var(--bnum-folder-title-padding, 10px 15px)',
    bal: 'var(--bnum-folder-bal-title-padding, 15px 15px)',
  };

  static #SELECTORS = {
    MESSAGES_ROWS: '#messagelist tbody tr',
    MESSAGES_CONTAINER: '#messagelist tbody',
    BNUM_FOLDER: HTMLBnumFolder.TAG,
    BNUM_FOLDER_MAILBOX: `${HTMLBnumFolder.TAG}.mailbox`,
    MAILBOXES_FOLDERS: `#mailboxlist ${HTMLBnumFolder.TAG}`,
    MAILBOXES_FOLDERS_MAILBOX: `#mailboxlist ${HTMLBnumFolder.TAG}.mailbox`,
    MENU_SOURCES: ['#rcmfoldermenu > ul', '#mailboxoptions-menu > ul > li'],
  };

  static #ENVS = {
    TASK: 'task',
    CONTEXT_MENU: 'context_menu',
    MAILBOX: 'mailbox',
    MAILBOXES: 'mailboxes',
    MMP_CONFIGS: 'mel_metapage_mail_configs',
  };

  /**
   * Hack spécifique pour corriger l'ID du dossier Junk (dette technique documentée).
   */
  static #LEGACY_JUNK_ID = 'Ind&AOk-sirables';

  // ─── Propriétés d'instance ─────────────────────────────────────────────────

  /** @type {DsCssRule | null} */
  #folderSpaceRule = null;

  /**
   * Règle CSS lazy-initialisée pour le style des dossiers personnalisés.
   * @returns {DsCssRule}
   * @readonly
   */
  get folderSpaceRule() {
    return (this.#folderSpaceRule ??= new DsCssRule(HTMLBnumFolder.TAG));
  }

  /**
   * Clé pour l'attribut data-ignore-capture
   * @type {string}
   * @readonly
   */
  get dataIgnoreCaptureKey() {
    return 'data-ignore-capture';
  }

  // ─── Cycle de vie ──────────────────────────────────────────────────────────

  constructor() {
    super();
  }

  /** @returns {BridgeMail} */
  _p_onInit() {
    if (!this.rcmail()) return this;
    if (!window.bridgeMail) this.export('bridgeMail', this);

    return this.#initMail();
  }

  /** @returns {BridgeMail} */
  _p_onReady() {
    if (this.get_env(BridgeMail.#ENVS.TASK) !== 'mail') return this;

    return this.#initListeners().#registerCommands();
  }

  // ─── Initialisation ────────────────────────────────────────────────────────

  /**
   * Initialise les comportements spécifiques à la vue mail.
   * @returns {BridgeMail}
   */
  #initMail() {
    if (this.get_env(BridgeMail.#ENVS.TASK) !== 'mail') return this;

    this.#updateMailMoveFolder();

    return this.#updateMailboxSelector()
      .#updateFolder()
      .#updateStyleFromParameters();
  }

  /**
   * Patche la sélection du menu en mobile
   */
  #updateMailMoveFolder() {
    BridgeRc.Instance.patch(BridgeRc.Instance.patch_folder_selector);
  }

  /**
   * Corrige le sélecteur de boîte aux lettres pour le menu contextuel.
   * @returns {BridgeMail}
   */
  #updateMailboxSelector() {
    const mailboxlist = this.get_env(
      BridgeMail.#ENVS.CONTEXT_MENU,
    )?.mailboxlist;
    if (mailboxlist) {
      mailboxlist.selector = BridgeMail.#SELECTORS.BNUM_FOLDER_MAILBOX;
    }
    return this;
  }

  /**
   * Enregistre les événements et patches liés aux dossiers personnalisés.
   * @returns {BridgeMail}
   */
  #updateFolder() {
    const { BNUM_FOLDER } = BridgeMail.#SELECTORS;
    const hasFolders =
      this.get_env(BridgeMail.#ENVS.MAILBOX) &&
      document.querySelector(BNUM_FOLDER);

    if (!hasFolders) return this;

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

    BridgeRc.Instance.patch(
      BridgeRc.Instance.patch_set_unread_count_display,
    ).patch(BridgeRc.Instance.patch_get_node, {
      target: BridgeRc.Instance.treelist,
    });

    this.#fixLegacyJunkFolder();
    this.#updateMarkAsUnread();
    return this.#updateContextMenuFolder();
  }

  /**
   * Modifie comme "mark_all_read_state" fonctionne.
   */
  #updateMarkAsUnread() {
    const rcmail = this.rcmail();

    if (rcmail.mark_all_read_state) {
      const rcmail_mark_all_read_state = rcmail.mark_all_read_state;

      rcmail.mark_all_read_state = function (mbox) {
        let state = rcmail_mark_all_read_state.call(this, mbox);

        if (state) return state;
        else {
          if (!mbox) mbox = this.env.mailbox;
          if (!mbox) return state;
          const getUnreads = (element) => {
            return +(element?.getAttribute?.('unread') || 0);
          };
          /**
           * @type {HTMLBnumFolder?}
           */
          const li = this.treelist.container[0].querySelector(
              `[folder-id="${mbox}"]`,
            ), //.get_item(mbox || this.env.mailbox),
            folder_item = li && getUnreads(li) > 0 ? 1 : 0,
            subfolder_items = [
              ...(li?.querySelectorAll?.('[unread]') ?? []),
            ].filter((x) => getUnreads(x)).length,
            all_items = [
              ...this.treelist.container[0].querySelectorAll('[unread]'),
            ].filter((x) => getUnreads(x)).length;
          //$('li.unread', ref.gui_objects.folderlist).length;

          state += folder_item;
          state += subfolder_items ? 2 : 0;
          state += all_items > folder_item + subfolder_items ? 4 : 0;

          this.enable_command('mark-all-read', state > 0);

          return state;
        }
      };
    }
  }

  /**
   * Corrige l'ID du dossier indésirable si nécessaire (héritage legacy).
   */
  #fixLegacyJunkFolder() {
    const emptyMailbox = this.get_env(BridgeMail.#ENVS.MAILBOXES)?.[
      EMPTY_STRING
    ];
    if (emptyMailbox?.class?.includes('junk')) {
      emptyMailbox.id = BridgeMail.#LEGACY_JUNK_ID;
    }
  }

  /**
   * Réinitialise le menu contextuel pour prendre en compte les nouveaux dossiers.
   * @returns {BridgeMail}
   */
  #updateContextMenuFolder() {
    const { MAILBOXES_FOLDERS, MAILBOXES_FOLDERS_MAILBOX, MENU_SOURCES } =
      BridgeMail.#SELECTORS;
    const bridge = BridgeEvents.Instance;

    const menu = this.rcmail().contextmenu.init(
      {
        menu_name: 'folderlist',
        menu_source: '#mailboxoptions-menu ul',
        list_object: null,
      },
      { activate: (p) => ({ ...p, enabled: true }) },
    );

    bridge.delegate(
      document,
      'contextmenu',
      MAILBOXES_FOLDERS_MAILBOX,
      bridge.onFolderContextMenu.bind(bridge, menu),
    );

    BridgeRc.Instance.replace(BridgeRc.Instance.patch_init_folder, {
      target: this.rcmail().contextmenu,
    });

    this.listen('menu-open', (...args) => void bridge.onMenuOpen(...args));
    this.listen('actionbefore', (args) => bridge.onActionBeforeDownload(args));
    this.listen('get_single_uid', (obj) => bridge.onGetSingleUid(obj));

    this.rcmail().contextmenu.init_folder(MAILBOXES_FOLDERS, {
      menu_source: MENU_SOURCES,
    });

    return this;
  }

  /**
   * Initialise les listeners globaux (drag/drop, clics, recherche).
   * @returns {BridgeMail}
   */
  #initListeners() {
    const bridge = BridgeEvents.Instance;
    const { BNUM_FOLDER } = BridgeMail.#SELECTORS;

    bridge
      .delegate(
        document,
        'dragover',
        BNUM_FOLDER,
        bridge.onMailDragOver.bind(bridge),
      )
      .delegate(document, 'drop', BNUM_FOLDER, bridge.onMailDrop.bind(bridge));

    this.listen(
      'responseafterlist',
      bridge.onResponseAfterList.bind(
        bridge,
        this.#setupMessageListHooks.bind(this),
      ),
    )
      .listen('responseaftersearch', this.#setupMessageListHooks.bind(this))
      .listen(
        'responseaftercheck-recent',
        this.#setupMessageListHooks.bind(this),
      )
      .listen('responseafterrefresh', (...args) => {
        const [responseContainer] = args;
        const containerExist = !!responseContainer;
        const responseExist = !!responseContainer.response;
        const rowUpdated =
          !!responseContainer.response?.exec?.includes?.('add_message_row');
        const needRedecorate = containerExist && responseExist && rowUpdated;

        if (needRedecorate) this.#setupMessageListHooks();
      })
      .listen('init', () => {
        const msgList = this.rcmail().message_list;

        if (!msgList) {
          BnumLog.error(
            'BridgeMail/initListeners',
            'Impossible de trouver "message_list" !',
          );
          return;
        }

        msgList.addEventListener(
          'select',
          bridge.onMessagesSelected.bind(
            bridge,
            this.#getSelectionIcon.bind(this),
            HTMLBnumAvatarAction,
            HTMLBnumButtonIcon,
          ),
        );

        msgList.addEventListener('initrow', (row) => {
          this.#prepareRow(row.obj);
        });
      });

    return this;
  }

  /**
   * Enregistre les commandes BridgeMail dans le registre de commandes.
   * @returns {BridgeMail}
   */
  #registerCommands() {
    BridgeCommands.Instance.command_register(
      'update_mail_css',
      BridgeCommands.Instance.command_update_mail_css,
      { args: [this.updateFolderStyle.bind(this)] },
    );
    return this;
  }

  // ─── Liste de messages ─────────────────────────────────────────────────────

  /**
   * Configure les comportements de la liste de messages (drag & drop, clics).
   * Idempotent : les listeners ne sont enregistrés qu'une seule fois via `data-has-bridge-listeners`.
   * @returns {BridgeMail}
   */
  #setupMessageListHooks() {
    const rcmail = this.rcmail();
    if (!rcmail?.message_list) return this;

    if (rcmail.message_list.draggable) {
      rcmail.message_list.draggable = false;
    }

    const tbody = document.querySelector(
      BridgeMail.#SELECTORS.MESSAGES_CONTAINER,
    );
    if (!tbody) return this;

    if (!tbody.dataset.hasBridgeListeners) {
      this.#attachTbodyListeners(tbody);
      tbody.dataset.hasBridgeListeners = 'true';
    }

    return this;
  }

  /**
   * Attache les listeners de la liste de messages sur le `<tbody>` (délégation d'événements).
   * @param {HTMLElement} tbody
   */
  #attachTbodyListeners(tbody) {
    const bridge = BridgeEvents.Instance;

    tbody.addEventListener(
      'click',
      (e) => {
        if (e.target.hasAttribute?.(this.dataIgnoreCaptureKey)) return;
        if (e.target.closest('tr')) bridge.onMailClick(e);
      },
      true,
    );

    tbody.addEventListener('dblclick', (e) => {
      if (e.target.closest('tr')) bridge.onMailDblClick(e);
    });

    tbody.addEventListener('dragstart', (e) => {
      if (e.target.closest('tr')) bridge.onMailDragStart(e);
    });

    tbody.addEventListener('dragend', (e) => {
      if (e.target.closest('tr')) bridge.onMailDragEnd(e);
    });
  }

  // ─── Décoration des lignes ─────────────────────────────────────────────────
  /**
   *
   * @param {?T} e
   * @template {HTMLElement} T
   */
  #ignoreCapture(e) {
    if (e && !e.hasAttribute(this.dataIgnoreCaptureKey))
      e.setAttribute(this.dataIgnoreCaptureKey, true);

    return e;
  }

  /**
   * Enrichit une ligne `<tr>` avec un avatar cliquable et les boutons d'action.
   * @param {HTMLElement} row
   * @returns {HTMLElement} La même ligne, modifiée.
   */
  #prepareRow(row) {
    if (row.hasAttribute('decorated')) return row;

    // Nettoie les anciens listeners jQuery si jQuery est disponible.
    if (typeof $ !== 'undefined') {
      $(row).off('mouseup mousedown');
    }

    row = this.#decorateRow(row);
    row.setAttribute('draggable', 'true');

    return row;
  }

  /**
   * Enrichit une ligne `<tr>` avec un avatar cliquable et les boutons d'action.
   * @param {HTMLElement} row
   * @returns {HTMLElement} La même ligne, modifiée.
   */
  #decorateRow(row) {
    this.#hideMsgIcon(row);
    this.#addUtilityClass(row);
    // La case à cocher native n'était jamais exclue de l'interception de clic
    // de la ligne : la cocher ouvrait le mail en plus de le sélectionner.
    this.#ignoreCapture(row.querySelector('.selection input'));

    const avatarContainer = this.#buildAvatarContainer(row);
    const rowActions = this.#buildRowActions(row);

    row.style.position = 'relative';
    row.prepend(avatarContainer, rowActions);
    row.setAttribute('decorated', true);

    this.#setThreadingDecorations(row);

    return row;
  }

  #isThreading() {
    return this.get_env('threading');
  }

  #setThreadingDecorations(row) {
    if (!this.#isThreading()) return row;

    this.#setIgnoreThreadCaptures(row).#process(row);
  }

  /**
   *
   * @param {HTMLElement} row
   * @param {number} level
   */
  #process(row) {
    const subject = row.querySelector('.subject');

    if (!subject) return;

    const padding = ~~(parseFloat(subject.style.paddingLeft) * 10);
    const level = padding / 15;

    row.style.setProperty('--row-level', level);
    row.classList.add('threading-level');
  }

  #setIgnoreThreadCaptures(row) {
    const thread = row.querySelector('.threads div');

    if (thread) this.#ignoreCapture(thread);

    return this;
  }

  /**
   * Ajoute la classe 'priority' à une ligne si elle contient un élément de priorité.
   *
   * @param {HTMLElement} row
   * @returns {void}
   */
  #addUtilityClass(row) {
    if (
      row.querySelector(
        '.subject span.priority :is(.prio, .prio1, .prio2, .prio4, .prio5)',
      )
    ) {
      row.classList.add('priority');
    }
    if (row.querySelector('.msgicon:is(.forwarded, .replied)')) {
      row.classList.add('handled');
    }
  }

  /**
   * Masque l'icône de statut d'origine (remplacée par l'avatar Bnum).
   * @param {HTMLElement} row
   */
  #hideMsgIcon(row) {
    //On récupère les icones qui ne sont ni en replied ni en forwarded
    const msgicon = row.querySelector('.msgicon:not(.forwarded, .replied)');
    if (msgicon) {
      msgicon.style.opacity = 0;
      msgicon.style.pointerEvents = 'none';
    }
  }

  /**
   * Crée le conteneur avatar + bouton de sélection pour une ligne.
   * @param {HTMLElement} row
   * @returns {HTMLBnumAvatarAction}
   */
  #buildAvatarContainer(row) {
    const avatar = AvatarElement.Create({
      email: row.querySelector('.rcmContactAddress')?.getAttribute('title'),
    }).addClass('mail-avatar--avatar');

    /**
     * @type {import("../ds-module-bnum.js").HTMLBnumButtonIcon}
     */
    const action = HTMLBnumButtonIcon.Create('add');
    this.#ignoreCapture(action)
      ?.attr?.('id', `action-of-${row.id}`)
      ?.addClass?.('mail-avatar--action');

    /**
     * Sélectionne/désélectionne la ligne. Rattaché à `action` (bouton révélé
     * au survol sur desktop) et à `avatarContainer` (seule zone atteignable
     * au doigt sur mobile, où le survol ne se déclenche jamais).
     */
    const selectRow = (e) => {
      e.stopImmediatePropagation();
      e.stopPropagation();
      e.preventDefault();

      const selectionBtn = document.querySelector(`#${row.id} .selection`);
      if (!selectionBtn) {
        console.error(
          `[BridgeMail] Bouton .selection introuvable dans #${row.id}`,
        );
        return;
      }

      action.icon = this.#getSelectionIcon(row.id, { inverted: true });
      this.rcmail().dummy_select = true;
      this.#ignoreCapture(selectionBtn).click();
      this.rcmail().dummy_select = null;
      clearTimeout(this.rcmail().preview_timer);
    };

    action.addEventListener('click', selectRow, true);

    const avatarContainer = HTMLBnumAvatarAction.Create({ avatar, action });
    avatarContainer
      .data('row-id', row.id)
      .addClass('mail-avatar')
      .onEnter.push((caller) => {
        const rowId = caller.data('row-id');
        const avatarAction = document.getElementById(`action-of-${rowId}`);
        if (avatarAction) {
          avatarAction.icon = this.#getSelectionIcon(rowId);
        } else {
          console.error(`[BridgeMail] Élément action-of-${rowId} introuvable.`);
        }
      });

    avatarContainer.addEventListener('click', selectRow, true);
    this.#ignoreCapture(avatarContainer);
    this.#ignoreCapture(avatar);

    return avatarContainer;
  }

  /**
   * Crée le bloc de boutons d'action (lu/non-lu, flag, suppression) pour une ligne.
   * @param {HTMLElement} row
   * @returns {HTMLElement}
   */
  #buildRowActions(row) {
    const container = document.createElement('div');
    container.classList.add('row-actions');

    const sortedActions = MelEnumerable.from(ROW_ACTIONS).orderBy(
      (a) => a.order,
    );

    for (const settings of sortedActions) {
      const button = this.#ignoreCapture(
        HTMLBnumButtonIcon.Create(settings.icon),
      );
      button.classList.add('sub-action', settings.cssClass);
      button.addEventListener(
        'click',
        settings.onclick.bind(row, button, settings, (e) =>
          this.#ignoreCapture(e),
        ),
      );
      container.appendChild(button);
    }

    for (const eventType of ['mouseenter', 'mouseleave']) {
      row.addEventListener(
        eventType,
        this.#_handleRowHover.bind(this, row, eventType),
      );
    }

    return container;
  }

  /**
   * Action générique qui permet de piloter l'action de {@link HTMLBnumAvatarAction}.
   * @param {HTMLElement} row
   * @param {'mouseenter' | 'mouseleave'} eventType
   */
  #_handleRowHover(row, eventType) {
    const avatar = row.querySelector(HTMLBnumAvatarAction.TAG);

    if (avatar) avatar.dispatchEvent(new MouseEvent(eventType));
  }

  // ─── Icônes de sélection ───────────────────────────────────────────────────

  /**
   * Retourne l'icône correspondant à l'état sélectionné/désélectionné d'une ligne.
   * @param {string | HTMLElement} rowOrId
   * @param {{ inverted?: boolean }} [options]
   * @returns {typeof ICON_SELECTED | typeof ICON_UNSELECTED}
   */
  #getSelectionIcon(rowOrId, { inverted = false } = {}) {
    const el =
      typeof rowOrId === 'string' ? document.getElementById(rowOrId) : rowOrId;
    const isSelected = el?.classList?.contains('selected') ?? false;
    return (inverted ? !isSelected : isSelected)
      ? ICON_SELECTED
      : ICON_UNSELECTED;
  }

  // ─── Styles CSS ────────────────────────────────────────────────────────────

  /**
   * Initialise la feuille de style des dossiers selon les paramètres utilisateur.
   * @returns {BridgeMail}
   */
  #updateStyleFromParameters() {
    try {
      const { generalPadding, balPadding } = this.#computeFolderStyle();
      DsDocument.Instance.styleSheets.add(
        CONFIG_FOLDER_SPACE,
        this.folderSpaceRule
          .addProperty(generalPadding)
          .addProperty(balPadding),
      );
    } catch (error) {
      console.error('[BridgeMail] Échec de la mise à jour du style :', error);
    }
    return this;
  }

  /**
   * Met à jour les propriétés CSS des dossiers à partir de la règle existante.
   * Méthode publique destinée à être appelée via les commandes enregistrées.
   */
  updateFolderStyle() {
    if (!this.folderSpaceRule) {
      console.warn('[BridgeMail] folderSpaceRule non initialisée.');
      return;
    }

    try {
      this.#computeFolderStyle({
        generalPadding: this.folderSpaceRule.get(0),
        balPadding: this.folderSpaceRule.get(1),
      });
    } catch (error) {
      console.error('[BridgeMail] Échec de la mise à jour du style :', error);
    }
  }

  /**
   * Calcule et applique les valeurs de padding CSS selon la configuration utilisateur.
   *
   * Utilise un map de stratégies pour séparer les données de la logique (SRP).
   *
   * @param {{ generalPadding?: DsCssProperty, balPadding?: DsCssProperty }} [options]
   * @returns {{ generalPadding: DsCssProperty, balPadding: DsCssProperty }}
   */
  #computeFolderStyle({ generalPadding = null, balPadding = null } = {}) {
    const configKey = (this.get_env(BridgeMail.#ENVS.MMP_CONFIGS) ?? {})[
      CONFIG_FOLDER_SPACE
    ];

    const safeGeneral =
      generalPadding ??
      new DsCssProperty(BridgeMail.#CSS_VARS.GEN_TITLE, EMPTY_STRING);
    const safeBal =
      balPadding ??
      new DsCssProperty(BridgeMail.#CSS_VARS.BAL_TITLE, EMPTY_STRING);

    const strategy =
      this.#getStyleStrategyMap()[configKey] ?? BridgeMail.#DEFAULTS;

    safeGeneral.value = strategy.general;
    safeBal.value = strategy.bal;

    return { generalPadding: safeGeneral, balPadding: safeBal };
  }

  /**
   * Retourne la carte de stratégies de style reliant les clés localisées aux valeurs CSS.
   *
   * Note : recalculée à chaque appel car `getLocalization` peut varier selon la locale active.
   *
   * @returns {Record<string, { general: string, bal: string }>}
   */
  #getStyleStrategyMap() {
    const ctx = { plugin: LOCALIZATION_PLUGIN };
    return {
      [this.getLocalization('larger', ctx)]: {
        general: 'var(--bnum-folder-title-padding-larger, 15px 15px)',
        bal: 'var(--bnum-folder-bal-title-padding-larger, 20px 15px)',
      },
      [this.getLocalization('smaller', ctx)]: {
        general: 'var(--bnum-folder-title-padding-smaller, 5px 15px)',
        bal: 'var(--bnum-folder-bal-title-padding-smaller, 10px 15px)',
      },
    };
  }
}
