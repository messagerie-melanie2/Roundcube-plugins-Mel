import ABaseMelObject from '../../../../mel_metapage/js/lib/base_mel_object.js';
import { BnumPromise } from '../../../../mel_metapage/js/lib/BnumPromise.js';
import { REG_LIGHT_PICTURE_NAME } from '../../../../mel_metapage/js/lib/constants/regexp.js';
import { EWebComponentMode } from '../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/js_html_base_web_elements.js';
import AHTMLCustomInternalElement from '../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/lib/AHTMLCustomInternalElement.js';

/**
 * Classe représentant un élément HTML personnalisé pour gérer les images en fonction du mode couleur (clair/sombre).
 *
 * Hérite de {@link AHTMLCustomInternalElement}.
 * @extends {AHTMLCustomInternalElement}
 */
export default class HTMLColorModePicture extends AHTMLCustomInternalElement {
  /**
   * Attributs observés par le navigateur.
   * @type {string[]}
   * @readonly
   * @static
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements}
   */
  static get observedAttributes() {
    return ['src'];
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
   * Indique quand le composant a été chargé complètement.
   * @type {boolean}
   * @private
   */
  #_asyncLoaded = false;

  /**
   * Constructeur de la classe.
   *
   * Initialise le mode d'affichage en tant qu'élément inline-block.
   *
   * Evènements :
   * - load : Déclenché lorsque l'image est complètement chargée.
   */
  constructor() {
    super({ mode: EWebComponentMode.inline_block });
  }

  /**
   * Retourne l'URL de l'image en mode sombre.
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
    return this.navigator.querySelector('img');
  }

  /**
   * Détermine si le mode sombre est activé.
   * @type {?boolean}
   * @readonly
   * @private
   */
  get #_isDarkMode() {
    return ABaseMelObject.Empty().get_skin().color_mode() === 'dark';
  }

  /**
   * Méthode principale appelée lors de l'initialisation.
   * Initialise les composants asynchrones.
   * @protected
   */
  _p_main() {
    super._p_main();
    this.#_asyncMain();
  }

  /**
   * Méthode asynchrone pour initialiser les composants.
   * @private
   */
  async #_asyncMain() {
    //On attend que le skin soit chargé avant de continuer
    await BnumPromise.Wait(() => !!ABaseMelObject.Empty().get_skin());
    //Synchronisation de l'état du mode sombre
    this.#_elementDarkModeState = this.#_isDarkMode;
    let shadow = this._p_start_construct();

    let img = document.createElement('img');
    img.setAttribute(
      'src',
      this.#_isDarkMode ? this.darkUrl : this.getAttribute('src'),
    );

    img.addEventListener('load', (e) => {
      this.dispatchEvent(
        new CustomEvent('load', { detail: { originalEvent: e } }),
      );
    });

    let style = document.createElement('style');
    style.textContent = `
      img {
        width: 100%;
        height: 100%;
      }
    `;

    shadow.append(style, img);

    //Génère un MutationObserver pour surveiller les changements de classe sur l'élément html.
    //Il surveille le changement de couleur (sombre/clair) et change l'URL de l'image en conséquence.
    this.#_createObserver();

    this.#_asyncLoaded = true;

    img = null;
    style = null;
    shadow = null;
  }

  /**
   * Crée un observateur de mutations pour surveiller les changements de classe.
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
   * Indique si l'élément utilise un shadow DOM.
   * @returns {boolean}
   */
  shadowEnabled() {
    return true;
  }

  /**
   * Méthode appelée lorsque l'élément est ajouté au DOM.
   */
  connectedCallback() {
    super.connectedCallback();
    if (this.#_asyncLoaded) this.#_createObserver();
  }

  /**
   * Est appelé quand un attribut de {@link observedAttributes} est modifié
   * @param {string} name
   * @param {string} oldValue
   * @param {string} newValue
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (this.elementLoaded && this.#_asyncLoaded && name === 'src') {
      this.picture.setAttribute(
        'src',
        this.#_isDarkMode ? this.darkUrl : newValue,
      );
    }
  }

  /**
   * Détruit l'élément et nettoie les ressources associées.
   */
  destroy() {
    super.destroy();
    if (this.#_observer) {
      this.#_observer.disconnect();
      this.#_observer = null;
    }
  }

  /**
   * Crée une instance de HTMLColorModePicture avec une source spécifiée.
   * @param {string} src - URL de l'image.
   * @returns {HTMLColorModePicture} Instance créée.
   * @static
   */
  static Create(src) {
    let node = document.createElement(this.TAG);
    node.setAttribute('src', src);
    return node;
  }

  /**
   * Retourne le nom de la balise HTML associée à ce composant.
   * @type {string}
   * @readonly
   * @static
   */
  static get TAG() {
    return 'bnum-img';
  }
}

// Définit le composant personnalisé dans le DOM.
HTMLColorModePicture.TryDefine(HTMLColorModePicture.TAG, HTMLColorModePicture);
