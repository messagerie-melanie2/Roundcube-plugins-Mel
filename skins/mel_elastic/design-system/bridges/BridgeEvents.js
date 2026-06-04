import { BnumLog } from '../../../../plugins/mel_metapage/js/lib/classes/bnum_log.js';
import { EMPTY_STRING } from '../../../../plugins/mel_metapage/js/lib/constants/constants.js';
import { MelObject } from '../../../../plugins/mel_metapage/js/lib/mel_object.js';

/**
 * Singleton gérant les événements de pont entre l'UI et la logique métier.
 * Fournit des méthodes pour déléguer des événements, gérer les interactions dossiers/mails, etc.
 */
export default class BridgeEvents extends MelObject {
  static #_instance = null;
  /**
   * Accès à l'instance unique de BridgeEvents.
   * @returns {BridgeEvents}
   */
  static get Instance() {
    return (this.#_instance ??= new BridgeEvents());
  }

  constructor() {
    super();
  }

  /**
   * Accès au treelist de Roundcube.
   * @returns {rcube_tree}
   */
  get treelist() {
    return this.rcmail().treelist;
  }

  /**
   * Délègue un événement à un sélecteur spécifique à partir d'une cible.
   * @param {Element} target Élément sur lequel écouter l'événement
   * @param {string} event Nom de l'événement (ex: 'click')
   * @param {string} selector Sélecteur CSS pour filtrer la cible
   * @param {Function} callback Fonction appelée lors de l'événement
   * @returns {this}
   */
  delegate(target, event, selector, callback) {
    target.addEventListener(
      event,
      (e) => {
        // On cherche l'élément correspondant au sélecteur le plus proche
        const element = e.target.closest(selector);

        if (BnumLog.log_level >= BnumLog.LogLevels.debug)
          BnumLog.debug(
            'BridgeEvents/delegate',
            'EVENT',
            element,
            target,
            target.contains(element),
          );

        // On vérifie que l'élément trouvé est bien à l'intérieur de notre "target"
        if (element && target.contains(element)) {
          callback(
            new CustomEvent(event, {
              detail: { innerEvent: e, target: element },
            }),
          );
        }
      },
      { capture: true },
    );

    return this;
  }

  #_hideContextMenus(e) {
    this.rcmail().contextmenu?.hide_all?.(e);
  }

  /**
   * Gère le clic sur un dossier (ferme les menus contextuels).
   * @param {Event} e
   */
  onFolderClick(e) {
    return this.#_hideContextMenus(e);
  }

  /**
   * Affiche le menu contextuel d'un dossier.
   * @param {Object} folderMenu
   * @param {Event} e
   */
  onFolderContextMenu2(folderMenu, e) {
    const source = e.target;
    source.blur();
    this.#_hideContextMenus(e);
    this.rcmail().contextmenu.show_one(
      e,
      source,
      source.getAttribute('rel'),
      folderMenu,
    );
  }

  /**
   * Gère la sélection d'un dossier.
   * @param {CustomEvent} e
   */
  onFolderSelect(e) {
    const { caller = e?.detail?.innerEvent?.detail?.caller } = e.detail;

    if (!caller) throw new Error("caller don't exist");

    if (caller.getAttribute('is-virtual') === 'true') return;

    const folderId = caller.getAttribute('folder-id');

    if (
      !folderId ||
      this.treelist.triggerEvent('beforeselect', folderId) === false
    )
      return;

    this.execCommand('list', { props: folderId, obj: caller, event: e });
    this.treelist.triggerEvent('select', folderId);
  }

  /**
   * Gère l'ouverture/fermeture d'un dossier (arborescence).
   * @param {CustomEvent} e
   */
  onFolderToggle(e) {
    const { caller, collapsed } = e.detail;
    this.treelist.triggerEvent(collapsed ? 'collapse' : 'expand', caller);
  }

  /**
   * Affiche le menu contextuel personnalisé pour un dossier.
   * @param {Object} menu
   * @param {CustomEvent} e
   */
  onFolderContextMenu(menu, e) {
    const { innerEvent, target } = e.detail;
    const folderId =
      target.getAttribute('folder-id') || target.getAttribute('rel');

    if (folderId) {
      rcube_event.cancel(innerEvent);
      this.update_env('context_menu_source_id', folderId);
      menu.show_menu(target, innerEvent);

      // Hack visuel
      if (typeof $ !== 'undefined') {
        $('#rcm_folderlist li').show();
        $('#rcm_folderlist a').addClass('active').removeClass('disabled');
      } else {
        for (const li of document.querySelectorAll('#rcm_folderlist li')) {
          li.style.display = EMPTY_STRING;
        }

        for (const a of document.querySelectorAll('#rcm_folderlist a')) {
          a.classList.add('active');
          a.classList.remove('disabled');
        }
      }
      return false;
    }
  }

  #_getContextMenu() {
    return this.rcmail().contextmenu;
  }

  #_setContextMenuPosition() {
    const contextmenu = this.#_getContextMenu();

    if (contextmenu) {
      contextmenu.position ??= (e, menuElement) => {
        menuElement.css({ left: '-1000px', top: '-1000px' }).show();

        const win = $(window);
        const winH = win.height() || 0;
        const winW = win.width() || 0;
        const menuH = menuElement.height() || 0;
        const menuW = menuElement.width() || 0;
        let top = e.pageY;
        let left = e.pageX;

        if (top + menuH > winH) {
          top -= menuH;
          if (top < 0) top = Math.max(0, (winH - menuH) / 2);
        }

        if (left + menuW > winW) {
          left -= left + menuW - winW + 10;
        }

        menuElement
          .hide()
          .css({ left: Math.max(0, left) + 'px', top: top + 'px' });
      };
    }
  }

  #_positionContextMenu(p) {
    const contextmenu = this.#_getContextMenu();

    this.#_setContextMenuPosition();

    contextmenu.position(p.originalEvent, $(`#${p.name}`));
  }

  /**
   * Personnalise l'ouverture du menu contextuel.
   * @param {Object} p
   */
  onMenuOpen(p) {
    if (p.name !== 'rcm_folderlist') return;

    // Positionnement personnalisé si absent
    this.rcmail().contextmenu.position ??= (e, menuElement) => {
      menuElement.css({ left: '-1000px', top: '-1000px' }).show();

      const win = $(window);
      const winH = win.height() || 0;
      const winW = win.width() || 0;
      const menuH = menuElement.height() || 0;
      const menuW = menuElement.width() || 0;
      let top = e.pageY;
      let left = e.pageX;

      if (top + menuH > winH) {
        top -= menuH;
        if (top < 0) top = Math.max(0, (winH - menuH) / 2);
      }

      if (left + menuW > winW) {
        left -= left + menuW - winW + 10;
      }

      menuElement
        .hide()
        .css({ left: Math.max(0, left) + 'px', top: top + 'px' });
    };

    this.rcmail().contextmenu.position(p.originalEvent, $(`#${p.name}`));

    // Activation visuelle des liens
    $(`#${p.name} ul li a`).each((_, element) => {
      const link = element;
      if (link.classList.contains('active')) return;

      for (const className of Array.from(link.classList)) {
        if (className.startsWith('cmd_')) {
          const command = className.replace('cmd_', '');
          if (this.rcmail().commands[command]) {
            link.classList.add('active');
          }
          break;
        }
      }
    });

    $(`#${p.name}`).show();
  }

  /**
   * Vérifie si une mbox équivaut à la mbox des brouillons.
   *
   * @remark
   * Si mbox et draftMbox sont `null` ou `undefined` elles sont récupérer depuis les varibles d'env `mailbox` et `drafts_mailbox`
   *
   * @param {Object} [param0={}]
   * @param {string | undefined} [param0.mbox=this.get_env('mailbox')] Mbox à vérifier
   * @param {string | undefined} [param0.draftMbox=this.get_env('drafts_mailbox')] Mbox des brouillons
   *
   * @returns {bool}
   * @private
   */
  #_isDraftMailbox({
    mbox = this.get_env('mailbox'),
    draftMbox = this.get_env('drafts_mailbox'),
  } = {}) {
    mbox ??= this.get_env('mailbox');
    draftMbox ??= this.get_env('drafts_mailbox');
    return mbox === draftMbox;
  }

  /**
   * Ouvre la fenêtre de composition des brouillons si la mbox est bien un brouillon
   * @param {string} uid Id du message
   * @param {string | undefined} [mbox=this.get_env('mailbox')] Mbox à tester
   * @returns {boolean} `true` si la fenêtre de composition est ouverte
   */
  #_tryOpenDraft(uid, mbox = this.get_env('mailbox')) {
    mbox ??= this.get_env('mailbox');
    let draftOpen = false;

    if (this.#_isDraftMailbox()) {
      draftOpen = true;
      this.open_compose_draft(uid, mbox);
    }

    return draftOpen;
  }

  #_getMsgListRowUid(row) {
    const uid = this.rcmail().message_list?.get_row_uid?.(row);

    if (this.isNullOrUndefined(uid))
      throw new Error("Impossible de trouver l'uid !");

    return uid;
  }

  #_messageListSelect(uid) {
    if (this.rcmail()?.message_list?.select)
      this.rcmail().message_list.select(uid);
    else throw new Error('Impossible de "select" un message !');
  }

  /**
   * Gère le clic sur un mail (affichage ou édition brouillon).
   * @param {Event} ev
   */
  onMailClick(ev) {
    const row = ev.target.closest('tr') || ev.target;
    const uid = this.#_getMsgListRowUid(row);

    this.#_tryOpenDraft(uid);

    this.#_messageListSelect(uid);
  }

  /**
   * Gère le double-clic sur un mail.
   * @param {Event} ev
   */
  onMailDblClick(ev) {
    const rcmail = this.rcmail();
    const row = ev.target.closest('tr') || ev.target;
    const uid = this.#_getMsgListRowUid(row);

    if (uid && !this.#_tryOpenDraft(uid)) rcmail.show_message(uid);
  }

  /**
   * Gère le début du drag d'un mail (prépare le ghost et les données).
   * @param {DragEvent} ev
   */
  onMailDragStart(ev) {
    // Sécurité : on s'assure de cibler le <tr> ou le conteneur de la ligne,
    // même si on a cliqué sur un enfant.
    const row = ev.target.closest('tr') || ev.target;
    const dt = ev.dataTransfer;

    // 1. Extraction des données (Natif)
    // .querySelector() remplace .find().first()
    const senderElem = row.querySelector('.rcmContactAddress');
    const sender = senderElem ? senderElem.textContent.trim() : 'Inconnu';

    // Pour .last(), on prend tous les éléments et on sélectionne le dernier de la liste
    const subjects = row.querySelectorAll('span.subject');
    const subject =
      subjects.length > 0
        ? subjects[subjects.length - 1].textContent.trim()
        : '(Sans objet)';

    // 2. Gestion du multi-sélection
    const messageList = this.rcmail().message_list;
    const selectionCount = messageList ? messageList.selection.length : 1;

    // 3. Mise à jour du Ghost
    const ghost = document.getElementById('bnum-drag-ghost');
    const container = ghost.querySelector('.ghost-container');

    ghost.querySelector('.ghost-sender').textContent = sender;
    ghost.querySelector('.ghost-subject').textContent = subject;

    const badge = ghost.querySelector('.ghost-badge');
    if (selectionCount > 1) {
      badge.textContent = selectionCount;
      badge.style.display = 'block';
    } else {
      badge.style.display = 'none';
    }

    // 4. Application de l'image de drag
    dt.setDragImage(container, 90, 40);

    // 5. Transmission des UIDs pour le drop
    let uids = '';
    if (messageList) {
      uids =
        messageList.selection.length > 0
          ? messageList.get_selection().join(',')
          : messageList.get_row_uid(row);
    } else {
      // Fallback si pas de message_list (cas rare)
      uids = row.getAttribute('id') || '';
    }

    dt.setData('text/plain', uids);
    dt.effectAllowed = 'move';
  }

  #_clearDragClasses() {
    for (const element of document.querySelectorAll(
      '#folderlist-content .dragover',
    )) {
      element.classList.remove('dragover');
    }
  }

  /**
   * Nettoie les styles après un drag de mail.
   */
  onMailDragEnd() {
    this.#_clearDragClasses();
  }

  /**
   * Gère le dragover sur un dossier (pour le drop de mails).
   * @param {CustomEvent} ev
   */
  onMailDragOver(ev) {
    const { innerEvent, target } = ev.detail;

    ev.preventDefault();
    innerEvent.preventDefault();

    if (innerEvent.dataTransfer) innerEvent.dataTransfer.dropEffect = 'move';

    this.#_clearDragClasses();

    target.classList.add('dragover');
  }

  /**
   * Gère le drop de mails sur un dossier.
   * @param {CustomEvent} ev
   */
  onMailDrop(ev) {
    const { innerEvent, target } = ev.detail;
    ev.preventDefault();
    innerEvent.preventDefault();
    let data = innerEvent.dataTransfer.getData('text/plain');

    if (!(data || false)) return;

    data = data.split(',').map((x) => +x);

    if (target.getAttribute('is-virtual') === 'true') return;

    const folder = target.getAttribute('folder-id');

    this.rcmail().move_messages(folder, null, data);
  }

  onMessagesSelected(
    getSelectionIcon,
    HTMLBnumAvatarAction,
    HTMLBnumButtonIcon,
    messageList,
  ) {
    const { rows, selection } = messageList;
    const selectedUids = new Set(selection.map(String));

    for (const [uid, { obj: row }] of Object.entries(rows)) {
      const action = row.querySelector(HTMLBnumAvatarAction.TAG);
      if (!action) continue;

      const isSelected = selectedUids.has(uid);
      action.forceActionState({ enabled: isSelected });

      if (!isSelected) continue;

      const icon = action.querySelector(HTMLBnumButtonIcon.TAG);
      if (icon) icon.icon = getSelectionIcon(row);
    }
  }

  /**
   * Exécute un callback après la réponse de la liste (asynchrone).
   * @param {Function} callback
   */
  onResponseAfterList(callback) {
    requestAnimationFrame(() => {
      callback();
    });
  }
}
