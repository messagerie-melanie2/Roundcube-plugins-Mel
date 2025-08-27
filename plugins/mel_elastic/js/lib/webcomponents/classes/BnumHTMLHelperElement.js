import { EMPTY_STRING } from "../../../../../mel_metapage/js/lib/constants/constants.js";
import ABnumHTMLElement from "../abstract/ABnumHTMLElement.js";
import helperStyle from "../style/bnum-helper-style.js";
import BnumHTMLIcon from "./BnumHTMLIcon.js";

/**
 * Constante représentant l'icône utilisée par défaut.
 * @constant {string}
 */
const ICON = "help";

/**
 * Élément web personnalisé représentant une aide contextuelle avec une icône.
 * @class
 * @extends ABnumHTMLElement
 */
export default class BnumHTMLHelperElement extends ABnumHTMLElement {
  /**
   * Crée une instance de BnumHTMLHelperElement.
   * @constructor
   */
  constructor() {
    super();
  }

  /**
   * Précharge les données de l'élément.
   * Si l'élément a des enfants, le texte est déplacé dans l'attribut title et le contenu est vidé.
   * @protected
   */
  _p_preload() {
    super._p_preload();
    if (this.hasChildNodes()) {
      this.setAttribute("title", this.textContent);
      this.textContent = EMPTY_STRING;
    }
  }

  /**
   * Génère le rendu HTML de l'élément.
   * @protected
   * @returns {string} Le HTML à insérer dans le composant.
   */
  _p_render() {
    super._p_render();

    return `<${BnumHTMLIcon.TAG} icon="${ICON}"></${BnumHTMLIcon.TAG}>`;
  }

  /**
   * Génère le style CSS de l'élément.
   * @protected
   * @returns {string} Le style CSS à appliquer au composant.
   */
  _p_style() {
    super._p_style();

    return `<style>${helperStyle}</style>`;
  }

  /**
   * Crée une nouvelle instance de BnumHTMLHelperElement avec le texte d'aide spécifié.
   * @param {string} title Texte d'aide à afficher dans l'attribut title.
   * @returns {BnumHTMLHelperElement} L'instance créée de l'élément d'aide.
   * @static
   */
  static Create(title) {
    const element = document.createElement(BnumHTMLHelperElement.TAG);
    element.setAttribute("title", title);
    return element;
  }

  /**
   * Retourne le tag HTML utilisé pour ce composant.
   * @returns {string} Tag HTML du composant.
   * @static
   * @readonly
   */
  static get TAG() {
    return "bnum-helper";
  }
}

BnumHTMLHelperElement.TryDefine();
