import { EMPTY_STRING } from '../../../../mel_metapage/js/lib/constants/constants.js';
import { HtmlCustomTag } from '../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/js_html_base_web_elements.js';
import { FavoriteButton } from '../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/pressed_button_web_element.js';
import { isNullOrUndefined } from '../../../../mel_metapage/js/lib/mel.js';

export class WorkspaceBlockItem extends HtmlCustomTag {
  constructor() {
    super();

    this._picture = null;
    this._tag = null;
    this._title = null;
    this._description = null;
    this._users = null;
    this._edited = null;
    this._color = null;
    this._is_favorite = null;
    this._private = null;

    Object.defineProperties(this, {
      _picture: {
        value: this.dataset.picture,
        writable: false,
        configurable: false,
      },
      _tag: {
        value: isNullOrUndefined(this.dataset.tag || null)
          ? null
          : this.dataset.tag[0] === '#'
            ? this.dataset.tag
            : `#${this.dataset.tag}`,
        writable: false,
        configurable: false,
      },
      _title: {
        value: this.dataset?.title ?? this.getAttribute('title'),
        writable: false,
        configurable: false,
      },
      _description: {
        value: this.dataset.description,
        writable: false,
        configurable: false,
      },
      _users: {
        value: this.dataset.users,
        writable: false,
        configurable: false,
      },
      _edited: {
        value: `Modifié le ${moment(this.dataset.lastEdited).format('DD/MM/YYYY')}`,
        writable: false,
        configurable: false,
      },
      _color: {
        value: this.dataset.color,
        writable: false,
        configurable: false,
      },
      _is_favorite: {
        value: this.dataset.favorite,
        writable: false,
        configurable: false,
      },
      _private: {
        value: this.dataset.private,
        writable: false,
        configurable: false,
      },
    });

    this.classList.add('workspace-block-item', 'mv2-card');

    this._generate();
  }

  _generate() {
    let div = document.createElement('div');
    div.classList.add('workspace-block-item-main', 'mel-focus', 'important');

    div.setAttribute('tabindex', 0);
    div.setAttribute('title', `Ouvrir l'espace ${this._title}`);
    div.setAttribute('role', 'button');

    div.style.borderRadius = '5px';

    div.onkeydown = (e) => {
      switch (e.key) {
        case ' ':
        case 'Enter':
          this.$.click();
          break;

        default:
          break;
      }
    };

    div.appendChild(this._generate_picture());
    div.appendChild(this._generate_bottom());

    this.appendChild(div);

    div = null;

    return this._generate_favorite();
  }

  _generate_favorite() {
    /**
     * @type {FavoriteButton}
     */
    let favorite = document.createElement(FavoriteButton.TAG);
    favorite.data('favoriteIcon', 'star');
    favorite.data('notFavoriteIcon', 'star');
    favorite.setAttribute('data-start-pressed', this._is_favorite);
    favorite.classList.add('workspace-block-item-favorite');

    favorite.ontoggle.push((...data) => {
      console.log('favs', data);
    });

    this.appendChild(favorite);

    favorite = null;

    return this;
  }

  _generate_picture() {
    let pict = document.createElement('div');
    pict.classList.add('workspace-block-item-picture');

    let element;
    if (this._picture) {
      element = document.createElement('img');
      element.addEventListener(
        'error',
        this._on_error_load.bind(this, pict, this._title),
      );
      element.style.borderColor = this._color;
      element.src = this._picture;
      pict.appendChild(element);
    } else this._generate_no_picture(pict), this._title;

    //this.appendChild(pict);

    this.removeAttribute('data-picture');
    this.removeAttribute('data-color');

    return pict;
  }

  _generate_bottom() {
    let bottom = document.createElement('div');
    bottom.classList.add('workspace-block-item-bottom');

    let functions = [
      this._generate_title_block,
      this._generate_description,
      this._generate_users,
      this._generate_edited,
    ];

    let tmp;
    for (const func of functions) {
      tmp = func.call(this);

      if (tmp) {
        bottom.appendChild(tmp);
        tmp = null;
      }
    }

    // this.appendChild(bottom);

    // bottom = null;

    return bottom;
  }

  _generate_title_block() {
    let bottom = document.createElement('div');
    bottom.classList.add('workspace-block-item-bottom-title');

    let functions = [this._generate_tag, this._generate_title];

    let tmp;
    for (const func of functions) {
      tmp = func.call(this);

      if (tmp) {
        bottom.appendChild(tmp);
        tmp = null;
      }
    }

    return bottom;
  }

  /**
   *
   * @param {HTMLElement} parentNode
   */
  _generate_no_picture(parentNode, txt) {
    let element = document.createElement('span');
    element.classList.add('no-picture');
    element.style.backgroundColor = this._color;

    let span = document.createElement('span');
    span.appendChild(
      document.createTextNode(txt.substring(0, 3).toUpperCase()),
    );
    span.classList.add('absolute-center');

    //Génération de la couleur du texte
    {
      const rgb_1 = mel_metapage.Functions.colors.kMel_extractRGB(this._color);
      const rgb_2 = mel_metapage.Functions.colors.kMel_extractRGB('#000000');

      if (mel_metapage.Functions.colors.kMel_LuminanceRatioAAA(rgb_1, rgb_2))
        span.style.color = '#000000';
      else span.style.color = '#FFFFFF';
    }

    element.appendChild(span);

    let children = parentNode.children;

    if (children.length) {
      for (const child of children) {
        child.remove();
      }
    }

    parentNode.appendChild(element);

    element = null;
    children = null;
    span = null;

    return this;
  }

  _generate_text_item(text, data, ...classes) {
    let return_data = false;

    if (!isNullOrUndefined(text)) {
      let element = document.createElement('div');

      if (classes.length) element.classList.add(...classes);

      let tag;
      switch (data) {
        case 'title':
          tag = 'h2';
          break;

        default:
          tag = 'span';
          break;
      }

      let span = document.createElement(tag);
      span.appendChild(document.createTextNode(text));

      element.appendChild(span);

      //this.appendChild(element);

      return_data = element;

      span = null;
      element = null;
    } else return this._generate_text_item(EMPTY_STRING, data, ...classes);

    this.removeAttribute(`data-${data}`);

    return return_data;
  }

  _generate_tag() {
    return this._generate_text_item(
      this._tag,
      'tag',
      'workspace-block-item-tag',
    );
  }

  _generate_title() {
    return this._generate_text_item(
      this._title,
      'title',
      'workspace-block-item-title',
    );
  }

  _generate_description() {
    return this._generate_text_item(
      this._description,
      'description',
      'workspace-block-item-description',
    );
  }

  _generate_users() {
    let pictures = document.createElement('div');
    pictures.classList.add('workspace-block-item-users');

    const users = this._users.split(',');

    let div;
    let img;
    let span;
    let url;
    let user;
    for (const userData of users) {
      url = userData.split('|');
      user = url[1];
      url = url[0];

      div = document.createElement('div');
      div.classList.add('workspace-block-item-user');

      if (!Number.isNaN(+url)) {
        img = document.createElement('span');
        img.classList.add('workspace-block-item-user-number');
        img.style.borderColor = this._color;
        span = document.createElement('span');
        span.appendChild(document.createTextNode(`+${url}`));
        span.classList.add('absolute-center');
        img.appendChild(span);
        div.appendChild(img);

        span = null;
      } else {
        // div.style.backgroundImage = `url(${user})`;
        // div.classList.add('with-picture');
        img = document.createElement('img');
        div.appendChild(img);
        // img.addEventListener('load', this._on_picture_load.bind(this));
        // img.addEventListener(
        //   'error',
        //   this._on_error_load.bind(this, img.parentNode, user),
        // );
        img.setAttribute('src', 'skins/elastic/images/contactpic.svg');
        img.setAttribute('data-src', url);
        img.setAttribute('data-user', user);
        img.setAttribute('title', user);
        img.owner = this;
      }

      pictures.appendChild(div);

      img = null;
      div = null;
    }

    this.removeAttribute('data-users');

    return pictures;
  }

  _generate_edited() {
    return this._generate_text_item(
      this._edited,
      'last-edited',
      'workspace-block-item-edited',
    );
  }

  /**
   *
   * @param {HTMLElement} node
   */
  _on_error_load(node, txt) {
    this._generate_no_picture(node, txt);
  }

  _on_picture_load(e) {
    /**
     * @type {HTMLElement}
     */
    let ev = e.originalTarget;

    ev.setAttribute('src', ev.dataset.src);
    ev.removeAttribute;
    //console.log('pl', e);
  }
}

{
  const TAG = 'bnum-workspace-block-item';
  if (!customElements.get(TAG)) customElements.define(TAG, WorkspaceBlockItem);
}

window.addEventListener('load', function () {
  onLoaded();
});

function onLoaded() {
  let imagesToLoad = document.querySelectorAll(
    '.workspace-block-item img[data-src]',
  );

  const loadImages = (image) => {
    image.onload = () => {
      image.removeAttribute('data-src');
      image.style.borderColor = image.owner._color;
    };
    image.onerror = image.owner._on_error_load.bind(
      image.owner,
      image.parentNode,
      image.dataset.user,
    );
    image.setAttribute('src', image.getAttribute('data-src'));
  };

  for (const image of imagesToLoad) {
    loadImages(image);
  }
}
