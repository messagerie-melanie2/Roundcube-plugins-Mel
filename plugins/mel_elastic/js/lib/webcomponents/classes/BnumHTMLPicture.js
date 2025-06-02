import { REG_LIGHT_PICTURE_NAME } from '../../../../../mel_metapage/js/lib/constants/regexp.js';
import ABnumHTMLElement from '../abstract/ABnumHTMLElement.js';

/**
 * Élément web personnalisé permettant d'afficher une image qui s'adapte automatiquement au mode sombre ou clair de l'interface.
 *
 * Cette classe observe les changements de classe sur l'élément <html> pour détecter le passage en mode sombre ou clair,
 * et ajuste dynamiquement l'URL de l'image affichée en conséquence.
 *
 * ## Attributs
 * - `src` : L'URL de l'image à afficher.
 * - `alt` : Texte alternatif pour l'image.
 *
 * ## Evènements
 * - `load` : Déclenché lorsque l'image est chargée avec succès.
 * - `error` : Déclenché si une erreur survient lors du chargement de l'image.
 *
 * @class
 * @extends ABnumHTMLElement
 * @example
 * <bnum-img src="image-light.png" alt="Description"></bnum-img>
 */
export default class BnumHTMLPicture extends ABnumHTMLElement {
  /**
   * Retourne la liste des attributs observés par le composant.
   * @returns {string[]}
   * @protected
   */
  static _p_observedAttributes() {
    let array = super._p_observedAttributes();
    array.push('src', 'alt');
    return array;
  }
  /**
   * Observateur de mutations pour surveiller les changements de classe sur l'élément HTML.
   * @type {?MutationObserver}
   * @private
   */
  #_observer = null;

  /**
   * État actuel du mode sombre de l'élément.
   * @type {?boolean}
   * @private
   */
  #_elementDarkModeState = null;

  /**
   * Constructeur de l'élément BnumHTMLPicture.
   * Initialise l'observateur de mutations et les gestionnaires d'attributs.
   */
  constructor() {
    super();
    //Génère un MutationObserver pour surveiller les changements de classe sur l'élément html.
    //Il surveille le changement de couleur (sombre/clair) et change l'URL de l'image en conséquence.
    this.#_createObserver();
    this._p_on_attribute_changed.push((name) => {
      switch (name) {
        case 'src':
        case 'alt':
          this.render();
          break;

        default:
          break;
      }
    });
  }

  /**
   * Retourne l'URL de l'image.
   * @type {string}
   * @readonly
   */
  get src() {
    return this.getAttribute('src');
  }

  /**
   * Retourne l'URL de l'image en mode sombre.
   * Si l'attribut src contient "light", il est remplacé par "dark".
   * Sinon, "-dark" est ajouté avant l'extension.
   * @type {string}
   * @readonly
   */
  get darkUrl() {
    if (this.hasAttribute('src')) {
      //On récupère l'attribut src de l'élément
      const attr = this.getAttribute('src');

      //On vérifie si l'attibut src contient le mot clé "light".
      if (attr.match(REG_LIGHT_PICTURE_NAME)?.length)
        //Si c'est le cas, on remplace "light" par "dark" dans l'URL de l'image.
        return attr.replace(REG_LIGHT_PICTURE_NAME, '-dark.$2');
      else
        // Si l'attribut src ne contient pas le mot clé "light", on remplace la dernière partie de l'URL par "-dark".
        return (
          attr.split('.').slice(0, -1).join('.') +
          '-dark.' +
          attr.split('.').slice(-1)
        );
    }

    return null;
  }

  /**
   * Retourne l'élément image HTML associé.
   * @type {HTMLImageElement}
   * @readonly
   */
  get picture() {
    return this.shadowRoot.querySelector('img');
  }

  /**
   * Détermine si le mode sombre est activé sur la page.
   * @type {boolean}
   * @readonly
   * @private
   */
  get #_isDarkMode() {
    const html = document.querySelector('html');
    return (
      html.classList.contains('dark-mode') ||
      html.classList.contains('dark-mode-custom')
    );
  }

  /**
   * Retourne le style CSS appliqué à l'image.
   * @returns {string}
   * @protected
   */
  _p_style() {
    super._p_style();

    return `<style>
      img {
        width: 100%;
        height: 100%;
      }</style>
    `;
  }

  /**
   * Génère le rendu HTML de l'image selon le mode sombre ou clair.
   * @returns {string}
   * @protected
   */
  _p_render() {
    super._p_render();

    return `<img src="${this.#_isDarkMode ? this.darkUrl : this.src}" alt="${this.attr('alt')}" />`;
  }

  /**
   * Attache les gestionnaires d'événements à l'image.
   * @protected
   */
  _p_attach() {
    super._p_attach();
    this.picture.addEventListener('load', this.trigger.bind(this, 'load'));
    this.picture.addEventListener('error', this.trigger.bind(this, 'error'));
  }

  /**
   * Crée un observateur de mutations pour surveiller les changements de classe sur l'élément <html>.
   * Permet de détecter le passage en mode sombre ou clair et d'ajuster l'image affichée.
   * @private
   */
  #_createObserver() {
    if (this.#_observer) return null;

    this.#_observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'class'
        ) {
          const isDarkMode =
            mutation.target.classList.contains('dark-mode') ||
            mutation.target.classList.contains('dark-mode-custom');

          if (isDarkMode && this.#_isDarkMode && !this.#_elementDarkModeState) {
            this.#_elementDarkModeState = true;
            this.picture.setAttribute('src', this.darkUrl);
          } else if (
            !isDarkMode &&
            !this.#_isDarkMode &&
            this.#_elementDarkModeState
          ) {
            this.#_elementDarkModeState = false;
            this.picture.setAttribute('src', this.getAttribute('src'));
          }
        }
      }
    });

    this.#_observer.observe(document.querySelector('html'), {
      attributes: true,
      attributeFilter: ['class'],
      subtree: false,
      childList: false,
    });
  }

  /**
   * Crée un nouvel élément BnumHTMLPicture avec la source spécifiée.
   * @param {string} src - L'URL de l'image à afficher.
   * @returns {BnumHTMLPicture}
   * @static
   */
  static Create(src) {
    const element = document.createElement(this.TAG);
    element.setAttribute('src', src);
    return element;
  }

  /**
   * Retourne le nom de la balise personnalisée associée à ce composant.
   * @type {string}
   * @static
   * @readonly
   */
  static get TAG() {
    return 'bnum-img';
  }
}

BnumHTMLPicture.TryDefine();
