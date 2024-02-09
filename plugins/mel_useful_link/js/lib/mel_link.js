import { MelHtml } from "../../../mel_metapage/js/lib/html/JsHtml/MelHtml.js";
import { BnumEvent } from "../../../mel_metapage/js/lib/mel_events.js";

export { MelLink, MelFolder, MelLinkVisualizer };

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
        set: (value) => {
          id = value;
          this.on_prop_changed.call(value, 'id', this);
        }
      },
      title: {
        get() {
          return title;
        },
        set: (value) => {
          title = value;
          this.on_prop_changed.call(value, 'title', this);
        }
      }
    });

    return this;
  }
}

class MelLink extends MelBaseLink {
  constructor (id, title, link) {
    super(id, title);
    this._setup_vars(link);
  }

  _init() {
    super._init();
    this.link = '';

    return this;
  }

  _setup_vars(link) {
    this.link = link;

    return this;
  }

  async callUpdate(task = "useful_links", action = "update") {
    let id = this.id;
    let config = {
      _id: id,
      _title: this.title,
      _link: this.link,
    };

    await mel_metapage.Functions.post(mel_metapage.Functions.url(task, action), config, (datas) => {
      id = datas;
    }, (a, b, c) => {
      rcmail.display_message("Impossible d'ajouter ou de modifier ce lien.", "error");
      console.error(a, b, c);
    });

    return id;
  }

  callDelete(task = "useful_links", action = "delete") {
    rcmail.set_busy(true, "loading");

    return mel_metapage.Functions.post(mel_metapage.Functions.url(task, action),
      { _id: this.id },
      (datas) => {
        rcmail.set_busy(false);
        rcmail.clear_messages();
        rcmail.display_message("Suppression effectué avec succès !", "confirmation");
        $('#link-block-' + this.id).remove();
      });
  }
}

class MelFolder extends MelBaseLink {
  constructor (id, title, links) {
    super(id, title);
    this._setup_vars(links);
  }

  _init() {
    super._init();
    this.links = {};

    return this;
  }

  _setup_vars(links) {
    if (Array.isArray(links)) this.addLinks(links);
    else this.addLink(links);

    return this;
  }

  addLink(link) {
    this.links[link.id] = link;

    return this;
  }

  addLinks(links) {
    for (const link of links) {
      this.addLink(link);
    }

    return this;
  }
}

class MelLinkVisualizer extends MelLink {
  constructor (id, title, link, icon) {
    super(id, title, link);
    this._setup_icon(icon);
  }

  _init() {
    super._init();
    this.icon = '';

    return this;
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
        set: (value) => {
          _icon = value;
          $(`.link-block[data-id="${this.id}"] .link-icon-image`).attr('src', value);
        }
      },
      title: {
        get() {
          return _title;
        },
        set: (value) => {
          _title = value;
          $(`.link-block[data-id="${this.id}"] .link-icon-title`).text(value);
          $(`.link-block[data-id="${this.id}"] button`).attr('data-title', value);
        }
      },
      link: {
        get() {
          return _link;
        },
        set: (value) => {
          _link = value;
          //Change en jquery les data url par la nouvelle valeur
          $(`.link-block[data-id="${this.id}"] button`).attr('data-link', value);

        }
      }
    });

    return this;
  }

  displayLink() {
    return MelHtml.start
      .li({ id: "link-block-" + this.id, title: this.title, class: "link-block", "data-id": this.id })
        .div({ id: "context-menu-" + this.id, class: "link-context-menu" })
          .button({ class: "link-context-menu-button copy-link", title: "Copier le lien dans le presse-papier", "data-link": this.link }).removeClass('mel-button').removeClass('no-button-margin').removeClass('no-margin-button').css({ "border": "none", "outline": "none" })
            .icon('content_copy').end()
          .end()
          .button({ class: "link-context-menu-button modify-link", title: "Modifier le lien", "data-id": this.id, "data-title": this.title, "data-link": this.link }).removeClass('mel-button').removeClass('no-button-margin').removeClass('no-margin-button').css({ "border": "none", "outline": "none" })
            .icon('edit').end()
          .end()
          .button({ class: "link-context-menu-button delete-link", title: "Supprimer le lien", "data-id": this.id }).removeClass('mel-button').removeClass('no-button-margin').removeClass('no-margin-button').css({ "border": "none", "outline": "none" })
            .icon('delete').end()
          .end()
        .end()
        .a({ id: "link-id-" + this.id, class: "link-icon-container", href: this.link, target: "_blank" })
          .img({ id: "link-block-icon-image-" + this.id, class: "link-icon-image", src: this.icon, onerror: "imgError(this.id, 'no-image-" + this.id + "', '" + this.title + "')" })
            .span({ id: "no-image-" + this.id, class: "link-icon-no-image" })
            .end()
          .end()
        .span({ class: "link-icon-title" })
          .text(this.title)
        .end()
      .end().generate();
  }
}