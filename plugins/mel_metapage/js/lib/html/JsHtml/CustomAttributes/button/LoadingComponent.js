import { BnumHtmlIcon } from '../js_html_base_web_elements.js';
import AHTMLComponent from '../lib/AHTMLComponent.js';
import { HTMLWrapperElement } from '../wrapper.js';
import { CLASS_LOADING_RECEIVER } from './constants.js';

/**
 * Temps d'attente avant que le bouton soit afficher correctement, pour que le mode "chargement" soit afficher correctement
 * @constant
 * @type {number}
 * @default 250
 */
const INIT_TIMEOUT = 250;
/**
 * Classe qui fait tourner l'élément
 * @constant
 * @type {string}
 * @default 'spin'
 */
const CLASS_SPIN = 'spin';
/**
 * Icône de chargement
 * @constant
 * @type {string}
 * @default 'progress_activity'
 * @see {@link https://fonts.google.com/icons?selected=Material+Symbols+Outlined:progress_activity:FILL@0;wght@400;GRAD@0;opsz@24&icon.query=progress_activity&icon.size=24&icon.color=%231f1f1f}
 */
const ICON_LOADER = 'progress_activity';

/**
 * @class
 * @classdesc Composant qui gère le fonctionnement du mode "chargement" du bouton
 * @extends AHTMLComponent
 */
export default class LoadingComponent extends AHTMLComponent {
  /**
   * @type {import('../button/HTMLBnumButton.js').default}
   */
  #_parent;
  /**
   *
   * @param {import('../button/HTMLBnumButton.js').default} parent
   */
  constructor(parent) {
    super(parent);
    this.#_parent = parent;
  }

  /**
   * Si le bouton est en mode chargement ou non
   * @type {boolean}
   * @readonly
   */
  get isLoadingMode() {
    return ['loading', 'true', true, 1, '1'].includes(this.getData('loading'));
  }

  /**
   * Initialise le composant
   * @override
   */
  setup() {
    if (this.isLoadingMode) {
      //Temps d'attente avant que le bouton soit afficher correctement, pour que le mode "chargement" soit afficher correctement
      setTimeout(() => {
        this._p_save_data('loading', false);
        this.setLoadingMode();
      }, INIT_TIMEOUT);
    }
  }

  /**
   * Action lorsqu'un attribut a été modifié
   * @param {string} name
   * @param {string} value
   * @returns {void}
   */
  attributeUpdated(name, value) {
    if (!this.#_getTargetWrapper() || !this.#_parent.elementLoaded) return;

    switch (name) {
      case 'loading':
        if (['loading', 'true', true, 1, '1'].includes(value))
          this.setLoadingMode();
        else this.stopLoadingmode();
        break;

      default:
        break;
    }
  }

  /**
   * Récupère le font size d'un élément
   * @param {HTMLElement} element
   * @returns {string}
   * @private
   */
  #_getFontSize(element) {
    const fontSize =
      element.style.fontSize ||
      ((el) => {
        const style = window
          .getComputedStyle(el, null)
          .getPropertyValue('font-size');

        return style;
      })(element);

    return fontSize;
  }

  /**
   * Récupère le wrapper qui affichera le chargement
   * @returns {HTMLWrapperElement}
   */
  #_getTargetWrapper() {
    return this.#_parent.querySelector(`.${CLASS_LOADING_RECEIVER}`);
  }

  /**
   * Active l'apparance et le fonctionnement du mode "chargement"
   * @returns {this}
   */
  setLoadingMode() {
    if (!this.isLoadingMode) {
      //On met la taille du bouton pour éviter que l'affichage du loading ne décale le contenu
      this.#_parent.style.width = `${this.#_parent.offsetWidth}px`;
      this.#_parent.style.height = `${this.#_parent.offsetHeight}px`;

      this._p_save_data('loading', 'loading');
      this.disable();

      if (this.#_parent.icon) {
        this._p_save_data('icon', this.#_parent.icon);
        this.#_parent.icon = ICON_LOADER;
        this.#_parent.querySelector('bnum-icon').classList.add(CLASS_SPIN);
        //Spin est une classe qui fait tourner l'élément
      } else {
        //init_state est pour éviter les bugs avec `stopLoadingmode`, pour éviter qu'il considère qu'il y avait une icône avant et que l'affichage fasse n'importe quoi
        this._p_save_data('init_state', true);
        let targetWrapper = this.#_getTargetWrapper();
        let wrapper = HTMLWrapperElement.CreateNode();
        let loader = BnumHtmlIcon.Create({
          icon: ICON_LOADER,
        }).addClass(CLASS_SPIN);
        loader.style.fontSize = this.#_getFontSize(targetWrapper);
        loader.style.verticalAlign = 'middle';

        wrapper.style.textAlign = 'center';
        wrapper.addClass('internal__wrapper--loading').appendChild(loader);

        targetWrapper.style.display = 'none';

        targetWrapper.parentElement.appendChild(wrapper);

        //free
        targetWrapper = null;
        wrapper = null;
        loader = null;
      }

      this.#_parent.setState('loading');
    }

    return this;
  }

  /**
   * Désactive l'apparance et le fonctionnement du mode "chargement"
   * @returns {this}
   */
  stopLoadingmode() {
    if (this.isLoadingMode) {
      let targetWrapper = this.#_getTargetWrapper();

      this._p_save_data('loading', false);
      this.enable();

      if (this.#_parent.icon && !this.getData('init_state')) {
        this.#_parent.icon = this.getData('icon');
        this.#_parent.querySelector('bnum-icon').classList.remove(CLASS_SPIN);
      } else {
        this.#_parent.style.width = null;
        this.#_parent.style.height = null;

        this._p_save_data('init_state', false);
        this.#_parent.querySelector('.internal__wrapper--loading')?.remove?.();
        this.#_parent.removeState('loading');

        targetWrapper.style.display = null;
        targetWrapper = null;
      }

      return this;
    }
  }
}
