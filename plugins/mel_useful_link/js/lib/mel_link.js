import { BnumEvent } from "../../../mel_metapage/js/lib/mel_events.js";

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

  async callUpdateLinks(task = "useful_links")
  {
     await mel_metapage.Functions.post(
         mel_metapage.Functions.url(task, "get_joined_links"),
         (datas) => {
             $(".body .joined .links-items").html(datas);
         }
     );

     return false;
  }

}

class MelLink extends MelBaseLink {
  constructor (id, title, url) {
    super(id, title);
    this._setup_vars(url);
  }

  _init() {
    super._init();
    this.url = '';

    return this;
  }

  _setup_vars(url) {
    this.url = url;

    return this;
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

class MelLinkVisualiser {
  constructor () {
    this._init()._setup()._main();
  }

  _init() {
    this.link = new MelLink(null, null, null);
    this.jquery_object = $();

    return this;
  }

  _setup() {
    Object.defineProperties(this, {
      jquery_object: {
        get() {
          return $(`#link-${this.link.id}`);
        }
      },
    });

    return this;
  }

  _main() {
    this.link.on_prop_changed.push((value, prop, link) => {
      this[`update_${prop}`]();
    });
  }

  update_title() {
    this.jquery_object.find('.link-title').text(this.link.title);
  }

  update_url() {
    this.jquery_object.find('.link-icon-image').attr("src", this.link.url);
  }

  update() {
    this.update_title();
    this.update_url();
  }
}