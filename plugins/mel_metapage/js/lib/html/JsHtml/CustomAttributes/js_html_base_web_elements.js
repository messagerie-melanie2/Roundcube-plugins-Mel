import { MaterialIcon } from '../../../icons.js';
export {
  HtmlCustomTag,
  BnumHtmlIcon,
  BnumHtmlSrOnly,
  BnumHtmlSeparate,
  BnumHtmlFlexContainer,
  BnumHtmlCenteredFlexContainer,
};

class HtmlCustomTag extends HTMLElement {
  constructor() {
    super();

    this.$ = null;
    this.navigator = null;

    Object.defineProperty(this, 'navigator', {
      get: () => (this.shadowEnabled() ? this.shadowRoot : this),
    });

    Object.defineProperty(this, '$', {
      get: () => $(this),
    });
  }

  connectedCallback() {
    this._p_main();
  }

  disconnectedCallback() {
    this.destroy();
  }

  _p_main() {
    return this;
  }

  _p_start_construct() {
    return this.shadowEnabled() ? this.attachShadow({ mode: 'open' }) : this;
  }

  shadowEnabled() {
    return this.data('shadow') === 'true';
  }

  /**
   * Récupère une donnée "data" de l'élement.
   *
   * Si la valeur n'est pas défini, retourne la valeur du "data".
   * @param {string} key Clé de la data
   * @param {?any} value Valeur de la donnée. Si null, retourne la donnée.
   * @returns {HtmlCustomElement | any}
   */
  data(key, value = null) {
    if (value !== null && value !== undefined) {
      this.dataset[key] = value;
      return this;
    } else return this.dataset[key];
  }

  /**
   * Vérfie si l'élement à une certaine classe.
   * @param {string} className Classe à tester
   * @returns {boolean}
   */
  hasClass(className) {
    return this.classList.contains(className);
  }

  /**
   * Ajoute une ou plusieurs classe(s).
   * @param  {...string} classes Classe(s) à ajouter.
   * @returns {HtmlCustomElement} Chaîne
   */
  addClass(...classes) {
    this.classList.add(...classes);
    return this;
  }

  /**
   * Supprime une classe de l'élément
   * @param {string} className Classe à supprimer
   * @returns {HtmlCustomElement} Chaîne
   */
  removeClass(className) {
    if (this.hasClass(className)) this.classList.remove(className);

    return this;
  }

  text(text) {
    if (HtmlCustomTag._p_text_callback)
      return HtmlCustomTag._p_text_callback(text);
    else return text;
  }

  createText(text) {
    return document.createTextNode(this.text(text));
  }

  destroy() {
    return this;
  }

  static SetTextCallback(callback) {
    this._p_text_callback = callback;
  }
}

HtmlCustomTag._p_text_callback = (text) => rcmail.gettext(text);

class BnumHtmlIcon extends HtmlCustomTag {
  constructor() {
    super();
  }

  _p_main() {
    super._p_main();
    if (!this.getAttribute('class'))
      this.setAttribute('class', BnumHtmlIcon.HTML_CLASS);

    if (!this.classList.contains(BnumHtmlIcon.HTML_CLASS))
      this.classList.add(BnumHtmlIcon.HTML_CLASS);

    if (this.dataset['icon'])
      this.appendChild(document.createTextNode(this.dataset['icon']));

    this.removeAttribute('data-icon');
  }
}

BnumHtmlIcon.HTML_CLASS = MaterialIcon.html_class;

class BnumHtmlSrOnly extends HtmlCustomTag {
  constructor() {
    super();
  }

  _p_main() {
    super._p_main();
    const sr_only = 'sr-only';

    if (!this.classList.contains(sr_only)) this.classList.add(sr_only);
  }
}

class BnumHtmlSeparate extends HtmlCustomTag {
  constructor() {
    super();
  }
}

class BnumHtmlFlexContainer extends HtmlCustomTag {
  constructor() {
    super();
  }

  _p_main() {
    super._p_main();

    this.style.display = 'flex';
  }
}

class BnumHtmlCenteredFlexContainer extends BnumHtmlFlexContainer {
  constructor() {
    super();
  }

  _p_main() {
    super._p_main();

    this.style.justifyContent = 'center';
  }
}
