import { EMPTY_STRING } from '../../../../mel_metapage/js/lib/constants/constants.js';
import {
  BnumHtmlIcon,
  BnumHtmlShadowIcon,
  HtmlCustomDataTag,
} from '../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/js_html_base_web_elements.js';

/**
 * Constante représentant l'icône utilisée par défaut.
 * @constant {string}
 */
const ICON = 'help';

/**
 * Classe représentant un élément HTML personnalisé `bnum-helper`.
 * Cet élément affiche une icône d'aide et un texte au survol.
 *
 * Utilisation :
 *
 * `<bnum-helper>texte à afficher au survol<bnum-helper>`
 *
 * Data disponible :
 * - shadow : true/false => Active ou non le shadowdom
 * @extends HtmlCustomDataTag
 * @example <h1>Options de la recherche <bnum-helper>Dans quels parties du mail la recherche doit être faite par défaut.</bnum-helper></h1>
 */
export default class HTMLBnumHelperElement extends HtmlCustomDataTag {
  /**
   * Constructeur de la classe HTMLBnumHelperElement.
   */
  constructor() {
    super();
  }

  /**
   * Méthode principale appelée lors de l'initialisation de l'élément.
   * Configure les attributs, le contenu et les styles de l'élément.
   * @protected
   */
  _p_main() {
    super._p_main();

    // Définit l'attribut 'title' avec le contenu texte actuel, puis vide le texte de l'élément.
    this.setAttribute('title', this.textContent);
    this.textContent = EMPTY_STRING;

    // Initialise la construction de l'élément et récupère la racine.
    let root = this._p_start_construct();

    // Crée une icône et l'ajoute à la racine.
    let icon = this.#_createIcon();
    root.appendChild(icon);

    // Si le shadow DOM est activé, ajoute des styles spécifiques.
    if (this.shadowEnabled()) {
      let style = document.createElement('style');
      style.appendChild(
        document.createTextNode(
          `:host {
              border-bottom: dotted thin;
              cursor: help;
            }
            `,
        ),
      );
      root.prepend(style);

      // Ajoute un style spécifique pour l'icône dans le shadow DOM.
      style = document.createElement('style');
      style.appendChild(
        document.createTextNode(
          `:host bnum-icon {
                font-size: var(--bnum-helper-icon-font-size, inherit);
                }
                `,
        ),
      );

      icon.shadowRoot.prepend(style);
      style = null;
    }

    root = null;
    icon = null;
  }

  /**
   * Crée une icône pour l'élément en fonction de l'état du shadow DOM.
   * @returns {BnumHtmlIcon|BnumHtmlShadowIcon} L'icône créée.
   * @private
   */
  #_createIcon() {
    var icon;

    // Vérifie si le shadow DOM est activé pour choisir le type d'icône à créer.
    if (this.shadowEnabled()) icon = BnumHtmlShadowIcon.Create({ icon: ICON });
    else icon = BnumHtmlIcon.Create({ icon: ICON });

    return icon;
  }

  /**
   * Génère un élément `bnum-helper` avec un texte à afficher au survol.
   * @param {string} text - Texte à afficher au survol.
   * @returns {HTMLBnumHelperElement} L'élément `bnum-helper` créé.
   * @static
   */
  static Create(text) {
    // Crée un nouvel élément HTML avec le texte fourni.
    let element = document.createElement(this.TAG);
    element.textContent = text;
    return element;
  }

  /**
   * Retourne le nom de la balise HTML associée à cet élément.
   * @type {string} Le nom de la balise HTML.
   * @readonly
   * @static
   */
  static get TAG() {
    return 'bnum-helper';
  }
}

// Définit la balise HTML personnalisée si elle n'est pas déjà enregistrée.
HTMLBnumHelperElement.TryDefine(
  HTMLBnumHelperElement.TAG,
  HTMLBnumHelperElement,
);
