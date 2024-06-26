import { MelHtml } from '../../../mel_metapage/js/lib/html/JsHtml/MelHtml.js';
import { BnumEvent } from '../../../mel_metapage/js/lib/mel_events.js';

export { MelLink, MelFolderLink, MelLinkVisualizer };

class MelBaseLink {
  constructor (id, title) {
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
        set: value => {
          id = value;
          this.on_prop_changed.call(value, 'id', this);
        },
      },
      title: {
        get() {
          return title;
        },
        set: value => {
          title = value;
          this.on_prop_changed.call(value, 'title', this);
        },
      },
    });

    return this;
  }

  callDelete(task = 'useful_links', action = 'delete') {
    const busy = rcmail.set_busy(true, 'loading');

    return mel_metapage.Functions.post(
      mel_metapage.Functions.url(task, action),
      { _id: this.id, _key: rcmail.env.mul_items_key },
      datas => {
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
  constructor (id, title, link, inFolder = false) {
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

  async callUpdate(task = 'useful_links', action = 'update') {
    const busy = rcmail.set_busy(true, 'loading');

    let id = this.id;
    let link = {
      _id: id,
      _title: this.title,
      _link: this.link,
    };

    let message =
      this.id === ''
        ? 'Ajout effectué avec succès !'
        : 'Modification effectuée avec succès !';

    await mel_metapage.Functions.post(
      mel_metapage.Functions.url(task, action),
      { link, _key: rcmail.env.mul_items_key },
      datas => {
        rcmail.set_busy(false, 'loading', busy);
        rcmail.display_message(message, 'confirmation');
        id = datas;
      },
      (a, b, c) => {
        rcmail.display_message(
          'Impossible d\'ajouter ou de modifier ce lien.',
          'error',
        );
        console.error(a, b, c);
      },
    );

    return id;
  }
}

class MelFolderLink extends MelBaseLink {
  constructor (id, title, links, isOpen = false) {
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
        set: value => {
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
      datas => {
        rcmail.set_busy(false, 'loading', busy);
        rcmail.display_message(message, 'confirmation');
        id = datas;
      },
      (a, b, c) => {
        rcmail.display_message(
          'Impossible de créer ou de modifier ce dossier.',
          'error',
        );
        console.error(a, b, c);
      },
    );

    return id;
  }

  callFolderDelete(task = 'useful_links', action = 'delete') {
    const busy = rcmail.set_busy(true, 'loading');

    return mel_metapage.Functions.post(
      mel_metapage.Functions.url(task, action),
      { _id: this.id, _key: rcmail.env.mul_items_key },
      datas => {
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

  openMultilink() {
    $('#link-block-' + this.id).toggleClass('multilink-close');
    $('#link-block-' + this.id).toggleClass('multilink-open');
    $(`#link-block-${this.id} li.link-block`).toggleClass('sublink');
    this.isOpen = !this.isOpen;
  }

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
        onclick: this.openMultilink.bind(this),
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

class MelLinkVisualizer extends MelLink {
  constructor (id, title, link, icon, inFolder = false) {
    super(id, title, link, inFolder);
    this._setup_icon(icon);
  }

  _init() {
    super._init();
    this.icon = '';

    return this;
  }

  linkTransform() {
    return new MelLink(this.id, this.title, this.link);
  }

  _setup_icon(icon) {
    let _icon = icon;
    let _title = this.title;
    let _link = this.link;

    Object.defineProperties(this, {
      icon: {
        get() {
          return _icon;
        },
        set: value => {
          _icon = value;
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
        set: value => {
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
        set: value => {
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

  _dragStart(link, ev) {
    ev = ev.dataTransfer ? ev : ev.originalEvent;
    ev.dataTransfer.dropEffect = 'move';
    ev.dataTransfer.setData(
      'text/plain',
      JSON.stringify({ id: this.id, multifolder: false, link: link }),
    );
  }

  displayLink() {
    return MelHtml.start
      .div({
        class: 'link-block-container',
        draggable: true,
        ondragstart: this._dragStart.bind(this, 'link'),
      })
      .li({ class: 'link-space-between' })
      .end()
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
        class: 'link-icon-image',
        src: this.icon,
        onerror: 'imgError(this.id, `no-image-' + this.id + '`, `' + this.title[0] + '`)',
      })
      .span({ id: 'no-image-' + this.id, class: 'link-icon-no-image' })
      .end()
      .end()
      .span({ class: 'link-icon-title' })
      .text(this.title)
      .end()
      .end()
      .end()
      .generate();
  }

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
        class: 'link-icon-image',
        src: this.icon,
        onerror: 'imgError(this.id, `no-image-' + this.id + '`, `' + this.title[0] + '`)',
      })
      .span({ id: 'no-image-' + this.id, class: 'link-icon-no-image' })
      .end()
      .end()
      .span({ class: 'link-icon-title' })
      .text(this.title)
      .end()
      .end()
      .generate();
  }
}
