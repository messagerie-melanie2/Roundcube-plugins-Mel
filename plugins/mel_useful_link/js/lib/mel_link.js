import { BnumEvent } from "../../../mel_metapage/js/lib/mel_events.js";

export {MelLink, MelFolder};

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

  async callUpdate(task = "useful_links",  action = "update")
  {
    let success = true;
    let config = {
      _id:this.id,
      _title:this.title,
      _link:this.url,
  };

    await mel_metapage.Functions.post(mel_metapage.Functions.url(task, action), config, (datas) => {}, (a, b, c) => {
      success = false;
      rcmail.display_message("Impossible d'ajouter ou de modifier ce lien.", "error");
      console.error(a, b, c);
    });

    return success; 
  }

  callDelete(task = "useful_links", action = "delete")
    {
        rcmail.set_busy(true, "loading");

        return mel_metapage.Functions.post(mel_metapage.Functions.url(task, action),
        {_id:this.id},
        (datas) => {
          rcmail.set_busy(false);
          rcmail.clear_messages();
          rcmail.display_message("Suppression effectué avec succès !", "confirmation");
          $('#link-block-'+this.id).remove();
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
