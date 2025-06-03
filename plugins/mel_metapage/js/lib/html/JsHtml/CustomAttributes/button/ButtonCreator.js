import { EMPTY_STRING } from '../../../../constants/constants.js';
import { isNullOrUndefined } from '../../../../mel.js';
import { EButtonType } from './FormComponent.js';
import HTMLBnumButton from './HTMLBnumButton.js';

/**
 *
 * @class
 * @classdesc Classe qui permet la configuration et la création d'un bouton bnumClasse qui permet la configuration et la création d'un bouton bnum
 */
export class HTMLBnumButtonBaseCreator {
  /**
   * @type {HTMLBnumButton}
   */
  #_node;
  /**
   *
   * @param {'bnum-button' | 'primary-button' | 'secondary-button' | 'error-button' | 'no-background-button'} [tag=HTMLBnumButton.TAG] Tag du bouton
   */
  constructor(tag = HTMLBnumButton.TAG) {
    this.#_node = document.createElement(tag);
  }

  /**
   * Si l'élément a déjà été généré ou non
   * @type {boolean}
   * @readonly
   */
  get canSetup() {
    return !isNullOrUndefined(this.#_node);
  }

  /**
   * Node en cours
   * @type {HTMLBnumButton}
   * @readonly
   * @protected
   */
  get _p_node() {
    return this.#_node;
  }

  /**
   * Ajoute le contenu du bouton
   * @param {string | HTMLElement} content
   * @returns {this}
   */
  setContent(content) {
    this.#_node.innerText = EMPTY_STRING;
    this.#_node.appendChild(
      typeof content === 'string' ? document.createTextNode(content) : content,
    );
    return this;
  }

  /**
   * Ajoute une icône au bouton
   * @param {string} icon Icône material symbol
   * @returns {this}
   */
  setIcon(icon) {
    this.#_node.setAttribute('data-icon', icon);
    return this;
  }

  /**
   * Gère la position du buton
   * @param {'right' | 'left'} pos
   * @returns {this}
   */
  setIconPos(pos) {
    this.#_node.setAttribute('data-icon-pos', pos);
    return this;
  }

  /**
   * Met le margin de l'icône par rapport au texte
   * @param {string | 0} margin
   * @returns {this}
   */
  setIconMargin(margin) {
    this.#_node.setAttribute('data-icon-margin', margin);
    return this;
  }

  /**
   * Désactive le bouton
   * @returns {this}
   */
  setDisabled() {
    this.#_node.disable();
    return this;
  }

  /**
   * Active le bouton
   * @returns {this}
   */
  setEnabled() {
    this.#_node.enable();
    return this;
  }

  /**
   * Met le bouton en mode "chargement"
   * @returns {this}
   */
  setLoading() {
    this.#_node.setAttribute('data-loading', 'loading');
    return this;
  }

  /**
   * Ajuste la forme du bouton pour avoir des bord carrés légèrement arrondis
   * @returns {this}
   */
  setSquare() {
    this.#_node.setAttribute('square', 'square');
    return this;
  }

  /**
   * Récupère le bouton et vide les données en mémoire.
   * @returns {HTMLBnumButton}
   */
  generate() {
    const node = this.#_node;
    this.#_node = null;
    return node;
  }
}

/**
 * @class
 * @classdesc Classe qui permet la configuration et la création d'un bouton bnum, mais ajoute la configuration des variations
 * @extends HTMLBnumButtonBaseCreator
 */
export class HTMLBnumButtonCreator extends HTMLBnumButtonBaseCreator {
  /**
   * /
   */
  constructor() {
    super();
  }

  /**
   * Met en place une variation
   * @param {EButtonType} variation
   * @returns {this}
   */
  setVariation(variation) {
    this._p_node.setAttribute(
      'data-variation',
      EButtonType.toString(variation),
    );
    return this;
  }

  /**
   * Met la skin `Primary` au bouton (variation => `primary`)
   * @returns {this}
   */
  setPrimaryVariation() {
    return this.setVariation(EButtonType.primary);
  }

  /**
   * Met la skin `Secondary` au bouton (variation => `secondary`)
   * @returns {this}
   */
  setSecondaryVariation() {
    return this.setVariation(EButtonType.secondary);
  }

  /**
   * Met la skin `Danger` au bouton (variation => `danger`)
   * @returns {this}
   */
  setDangerVariation() {
    return this.setVariation(EButtonType.danger);
  }

  /**
   * Met la skin `no background` au bouton (variation => `nobackground`)
   * @returns {this}
   */
  setNoBackgroundVariation() {
    return this.setVariation(EButtonType.nobackground);
  }
}
