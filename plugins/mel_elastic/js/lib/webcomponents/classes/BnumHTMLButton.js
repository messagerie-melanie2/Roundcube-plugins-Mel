import { EMPTY_STRING } from '../../../../../mel_metapage/js/lib/constants/constants.js';
import { REG_XSS_SAFE } from '../../../../../mel_metapage/js/lib/constants/regexp.js';
import {
  BnumHtmlIcon,
  BnumHtmlShadowIcon,
} from '../../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/js_html_base_web_elements';
import { BnumEvent } from '../../../../../mel_metapage/js/lib/mel_events.js';
import ABnumHTMLElement from '../abstract/ABnumHTMLElement.js';
import ElementChangedEvent from '../events/ElementChangedEvent.js';
import style from '../style/bnum-button-style.js';

/**
 * Tag HTML du bouton Bnum.
 * @constant
 * @type {string}
 */
const TAG = 'bnum-button';

/**
 * Tag HTML du bouton Bnum de type "primary".
 * @constant
 * @type {string}
 */
const TAG_PRIMARY = 'bnum-primary-button';

/**
 * Tag HTML du bouton Bnum de type "secondary".
 * @constant
 * @type {string}
 */
const TAG_SECONDARY = 'bnum-secondary-button';

/**
 * Tag HTML du bouton Bnum de type "danger".
 * @constant
 * @type {string}
 */
const TAG_DANGER = 'bnum-danger-button';

/**
 * Icône de chargement par défaut.
 * @constant
 * @type {string}
 * @default 'progress_activity'
 * @see {@link https://fonts.google.com/icons?selected=Material+Symbols+Outlined:progress_activity:FILL@0;wght@400;GRAD@0;opsz@24&icon.query=progress_activity&icon.size=24&icon.color=%231f1f1f}
 */
const ICON_LOADER = 'progress_activity';

/**
 * Classe représentant un bouton personnalisé Bnum.
 * Gère les variations, l'affichage d'icônes, l'état de chargement, etc.
 * @class
 * @extends ABnumHTMLElement
 */
export default class BnumHTMLButton extends ABnumHTMLElement {
  /**
   * Internals pour la gestion des états du composant.
   * @type {ElementInternals}
   * @private
   */
  #_internals = this.attachInternals();

  /**
   * Indique si la recherche d'icônes doit être ignorée.
   * @type {boolean}
   * @private
   */
  #_ignoreFindingIcons = false;

  /**
   * Indique si c'est le premier rendu du composant.
   * @type {boolean}
   * @private
   */
  #_firstRender = true;

  /**
   * Retourne la liste des attributs observés par le composant.
   * @returns {string[]}
   * @static
   * @protected
   */
  static _p_observedAttributes() {
    return [
      'data-icon',
      'data-icon-pos',
      'data-icon-margin',
      'data-variation',
      'square',
      'loading',
    ];
  }

  /**
   * ## Liste des événements disponibles sur ce composant :
   * - onloadingstatechange : déclenché lors du changement d'état de chargement (loading)
   * - oniconchange : déclenché lors du changement d'icône
   * - oniconpropchange : déclenché lors du changement de propriété de l'icône (position ou marge)
   * - onvariationchange : déclenché lors du changement de variation (primary, secondary, danger)
   *
   * ## Les événements DOM suivants sont également dispatchés :
   * - custom:element-changed.icon (ElementChangedEvent)
   * - custom:element-changed.variation (ElementChangedEvent)
   * - custom:icon.prop.changed (CustomEvent)
   * - custom:loading (CustomEvent)
   *
   * ## Attributs disponibles :
   * - data-icon : string | null — Nom de l'icône à afficher (par défaut : null)
   * - data-icon-pos : 'left' | 'right' — Position de l'icône (par défaut : 'right')
   * - data-icon-margin : string | null — Marge CSS appliquée à l'icône (par défaut : 'var(--custom-button-icon-margin, 20px)')
   * - data-variation : 'primary' | 'secondary' | 'danger' — Variation du bouton (par défaut : 'primary')
   * - square : boolean — Rend le bouton carré (par défaut : false)
   * - loading : boolean — Active l'état de chargement (par défaut : false)
   *
   * ## États internes (internals.states) :
   * - primary, secondary, danger : variation du bouton
   * - square : bouton carré
   * - loading : bouton en chargement
   * - disabled : bouton désactivé (si loading ou disabled)
   * - icon : bouton avec icône
   * - without-icon : bouton sans icône
   * - without-icon-loading : bouton sans icône mais en chargement
   *
   * ## Slots disponibles :
   * - (default) : contenu texte ou HTML du bouton
   *
   */
  constructor() {
    super();

    /**
     * Événement déclenché lorsque le bouton passe en mode chargement ou non.
     * @type {BnumEvent<(state: bool) => void>}
     */
    this.onloadingstatechange = new BnumEvent();
    /**
     * Événement déclenché lorsque l'icône est changé.
     * @type {BnumEvent<(newIcon: string, oldIcon: string) => void>}
     */
    this.oniconchange = new BnumEvent();
    /**
     * Événement déclenché lorsque le margin ou la position droite/gauche de l'icône est changé.
     * @type {BnumEvent<(type: 'margin' | 'pos', new: string) => void>}
     */
    this.oniconpropchange = new BnumEvent();
    /**
     * Événement déclenché lorsque la variation du bouton est changé.
     * @type {BnumEvent<(newVariation: 'primary' | 'secondary' | 'danger', oldVariation: 'primary' | 'secondary' | 'danger') => void>}
     */
    this.onvariationchange = new BnumEvent();

    this.oniconchange.push((n, o) => {
      this.dispatchEvent(new ElementChangedEvent('icon', n, o, this));
    });

    this.onvariationchange.push((n, o) => {
      this.dispatchEvent(new ElementChangedEvent('variation', n, o, this));
    });

    this.oniconpropchange.push((type, newValue) => {
      this.dispatchEvent(
        new CustomEvent('custom:icon.prop.changed', {
          detail: { type, newValue },
        }),
      );
    });

    this.onloadingstatechange.push((state) => {
      this.dispatchEvent(
        new CustomEvent('custom:loading', {
          detail: { state },
        }),
      );
    });

    this._p_on_attribute_changed.push(() => {
      if (!this.#_firstRender) {
        this.#_ignoreFindingIcons = true;
        this.render();
      }
    });
  }

  /**
   * Variation du bouton (primary, secondary, danger).
   * @type {'primary' | 'secondary' | 'danger'}
   */
  get variation() {
    return this.data('variation') || 'primary';
  }
  set variation(value) {
    // Ne permettre que 'primary', 'secondary', 'tertiary' ou 'danger'
    if (['primary', 'secondary', 'tertiary', 'danger'].includes(value)) {
      this.data('variation', { value, fromAttribute: true });

      if (!this.#_firstRender) {
        this.onvariationchange.call(value);
      }
    }
  }

  /**
   * Récupère l'icône associée au bouton.
   * @type {?string}
   */
  get icon() {
    return this.data('icon') || null;
  }

  /**
   * Définit l'icône du bouton.
   * @param {string} value - Nom de l'icône.
   */
  set icon(value) {
    if (!this.#_firstRender) {
      this.oniconchange.call(value, this.icon);
    }

    if (typeof value === 'string' && /^[\w-]+$/.test(value))
      this.data('icon', { value, fromAttribute: true });
    else this.data('icon', null);
  }

  /**
   * Position de l'icône (left ou right).
   * @type {'left' | 'right'}
   */
  get iconPos() {
    return this.data('icon-pos') || 'right';
  }

  /**
   * Définit la position de l'icône.
   * @param {'left' | 'right'} value
   */
  set iconPos(value) {
    if (!this.#_firstRender) {
      this.oniconpropchange.call('pos', value);
    }

    // Ne permettre que 'left' ou 'right'
    if (['left', 'right'].includes(value))
      this.data('icon-pos', { value, fromAttribute: true });
  }

  /**
   * Marge appliquée à l'icône.
   * @type {string}
   */
  get iconMargin() {
    return this.data('icon-margin') || 'var(--custom-button-icon-margin, 20px)';
  }
  /**
   * Définit la marge de l'icône.
   * @param {string|null} value - Valeur CSS de la marge ou null.
   */
  set iconMargin(value) {
    if (!this.#_firstRender) {
      this.oniconpropchange.call('pos', value);
    }

    if (typeof value === 'string' && REG_XSS_SAFE.test(value))
      this.data('icon-margin', { value, fromAttribute: true });
    else if (value === null) {
      this.data('icon-margin', { value });
      this.#_ignoreFindingIcons = true;
      this.render();
    }
  }

  /**
   * Rendu du composant.
   * @protected
   * @returns {string}
   */
  _p_render() {
    super._p_render();
    BnumHTMLButton.ToButton(this);
    const isLoading = this.#_isLoading();

    this.#_internals.states.clear();
    this.#_internals.states.add(this.variation);

    if (this.#_isSquare()) this.#_internals.states.add('square');

    if (isLoading) this.#_internals.states.add('loading');

    if (isLoading || this.#_isDisabled())
      this.#_internals.states.add('disabled');

    let txt = '<slot></slot>';

    const iconData = this.#_findIcon();

    if (iconData) {
      this.data('icon-pos', { value: iconData.first ? 'left' : 'right' });
      const icon = `<${BnumHtmlShadowIcon.TAG} class="icon" data-icon="${isLoading ? ICON_LOADER : iconData.icon}"></${BnumHtmlShadowIcon.TAG}>`;

      if (iconData.first) txt = `${icon}${txt}`;
      else txt += icon;

      this.#_internals.states.add('icon');
    } else if (isLoading) {
      this.#_internals.states.add('without-icon-loading');
      txt += `<${BnumHtmlShadowIcon.TAG} class="loader" data-icon="${ICON_LOADER}"></${BnumHtmlShadowIcon.TAG}>`;
    } else {
      this.#_internals.states.add('without-icon');
    }

    this.#_firstRender = false;

    return `
      ${this.#_style()}
      <div class="wrapper">${txt}</div>
    `
      .replaceAll('<script', '&lt;script')
      .replaceAll('</script>', '&lt;/script&gt;');
  }

  /**
   * Génère le style du composant.
   * @private
   * @returns {string}
   */
  #_style() {
    return `<style>${style.replaceAll('%0', this.iconPos === 'left' ? 'right' : 'left').replaceAll('%1', this.iconMargin)}</style>`;
  }

  /**
   * Indique si le bouton est carré.
   * @private
   * @returns {boolean}
   */
  #_isSquare() {
    return this.#_is('square');
  }

  /**
   * Indique si le bouton est en état de chargement.
   * @private
   * @returns {boolean}
   */
  #_isLoading() {
    return this.#_is('loading');
  }

  /**
   * Indique si le bouton est désactivé.
   * @private
   * @returns {boolean}
   */
  #_isDisabled() {
    return this.#_is('disabled');
  }

  /**
   * Vérifie si un attribut est présent et actif.
   * @private
   * @param {string} attr - Nom de l'attribut.
   * @returns {boolean}
   */
  #_is(attr) {
    return (
      this.hasAttribute(attr) &&
      [attr, 'true', true].includes(this.getAttribute(attr))
    );
  }

  /**
   * Recherche et retourne les informations sur l'icône à afficher.
   * @private
   * @returns {{first: boolean, icon: string}|false}
   */
  #_findIcon() {
    if (this.icon) {
      return {
        first: this.iconPos === 'left',
        icon: this.icon,
      };
    } else if (!this.#_ignoreFindingIcons) {
      const children = Array.from(this.childNodes);
      let foundNode = true;

      for (const child of children) {
        if (
          child.nodeName === BnumHtmlShadowIcon.TAG.toUpperCase() ||
          child.nodeName === BnumHtmlIcon.TAG.toUpperCase()
        ) {
          this._p_setData('icon', child.icon);
          const icon = child.icon;
          child.remove();

          return {
            first: foundNode,
            icon,
          };
        } else if (foundNode) foundNode = false;
      }
    }

    return false;
  }

  /**
   * Active l'état de chargement du bouton.
   * @returns {this}
   */
  setLoading() {
    return this.attr('loading', true);
  }

  /**
   * Désactive l'état de chargement du bouton.
   * @returns {this}
   */
  stopLoading() {
    this.removeAttribute('loading');
    return this;
  }

  /**
   * Ajoute le rôle "bouton" et son fonctionnement à un élément
   * @param {T} element
   * @returns {T}
   * @template {HTMLElement} T
   * @static
   */
  static ToButton(element) {
    if (!element.onkeydown) {
      element.onkeydown = (e) => {
        switch (e.key) {
          case ' ':
          case 'Enter':
            e.target.click();
            break;

          default:
            break;
        }
      };
    }

    if (
      !element.hasAttribute('role') ||
      element.getAttribute('role') !== 'button'
    )
      element.setAttribute('role', 'button');

    if (!element.hasAttribute('tabindex'))
      element.setAttribute('tabindex', '0');

    return element;
  }

  /**
   *
   * Méthode statique de création d'un bouton Bnum.
   * Permet de créer dynamiquement un élément bouton personnalisé avec les propriétés spécifiées.
   *
   * @protected
   * @param {BnumHTMLButton | BnumHTMLDangerButton | BnumHTMLSecondaryButton | BnumHTMLPrimaryButton} buttonClass
   * @param {Object} [options={}] - Options de création du bouton.
   * @param {string} [options.text=EMPTY_STRING] - Texte du bouton.
   * @param {?string} [options.icon=null] - Nom de l'icône à afficher.
   * @param {'left'|'right'} [options.iconPos='right'] - Position de l'icône.
   * @param {?string} [options.iconMargin=null] - Marge CSS appliquée à l'icône.
   * @param {'primary'|'secondary'|'danger'|null} [options.variation=null] - Variation du bouton.
   * @param {boolean} [options.square=false] - Indique si le bouton est carré.
   * @param {boolean} [options.loading=false] - Indique si le bouton est en état de chargement.
   * @returns {BnumHTMLButton | BnumHTMLDangerButton | BnumHTMLSecondaryButton | BnumHTMLPrimaryButton} Élément bouton Bnum configuré.
   */
  static _p_Create(
    buttonClass,
    {
      text = EMPTY_STRING,
      icon = null,
      iconPos = 'right',
      iconMargin = null,
      variation = null,
      square = false,
      loading = false,
    } = {},
  ) {
    let node = document.createElement(buttonClass.TAG);
    node.textContent = text;

    if (iconMargin === 0) iconMargin = '0px';

    if (icon) node.setAttribute('data-icon', icon);
    if (iconPos) node.setAttribute('data-icon-pos', iconPos);
    if (iconMargin) node.setAttribute('data-icon-margin', iconMargin);
    if (variation) node.setAttribute('data-variation', variation);
    if (square) node.setAttribute('square', true);
    if (loading) node.setAttribute('loading', true);

    return node;
  }

  /**
   * Méthode statique de création d'un bouton Bnum.
   * Permet de créer dynamiquement un élément bouton personnalisé avec les propriétés spécifiées.
   *
   * @param {Object} [options={}] - Options de création du bouton.
   * @param {string} [options.text=EMPTY_STRING] - Texte du bouton.
   * @param {?string} [options.icon=null] - Nom de l'icône à afficher.
   * @param {'left'|'right'} [options.iconPos='right'] - Position de l'icône.
   * @param {?string} [options.iconMargin=null] - Marge CSS appliquée à l'icône.
   * @param {'primary'|'secondary'|'danger'} [options.variation=EButtonType.PRIMARY] - Variation du bouton.
   * @param {boolean} [options.square=false] - Indique si le bouton est carré.
   * @param {boolean} [options.loading=false] - Indique si le bouton est en état de chargement.
   * @returns {BnumHTMLButton} Élément bouton Bnum configuré.
   */
  static Create({
    text = EMPTY_STRING,
    icon = null,
    iconPos = 'right',
    iconMargin = null,
    variation = EButtonType.PRIMARY,
    square = false,
    loading = false,
  } = {}) {
    return this._p_Create(this, {
      text,
      icon,
      iconPos,
      iconMargin,
      variation,
      square,
      loading,
    });
  }

  /**
   * Crée dynamiquement un bouton Bnum avec uniquement une icône.
   * @param {string} icon - Nom de l'icône à afficher.
   * @param {Object} [param1={}] - Options de création du bouton.
   * @param {string} [param1.variation=EButtonType.PRIMARY] - Variation du bouton.
   * @param {boolean} [param1.square=false] - Indique si le bouton est carré.
   * @param {boolean} [param1.loading=false] - Indique si le bouton est en état de chargement.
   * @returns {BnumHTMLButton} Élément bouton Bnum configuré.
   */
  static CreateOnlyIcon(
    icon,
    { variation = EButtonType.PRIMARY, square = false, loading = false } = {},
  ) {
    return this.Create({
      icon,
      variation,
      square,
      loading,
      iconMargin: 0,
    });
  }

  /**
   * Tag HTML du composant.
   * @type {string}
   * @readonly
   * @static
   */
  static get TAG() {
    return TAG;
  }
}

BnumHTMLButton.TryDefine();

/**
 * Enumération des types de boutons.
 * @enum {string}
 */
export const EButtonType = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  TERTIARY: 'tertiary',
  DANGER: 'danger',
};

/**
 * Classe représentant un bouton Bnum de type "primary".
 * Hérite de {@link BnumHTMLButton} et applique automatiquement la variation "primary".
 *
 * @class
 * @extends BnumHTMLButton
 */
export class BnumHTMLPrimaryButton extends BnumHTMLButton {
  /**
   * Constructeur du bouton "primary".
   */
  constructor() {
    super();
    this.data('variation', {
      value: EButtonType.PRIMARY,
      fromAttribute: false,
    });
  }

  /**
   * Crée dynamiquement un bouton Bnum de type "primary".
   * @param {Object} [options={}] - Options de création du bouton.
   * @param {string} [options.text=EMPTY_STRING] - Texte du bouton.
   * @param {?string} [options.icon=null] - Nom de l'icône à afficher.
   * @param {'left'|'right'} [options.iconPos='right'] - Position de l'icône.
   * @param {?string} [options.iconMargin=null] - Marge CSS appliquée à l'icône.
   * @param {boolean} [options.square=false] - Indique si le bouton est carré.
   * @param {boolean} [options.loading=false] - Indique si le bouton est en état de chargement.
   * @returns {HTMLElement} Élément bouton Bnum configuré.
   */
  static Create({
    text = EMPTY_STRING,
    icon = null,
    iconPos = 'right',
    iconMargin = null,
    square = false,
    loading = false,
  } = {}) {
    return this._p_Create(this, {
      text,
      icon,
      iconPos,
      iconMargin,
      square,
      loading,
    });
  }

  /**
   * Crée dynamiquement un bouton Bnum avec uniquement une icône.
   * @param {string} icon - Nom de l'icône à afficher.
   * @param {Object} [param1={}] - Options de création du bouton.
   * @param {boolean} [param1.square=false] - Indique si le bouton est carré.
   * @param {boolean} [param1.loading=false] - Indique si le bouton est en état de chargement.
   * @returns {BnumHTMLButton} Élément bouton Bnum configuré.
   */
  static CreateOnlyIcon(icon, { square = false, loading = false } = {}) {
    return this.Create({
      icon,
      square,
      loading,
      iconMargin: 0,
    });
  }

  /**
   * Retourne le tag HTML du bouton "primary".
   * @type {string}
   * @readonly
   * @static
   */
  static get TAG() {
    return TAG_PRIMARY;
  }
}

BnumHTMLPrimaryButton.TryDefine();

/**
 * Classe représentant un bouton Bnum de type "secondary".
 * Hérite de {@link BnumHTMLButton} et applique automatiquement la variation "secondary".
 *
 * @class
 * @extends BnumHTMLButton
 */
export class BnumHTMLSecondaryButton extends BnumHTMLButton {
  /**
   * Constructeur du bouton "secondary".
   */
  constructor() {
    super();
    this.data('variation', {
      value: EButtonType.SECONDARY,
      fromAttribute: false,
    });
  }

  /**
   * Crée dynamiquement un bouton Bnum de type "secondary".
   * @param {Object} [options={}] - Options de création du bouton.
   * @param {string} [options.text=EMPTY_STRING] - Texte du bouton.
   * @param {?string} [options.icon=null] - Nom de l'icône à afficher.
   * @param {'left'|'right'} [options.iconPos='right'] - Position de l'icône.
   * @param {?string} [options.iconMargin=null] - Marge CSS appliquée à l'icône.
   * @param {boolean} [options.square=false] - Indique si le bouton est carré.
   * @param {boolean} [options.loading=false] - Indique si le bouton est en état de chargement.
   * @returns {HTMLElement} Élément bouton Bnum configuré.
   */
  static Create({
    text = EMPTY_STRING,
    icon = null,
    iconPos = 'right',
    iconMargin = null,
    square = false,
    loading = false,
  } = {}) {
    return this._p_Create(this, {
      text,
      icon,
      iconPos,
      iconMargin,
      square,
      loading,
    });
  }

  /**
   * Crée dynamiquement un bouton Bnum avec uniquement une icône.
   * @param {string} icon - Nom de l'icône à afficher.
   * @param {Object} [param1={}] - Options de création du bouton.
   * @param {boolean} [param1.square=false] - Indique si le bouton est carré.
   * @param {boolean} [param1.loading=false] - Indique si le bouton est en état de chargement.
   * @returns {BnumHTMLButton} Élément bouton Bnum configuré.
   */
  static CreateOnlyIcon(icon, { square = false, loading = false } = {}) {
    return this.Create({
      icon,
      square,
      loading,
      iconMargin: 0,
    });
  }

  /**
   * Retourne le tag HTML du bouton "secondary".
   * @type {string}
   * @readonly
   * @static
   */
  static get TAG() {
    return TAG_SECONDARY;
  }
}

BnumHTMLSecondaryButton.TryDefine();

/**
 * Classe représentant un bouton Bnum de type "danger".
 * Hérite de {@link BnumHTMLButton} et applique automatiquement la variation "danger".
 *
 * @class
 * @extends BnumHTMLButton
 */
export class BnumHTMLDangerButton extends BnumHTMLButton {
  /**
   * Constructeur du bouton "danger".
   */
  constructor() {
    super();
    this.data('variation', {
      value: EButtonType.DANGER,
      fromAttribute: false,
    });
  }

  /**
   * Crée dynamiquement un bouton Bnum de type "danger".
   * @param {Object} [options={}] - Options de création du bouton.
   * @param {string} [options.text=EMPTY_STRING] - Texte du bouton.
   * @param {?string} [options.icon=null] - Nom de l'icône à afficher.
   * @param {'left'|'right'} [options.iconPos='right'] - Position de l'icône.
   * @param {?string} [options.iconMargin=null] - Marge CSS appliquée à l'icône.
   * @param {boolean} [options.square=false] - Indique si le bouton est carré.
   * @param {boolean} [options.loading=false] - Indique si le bouton est en état de chargement.
   * @returns {HTMLElement} Élément bouton Bnum configuré.
   */
  static Create({
    text = EMPTY_STRING,
    icon = null,
    iconPos = 'right',
    iconMargin = null,
    square = false,
    loading = false,
  } = {}) {
    return this._p_Create(this, {
      text,
      icon,
      iconPos,
      iconMargin,
      square,
      loading,
    });
  }

  /**
   * Crée dynamiquement un bouton Bnum avec uniquement une icône.
   * @param {string} icon - Nom de l'icône à afficher.
   * @param {Object} [param1={}] - Options de création du bouton.
   * @param {boolean} [param1.square=false] - Indique si le bouton est carré.
   * @param {boolean} [param1.loading=false] - Indique si le bouton est en état de chargement.
   * @returns {BnumHTMLButton} Élément bouton Bnum configuré.
   */
  static CreateOnlyIcon(icon, { square = false, loading = false } = {}) {
    return this.Create({
      icon,
      square,
      loading,
      iconMargin: 0,
    });
  }

  /**
   * Retourne le tag HTML du bouton "danger".
   * @type {string}
   * @readonly
   * @static
   */
  static get TAG() {
    return TAG_DANGER;
  }
}

BnumHTMLDangerButton.TryDefine();
