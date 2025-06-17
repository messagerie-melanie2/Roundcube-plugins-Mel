import { REG_XSS_SAFE } from '../../../../../mel_metapage/js/lib/constants/regexp.js';
import { BnumHtmlShadowIcon } from '../../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/js_html_base_web_elements';
import ABnumHTMLElement from '../abstract/ABnumHTMLElement.js';
import style from '../style/bnum-button-style.js';

export default class BnumHTMLButton extends ABnumHTMLElement {
  #_internals = this.attachInternals();
  #_ignoreFindingIcons = false;
  #_firstRender = true;

  static _p_observedAttributes() {
    return ['data-icon', 'data-icon-pos', 'data-icon-margin', 'data-variation'];
  }

  constructor() {
    super();

    this._p_on_attribute_changed.push(() => {
      if (!this.#_firstRender) {
        this.#_ignoreFindingIcons = true;
        this.render();
      }
    });
  }

  get variation() {
    return this.data('variation') || 'primary';
  }
  set variation(value) {
    // Ne permettre que 'primary', 'secondary', 'tertiary' ou 'danger'
    if (['primary', 'secondary', 'tertiary', 'danger'].includes(value))
      this.data('variation', { value, fromAttribute: true });
  }

  /**
   * Récupère l'icône associée au bouton.
   * @type {?string}
   */
  get icon() {
    return this.data('icon') || null;
  }

  set icon(value) {
    if (typeof value === 'string' && /^[\w-]+$/.test(value))
      this.data('icon', { value, fromAttribute: true });
    else this.data('icon', null);
  }

  get iconPos() {
    return this.data('icon-pos') || 'right';
  }

  set iconPos(value) {
    // Ne permettre que 'left' ou 'right'
    if (['left', 'right'].includes(value))
      this.data('icon-pos', { value, fromAttribute: true });
  }

  get iconMargin() {
    return this.data('icon-margin') || 'var(--custom-button-icon-margin, 20px)';
  }
  set iconMargin(value) {
    if (typeof value === 'string' && REG_XSS_SAFE.test(value))
      this.data('icon-margin', { value, fromAttribute: true });
    else if (value === null) {
      this.data('icon-margin', { value });
      this.#_ignoreFindingIcons = true;
      this.render();
    }
  }

  _p_style() {
    return `<style>${super._p_style()}${style.replaceAll('%0', this.iconPos === 'left' ? 'right' : 'left').replaceAll('%1', this.iconMargin)}</style>`;
  }

  _p_render() {
    super._p_render();

    this.#_internals.states.clear();
    this.#_internals.states.add(this.variation);

    let txt = `
        <slot></slot>
    `;

    const iconData = this.#_findIcon();

    if (iconData) {
      if (iconData.first) {
        this.data('data-icon-pos', 'left');
        txt = `
                    <${BnumHtmlShadowIcon.TAG} data-icon="${iconData.icon}"></${BnumHtmlShadowIcon.TAG}>
                    ${txt}
                `;
      } else {
        this.data('data-icon-pos', 'right');
        txt += `<${BnumHtmlShadowIcon.TAG} data-icon="${iconData.icon}"></${BnumHtmlShadowIcon.TAG}>`;
      }
    }

    if (this.#_firstRender) this.#_firstRender = false;

    return `
      <div class="wrapper">${txt}<div>
    `
      .replaceAll('<script', '&lt;script')
      .replaceAll('</script>', '&lt;/script&gt;');
  }

  #_findIcon() {
    if (this.icon) {
      return {
        first: this.iconPos === 'left',
        icon: this.icon,
      };
    } else if (!this.#_ignoreFindingIcons) {
      const children = Array.from(this.childNodes);
      let foundNode = false;

      for (const child of children) {
        if (child.nodeType === BnumHtmlShadowIcon.TAG.toUpperCase()) {
          return {
            first: foundNode,
            icon: child.icon,
          };
        } else if (!foundNode) foundNode = true;
      }
    }

    return false;
  }

  static Create() {}

  /**
   * @type {string}
   * @readonly
   */
  static get TAG() {
    return 'bnum-test-button';
  }
}

BnumHTMLButton.TryDefine();

/**
 * Enumération des types de boutons.
 * @enum
 */
export const EButtonType = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  TERTIARY: 'tertiary',
  DANGER: 'danger',
};
