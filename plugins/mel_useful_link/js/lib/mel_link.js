/* eslint-disable no-undef */
import { MelHtml } from '../../../mel_metapage/js/lib/html/JsHtml/MelHtml.js';
import { BnumEvent } from '../../../mel_metapage/js/lib/mel_events.js';

export { MelLink, MelFolderLink, MelLinkVisualizer, MelStoreLink };

class MelBaseLink {
  constructor(id, title) {
    this._init()._setup(id, title);
  }

  _init() {
    this.id = '';
    this.title = '';

    this.on_prop_changed = new BnumEvent();

    return this;
  }

  _setup(id, title) {
    this.title = title;

    Object.defineProperties(this, {
      id: {
        get() {
          return id;
        },
        set: (value) => {
          id = value;
          this.on_prop_changed.call(value, 'id', this);
        },
      },
      title: {
        get() {
          return title;
        },
        set: (value) => {
          title = value;
          this.on_prop_changed.call(value, 'title', this);
        },
      },
    });

    return this;
  }

  /**
   * Appel Ajax pour supprimer un lien dans les préférences de l'utilisateur
   * @param {string} task
   * @param {string} action
   */
  callDelete(task = 'useful_links', action = 'delete') {
    const busy = rcmail.set_busy(true, 'loading');

    return mel_metapage.Functions.post(
      mel_metapage.Functions.url(task, action),
      { _id: this.id, _key: rcmail.env.mul_items_key },
      (datas) => {
        rcmail.set_busy(false, 'loading', busy);
        rcmail.display_message(
          'Suppression effectué avec succès !',
          'confirmation',
        );
        $('#link-block-' + this.id)
          .closest('.link-block-container')
          .remove();
        rcmail.env.mul_items.find((item, index) => {
          if (item.id === this.id) {
            rcmail.env.mul_items.splice(index, 1);
            return true;
          }
        });
      },
    );
  }
}

class MelLink extends MelBaseLink {
  constructor(id, title, link, inFolder = false) {
    super(id, title);
    this._setup_vars(link, inFolder);
  }

  _init() {
    super._init();
    this.link = '';
    this.inFolder = false;

    return this;
  }

  _setup_vars(link, inFolder) {
    this.link = link;
    this.inFolder = inFolder;

    return this;
  }
}

class MelFolderLink extends MelBaseLink {
  constructor(id, title, links, isOpen = false) {
    super(id, title);
    this._setup_vars(links, isOpen);
  }

  _init() {
    super._init();
    this.links = {};
    this.isOpen = false;

    return this;
  }

  _setup_vars(links, isOpen) {
    let _title = this.title;

    this.isOpen = this.isOpen;

    if (typeof links === 'object' && links !== null) {
      this.addLinks(links);
    } else this.addLink(links);

    Object.defineProperties(this, {
      title: {
        get() {
          return _title;
        },
        set: (value) => {
          _title = value;
          $(
            `.multilink-block[data-id="${this.id}"] .multilink-icon-title`,
          ).text(value);
        },
      },
    });

    return this;
  }

  getLink(id) {
    for (const key in this.links) {
      if (key === id) return this.links[key];
    }
  }

  updateLink(link) {
    for (const key in this.links) {
      if (key === link.id) {
        this.links[key] = link;
      }
    }
  }

  removeLink(link) {
    delete this.links[link.id];
  }

  addLink(link) {
    link.inFolder = true;
    this.links[link.id] = link;

    return this;
  }

  addLinks(links) {
    for (let key in links) {
      this.addLink(links[key]);
    }

    return this;
  }

  /**
   * Appel Ajax pour mettre à jour les liens d'un dossier
   * @param {string} task
   * @param {string} action
   */
  async callFolderUpdate(task = 'useful_links', action = 'update') {
    const busy = rcmail.set_busy(true, 'loading');

    let id = this.id;
    let link = {
      _id: id,
      _title: this.title,
      _link: this.links,
    };

    let message =
      this.id === ''
        ? 'Dossier créer avec succès !'
        : 'Dossier modifié avec succès !';

    await mel_metapage.Functions.post(
      mel_metapage.Functions.url(task, action),
      { link, _key: rcmail.env.mul_items_key },
      (datas) => {
        rcmail.set_busy(false, 'loading', busy);
        if (datas !== '') {
          rcmail.display_message(message, 'confirmation');
          id = datas;
        } else {
          rcmail.display_message(
            "Impossible d'ajouter ou de modifier ce lien.",
            'error',
          );
          id = false;
        }
      },
      (a, b, c) => {
        rcmail.display_message(
          'Impossible de créer ou de modifier ce dossier.',
          'error',
        );
        console.error(a, b, c);
        id = false;
      },
    );

    return id;
  }

  /**
   * Appel Ajax pour supprimer un ou des liens d'un dossier
   * @param {string} task
   * @param {string} action
   */
  callFolderDelete(task = 'useful_links', action = 'delete') {
    const busy = rcmail.set_busy(true, 'loading');

    return mel_metapage.Functions.post(
      mel_metapage.Functions.url(task, action),
      { _id: this.id, _key: rcmail.env.mul_items_key },
      (datas) => {
        rcmail.set_busy(false, 'loading', busy);
        rcmail.display_message(
          'Suppression effectué avec succès !',
          'confirmation',
        );
        $('#link-block-' + this.id)
          .closest('.link-block-container')
          .remove();
        rcmail.env.mul_items.find((item, index) => {
          if (item.id === this.id) {
            rcmail.env.mul_items.splice(index, 1);
            return true;
          }
        });
      },
    );
  }

  /**
   * Fait passer l'id au moment du déplacement du lien
   * @param {Event} ev
   */
  _dragStart(ev) {
    ev = ev.dataTransfer ? ev : ev.originalEvent;
    ev.dataTransfer.dropEffect = 'move';
    if (ev.target.classList.contains('link-block-container')) {
      ev.dataTransfer.setData(
        'text/plain',
        JSON.stringify({ id: this.id, multifolder: true }),
      );
    } else {
      ev.dataTransfer.setData(
        'text/plain',
        JSON.stringify({
          id: $(ev.target).closest('.link-block').attr('data-id'),
          inFolder: true,
        }),
      );
    }
  }

  toggleMultilink() {
    if (!this.isOpen) 
      this.openMultilink();
    else
      this.closeMultilink();    
  }

  /**
   * Ouvre un dossier
   */
  openMultilink() {    
    //Si un autre dossier est déjà ouvert
    if (MelFolderLink.folderOpen) {
      this.closeMultilink(MelFolderLink.folderOpen.id);
      MelFolderLink.folderOpen.isOpen = false;
    }

    $('#link-block-' + this.id).removeClass('multilink-close');
    $('#link-block-' + this.id).addClass('multilink-open');
    $(`#link-block-${this.id} li.link-block`).removeClass('sublink');

    MelFolderLink.folderOpen = this;
    this.isOpen = true;
  }

  /**
   * Ferme un dossier
   */
  closeMultilink(id = this.id) {
    $('#link-block-' + id).addClass('multilink-close');
    $('#link-block-' + id).removeClass('multilink-open');
    $(`#link-block-${id} li.link-block`).addClass('sublink');

    this.isOpen = false;
  }

  /**
   * Affichage d'un dossier
   */
  displayFolder() {
    return MelHtml.start
      .div({
        class: 'link-block-container',
        draggable: true,
        ondragstart: this._dragStart.bind(this),
      })
      .li({ class: 'link-space-between' })
      .end()
      .li({
        id: 'link-block-' + this.id,
        title: this.title,
        class: 'link-block multilink-block multilink-close',
        'data-id': this.id,
      })
      .div({
        id: 'context-menu-' + this.id,
        class: 'link-context-menu folder-context-menu',
      })
      .button({
        class: 'link-context-menu-button modify-folder',
        title: 'Modifier le nom du dossier',
        'data-id': this.id,
        'data-title': this.title,
      })
      .removeClass('mel-button')
      .removeClass('no-button-margin')
      .removeClass('no-margin-button')
      .css({ border: 'none', outline: 'none' })
      .icon('edit')
      .end()
      .end()
      .button({
        class: 'link-context-menu-button delete-folder',
        title: 'Supprimer le dossier',
        'data-id': this.id,
      })
      .removeClass('mel-button')
      .removeClass('no-button-margin')
      .removeClass('no-margin-button')
      .css({ border: 'none', outline: 'none' })
      .icon('delete')
      .end()
      .end()
      .end()
      .div({
        id: 'link-id-' + this.id,
        class: 'multilink-icon-container',
        onclick: this.toggleMultilink.bind(this),
      })
      .ul({
        id: 'links-container-' + this.id,
        class: 'multilink-container m-2 p-0',
      })
      .end()
      .end()
      .span({ id: 'multilink-title-' + this.id, class: 'multilink-icon-title' })
      .text(this.title)
      .end()
      .end()
      .end()
      .generate();
  }
}

/**
 * @static
 * @const
 * @type {string}
 * @default 'false'
 */
MelFolderLink.folderOpen = false;

class MelLinkVisualizer extends MelLink {
  constructor(id, title, link, image, inFolder = false, icon = null) {
    super(id, title, link, inFolder);
    this._setup_image(image);
    this._setup_icon(icon);
  }

  _init() {
    super._init();
    this.image = '';
    this.icon = '';

    return this;
  }

  _setup_icon(icon) {
    let _icon = icon;

    Object.defineProperties(this, {
      icon: {
        get() {
          return _icon;
        },
        set: (value) => {
          _icon = value;
          if (value) {
            $(`.link-block[data-id="${this.id}"] .link-icon-image`).addClass(
              'hidden',
            );
            $(`#no-image-${this.id}`).addClass('hidden');
            $(`#link-icon-${this.id}`).removeClass('hidden');
            $(`#link-icon-${this.id}`).text(value);
          } else {
            $(`.link-block[data-id="${this.id}"] .link-icon-image`).removeClass(
              'hidden',
            );
            $(`#no-image-${this.id}`).removeClass('hidden');
            $(`#link-icon-${this.id}`).addClass('hidden');
          }
          $(`.link-block[data-id="${this.id}"] button`).attr(
            'data-icon',
            value,
          );
        },
      },
    });
  }

  _setup_image(image) {
    let _image = image;
    let _title = this.title;
    let _link = this.link;

    Object.defineProperties(this, {
      image: {
        get() {
          return _image;
        },
        set: (value) => {
          _image = value;
          $(`.link-block[data-id="${this.id}"] .link-icon-image`).show();
          $(`#no-image-${this.id}`).css('display', 'initial').text('');
          $(`.link-block[data-id="${this.id}"] .link-icon-image`).attr(
            'src',
            value,
          );
        },
      },
      title: {
        get() {
          return _title;
        },
        set: (value) => {
          _title = value;
          $(`.link-block[data-id="${this.id}"] .link-icon-title`).text(value);
          $(`.link-block[data-id="${this.id}"] button`).attr(
            'data-title',
            value,
          );
        },
      },
      link: {
        get() {
          return _link;
        },
        set: (value) => {
          _link = value;
          //Change en jquery les data url par la nouvelle valeur
          $(`.link-block[data-id="${this.id}"] button`).attr(
            'data-link',
            value,
          );
          $(`a#link-id-${this.id}`).attr('href', value);
        },
      },
    });

    return this;
  }

  /**
   * Ajoute/Met à jour un lien
   * @param {string} task
   * @param {string} action
   */
  async callUpdate(task = 'useful_links', action = 'update') {
    const busy = rcmail.set_busy(true, 'loading');

    let id = this.id;
    let link = {
      _id: id,
      _title: this.title,
      _link: this.link,
      _image: this.image,
      _icon: this.icon,
    };

    let message =
      this.id === ''
        ? 'Ajout effectué avec succès !'
        : 'Modification effectuée avec succès !';

    await mel_metapage.Functions.post(
      mel_metapage.Functions.url(task, action),
      { link, _key: rcmail.env.mul_items_key },
      (datas) => {
        rcmail.set_busy(false, 'loading', busy);
        if (datas !== '') {
          rcmail.display_message(message, 'confirmation');
          id = datas;
        } else {
          rcmail.display_message(
            "Impossible d'ajouter ou de modifier ce lien.",
            'error',
          );
          id = false;
        }
      },
      (a, b, c) => {
        rcmail.display_message(
          "Impossible d'ajouter ou de modifier ce lien.",
          'error',
        );
        console.error(a, b, c);
        id = false;
      },
    );

    return id;
  }

  /**
   * Fait passer l'id au moment du déplacement du lien
   * @param {MelLinkVisualizer} link
   * @param {Event} ev
   */
  _dragStart(link, ev) {
    ev = ev.dataTransfer ? ev : ev.originalEvent;
    ev.dataTransfer.dropEffect = 'move';
    ev.dataTransfer.setData(
      'text/plain',
      JSON.stringify({ id: this.id, multifolder: false, link: link }),
    );
  }

  /**
   * Affiche le lien dans l'interface
   */
  displayLink() {
    let html = MelHtml.start
      .div({
        class: 'link-block-container',
        draggable: true,
        ondragstart: this._dragStart.bind(this, 'link'),
      })
      .li({ class: 'link-space-between' })
      .end('li')
      .li({
        id: 'link-block-' + this.id,
        title: this.title,
        class: 'link-block',
        'data-id': this.id,
      })
      .div({ id: 'context-menu-' + this.id, class: 'link-context-menu' })
      .button({
        class: 'link-context-menu-button copy-link',
        title: 'Copier le lien dans le presse-papier',
        'data-link': this.link,
      })
      .removeClass('mel-button')
      .removeClass('no-button-margin')
      .removeClass('no-margin-button')
      .css({ border: 'none', outline: 'none' })
      .icon('content_copy')
      .end('icon')
      .end('button')
      .button({
        class: 'link-context-menu-button modify-link',
        title: 'Modifier le lien',
        'data-id': this.id,
        'data-title': this.title,
        'data-link': this.link,
        'data-icon': this.icon,
      })
      .removeClass('mel-button')
      .removeClass('no-button-margin')
      .removeClass('no-margin-button')
      .css({ border: 'none', outline: 'none' })
      .icon('edit')
      .end('icon')
      .end('button')
      .button({
        class: 'link-context-menu-button delete-link',
        title: 'Supprimer le lien',
        'data-id': this.id,
      })
      .removeClass('mel-button')
      .removeClass('no-button-margin')
      .removeClass('no-margin-button')
      .css({ border: 'none', outline: 'none' })
      .icon('delete')
      .end('icon')
      .end('button')
      .end('div')
      .a({
        id: 'link-id-' + this.id,
        class: 'link-icon-container',
        href: this.link,
        target: '_blank',
      })
      .img({
        id: 'link-block-icon-image-' + this.id,
        class: `link-icon-image ${this.icon ? 'hidden' : ''}`,
        src: this.image,
        onerror:
          'imgError(this.id, `no-image-' +
          this.id +
          '`, `' +
          this.title[0] +
          '`)',
      })
      .span({
        id: 'no-image-' + this.id,
        class: `link-icon-no-image ${this.icon ? 'hidden' : ''}`,
      })
      .end('span')
      .icon(this.icon || '', {
        id: 'link-icon-' + this.id,
        class: `link-with-icon ${!this.icon ? 'hidden' : ''}`,
      })
      .end('icon')
      .end('a')
      .span({ class: 'link-icon-title' })
      .text(this.title)
      .end('span')
      .end('li')
      .end('div');

    return html.generate();
  }

  /**
   * Affiche un lien dans un dossier
   * @param {boolean} isOpen
   */
  displaySubLink(isOpen = false) {
    return MelHtml.start
      .li({
        id: 'link-block-' + this.id,
        title: this.title,
        class: `link-block ${isOpen ? '' : 'sublink'}`,
        'data-id': this.id,
        draggable: true,
        ondragstart: this._dragStart.bind(this, 'sublink'),
      })
      .div({ id: 'context-menu-' + this.id, class: 'link-context-menu' })
      .button({
        class: 'link-context-menu-button copy-link',
        title: 'Copier le lien dans le presse-papier',
        'data-link': this.link,
      })
      .removeClass('mel-button')
      .removeClass('no-button-margin')
      .removeClass('no-margin-button')
      .css({ border: 'none', outline: 'none' })
      .icon('content_copy')
      .end()
      .end()
      .button({
        class: 'link-context-menu-button modify-link',
        title: 'Modifier le lien',
        'data-id': this.id,
        'data-title': this.title,
        'data-link': this.link,
      })
      .removeClass('mel-button')
      .removeClass('no-button-margin')
      .removeClass('no-margin-button')
      .css({ border: 'none', outline: 'none' })
      .icon('edit')
      .end()
      .end()
      .button({
        class: 'link-context-menu-button delete-link',
        title: 'Supprimer le lien',
        'data-id': this.id,
      })
      .removeClass('mel-button')
      .removeClass('no-button-margin')
      .removeClass('no-margin-button')
      .css({ border: 'none', outline: 'none' })
      .icon('delete')
      .end()
      .end()
      .end()
      .a({
        id: 'link-id-' + this.id,
        class: 'link-icon-container',
        href: this.link,
        target: '_blank',
      })
      .img({
        id: 'link-block-icon-image-' + this.id,
        class: `link-icon-image ${this.icon ? 'hidden' : ''}`,
        src: this.image,
        onerror:
          'imgError(this.id, `no-image-' +
          this.id +
          '`, `' +
          this.title[0] +
          '`)',
      })
      .span({
        id: 'no-image-' + this.id,
        class: `link-icon-no-image ${this.icon ? 'hidden' : ''}`,
      })
      .end('span')
      .icon(this.icon || '', {
        id: 'link-icon-' + this.id,
        class: `link-with-icon ${!this.icon ? 'hidden' : ''}`,
      })
      .end('icon')
      .end()
      .span({ class: 'link-icon-title' })
      .text(this.title)
      .end()
      .end()
      .generate();
  }
}

class MelStoreLink extends MelLinkVisualizer {
  constructor(id, title, link, icon, description, inLinks = false) {
    super(id, title, link, null, null, icon);
    this._setup_vars(description, link, inLinks);
  }

  _init() {
    super._init();
    this.description = '';
    this.inLinks = false;

    return this;
  }

  _setup_vars(description, link, inLinks) {
    super._setup_vars(link, false);
    this.description = description;
    this.inLinks = inLinks;

    return this;
  }

  /**
   * Affiche un lien dans la modale de bibliothèque d'application
   */
  displayStoreLink() {
    return MelHtml.start
      .li({
        id: 'store-link-block-' + this.id,
        title: this.title,
        class: 'store-link-block',
        'data-id': this.id,
      })
      .div({ class: 'store-link-icon-container' })
      .icon(this.icon, { id: 'link-icon-' + this.id, class: 'link-with-icon' })
      .end('icon')
      .end('div')
      .div({ class: 'store-link-text' })
      .a({
        id: 'store-link-id-' + this.id,
        class: 'store-link-icon-title',
        href: this.link,
        target: '_blank',
      })
      .text(this.title)
      .end('a')
      .span({ class: 'store-link-icon-description' })
      .text(this.description)
      .end('span')
      .end('div')
      .button({
        class: `add-store-link mel-btn mel-btn-icon ${this.inLinks ? 'disabled' : ''}`,
        onclick: () => {
          window.linkManager.addStoreLink(this);
        },
      })
      .span()
      .text(this.inLinks ? 'Ajouté ' : 'Ajouter')
      .end('span')
      .icon(this.inLinks ? 'check_circle' : 'add_circle', {
        class: 'ml-4 fs-23',
      })
      .end()
      .end('button')
      .end('li')
      .generate();
  }
}
