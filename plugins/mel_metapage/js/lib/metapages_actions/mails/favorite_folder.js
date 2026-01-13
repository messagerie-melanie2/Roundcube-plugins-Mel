import { HTMLBnumFolder } from '../../../../../../skins/mel_elastic/design-system/ds-module-bnum.js';
import { MelEnumerable, MelKeyValuePair } from '../../classes/enum.js';
import { EMPTY_STRING } from '../../constants/constants.js';
import { BnumConnector } from '../../helpers/bnum_connections/bnum_connections.js';
import { MelJsHtml } from '../../html/JsHtml/JsMelHtml.js';
import { AFolderModifier } from './afolder_modifier.js';

export class MailFavoriteFolder extends AFolderModifier {
  static #_currentFolder = null;
  static get current_folder() {
    if (
      this.#_currentFolder &&
      !document.querySelector('#rcm_folderlist').checkVisibility()
    )
      this.#_currentFolder = null;

    return this.#_currentFolder;
  }
  #_loadFinished = false;
  constructor() {
    super();
    this.#_loadFinished = true;
  }

  get load_finished() {
    return this.#_loadFinished;
  }

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

  _setup_commands() {
    this.rcmail().register_command(
      'toggle-favorite-folder',
      this._command_toggle_favorite_folder.bind(this),
      true,
    );

    return this;
  }

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

  _listenMenuClick() {
    $('bnum-icon-button.bnum-column__header__content').on(
      'shown.bs.popover',
      this.update_context_menu.bind(this),
    );

    return this;
  }

  _setup_listeners() {
    return this._listenMenuClick();
  }

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

  _is_collapsed_rel(rel) {
    let collapsed_folders =
      this.get_env('favorite_folders_collapsed') || EMPTY_STRING;

    if (collapsed_folders.includes('&&'))
      collapsed_folders = collapsed_folders.split('&&');
    else if (collapsed_folders !== '') collapsed_folders = [collapsed_folders];
    else collapsed_folders = [];

    return collapsed_folders.includes(rel);
  }

  update_visuel() {
    super.update_visuel();

    const tree = this._constructFavoriteTree();

    let html = MelJsHtml.start.tag('bnum-tree', {
      class: 'treelist listing folderlist',
      id: 'favorite-folders-list',
      'aria-label': 'Dossiers favoris',
    });

    // Variable pour suivre le niveau de l'itération précédente
    let previousLevel = null;

    for (const { folder, props } of tree) {
      // 1. Déterminer le niveau actuel
      // Le dossier 'favorite' est forcé à 0, sinon on prend props.level
      const currentLevel = folder === 'favorite' ? 0 : props.level;

      // 2. Gestion de la fermeture des balises (.end())
      if (previousLevel !== null) {
        if (currentLevel > previousLevel) {
          // CAS 1 : On descend (enfant).
          // On ne ferme rien, on laisse la balise précédente ouverte pour y inclure celle-ci.
        } else if (currentLevel === previousLevel) {
          // CAS 2 : Même niveau (frère).
          // On ferme juste l'élément précédent.
          html = html.end();
        } else {
          // CAS 3 : On remonte (ex: niveau 2 vers niveau 0).
          // Il faut fermer l'élément courant + la différence de niveaux.
          const gap = previousLevel - currentLevel;
          // Si gap = 2 (de niv 2 à 0), on ferme 3 fois (le niv 2, le niv 1, et on revient au niv 0)
          for (let i = 0; i < gap + 1; i++) {
            html = html.end();
          }
        }
      }

      // 3. Construction des attributs (Votre code existant)
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
          // eslint-disable-next-line no-shadow
          const folder = e.currentTarget.getAttribute('folder');
          const element = document.querySelector(
            `#mailboxlist [folder-id="${folder}"]`,
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

        // eslint-disable-next-line no-shadow
        const folder = e.currentTarget.getAttribute('folder');
        const element = document.querySelector(
          `#mailboxlist [folder-id="${folder}"]`,
        );

        if (element) {
          MailFavoriteFolder.#_currentFolder = folder;
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
      // 4. Ouverture de la nouvelle balise
      html = html.tag('bnum-folder', attribs);

      // 5. Mise à jour du niveau précédent pour le prochain tour
      previousLevel = currentLevel;
    }

    // 6. Fermeture finale
    // Une fois la boucle finie, il reste des balises ouvertes.
    // Si le dernier élément était au niveau 2, il faut fermer le niv 2, le niv 1 et le niv 0.
    // Donc (previousLevel + 1) fois.
    if (previousLevel !== null) {
      try {
        for (let i = 0; i <= previousLevel; i++) {
          html = html.end();
        }
      } catch (error) {}
    }

    try {
      // Fermeture du conteneur parent 'bnum-tree'
      html = html.end();
    } catch (error) {}

    document.getElementById('favorite-folders-list')?.remove?.();
    // Note: j'ai ajouté .generate_dom() ici comme dans votre exemple original
    const generatedDom = html.generate_dom ? html.generate_dom() : html;
    document.getElementById('folderlist-content').prepend(generatedDom);
  }

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

  async get_from_server() {
    const datas = await BnumConnector.connect(
      BnumConnector.connectors.mail_get_favorite_folder,
      {},
    );

    this.rcmail().env.favorites_folders = datas.datas;
  }

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
}
