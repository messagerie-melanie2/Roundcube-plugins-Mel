import { HtmlCustomTag } from '../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/js_html_base_web_elements.js';

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

    Object.defineProperties(this, {
      _picture: {
        value: this.dataset.picture,
        writable: false,
        configurable: false,
      },
      _tag: {
        value: this.dataset.tag,
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
        value: this.dataset.lastEdited,
        writable: false,
        configurable: false,
      },
      _color: {
        value: this.dataset.color,
        writable: false,
        configurable: false,
      },
    });

    this.classList.add('workspace-block-item', 'mv2-card');

    this._generate_picture()
      ._generate_tag()
      ._generate_title()
      ._generate_description()
      ._generate_users()
      ._generate_edited();
  }

  _generate_picture() {
    let pict = document.createElement('div');
    pict.classList.add('workspace-block-item-picture');

    let element;
    if (this._picture) {
      element = document.createElement('img');
      element.addEventListener('error', this._on_load.bind(this, pict));
      element.src = this._picture;
      pict.appendChild(element);
    } else this._generate_no_picture(pict);

    this.appendChild(pict);

    this.removeAttribute('data-picture');
    this.removeAttribute('data-color');

    return this;
  }

  /**
   *
   * @param {HTMLElement} parentNode
   */
  _generate_no_picture(parentNode) {
    let element = document.createElement('span');
    element.classList.add('no-picture');
    element.style.backgroundColor = this._color;

    let span = document.createElement('span');
    span.appendChild(document.createTextNode(this._title.substring(0, 3)));
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
    text = text || null;

    if (text) {
      let element = document.createElement('div');

      if (classes.length) element.classList.add(...classes);

      let span = document.createElement('span');
      span.appendChild(document.createTextNode(text));

      element.appendChild(span);

      this.appendChild(element);

      element = null;
      span = null;
    }

    this.removeAttribute(`data-${data}`);

    return this;
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
    return this;
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
  _on_load(node) {
    this._generate_no_picture(node);
  }
}

{
  const TAG = 'bnum-workspace-block-item';
  if (!customElements.get(TAG)) customElements.define(TAG, WorkspaceBlockItem);
}
