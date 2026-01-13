import { HTMLBnumFolder } from '../../../../../../skins/mel_elastic/design-system/ds-module-bnum.js';
import { MelEnumerable, MelKeyValuePair } from '../../classes/enum.js';
import { EMPTY_STRING } from '../../constants/constants.js';
import { BnumConnector } from '../../helpers/bnum_connections/bnum_connections.js';
import { MelJsHtml } from '../../html/JsHtml/JsMelHtml.js';
import { AFolderModifier } from './afolder_modifier.js';

/**
 * Classe gérant l'affichage et la logique des dossiers favoris dans l'interface de messagerie.
 * Étend la classe de base AFolderModifier.
 * * @extends AFolderModifier
 */
export class MailFavoriteFolder extends AFolderModifier {
  //#region Static properties
  /**
   * Stocke le dossier actuellement ciblé ou sélectionné.
   * @type {string|null}
   * @private
   * @static
   */
  static #_currentFolder = null;

  /**
   * Récupère le dossier courant si la liste des dossiers Roundcube est visible.
   * @type {string|null}
   * @readonly
   * @static
   */
  static get current_folder() {
    if (
      this.#_currentFolder &&
      !document.querySelector('#rcm_folderlist').checkVisibility()
    )
      this.#_currentFolder = null;

    return this.#_currentFolder;
  }
  //#endregion Static properties

  //#region Private properties
  /**
   * Indique si l'initialisation du composant est terminée.
   * @type {boolean}
   * @private
   */
  #_loadFinished = false;
  //#endregion Private properties

  //#region Getters
  /**
   * Getter indiquant si le chargement est terminé.
   * @type {boolean}
   * @readonly
   */
  get load_finished() {
    return this.#_loadFinished;
  }
  //#endregion Getters

  //#region Lifecycle
  /**
   * Initialise une nouvelle instance de MailFavoriteFolder.
   */
  constructor() {
    super();
    this.#_loadFinished = true;
  }

  /**
   * Point d'entrée principal de la classe.
   * Initialise les commandes et les écouteurs d'événements sur la liste des boîtes aux lettres.
   * @override
   */
  main() {
    super.main();

    this._setup_commands();

    document.querySelectorAll('#mailboxlist bnum-folder').forEach((el) => {
      el.addEventListener('click', (e) => {
        const target = e.currentTarget;

        const copycat = document.querySelector(
          `#favorite-folders-list [folder-id="${target.getAttribute(
            'folder-id',
          )}"]`,
        );
        if (copycat) copycat.click();
        else {
          document
            .querySelector('#favorite-folders-list [is-selected="true"]')
            ?.setAttribute?.('is-selected', 'false');
        }
      });
    });
  }
  //#endregion Lifecycle

  //#region Plublic methods
  /**
   * Met à jour le rendu visuel de la liste des dossiers favoris dans le DOM.
   * Construit dynamiquement le HTML en respectant les niveaux d'imbrication.
   * @override
   */
  update_visuel() {
    super.update_visuel();

    const tree = this._constructFavoriteTree();

    let html = MelJsHtml.start.tag('bnum-tree', {
      class: 'treelist listing folderlist',
      id: 'favorite-folders-list',
      'aria-label': 'Dossiers favoris',
    });

    /** @type {number|null} Suivi du niveau de profondeur pour la gestion des fermetures de balises. */
    let previousLevel = null;

    for (const { folder, props } of tree) {
      const currentLevel = folder === 'favorite' ? 0 : props.level;

      if (previousLevel !== null) {
        if (currentLevel > previousLevel) {
          // On descend d'un niveau
        } else if (currentLevel === previousLevel) {
          html = html.end();
        } else {
          const gap = previousLevel - currentLevel;
          for (let i = 0; i < gap + 1; i++) {
            html = html.end();
          }
        }
      }

      let attribs = {};
      if (folder === 'favorite') {
        attribs = {
          'aria-level': 0,
          'is-selected': false,
          'is-collapsed': this._is_collapsed_rel('favorite'),
          'is-virtual': true,
          'folder-id': 'favorite',
          mailid: 'favorite',
          rel: 'favorite',
          class: 'mailbox boite virtual',
          level: 0,
          label: this.gettext('favorites', 'mel_metapage'),
          icon: 'star',
        };
      } else {
        const copycat = document.querySelector(
          `#mailboxlist [folder-id="${folder}"]`,
        );

        attribs = {
          'aria-level': props.level,
          'folder-id': copycat?.getAttribute('folder-id') || folder,
          'is-selected':
            copycat?.classList?.contains?.('selected') ??
            props.selected ??
            false,
          'is-collapsed': this._is_collapsed_rel(folder),
          'is-virtual': copycat?.getAttribute?.('is-virtual') ?? true,
          class: 'mailbox',
          rel: copycat?.getAttribute('rel') || folder,
          level: props.level,
          label: copycat?.getAttribute('label') || folder,
          icon: copycat?.getAttribute('icon') || 'folder',
          unread: copycat?.getAttribute('unread') || 0,
          slot: 'folders',
          folder,
        };
      }

      if (attribs['is-virtual'] === 'false') {
        attribs.onclick = (e) => {
          const folderAttr = e.currentTarget.getAttribute('folder');
          const element = document.querySelector(
            `#mailboxlist [folder-id="${folderAttr}"]`,
          );

          if (
            element.nodeName === HTMLBnumFolder.TAG.toUpperCase() &&
            element.select &&
            typeof element.select === 'function'
          ) {
            element.select().click();
          } else element.click();
        };
      }

      attribs.oncontextmenu = (e) => {
        e.preventDefault();

        const target = e.currentTarget;
        if (target.classList.contains('--not-u')) {
          target.classList.remove('--not-u');
          return;
        }

        let parent = target.parentElement;
        while (parent && !parent.classList.contains('treelist')) {
          if (!parent.classList.contains('--not-u'))
            parent.classList.add('--not-u');
          parent = parent.parentElement;
        }

        const folderAttr = e.currentTarget.getAttribute('folder');
        const element = document.querySelector(
          `#mailboxlist [folder-id="${folderAttr}"]`,
        );

        if (element) {
          MailFavoriteFolder.#_currentFolder = folderAttr;
          element.dispatchEvent(
            new MouseEvent('contextmenu', {
              bubbles: true,
              cancelable: true,
              view: window,
              clientX: e.clientX,
              clientY: e.clientY,
            }),
          );
          setTimeout(() => {
            $('#rcm_folderlist').css('display', '');
          }, 10);
        }
      };

      html = html.tag('bnum-folder', attribs);
      previousLevel = currentLevel;
    }

    if (previousLevel !== null) {
      for (let i = 0; i <= previousLevel; i++) {
        html = html.tryEnd();
      }
    }

    html = html.tryEnd();

    document.getElementById('favorite-folders-list')?.remove?.();
    const generatedDom = html.generate_dom ? html.generate_dom() : html;
    document.getElementById('folderlist-content')?.prepend?.(generatedDom);
  }

  /**
   * Met à jour le libellé de l'action "Favoris" dans le menu contextuel.
   * @param {string|null} [folder] L'identifiant du dossier. Si null, tente de le récupérer via la sélection.
   * @override
   */
  update_context_menu(folder) {
    if (typeof folder !== 'string') folder = null;

    super.update_context_menu(folder);

    if (folder) {
      const links = document.querySelectorAll('.popover .favorite');
      if (links.length > 0) {
        for (const link of links) {
          if (this.get_env('favorites_folders')?.[folder]) {
            link.textContent = this.getLocalization('unset-to-favorite', {
              plugin: 'mel_metapage',
            });
          } else {
            link.textContent = this.getLocalization('set-to-favorite', {
              plugin: 'mel_metapage',
            });
          }
        }
      }
    } else {
      folder = document
        .querySelector('#layout-sidebar .selected')
        ?.getAttribute?.('folder-id');

      if (folder) this.update_context_menu(folder);
    }
  }

  /**
   * Récupère la liste des dossiers favoris depuis le serveur via le connecteur Bnum.
   * @async
   * @returns {Promise<void>}
   */
  async get_from_server() {
    const datas = await BnumConnector.connect(
      BnumConnector.connectors.mail_get_favorite_folder,
      {},
    );

    this.rcmail().env.favorites_folders = datas.datas;
  }

  /**
   * Envoie au serveur le nouvel état (favori ou non) d'un dossier.
   * @async
   * @param {string} folder L'identifiant du dossier à modifier.
   * @param {boolean} is_favorite L'état actuel du dossier (sera inversé).
   * @returns {Promise<Object>} Les données mises à jour renvoyées par le serveur.
   */
  async set_to_server(folder, is_favorite) {
    const datas = await BnumConnector.connect(
      BnumConnector.connectors.mail_toggle_favorite,
      {
        params: {
          _folder: folder,
          _state: !is_favorite,
        },
      },
    );

    return datas.datas;
  }
  //#endregion Plublic methods

  //#region Private methods

  /**
   * Enregistre les commandes Roundcube liées aux dossiers favoris.
   * @returns {this} L'instance courante pour le chaînage.
   * @private
   */
  _setup_commands() {
    this.rcmail().register_command(
      'toggle-favorite-folder',
      this._command_toggle_favorite_folder.bind(this),
      true,
    );

    return this;
  }

  /**
   * Exécute la commande de basculement d'un dossier en favori (ajout/suppression).
   * Identifie le dossier cible via le contexte ou la sélection actuelle.
   * @private
   */
  _command_toggle_favorite_folder() {
    if (this.rcmail().busy) return;

    const folder =
      MailFavoriteFolder.current_folder ??
      document
        .querySelector('#layout-sidebar .context-source')
        ?.getAttribute?.('folder-id') ??
      document
        .querySelector('#layout-sidebar .selected')
        ?.getAttribute?.('folder-id');

    if (!folder) return;

    if (MailFavoriteFolder.current_folder)
      MailFavoriteFolder.#_currentFolder = null;

    const is_favorite = this.get_env('favorites_folders')?.[folder] ?? false;

    (async () => {
      const data = await this.set_to_server(folder, is_favorite);
      this.rcmail().env.favorites_folders = data;
      this.update_visuel();
    })();
  }

  /**
   * Initialise l'écouteur pour l'affichage du menu contextuel (popover).
   * @returns {this} L'instance courante.
   * @private
   */
  _listenMenuClick() {
    $('bnum-icon-button.bnum-column__header__content').on(
      'shown.bs.popover',
      this.update_context_menu.bind(this),
    );

    return this;
  }

  /**
   * Configure l'ensemble des écouteurs d'événements.
   * @returns {this} L'instance courante.
   * @private
   * @override
   */
  _setup_listeners() {
    super._setup_listeners();
    return this._listenMenuClick();
  }

  /**
   * Générateur construisant la structure arborescente des dossiers favoris.
   * Calcule les niveaux, les dossiers parents et l'ordre d'affichage.
   * * @yields {Object} Un objet contenant l'identifiant du dossier et ses propriétés (selected, level, etc.).
   * @private
   */
  *_constructFavoriteTree() {
    const favorites = this.get_env('favorites_folders') || {};
    if (!favorites || Object.keys(favorites).length === 0) return;

    yield { folder: 'favorite', props: { selected: false, level: 0 } };

    let parentFolderAlreadyAdded = [];
    for (let { key: folder, value: props } of MelEnumerable.from(favorites)
      .orderBy((x) => this.get_env('mailboxes_list').indexOf(x.key))
      .select((x) => new MelKeyValuePair(x.key, x.value))) {
      const hasParent = folder.includes('/');

      if (folder.includes(this.balp())) {
        const balName =
          this.env('username') +
          '.-.' +
          folder.replace(this.balp() + '/', EMPTY_STRING).split('/')[0];
        if (!parentFolderAlreadyAdded.includes(balName)) {
          parentFolderAlreadyAdded.push(balName);

          yield {
            folder: balName,
            props: { selected: false, is_parent: true, level: 1 },
          };
        }
      } else {
        const balName = this.get_env('username');
        if (!parentFolderAlreadyAdded.includes(balName)) {
          parentFolderAlreadyAdded.push(balName);

          yield {
            folder: balName,
            props: { selected: false, is_parent: true, level: 1 },
          };
        }
      }

      if (hasParent) {
        const parents = folder.split('/');
        let key = null;

        for (const parent of parents) {
          key = key === null ? parent : `${key}/${parent}`;

          if (favorites[key]) continue;

          if (parentFolderAlreadyAdded.includes(parent)) continue;

          parentFolderAlreadyAdded.push(parent);
          yield {
            folder: parent,
            props: {
              selected: document
                .querySelector(`[folder-id="${key}"]`)
                ?.classList?.contains?.('selected'),
              is_parent: true,
              level: key.split('/').length + 1,
            },
          };
        }
      }

      if (parentFolderAlreadyAdded.includes(folder)) continue;
      parentFolderAlreadyAdded.push(folder);

      yield {
        folder,
        props: { ...props, level: folder.split('/').length + 1 },
      };
    }
  }

  /**
   * Vérifie si un dossier est marqué comme réduit (collapsed) dans les préférences.
   * @param {string} rel L'identifiant relatif du dossier.
   * @returns {boolean} True si le dossier est réduit.
   * @private
   */
  _is_collapsed_rel(rel) {
    let collapsed_folders =
      this.get_env('favorite_folders_collapsed') || EMPTY_STRING;

    if (collapsed_folders.includes('&&'))
      collapsed_folders = collapsed_folders.split('&&');
    else if (collapsed_folders !== '') collapsed_folders = [collapsed_folders];
    else collapsed_folders = [];

    return collapsed_folders.includes(rel);
  }
  //#endregion Private methods
}
