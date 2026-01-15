import { EMPTY_STRING } from '../../plugins/mel_metapage/js/lib/constants/constants.js';
import { MelObject } from '../../plugins/mel_metapage/js/lib/mel_object.js';
import { HTMLBnumFolder } from './design-system/ds-module-bnum.js';

class BridgeEvents extends MelObject {
  static #_instance = null;
  static get Instance() {
    return (this.#_instance ??= new BridgeEvents());
  }

  constructor() {
    super();
  }

  get treelist() {
    return this.rcmail().treelist;
  }

  delegate(target, event, selector, callback) {
    target.addEventListener(event, (e) => {
      // On cherche l'élément correspondant au sélecteur le plus proche
      const element = e.target.closest(selector);

      // On vérifie que l'élément trouvé est bien à l'intérieur de notre "target"
      if (element && target.contains(element)) {
        callback(
          new CustomEvent(event, {
            detail: { innerEvent: e, target: element },
          }),
        );
      }
    });

    return this;
  }

  callOnReady(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  onFolderClick(e) {
    return this.rcmail().contextmenu.hide_all(e);
  }

  onFolderContextMenu2(folderMenu, e) {
    const source = e.target;
    source.blur();
    this.rcmail().contextmenu.hide_all(e);
    this.rcmail().contextmenu.show_one(
      e,
      source,
      source.getAttribute('rel'),
      folderMenu,
    );
  }

  onFolderSelect(e) {
    const { caller } = e.detail;

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

  onFolderToggle(e) {
    const { caller, collapsed } = e.detail;
    this.treelist.triggerEvent(collapsed ? 'collapse' : 'expand', caller);
  }

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

  onMailClick(ev) {
    const rcmail = this.rcmail();
    const row = ev.target.closest('tr') || ev.target;
    const uid = rcmail.message_list.get_row_uid(row);
    const mbox = this.get_env('mailbox');

    if (mbox === this.get_env('drafts_mailbox')) {
      return rcmail.open_compose_step({
        _draft_uid: uid,
        _mbox: mbox,
      });
    }

    rcmail.show_message(uid, false, true);
  }

  onMailDblClick(ev) {
    const rcmail = this.rcmail();
    const row = ev.target.closest('tr') || ev.target;
    const uid = rcmail.message_list.get_row_uid(row);

    if (uid) {
      const mbox = this.get_env('mailbox');
      if (mbox === this.get_env('drafts_mailbox'))
        rcmail.open_compose_step({ _draft_uid: uid, _mbox: mbox });
      else rcmail.show_message(uid);
    }
  }

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

  onMailDragEnd() {
    for (const element of document.querySelectorAll(
      '#folderlist-content .dragover',
    )) {
      element.classList.remove('dragover');
    }
  }

  onMailDragOver(ev) {
    const { innerEvent, target } = ev.detail;

    ev.preventDefault();
    innerEvent.preventDefault();

    if (innerEvent.dataTransfer) innerEvent.dataTransfer.dropEffect = 'move';

    for (const element of document.querySelectorAll(
      '#folderlist-content .dragover',
    )) {
      element.classList.remove('dragover');
    }

    target.classList.add('dragover');
  }

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

  onResponseAfterList(callback) {
    requestAnimationFrame(() => {
      callback();
    });
  }
}

/**
 * @callback AnyFunction
 * @param {...} any
 * @returns {any}
 */

class BridgeRc extends MelObject {
  static #_instance = null;
  static get Instance() {
    return (this.#_instance ??= new BridgeRc());
  }

  constructor() {
    super();
  }

  get treelist() {
    return BridgeEvents.Instance.treelist;
  }

  /**
   * Applique un patch automatique en utilisant le nom de la fonction fournie
   * @param {Function} replacementFunc - La fonction de remplacement
   * @param {Object} [param1={}]
   * @param {typeof rcube_webmail} [param1.target=this.rcmail()] Objet à appliquer le patch. Si non défini, ce sera rcmail.
   * @returns {this} Chaînage
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
   *
   * @param {Object} element
   * @param {AnyFunction} old
   * @param {AnyFunction} newF
   * @returns {AnyFunction} Function bind
   */
  bind(element, old, newF) {
    return function (rcmailRef, oldFunction, newFunction, ...args) {
      return newFunction(rcmailRef, oldFunction, ...args);
    }.bind(element, element, old, newF.bind(this));
  }

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

  patch_get_node(treeRef, oldFunction, folder) {
    return (
      oldFunction.call(treeRef, folder) ??
      document.querySelector(`${HTMLBnumFolder.TAG}[folder-id="${folder}"]`)
    );
  }

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

class DsBridge extends MelObject {
  constructor() {
    super();

    if (this.rcmail()) {
      this.listen('init', () => {
        this.#_onInit();
      });
    }

    BridgeEvents.Instance.callOnReady(() => this.#_onReady());
  }

  #_onReady() {
    return this.#_onInitListeners();
  }

  #_onInit() {
    return this.#_onInitMail();
  }

  #_onInitMail() {
    if (this.get_env('task') === 'mail')
      return this.#_updateMailboxSelector().#_updateFolder();

    return this;
  }

  #_updateMailboxSelector() {
    const mailboxlist = this.get_env('context_menu')?.mailboxlist;

    if (mailboxlist) mailboxlist.selector = 'bnum-folder.mailbox';
    return this;
  }

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
}

void new DsBridge();
