import {
  BnumHtmlIcon,
  EWebComponentMode,
  HtmlCustomDataTag,
} from './js_html_base_web_elements.js';

export { HTMLMelButton, HTMLIconMelButton, EIconPositions };

class HTMLMelButton extends HtmlCustomDataTag {
  constructor() {
    super({ mode: EWebComponentMode.inline_block });
  }

  _p_main() {
    super._p_main();

    this.addClass('mel-button', 'no-margin-button', 'no-button-margin')
      .#_set_mode()
      .setAttribute('role', 'button');

    this.setAttribute('tabindex', '0');

    this.onkeydown = (e) => {
      switch (e.key) {
        case ' ':
        case 'Enter':
          this.click();
          break;

        default:
          break;
      }
    };
  }

  _p_mode() {
    return this._p_get_data('mode')?.toLowerCase?.();
  }

  #_set_mode() {
    const mode = this._p_mode();
    if (mode && mode !== 'inline-block') {
      switch (mode) {
        case 'span':
          this.setAttribute('component-mode', 'span');
          break;

        case 'flex':
          this.setAttribute('component-mode', 'flex');
          break;

        case 'div':
          this.setAttribute('component-mode', 'div');
          break;

        case 'inline-flex':
          this.setAttribute('component-mode', 'inline-flex');
          break;

        default:
          break;
      }
    }

    return this;
  }

  disable() {
    this.setAttribute('aria-disabled', true);
    this.setAttribute('disabled', 'disabled');

    return this.addClass('disabled');
  }

  enable() {
    this.removeAttribute('aria-disabled');
    this.removeAttribute('disabled');

    return this.removeClass('disabled');
  }

  /**
   * Créer un HTMLMelButton
   * @param {Object} [options={}]
   * @param {EWebComponentMode} [options.mode=EWebComponentMode.inline_block] Mode d'affichage du boutton
   * @param {null | ____JsHtml | Node | externa:jQuery} [options.contentsNode=null] Node enfant
   * @returns {HTMLMelButton}
   */
  static CreateNode({
    mode = EWebComponentMode.inline_block,
    contentsNode = null,
  } = {}) {
    let node = document.createElement('bnum-button');

    if (mode !== EWebComponentMode.inline_block) {
      let modeSet = 'inline-block';
      switch (mode) {
        case EWebComponentMode.div:
          modeSet = 'div';
          break;

        case EWebComponentMode.flex:
          modeSet = 'flex';
          break;

        case EWebComponentMode.span:
          modeSet = 'span';
          break;

        case 'inline_flex':
          modeSet = 'inline-flex';

        default:
          break;
      }

      node.setAttribute('data-mode', modeSet);
    }

    if (contentsNode) {
      if (contentsNode.generate_dom) contentsNode = contentsNode.generate_dom();
      else if (contentsNode.css) contentsNode = contentsNode[0];

      node.appendChild(contentsNode);

      contentsNode = null;
    }

    return node;
  }

  static get TAG() {
    return 'bnum-button';
  }
}

{
  const TAG = HTMLMelButton.TAG;
  if (!customElements.get(TAG)) customElements.define(TAG, HTMLMelButton);
}

const CSS_DEFAULT_MARGIN = 'var(--custom-button-icon-margin)';

class HTMLIconMelButton extends HTMLMelButton {
  constructor() {
    super();
  }

  get id() {
    if (!this._p_get_data('id')) {
      this._p_save_into_data(
        'id',
        this.getAttribute('id') || this.generateId('button-icon'),
      );
    }

    return this._p_get_data('id');
  }

  get iconPos() {
    return this._p_get_data('icon-pos') ?? 'right';
  }

  get iconMarginRight() {
    return this._p_get_data('icon-margin-right') ?? CSS_DEFAULT_MARGIN;
  }

  get iconMarginLeft() {
    return this._p_get_data('icon-margin-left') ?? CSS_DEFAULT_MARGIN;
  }

  get icon() {
    return (
      this._p_get_data('icon') ??
      this.querySelector(`#icon-${this.id}`)?.icon ??
      'add'
    );
  }

  set icon(value) {
    this._p_save_into_data('icon', value);
    this.querySelector(`#icon-${this.id}`).icon = value;
  }

  _p_main() {
    super._p_main();

    let bnumIcon = this.querySelector(`#icon-${this.id}`);
    if (!bnumIcon) {
      bnumIcon = this.querySelector('bnum-icon');
      if (!bnumIcon) {
        bnumIcon = BnumHtmlIcon.Create({ icon: this.icon });

        let style = null;
        let styleValue = null;
        switch (this.iconPos) {
          case 'right':
            style = 'marginLeft';
            styleValue = this.iconMarginLeft;
            break;

          case 'left':
            style = 'marginRight';
            styleValue = this.iconMarginRight;
            break;

          default:
            break;
        }

        if (style) bnumIcon.style[style] = styleValue;

        if (this.iconPos === 'right') this.appendChild(bnumIcon);
        else this.prepend(bnumIcon);
      } else bnumIcon.setAttribute('id', `icon-${this.id}`);
    }

    bnumIcon = null;
  }

  _p_mode() {
    return 'inline-flex';
  }

  static CreateNode(
    icon,
    {
      iconPos = EIconPositions.right,
      iconMarginRight = CSS_DEFAULT_MARGIN,
      iconMarginLeft = CSS_DEFAULT_MARGIN,
      content = null,
    } = {},
  ) {
    /**
     * @type {HTMLIconMelButton}
     */
    let node = document.createElement(this.TAG);

    if (content) {
      if (typeof content === 'string') node.innerHTML = content;
      else {
        if (content.generate_dom)
          content = content.generate_dom(); //jshtml
        else if (content.css) content = content[0]; //jquery

        node.appendChild(content);
      }

      content = null;
    }

    if (icon !== 'add') node.data('icon', icon);

    if (iconPos !== EIconPositions.right) node.data('icon-pos', 'left');

    if (iconMarginLeft !== CSS_DEFAULT_MARGIN)
      node.data('icon-margin-left', iconMarginLeft);

    if (iconMarginRight !== CSS_DEFAULT_MARGIN)
      node.data('icon-margin-right', iconMarginRight);

    return node;
  }

  static CreateClickableIcon(icon) {
    return this.CreateNode(icon, { iconMarginRight: 0 });
  }

  static get TAG() {
    return 'bnum-button-icon';
  }
}

/**
 * @enum
 */
const EIconPositions = {
  right: Symbol(),
  left: Symbol(),
};

{
  const TAG = HTMLIconMelButton.TAG;
  if (!customElements.get(TAG)) customElements.define(TAG, HTMLIconMelButton);
}
