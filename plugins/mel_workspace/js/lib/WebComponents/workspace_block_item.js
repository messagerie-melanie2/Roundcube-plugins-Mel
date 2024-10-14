import { BnumMessage } from '../../../../mel_metapage/js/lib/classes/bnum_message.js';
import { FramesManager } from '../../../../mel_metapage/js/lib/classes/frame_manager.js';
import { EMPTY_STRING } from '../../../../mel_metapage/js/lib/constants/constants.js';
import { BnumConnector } from '../../../../mel_metapage/js/lib/helpers/bnum_connections/bnum_connections.js';
import { HtmlCustomTag } from '../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/js_html_base_web_elements.js';
import { FavoriteButton } from '../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/pressed_button_web_element.js';
import { isNullOrUndefined } from '../../../../mel_metapage/js/lib/mel.js';
import { BnumEvent } from '../../../../mel_metapage/js/lib/mel_events.js';
import { MelObject } from '../../../../mel_metapage/js/lib/mel_object.js';
import { connectors } from '../connectors.js';

//#region textes
const TEXT_PRIVATE_SPACE = 'Cet espace est privé !';
const TEXT_SET_TO_FAVORITE = 'Mettre cet espace en favori';
const TEXT_UNSET_TO_FAVORITE = 'Retirer cet espace des favoris';
//#endregion

export class WorkspaceBlockItem extends HtmlCustomTag {
  #initHtml;

  constructor() {
    super();

    this._uid = null;
    this._picture = null;
    this._tag = null;
    this._title = null;
    this._description = null;
    this._users = null;
    this._edited = null;
    this._color = null;
    this._is_favorite = null;
    this._private = null;

    this.onfavoritechanged = new BnumEvent();
  }

  _init() {
    this.onfavoritechanged.push((state, node, self) => {
      this.dispatchEvent(
        new CustomEvent('api:favorite', {
          detail: { state, node, self },
        }),
      );
    });

    this.#initHtml = this.outerHTML;

    const canBeFavorite = this.data('canBeFavorite') ?? true;

    if (!canBeFavorite) this.data('favorite', false);

    Object.defineProperties(this, {
      _uid: {
        value: this.dataset.id,
        writable: false,
        configurable: false,
      },
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
      _private: {
        value: this.dataset.private,
        writable: false,
        configurable: false,
      },
    });

    this._is_favorite = this.dataset.favorite;

    return this;
  }

  _p_main() {
    this._init();

    this.classList.add('workspace-block-item', 'mv2-card');

    this._generate();
  }

  title() {
    return this._title;
  }

  edited() {
    return moment(this._edited.split(' ')[2], 'DD/MM/YYYY');
  }

  isFavorite() {
    return this._is_favorite;
  }

  getClone() {
    return $(this.#initHtml);
  }

  getInitHtml() {
    return this.#initHtml;
  }

  //#region main_block
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

    return this._generate_favorite()._generate_lock();
  }

  //#region favorite
  _generate_favorite() {
    if (this.data('canBeFavorite') ?? true) {
      /**
       * @type {FavoriteButton}
       */
      let favorite = document.createElement(FavoriteButton.TAG);
      favorite.data('favoriteIcon', 'star');
      favorite.data('notFavoriteIcon', 'star');
      favorite.setAttribute('data-start-pressed', this._is_favorite);
      favorite.classList.add('workspace-block-item-favorite');

      this._set_favorite_texts(favorite, this._is_favorite);

      favorite.ontoggle.push(async (...data) => {
        if (rcmail.busy) {
          $(node).click();
        } else {
          let [event, node] = data;

          $('bnum-favorite-button')
            .addClass('disabled')
            .attr('disabled', 'disabled');

          BnumMessage.SetBusyLoading();

          this._set_favorite_texts(node, event.newState);

          this._is_favorite = event.newState;

          const connector = connectors.toggle_favorite;

          let params = connector.needed;
          params._id = this._uid;

          await BnumConnector.connect(connector, { params });
          BnumMessage.StopBusyLoading();

          this.onfavoritechanged.call(event, node, this);
        }
      });

      this.appendChild(favorite);
      this.removeAttribute('data-favorite');

      favorite = null;
    }

    this.removeAttribute('data-can-be-favorite');
    this.removeAttribute('data-old-favorite');

    return this;
  }
  //#endregion

  //#region lock
  _generate_lock() {
    if ([true, 'true', 1, '1'].includes(this.dataset.private)) {
      let lock = document.createElement('bnum-icon');
      lock.setAttribute('data-icon', 'lock');
      lock.setAttribute('title', TEXT_PRIVATE_SPACE);
      lock.classList.add('workspace-block-item-lock');

      this.appendChild(lock);

      lock = null;
    }

    this.removeAttribute('data-private');

    return this;
  }
  //#endregion
  //#endregion

  //#region top_block
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
  //#endregion

  //#region bottom_block
  _generate_bottom() {
    let bottom = document.createElement('div');
    bottom.classList.add('workspace-block-item-bottom');

    let functions = [this._generate_title_block, this._generate_workspace_data];

    let tmp;
    for (const func of functions) {
      tmp = func.call(this);

      if (tmp) {
        bottom.appendChild(tmp);
        tmp = null;
      }
    }

    bottom.addEventListener('click', () => {
      FramesManager.Instance.switch_frame('workspace', {
        args: {
          _action: 'workspace',
          _uid: this._uid,
        },
      });
    });

    return this.toButton(bottom);
  }

  //#region title_block
  _generate_title_block() {
    let bottom = document.createElement('div');
    bottom.classList.add('workspace-block-item-bottom-title');

    let functions = [
      this._generate_tag,
      this._generate_title,
      this._generate_description,
    ];

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

  //#region tag
  _generate_tag() {
    return this._generate_text_item(
      this._tag,
      'tag',
      'workspace-block-item-tag',
    );
  }
  //#endregion

  //#region title
  _generate_title() {
    return this._generate_text_item(
      this._title,
      'title',
      'workspace-block-item-title',
    );
  }
  //#endregion

  //#region description
  _generate_description() {
    return this._generate_text_item(
      this._description,
      'description',
      'workspace-block-item-description',
    );
  }
  //#endregion
  //#endregion

  //#region data_blocks
  _generate_workspace_data() {
    let div = document.createElement('div');
    div.classList.add('workspace-block-item-data');

    div.appendChild(this._generate_users());
    div.appendChild(this._generate_edited());

    return div;
  }

  //#region round_users
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
        img = document.createElement('bnum-avatar');
        img.setAttribute('data-email', url);
        img.setAttribute('data-shadow', false);
        img.setAttribute('title', user);
        img.addEventListener('api:imgload', (customEvent) => {
          let image = customEvent.image();
          image.style.borderColor = this._color;
        });
        img.addEventListener(
          'api:imgloaderror',
          function (user, customEvent) {
            customEvent.avatar().style.border = 'none';
            this._on_error_load(customEvent.avatar().navigator, user);
            customEvent.stop();
          }.bind(this, user),
        );
        div.appendChild(img);
      }

      pictures.appendChild(div);

      img = null;
      div = null;
    }

    this.removeAttribute('data-users');

    return pictures;
  }
  //#endregion

  //#region date
  _generate_edited() {
    return this._generate_text_item(
      this._edited,
      'last-edited',
      'workspace-block-item-edited',
    );
  }
  //#endregion
  //#endregion
  //#endregion

  //#region private_functions
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

      return_data = element;

      span = null;
      element = null;
    } else return this._generate_text_item(EMPTY_STRING, data, ...classes);

    this.removeAttribute(`data-${data}`);

    return return_data;
  }

  /**
   *
   * @param {HTMLElement} node
   * @param {boolean} fav
   */
  _set_favorite_texts(node, fav) {
    if (fav) node.setAttribute('title', TEXT_UNSET_TO_FAVORITE);
    else node.setAttribute('title', TEXT_SET_TO_FAVORITE);

    return this;
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
    // ev.removeAttribute;
    //console.log('pl', e);
  }
  //#endregion
}

{
  const TAG = 'bnum-workspace-block-item';
  if (!customElements.get(TAG)) customElements.define(TAG, WorkspaceBlockItem);
}

// window.addEventListener('load', function () {
//   onLoaded();
// });

// function onLoaded() {
//   let imagesToLoad = document.querySelectorAll(
//     '.workspace-block-item img[data-src]',
//   );

//   const loadImages = (image) => {
//     image.onload = () => {
//       image.removeAttribute('data-src');
//       image.style.borderColor = image.owner._color;
//     };
//     image.onerror = image.owner._on_error_load.bind(
//       image.owner,
//       image.parentNode,
//       image.dataset.user,
//     );
//     image.setAttribute('src', image.getAttribute('data-src'));
//   };

//   for (const image of imagesToLoad) {
//     loadImages(image);
//   }
// }
