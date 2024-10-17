/* eslint-disable no-undef */
import {
  RcmailDialog,
  RcmailDialogButton,
} from '../../../mel_metapage/js/lib/classes/modal.js';
import { MelHtml } from '../../../mel_metapage/js/lib/html/JsHtml/MelHtml.js';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { MelLinkVisualizer, MelFolderLink, MelStoreLink } from './mel_link.js';
import { MelIconPrevisualiser } from '../../../mel_metapage/skins/mel_elastic/js_templates/blocks/icon_previsualiser.js';

export class LinkManager extends MelObject {
  constructor({
    displayButtonElement = $('.module_Links .melv2-card-pre'),
  } = {}) {
    super(displayButtonElement);
  }

  main(displayButtonElement) {
    super.main(displayButtonElement);

    if (rcmail.env.mel_portal_ulink) this.displayButton(displayButtonElement);

    this.displayLinks();

    this.bindActions();

    window.linkManager = this;

    if (window.linksPicturesLoaded) {
      onLoaded();
    }
  }

  /**
   * Créé la modale de création/modification d'un nouveau lien
   * @param {?string} id
   * @param {?string} title
   * @param {?string} url
   * @param {?string} icon
   */
  openLinkModal(id = null, title = null, url = null, icon = null) {
    let self = this;

    if (this.newLinkModal) {
      this.newLinkModal.show();
      this.getModalValue(id, title, url, icon);

      // this.bindModalActions();
    } else {
      const html = MelHtml.start
        .div()
        .row({ class: 'mx-2' })
        .span({ class: 'text-danger' })
        .text('*')
        .end()
        .text(rcmail.gettext('required_fields', 'mel_useful_link'))
        .end()
        .input({ id: 'mulc-id', type: 'hidden', value: id })
        .row({ class: 'mx-2' })
        .label({ class: 'span-mel t1 first', for: 'mulc-title' })
        .span({ class: 'text-danger' })
        .text('*')
        .end()
        .text(rcmail.gettext('link_name', 'mel_useful_link'))
        .end()
        .input({
          id: 'mulc-title',
          class: 'form-control input-mel required',
          required: true,
          placeholder: rcmail.gettext('link_title', 'mel_useful_link'),
          value: title,
        })
        .end()
        .row({ class: 'mx-2' })
        .label({ class: 'span-mel t1 first', for: 'mulc-url' })
        .span({ class: 'text-danger' })
        .text('*')
        .end()
        .text(rcmail.gettext('link_url', 'mel_useful_link'))
        .end()
        .input({
          id: 'mulc-url',
          class: 'form-control input-mel required',
          required: true,
          placeholder: 'URL',
          value: url,
        })
        .end()
        .row({ class: 'mr-1 mt-3 mx-2 align-items-center' })
        .label({ class: 'span-mel t1 first', for: 'mulc-url' })
        .text(rcmail.gettext('preview', 'mel_useful_link'))
        .end()
        .div({ class: 'link-block' })
        .div({ class: 'link-icon-container no-after' })
        .img({
          id: 'icon-image',
          class: `link-icon-image ${icon ? 'hidden' : ''}`,
          src: '',
          onerror: "imgError(this.id, 'no-image')",
          style: 'display:none',
        })
        .span({
          id: 'no-image',
          class: `link-icon-no-image ${icon ? 'hidden' : ''}`,
        })
        .end('span')
        .icon(icon ?? '', {
          id: 'link-icon',
          class: `link-with-icon ${!icon ? 'hidden' : ''}`,
        })
        .end('icon')
        .end('div')
        .end('div')
        .button({ id: 'change_icon', class: '' })
        .text(rcmail.gettext('change_icon', 'mel_useful_link'))
        .icon('edit')
        .end()
        .end('button')
        .end('row')
        .end('div')
        .generate();

      this.newLinkModal = new RcmailDialog(html, {
        title: id
          ? rcmail.gettext('update_new_link', 'mel_useful_link')
          : rcmail.gettext('create_new_link', 'mel_useful_link'),
        buttons: [
          new RcmailDialogButton(
            id
              ? rcmail.gettext('update', 'mel_useful_link')
              : rcmail.gettext('add', 'mel_useful_link'),
            {
              id: 'add-mel-link',
              classes: 'add-mel-link mel-button btn btn-secondary',
              click: () => {
                if (self.checkEmptyInputs()) this.addMelLink();
              },
            },
          ),
        ],
        options: { disable_show_on_start: true, height: 430 },
      });
      this.newLinkModal = this.newLinkModal.to_mel_dialog();
      this.newLinkModal.show();
      if (url && !icon) {
        this.displayIcon(url);
      }
      this.bindModalActions();
    }
  }

  /**
   * Créé la modale de modification d'un dossier
   * @param {?string} id
   * @param {?string} title
   */
  openFolderModal(id = null, title = null) {
    const html = MelHtml.start
      .div()
      .input({ id: 'mulc-id', type: 'hidden', value: id })
      .row({ class: 'mx-2' })
      .label({ class: 'span-mel t1 first', for: 'mulc-title' })
      .span({ class: 'text-danger' })
      .text('*')
      .end()
      .text(rcmail.gettext('folder_name', 'mel_useful_link'))
      .end()
      .input({
        id: 'folder-mulc-title',
        class: 'form-control input-mel required',
        required: true,
        placeholder: rcmail.gettext('link_title', 'mel_useful_link'),
        value: title,
      })
      .end()
      .end()
      .generate();

    this.newFolderModal = new RcmailDialog(html, {
      title: rcmail.gettext(
        rcmail.gettext('update_new_folder', 'mel_useful_link'),
        'mel_useful_link',
      ),
      buttons: [
        new RcmailDialogButton(rcmail.gettext('update', 'mel_useful_link'), {
          id: 'modify-mel-folder',
          classes: 'modify-mel-folder mel-button btn btn-secondary',
          click: () => {
            this.updateFolder(id);
          },
        }),
      ],
    });
  }

  /**
   * Créé la modale de bibliothèque d'application
   */
  openStoreModal() {
    const html = MelHtml.start
      .div({ class: 'container' })
      .row({ class: 'mx-2' })
      .div({ class: 'border-bottom-input-icon mb-2' })
      .input({
        type: 'text',
        placeholder: 'Rechercher',
        class: 'form-control input-mel border-bottom-input large-input',
        id: 'search-app',
        oninput: () => {
          this.searchInStore($('#search-app').val());
        },
      })
      .button({
        id: 'reset-search',
        class:
          'border-bottom-input-button close-button btn btn-secondary border-0',
      })
      .removeClass('mel-button')
      .icon('close')
      .end()
      .end('button')
      .end('div')
      .end('row')
      .row({ class: 'm-2 list-filter-container' })
      .span({ class: 'font-weight-bold' })
      .text(rcmail.gettext('category_filter', 'mel_useful_link'))
      .end('span')
      .div({ id: 'list-filters-container' })
      .end('div')
      .end('row')
      .row({ class: 'mx-2' })
      .span({
        id: 'not-found-app',
        class: 'w-100 text-center font-weight-bold',
      })
      .end()
      .ul({ id: 'list-store-app' })
      .end('ul')
      .end('row')
      .end()
      .generate();

    this.newStoreModal = new RcmailDialog(html, {
      title: rcmail.gettext('app_store_title', 'mel_useful_link'),
      options: { height: 600, minWidth: 700 },
    });
    this.loadStoreDialog();
  }

  /**
   * Ajoute un lien de la bibliothèque d'application dans les liens de l'utilisateur
   * @param {MelLinkVisualizer} link
   */
  addStoreLink(link) {
    link.callUpdate().then((data) => {
      if (data === link.id) {
        this.displayLink(link);
        this.loadStoreApp();
      }
    });
  }

  /**
   * Charge la bibliothèque d'application et ses fonctions
   */
  loadStoreDialog() {
    $('#reset-search').on('click', () => {
      $('#search-app').val('');
      this.filterList('all');
    });
    this.loadStoreApp();

    this.activeStoreCategories = [];
    this.loadStoreFilters();
  }

  /**
   * Fonction pour la recherche dans le store d'application
   * @param {string} input
   */
  searchInStore(input) {
    let foundLinks = [];
    Object.keys(rcmail.env.default_links).forEach((key) => {
      if (
        rcmail.env.default_links[key].name
          .toLowerCase()
          .includes(input.toLowerCase())
      ) {
        foundLinks.push(key);
      }
    });
    this.removeFilter();
    this.loadStoreApp([], foundLinks);
  }

  /**
   * Charge les applications de la bibliothèque
   * @param {Array} filter
   * @param {Array} foundLinks
   */
  loadStoreApp(filter = [], foundLinks = null) {
    $('#list-store-app').empty();
    this.storeCategories = [];
    let isLinks = false;

    for (const item in rcmail.env.default_links) {
      if (Object.hasOwnProperty.call(rcmail.env.default_links, item)) {
        const link = rcmail.env.default_links[item];

        if (foundLinks) {
          if (foundLinks.indexOf(item) !== -1) {
            let foundLink = new MelStoreLink(
              item,
              link.name,
              link.url,
              link.icon,
              link.description,
              this.linksIdList.includes(item) ? true : false,
            );

            foundLink.displayStoreLink().appendTo('#list-store-app');
            isLinks = true;
          }
          continue;
        }

        let filterPass = filter.length === 0 ? true : false;
        if (link.categories) {
          link.categories.forEach((value) => {
            if (this.storeCategories.indexOf(value) === -1) {
              this.storeCategories.push(value);
            }
            if (filter.length !== 0) {
              filterPass = filter.includes(value) ? true : false;
            }
          });
        }

        //!link.feedUr permet de ne pas mettre les anciens liens dans la boucle
        if (filterPass && !link.feedUrl) {
          let storeLink = new MelStoreLink(
            item,
            link.name,
            link.url,
            link.icon,
            link.description,
            this.linksIdList.includes(item) ? true : false,
          );
          storeLink.displayStoreLink().appendTo('#list-store-app');
          isLinks = true;
        }
      }
    }

    !isLinks
      ? $('#not-found-app').text(
          rcmail.gettext('not_found_link', 'mel_useful_link'),
        )
      : $('#not-found-app').text('');
  }

  /**
   * Charge les filtres de la bibliothèque d'application
   */
  loadStoreFilters() {
    if (this.storeCategories) {
      let html = MelHtml.start.ul({ id: 'list-filters' });
      html
        .li()
        .button({
          class: 'list-filter active',
          id: 'all',
          onclick: () => {
            this.filterList('all');
          },
        })
        .text('Tout')
        .end()
        .end('li');

      for (const categorie of this.storeCategories) {
        html
          .li()
          .button({
            class: 'list-filter',
            id: `${categorie}`,
            onclick: () => {
              this.filterList(categorie);
            },
          })
          .text(categorie)
          .end()
          .end('li');
      }
      html.end('ul');

      $('#list-filters-container').append(html.generate());
    }
  }

  /**
   * Filtre les applications de la bibliothèque d'application
   * @param {string} filter
   */
  filterList(filter) {
    if (filter === 'all') {
      this.activeStoreCategories = [];
    } else {
      const index = this.activeStoreCategories.indexOf(filter);
      if (index === -1) {
        this.activeStoreCategories.push(filter);
      } else {
        this.activeStoreCategories.splice(index, 1);
      }
    }
    this.loadStoreApp(this.activeStoreCategories);
    this.displayActiveCategories();
  }

  /**
   * Affiche les catégories actives dans le store d'application
   */
  displayActiveCategories() {
    let self = this;
    let active = false;
    $('#list-filters li button').each(function () {
      if (self.activeStoreCategories.includes($(this).attr('id'))) {
        $(this).addClass('active');
        active = true;
      } else {
        $(this).removeClass('active');
      }
    });

    if (!active) {
      $('#list-filters li button#all').addClass('active');
    }
  }

  /**
   * Supprime les filtres actifs
   */
  removeFilter() {
    this.activeStoreCategories = [];
    this.displayActiveCategories();
  }

  /**
   * Affiche les liens sur la page web
   */
  displayLinks() {
    let links_array = [];
    this.linksIdList = [];
    for (const links in rcmail.env.mul_items) {
      let link = rcmail.env.mul_items[links];
      link = JSON.parse(link);
      let linkVisualizer;

      if (link.links) {
        linkVisualizer = new MelFolderLink(link.id, link.title, link.links);
        linkVisualizer.displayFolder().appendTo('.links-items');
        for (const key in linkVisualizer.links) {
          let subLink = linkVisualizer.links[key];
          if (!subLink.icon) {
            if (!subLink.image) {
              subLink.image = LinkManager.fetchIcon(subLink.link);
            }
          } else {
            subLink.image = '';
          }

          //Correction problème icon false
          if (subLink.icon === 'false') {
            subLink.icon = '';
          }

          linkVisualizer.links[key] = new MelLinkVisualizer(
            subLink.id,
            subLink.title,
            subLink.link,
            subLink.image,
            true,
            subLink.icon,
          );
          linkVisualizer.links[key]
            .displaySubLink()
            .appendTo(`#links-container-${linkVisualizer.id}`);

          this.linksIdList.push(subLink.id);
        }
      } else {
        if (!link.icon) {
          if (!link.image) {
            link.image = LinkManager.fetchIcon(link.link);
          }
        } else {
          link.image = '';
        }

        //Correction problème icon false
        if (link.icon === 'false') {
          link.icon = '';
        }

        linkVisualizer = new MelLinkVisualizer(
          link.id,
          link.title,
          link.link,
          link.image,
          false,
          link.icon,
        );
        linkVisualizer.displayLink().appendTo('.links-items');

        this.linksIdList.push(link.id);
      }
      links_array.push(linkVisualizer);
    }

    $('<li class="link-space-end"></li>').appendTo('.links-items');
    this.bindRightClickActions();

    rcmail.env.mul_items = links_array;
  }

  /**
   * Affiche un lien sur la page web
   * @param {MelLinkVisualizer} link
   */
  displayLink(link) {
    link.displayLink().insertBefore('.link-space-end');
    this.saveLink(link);
  }

  /**
   * Affiche le bouton de création sur la page web
   */
  displayButton(selector) {
    let button = MelHtml.start
      .div({ class: 'mul_right_buttons' })
      .button({
        class: 'fixed_mulba',
        id: 'mulba',
      })
      .text('Ajouter')
      .icon('add_circle')
      .end()
      .end('button')
      .button({ id: 'app_store', class: 'mel-button-icon' })
      .text("Bibliothèque d'applications")
      .icon('widgets')
      .end()
      .end('button')
      .end('div');
    selector.append(button.generate());
  }

  /**
   * Sauvegarde un lien
   * @param {MelLinkVisualizer} link
   */
  saveLink(link) {
    this.bindRightClickActions(link.id);
    this.bindActions(link.id);
    rcmail.env.mul_items.push(link);
    this.linksIdList.push(link.id);
  }

  /**
   * Affiche un dossier sur la page web
   * @param {MelFolderLink} folder
   * @param {HTMLElement} location
   */
  displayFolder(folder, location = null) {
    const indexes = [];

    if (!location) {
      folder.displayFolder().insertBefore('.link-space-end');
    } else {
      folder.displayFolder().insertBefore(location);
    }

    for (const key in folder.links) {
      let subLink = folder.links[key];
      let index = rcmail.env.mul_items.findIndex(
        (item) => item.id === subLink.id,
      );
      indexes.push(index);

      this.removeContainer($('#link-block-' + subLink.id));

      subLink.displaySubLink().appendTo(`#links-container-${folder.id}`);
      this.bindRightClickActions(subLink.id);
      this.bindActions(subLink.id);
    }

    rcmail.env.mul_items = rcmail.env.mul_items.filter(
      (value, index) => !indexes.includes(index),
    );
    rcmail.env.mul_items.splice(Math.min(...indexes), 0, folder);

    this.bindRightClickActions(folder.id);
    this.bindActions(folder.id);
  }

  /**
   * Ajoute ou retire un lien d'un dossier
   * @param {MelFolderLink} folder
   * @param {MelLinkVisualizer} link
   */
  updateFolderLink(folder, link) {
    folder.addLink(link);
    folder.callFolderUpdate().then(() => {
      $('#link-block-' + link.id)
        .closest('.link-block-container')
        .remove();
      let index = rcmail.env.mul_items.findIndex((item) => item.id === link.id);
      rcmail.env.mul_items.splice(index, 1);

      link
        .displaySubLink(folder.isOpen)
        .appendTo(`#links-container-${folder.id}`);
      this.bindRightClickActions(link.id);
      this.bindActions(link.id);
    });
  }

  /**
   * Ajoute un lien dans la liste des liens de l'utilisateur
   */
  addMelLink() {
    let linkId = $(LinkManager.SELECTOR_MODAL_ID).val();
    let link;

    if (!linkId) {
      link = new MelLinkVisualizer(
        linkId,
        $(LinkManager.SELECTOR_MODAL_TITLE).val(),
        $(LinkManager.SELECTOR_MODAL_URL).val(),
        LinkManager.fetchIcon($(LinkManager.SELECTOR_MODAL_URL).val()),
        null,
        LinkManager.SELECTEDICON,
      );

      link.callUpdate().then((data) => {
        if (data !== link.id) {
          link.id = data;
          this.displayLink(link);
        }
        this.newLinkModal.hide();
      });
    } else {
      for (const key in rcmail.env.mul_items) {
        const item = rcmail.env.mul_items[key];
        if (item.id === linkId) {
          link = item;
          let savelink = { ...link };

          link.title = $(LinkManager.SELECTOR_MODAL_TITLE).val();
          link.link = $(LinkManager.SELECTOR_MODAL_URL).val();
          link.image = LinkManager.fetchIcon(
            $(LinkManager.SELECTOR_MODAL_URL).val(),
          );
          link.icon = LinkManager.SELECTEDICON;

          link.callUpdate().then((data) => {
            this.newLinkModal.hide();
            if (!data) {
              link.title = savelink.title;
              link.link = savelink.link;
              link.image = savelink.image;
              link.icon = savelink.icon;
            }
          });
          break;
        } else if (this.isFolder(item)) {
          let findLink = item.getLink(linkId);
          if (findLink) {
            let savelink = { ...findLink };
            findLink.title = $(LinkManager.SELECTOR_MODAL_TITLE).val();
            findLink.link = $(LinkManager.SELECTOR_MODAL_URL).val();
            findLink.image = LinkManager.fetchIcon(
              $(LinkManager.SELECTOR_MODAL_URL).val(),
            );
            findLink.icon = LinkManager.SELECTEDICON;

            item.callFolderUpdate().then((data) => {
              this.newLinkModal.hide();
              if (!data) {
                findLink.title = savelink.title;
                findLink.link = savelink.link;
                findLink.image = savelink.image;
                findLink.icon = savelink.icon;
              }
            });
            break;
          }
        }
      }
    }

    LinkManager.SELECTEDICON = null;
  }

  /**
   * Retourne un lien par son id
   * @param {string} id
   * @returns {MelLinkVisualizer | boolean} Return le lien ou false si pas trouvé
   */
  findLinkById(id) {
    for (const key in rcmail.env.mul_items) {
      const item = rcmail.env.mul_items[key];

      if (item.id === id) {
        return item;
      } else if (this.isFolder(item)) {
        let findLink = item.getLink(id);
        if (findLink) {
          return findLink;
        }
      }
    }

    return false;
  }

  /**
   * Trouve le dossier parent d'un lien
   * @param {MelLinkVisualizer} link
   * @returns {MelFolderLink | boolean} Return le dossier ou false si pas trouvé
   */
  findParentFolder(link) {
    for (const key in rcmail.env.mul_items) {
      const item = rcmail.env.mul_items[key];

      if (this.isFolder(item)) {
        let findLink = item.getLink(link.id);
        if (findLink) {
          return item;
        }
      }
    }

    return false;
  }

  /**
   * Vérifie si un lien est un dossier
   * @param {MelLinkVisualizer | MelFolderLink} link
   * @returns {Boolean}
   */
  isFolder(link) {
    if (link.links) return true;

    return false;
  }

  /**
   * Vérifie si un lien est dans un dossier
   * @param {MelLinkVisualizer | MelFolderLink} link
   * @returns {Boolean}
   */
  isInFolder(link) {
    if (link.inFolder === true) return true;

    return false;
  }

  /**
   * Supprime un lien
   * @param {string} id
   */
  deleteMelLink(id) {
    const link = this.findLinkById(id);

    if (
      confirm(
        link.links
          ? rcmail.gettext('confirm_delete_link_folder', 'mel_useful_link')
          : rcmail.gettext('confirm_delete_link_element', 'mel_useful_link'),
      )
    ) {
      if (this.isInFolder(link)) {
        let folder = this.findParentFolder(link);
        folder.removeLink(link);
        folder.callFolderUpdate().then(() => {
          $('#link-block-' + link.id).remove();
          this.linksIdList = this.linksIdList.filter((item) => item !== id);
        });
      } else if (this.isFolder(link)) {
        for (const key in link.links) {
          const element = link.links[key];
          this.linksIdList = this.linksIdList.filter(
            (item) => item !== element.id,
          );
        }
        link.callDelete();
      } else {
        link.callDelete();
        this.linksIdList = this.linksIdList.filter((item) => item !== id);
      }
    }
  }

  /**
   * Met a jour le titre d'une modale
   * @param {string} id
   */
  updateFolder(id) {
    let folder = rcmail.env.mul_items.find(function (objet) {
      return objet.id === id;
    });

    folder.title = $(LinkManager.FOLDER_SELECTOR_MODAL_TITLE).val();

    folder.callFolderUpdate().then(() => {
      this.newFolderModal.destroy();
    });
  }

  /**
   * Retire un lien d'un dossier pour l'ajouter dans la liste de l'utilisateur
   * @param {MelFolderLink} folder
   * @param {MelLinkVisualizer} link
   * @param {string} id
   * @param {int} targetIndex
   * @param {?HTMLElement} location
   */
  TakeOutLinkFromFolder(folder, link, id, targetIndex, location = null) {
    folder.removeLink(link);

    //On supprime le dossier s'il n'y a plus aucun lien
    if (Object.keys(folder.links).length === 0) {
      link.callUpdate().then(() => {
        if (!location) {
          link.displayLink().insertBefore('.link-space-end');
        } else {
          link.displayLink().insertBefore(location);
        }
        this.saveLink(link);
      });
      folder.callFolderDelete();

      this.updateList(id, targetIndex);
    } else {
      folder.callFolderUpdate().then(() => {
        link.callUpdate().then(() => {
          $('#link-block-' + link.id).remove();

          if (!location) {
            link.displayLink().insertBefore('.link-space-end');
          } else {
            link.displayLink().insertBefore(location);
          }
          this.saveLink(link);

          if (targetIndex !== -1) {
            this.updateList(id, targetIndex);
          }
        });
        //Si il ne reste plus qu'un lien dans le dossier, on le sort et supprime le dossier
        // if (Object.keys(folder.links).length === 1) {
        // 	this.TakeOutLinkFromFolder(
        // 		folder,
        // 		folder.links[Object.keys(folder.links)[0]],
        // 	);
        // }
      });
    }
  }

  /**
   * Bind des actions liés aux liens
   * @param {?string} id on met l'id si on active les actions pour un nouveau lien
   */
  bindActions(id = null) {
    let self = this;
    let _id = id ? `#link-block-${id} ` : '';

    if (!id) {
      $(LinkManager.CREATE_BUTTON).on('click', function () {
        self.openLinkModal();
      });
      $(LinkManager.APP_STORE).on('click', function () {
        self.openStoreModal();
      });
    }

    $(_id + LinkManager.COPY_LINK).on('click', function (e) {
      mel_metapage.Functions.copy($(e.currentTarget).attr('data-link'));
    });

    $(_id + LinkManager.MODIFY_LINK).on('click', function (e) {
      self.openLinkModal(
        $(e.currentTarget).attr('data-id'),
        $(e.currentTarget).attr('data-title'),
        $(e.currentTarget).attr('data-link'),
        $(e.currentTarget).attr('data-icon'),
      );
    });

    $(_id + LinkManager.DELETE_LINK).on('click', function (e) {
      self.deleteMelLink($(e.currentTarget).attr('data-id'));
    });

    $(_id + LinkManager.MODIFY_FOLDER).on('click', function (e) {
      self.openFolderModal(
        $(e.currentTarget).attr('data-id'),
        $(e.currentTarget).attr('data-title'),
      );
    });

    $(_id + LinkManager.DELETE_FOLDER).on('click', function (e) {
      self.deleteMelLink($(e.currentTarget).attr('data-id'));
    });

    if (!id) {
      document.addEventListener('dragenter', function (event) {
        if (event.target.classList.contains('link-space-between')) {
          event.target.classList.add('link-space-hovered');
        }
        const linkBlock = event.target.closest(
          '.link-block:not(.multilink-open)',
        );
        if (
          linkBlock &&
          !linkBlock.parentElement.classList.contains('multilink-container')
        ) {
          linkBlock.classList.add('link-block-hovered');
        }
      });

      document.addEventListener('dragleave', function (event) {
        if (event.target.classList.contains('link-space-between')) {
          event.target.classList.remove('link-space-hovered');
        }
        if (event.target.closest('.link-block.link-block-hovered')) {
          event.target
            .closest('.link-block.link-block-hovered')
            .classList.remove('link-block-hovered');
        }
      });

      document.addEventListener(
        'dragover',
        function (event) {
          // Empêche le comportement par défaut afin d'autoriser le drop
          event.preventDefault();
        },
        false,
      );

      document.addEventListener('drop', function (event) {
        event.preventDefault();

        let data = JSON.parse(event.dataTransfer.getData('text/plain'));

        let id = data.id;

        let movedElement = $('#link-block-' + id);
        let movedContainer = movedElement.closest('.link-block-container');

        let targetElement = $(event.target);
        let targetContainer = targetElement.closest('.link-block-container');

        let targetIndex = $('.link-block-container').index(targetContainer);
        let elementIndex = $('.link-block-container').index(movedContainer);

        //Si on déplace un element d'un dossier non ouvert
        if (movedElement.hasClass('sublink')) {
          targetElement.removeClass('multilink-block-hovered');
          targetElement.removeClass('link-space-hovered');
          return;
        }
        //Si on sort un lien d'un dossier
        if (data.inFolder) {
          let link = self.findLinkById(id);
          let folder = self.findParentFolder(link);
          //TODO Mettre à jours rcmail.env.mul_items
          self.TakeOutLinkFromFolder(
            folder,
            link,
            id,
            targetIndex,
            targetElement.hasClass('link-space-end') ? null : targetContainer,
          );
          return;
        }

        //Si on déplace l'élément
        if (targetElement.hasClass('link-space-between')) {
          targetElement.removeClass('link-space-hovered');

          self.updateList(id, targetIndex, targetContainer, movedContainer);
          return;
        }
        if (targetElement.hasClass('link-space-end')) {
          self.updateList(id, targetIndex, targetElement, movedContainer);
          return;
        }

        //Si on le rajoute dans un dossier
        if (
          targetElement.hasClass('multilink-icon-container') ||
          targetElement.hasClass('sublink') ||
          targetElement.hasClass('multilink-container')
        ) {
          targetElement.removeClass('multilink-block-hovered');
          if (!rcmail.env.mul_items[elementIndex].links) {
            self.updateFolderLink(
              rcmail.env.mul_items[targetIndex],
              rcmail.env.mul_items[elementIndex],
            );
          }
        }

        //Si on crée un dossier
        else {
          targetElement
            .closest('.link-block.link-block-hovered')
            .removeClass('link-block-hovered');

          //Si le target n'est pas déjà un dossier
          if (!rcmail.env.mul_items[targetIndex].links) {
            //Si on déplace un dossier dans un dossier
            if (rcmail.env.mul_items[elementIndex].links) return;

            let _melFolder = new MelFolderLink('', 'Dossier', [
              rcmail.env.mul_items[elementIndex],
              rcmail.env.mul_items[targetIndex],
            ]);
            _melFolder.callFolderUpdate().then((data) => {
              if (data !== _melFolder.id) {
                _melFolder.id = data;
                self.displayFolder(_melFolder, targetContainer);
              }
            });
          }
          //Si on ajoute un lien dans un dossier
          else {
            targetElement.removeClass('multilink-block-hovered');
            if (!rcmail.env.mul_items[elementIndex].links) {
              self.updateFolderLink(
                rcmail.env.mul_items[targetIndex],
                rcmail.env.mul_items[elementIndex],
              );
            }
          }
        }
      });
    }
  }

  /**
   * Met a jour l'ordre des liens
   * @param {string} id
   * @param {int} newIndex Nouvelle position de l'icone dans le DOM
   */
  updateList(id, newIndex, targetContainer = null, movedContainer = null) {
    const busy = rcmail.set_busy(true, 'loading');
    rcmail.env.mul_items.find(function (object, index) {
      if (object.id === id) {
        //On met l'objet dans la bonne position après le déplacement
        rcmail.env.mul_items.splice(
          newIndex,
          0,
          rcmail.env.mul_items.splice(index, 1)[0],
        );

        return mel_metapage.Functions.post(
          mel_metapage.Functions.url('useful_links', 'update_list'),
          { _list: rcmail.env.mul_items, _key: rcmail.env.mul_items_key },
          (data) => {
            rcmail.set_busy(false, 'loading', busy);
            if (data != 1) {
              rcmail.display_message(
                "Erreur lors de l'enregistrement",
                'error',
              );
            } else {
              if (targetContainer && movedContainer) {
                targetContainer.before(movedContainer);
              }
            }
          },
        );
      }
    });
  }

  /**
   * Bind des actions liés à la modale
   */
  bindModalActions() {
    let self = this;

    $(
      `${LinkManager.SELECTOR_MODAL_URL}, ${LinkManager.SELECTOR_MODAL_TITLE}`,
    ).on('change', function () {
      if ($(LinkManager.SELECTOR_MODAL_URL).val())
        self.displayIcon($(LinkManager.SELECTOR_MODAL_URL).val());
    });

    $(LinkManager.SELECTOR_MODAL_IMAGE).on('error', function () {
      imgError(
        $(this).attr('id'),
        'no-image',
        $(LinkManager.SELECTOR_MODAL_TITLE).val(),
      );
    });

    $(LinkManager.ADD_STORE_BUTTON).on('click', () => {
      LinkManager.previsualiser.create_popup("Changer d'icone");
    });

    MEL_ELASTIC_UI.update_tabs();
  }

  /**
   * Bind des actions au clique droit pour les liens (suppression, modification...)
   * @param {string} id on met l'id pour un nouveau lien
   */
  bindRightClickActions(id = null) {
    let _id = id ? `#link-block-${id}` : '';
    // Open the context menu on right-click
    $(`${_id}.link-block`).on('contextmenu', function (event) {
      event.preventDefault();

      if ($(this).hasClass('multilink-open') || $(this).hasClass('sublink'))
        return;

      const contextMenu = $('#context-menu-' + $(this).data('id'));

      if (LinkManager.CONTEXTMENUOPENED) {
        LinkManager.CONTEXTMENUOPENED.hide();
      }

      // Show the context menu
      contextMenu.show();
      LinkManager.CONTEXTMENUOPENED = contextMenu;

      $(document).on('click', function () {
        if (
          !contextMenu.is(event.target) &&
          contextMenu.has(event.target).length === 0
        ) {
          contextMenu.hide();
          LinkManager.CONTEXTMENUOPENED = false;
        }
      });
    });
  }

  /**
   * Reset les informations précédentes de la modale
   * @param {string} id
   * @param {string} title
   * @param {string} url
   */
  getModalValue(id = null, title = null, url = null, icon = null) {
    $(LinkManager.SELECTOR_MODAL_ID).val(id);
    $(LinkManager.SELECTOR_MODAL_TITLE).val(title);
    $(LinkManager.SELECTOR_MODAL_URL).val(url);
    $(LinkManager.SELECTOR_MODAL_ICON).text('');

    if (url) {
      this.displayIcon(url);
    } else {
      $(LinkManager.SELECTOR_MODAL_IMAGE).attr('src', '');
      $(LinkManager.SELECTOR_MODAL_IMAGE).css('display', 'none');
    }

    if (icon) {
      LinkManager.toggleIcon(icon);
    }

    if (id) {
      $('.add-mel-link').text(rcmail.gettext('update', 'mel_useful_link'));
    } else {
      $('.add-mel-link').text(rcmail.gettext('add', 'mel_useful_link'));
    }
  }

  /**
   * Affiche l'icone du lien
   * @param {string} url Url du lien
   */
  displayIcon(url) {
    $(LinkManager.SELECTOR_MODAL_IMAGE).css('display', 'flex');
    $(LinkManager.SELECTOR_MODAL_NO_IMAGE).css('display', 'none');
    LinkManager.toggleImage();

    const validProtocol = /^https?:\/\//i;

    if (!validProtocol.test(url)) {
      // Si le protocole n'est pas présent, ajoute 'https://' avant l'URL
      url = 'https://' + url;
    } else if (url === 'https://') {
      url = '';
    }

    $(LinkManager.SELECTOR_MODAL_URL).val(url);

    const apiUrl = LinkManager.fetchIcon(url);

    $(LinkManager.SELECTOR_MODAL_IMAGE).attr('src', apiUrl);
  }

  /**
   * Récupère le nom de domaine de l'url pour retourner l'url de l'icone
   * @param {string} url Url du lien
   * @return {string} Url de l'icone
   */
  static fetchIcon(url) {
    let domain = '';
    try {
      domain = new URL(url).hostname;
    } catch (error) {
      console.error('Erreur :', error.message);
      return null;
    }

    return rcmail.env.external_icon_url + domain;
  }

  /**
   * Helpers functions
   */

  /**
   * Affiche l'icone et cache l'image
   * @param {string} icon
   */
  static toggleIcon(icon = null) {
    $(LinkManager.SELECTOR_MODAL_IMAGE).addClass('hidden');
    $(LinkManager.SELECTOR_MODAL_NO_IMAGE).addClass('hidden');
    $(LinkManager.SELECTOR_MODAL_ICON).removeClass('hidden');
    if (icon) $(LinkManager.SELECTOR_MODAL_ICON).text(icon);
  }

  /**
   * Affiche l'image et cache l'icone
   */
  static toggleImage() {
    $(LinkManager.SELECTOR_MODAL_IMAGE).removeClass('hidden');
    $(LinkManager.SELECTOR_MODAL_NO_IMAGE).removeClass('hidden');
    $(LinkManager.SELECTOR_MODAL_ICON).addClass('hidden');
  }

  /**
   * Supprime le container le plus proche de l'élément passé en paramètre
   * @param {HTMLElement} target
   */
  removeContainer(target) {
    target.closest('.link-block-container').remove();
  }

  /**
   * Vérifie si les champs de la modale ne sont pas vides
   * @return {boolean}
   */
  checkEmptyInputs() {
    const titleInput = $(LinkManager.SELECTOR_MODAL_TITLE);
    const urlInput = $(LinkManager.SELECTOR_MODAL_URL);

    if (!titleInput.val()) {
      titleInput.addClass('error');
      return false;
    } else {
      titleInput.removeClass('error');
    }

    if (!urlInput.val()) {
      urlInput.addClass('error');
      return false;
    } else {
      urlInput.removeClass('error');
    }

    return true;
  }

  /**
   * Affiche la première lettre si l'image n'est pas trouvée
   * @param {string} iconId Id de l'image
   * @param {string} iconId Id de l'overlay si l'image n'est pas chargée
   * @param {string} title Titre du lien
   */
  static imgError(e) {
    let $image = $(e.currentTarget).removeAttr('data-src').parent();
    const title = $image.parent().attr('title');
    console.log('error', e, title);
    $(e.currentTarget).addClass('hidden');
    $image.find('bnum-icon').addClass('hidden');
    $image
      .find('span')
      .removeClass('hidden')
      .text(title?.[0] || '?')
      .css({ display: 'block', 'text-align': 'center' });
    // let iconImage = $('#' + iconId);
    // let noImage = $('#' + noImageId);
    // const firstLetter = title
    //   ? title[0].toUpperCase()
    //   : $('#mulc-title').val()
    //     ? $('#mulc-title').val()[0].toUpperCase()
    //     : null;
    // iconImage.hide();
    // if (noImage.text() === '') {
    //   noImage.html(firstLetter);
    // }
    // noImage.css('display', 'flex');
  }
}

/**
 * @static
 * @const
 * @type {string}
 * @default '#mulc-id'
 */
LinkManager.SELECTOR_MODAL_ID = '#mulc-id';

/**
 * @static
 * @const
 * @type {string}
 * @default '#mulc-title'
 */
LinkManager.SELECTOR_MODAL_TITLE = '#mulc-title';

/**
 * @static
 * @const
 * @type {string}
 * @default '#folder-mulc-title'
 */
LinkManager.FOLDER_SELECTOR_MODAL_TITLE = '#folder-mulc-title';

/**
 * @static
 * @const
 * @type {string}
 * @default '#mulc-url'
 */
LinkManager.SELECTOR_MODAL_URL = '#mulc-url';

/**
 * @static
 * @const
 * @type {string}
 * @default '#icon-image'
 */
LinkManager.SELECTOR_MODAL_IMAGE = '#icon-image';

/**
 * @static
 * @const
 * @type {string}
 * @default '#no-image'
 */
LinkManager.SELECTOR_MODAL_NO_IMAGE = '#no-image';

/**
 * @static
 * @const
 * @type {string}
 * @default '#link-icon'
 */
LinkManager.SELECTOR_MODAL_ICON = '#link-icon';

/**
 * @static
 * @const
 * @type {string}
 * @default '#mulba'
 */
LinkManager.CREATE_BUTTON = '#mulba';

/**
 * @static
 * @const
 * @type {string}
 * @default '#app_store'
 */
LinkManager.APP_STORE = '#app_store';

/**
 * @static
 * @const
 * @type {string}
 * @default '.add-store-link'
 */
LinkManager.ADD_STORE_LINK = '.add-store-link';

/**
 * @static
 * @const
 * @type {string}
 * @default '#change_icon'
 */
LinkManager.ADD_STORE_BUTTON = '#change_icon';

/**
 * @static
 * @const
 * @type {string}
 * @default '.copy-link'
 */
LinkManager.COPY_LINK = '.copy-link';

/**
 * @static
 * @const
 * @type {string}
 * @default '.modify-link'
 */
LinkManager.MODIFY_LINK = '.modify-link';

/**
 * @static
 * @const
 * @type {string}
 * @default '.delete-link'
 */
LinkManager.DELETE_LINK = '.delete-link';

/**
 * @static
 * @const
 * @type {string}
 * @default '.modify-folder'
 */
LinkManager.MODIFY_FOLDER = '.modify-folder';

/**
 * @static
 * @const
 * @type {string}
 * @default '.delete-folder'
 */
LinkManager.DELETE_FOLDER = '.delete-folder';

/**
 * @static
 * @const
 * @type {string}
 * @default 'null'
 */
LinkManager.SELECTEDICON = null;

/**
 * @static
 * @const
 * @type {string}
 * @default 'null'
 */
LinkManager.DISPLAYIMAGE = null;

/**
 * @static
 * @const
 * @type {string}
 * @default 'null'
 */
LinkManager.CONTEXTMENUOPENED = null;

/**
 * @static
 * @const
 * @type {Array}
 */
LinkManager.preview_icon = [
  'home',
  'settings',
  'favorite',
  'mail',
  'calendar_month',
  'forum',
  'workspaces',
  'folder_open',
  'chat',
  'call',
  'search',
  'description',
  'folder',
  'check',
  'check_box',
  'verified_user',
  'add',
  'delete',
  'person',
  'manage_accounts',
  'group',
  'contacts',
  'share',
  'thumb_up',
  'public',
  'language',
  'account_circle',
  'info',
  'visibility',
  'calendar_today',
  'schedule',
  'help',
  'error',
  'bookmark',
  'notifications',
  'edit',
  'photo_camera',
  'image',
  'location_on',
  'map',
  'explore',
  'star',
  'apps',
  'music_note',
  'picture_as_pdf',
  'fullscreen',
  'terminal',
  'file_open',
  'create_new_folder',
  'token',
  'heart_plus',
  'monitoring',
  'database',
  'sell',
  'work',
  'view_kanban',
  'sync_saved_locally',
  'eco',
  'lock',
];

/**
 * @static
 * @type {MelIconPrevisualiser}
 */
LinkManager.previsualiser = new MelIconPrevisualiser({
  add_default_action_default_buttons: true,
  add_defaults_actions: true,
  generate_defaults_icons: false,
});

LinkManager.previsualiser.addCustomIcons(LinkManager.preview_icon);

LinkManager.previsualiser.on_create_default_items.push(() => {
  let image_url = LinkManager.fetchIcon(
    $(LinkManager.SELECTOR_MODAL_URL).val(),
  );
  return MelHtml.start
    .div()
    .button({ class: 'image-preview' })
    .css({ 'background-image': `url('${image_url}')` })
    .attr('onmouseenter', () => {
      $('#bnum-folder-main-icon').css({
        'background-image': 'url(' + image_url + ')',
        'background-size': 'contain',
      });
      $('#bnum-folder-main-icon .material-symbols-outlined').hide();
    })
    .attr('onmouseleave', () => {
      if (!LinkManager.DISPLAYIMAGE) {
        $('#bnum-folder-main-icon').css('background-image', 'none');
        $('#bnum-folder-main-icon .material-symbols-outlined').show();
      }
    })
    .attr('onclick', function (e) {
      LinkManager.previsualiser._on_default_click(e);
      setTimeout(() => {
        $('#bnum-folder-main-icon').css({
          'background-image': 'url(' + image_url + ')',
          'background-size': 'contain',
        });
      }, 50);
      LinkManager.DISPLAYIMAGE = image_url;
    })
    .icon(' ')
    .css({ display: 'none' })
    .end()
    .end()
    .end();
});

LinkManager.previsualiser.on_button_click.push(() => {
  LinkManager.DISPLAYIMAGE = null;
  if ($('#bnum-folder-main-icon').css('background-image')) {
    $('#bnum-folder-main-icon').css('background-image', 'none');
  }
});

LinkManager.previsualiser.on_button_hover.push(() => {
  if (LinkManager.DISPLAYIMAGE) {
    $('#bnum-folder-main-icon').css('background-image', 'none');
  }
});

LinkManager.previsualiser.on_button_leave.push(() => {
  if (LinkManager.DISPLAYIMAGE) {
    $('#bnum-folder-main-icon').css(
      'background-image',
      'url(' + LinkManager.DISPLAYIMAGE + ')',
    );
  }
});

LinkManager.previsualiser.on_create_show_selected.push(() => {
  return '';
});

LinkManager.previsualiser.on_save.push((popup, $dialog) => {
  LinkManager.SELECTEDICON = null;
  LinkManager.DISPLAYIMAGE = null;
  if (popup.get_selected_icon() !== ' ') {
    LinkManager.SELECTEDICON = popup.get_selected_icon();
    LinkManager.toggleIcon(LinkManager.SELECTEDICON);
  } else {
    LinkManager.toggleImage();
  }

  $($dialog).dialog('close');
});

window.addEventListener('load', function () {
  onLoaded();
  setTimeout(() => {
    onLoaded();
  }, 1000);
});
//#region Chargement
/**
 * Charge tout les avatars qui ont besoin d'être chargés.
 * @package
 */
function onLoaded() {
  let imagesToLoad = document.querySelectorAll(
    '.link-block-container [data-src]',
  );

  for (const image of imagesToLoad) {
    image.onload = function (pict) {
      pict.onload = null;
      pict.removeAttribute('data-src');
    }.bind(this, image);
    image.setAttribute('src', image.dataset.src);
  }

  window.linksPicturesLoaded = true;
}
//#endregion
