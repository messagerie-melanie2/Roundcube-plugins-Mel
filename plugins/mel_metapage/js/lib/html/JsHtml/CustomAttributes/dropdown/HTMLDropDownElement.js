import { MelEnumerable } from '../../../../classes/enum.js';
import { EMPTY_STRING } from '../../../../constants/constants.js';
import { BnumEvent } from '../../../../mel_events.js';
import {
  BnumHtmlShadowIcon,
  BnumHtmlVoiceElement,
  EWebComponentMode,
} from '../js_html_base_web_elements.js';
import AHTMLCustomInternalElement from '../lib/AHTMLCustomInternalElement.js';
import { HTMLWrapperElement } from '../wrapper.js';
import {
  HTMLBnumDropDownDefaultOption,
  HTMLBnumDropDownOption,
  HTMLBnumDropDownSelectedOption,
} from './HtmlDropDownOptions.js';
import RoundShapeComponent from './RoundShapeComponent.js';
import DropDownVariationComponent, {
  EDropDownVariations,
} from './VariationComponent.js';

/**
 * @callback DropDownCallback
 * @param {string} value
 * @param {Event} originalEvent
 * @param {HTMLDropDownElement} caller
 * @returns {void}
 */

/**
 * # Dropdown du Bnum
 * Permet la création d'un dropdown personalisé.
 *
 * ## Utilisation
 * Le dropdown contient 2 variations :
 * - default : Représentation par défaut, ressemble à un select standard avec une icône à gauche (optionelle)
 * - alternate : Arrière plan transparent, la flèche à droite est caché et se trouve à gauche.
 *
 * Les variations peuvent être utilisé, soit par le data `variation`, soit avec le composant custom : {@link HTMLAlternateDropDownElement|alternate-dropdown}
 *
 * Ajoutez l'attribut {@link RoundShapeComponent|square} pour avoir un bouton avec des bords carré légèrement arrondi.
 *
 * Vous pouvez ajouter un attribut "h" allant de 1 à 6 pour définir une taille de texte spécifique.
 *
 * Ajoutez un élément {@link BnumHtmlVoiceElement|voice} pour décrire le dropdown.
 *
 * Pour ajouter des options, vous avez plusieurs.... options (lol) :
 * - {@link HTMLBnumDropDownOption|bnum-option} : L'élément est caché par défaut, ce qui permet d'avoir un meilleur affichage.
 * - {@link HTMLBnumDropDownDefaultOption|default-option} : L'élément est caché par défaut, ce qui permet d'avoir un meilleur affichage. Il est sélectionné par défaut et non reséléctionnable.
 * - {@link HTMLBnumDropDownSelectedOption|selected-option} : L'élément est caché par défaut, ce qui permet d'avoir un meilleur affichage. Il est sélectionné par défaut.
 *
 * ## Evènements
 * Vous pouvez écouter l'évènements `custom:event:change` pour être notifié lorsqu'une option est sélectionné.
 *
 * ## Css
 * ### Etats
 * L'élément possède des {@link https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals/states|états internes} qui peuvent être utilisés dans le css avec le tag :state($etat$).
 * - bnum-dropdown : Permet de séléctionnée les éléments custom qui hérite de cette classe
 * - placeholder : Lorsqu'aucune option n'est sélectionné parce qu'une {@link HTMLBnumDropDownDefaultOption|option par défaut} est présente. Elle est retirée lorsqu'une option est sélectionné.
 * ### Variables
 * - --dropdown-width : Largeur du select
 * - --dropdown-height : Hauteur du select
 * - --dropdown-color--alternate : Couleur du texte pour la variation alternate
 * - --dropdow-padding--alternate : Marge intérieur pour la variation alternate (8px 10px 8px 10px par défaut)
 * - --dropdown-background-color--alternate--hover : Couleur de fond au survol pour la variation alternate
 * - --dropdown-color--alternate--hover : Couleur du texte au survol pour la variation alternate
 * - --dropdown-background-color--alternate--clicked : Couleur de fond au click pour la variation alternate
 * - --dropdown-color--alternate--clicked : Couleur du texte au click pour la variation alternate
 * - --dropdown-radius : Rayon de bordure du bouton
 * - --dropdown-square-radius : Rayon de bordure du bouton avec des bords carré légèrement arrondi
 * - --h1-font-size : Taille de police pour h1
 * - --h2-font-size : Taille de police pour h2
 * - --h3-font-size : Taille de police pour h3
 * - --h4-font-size : Taille de police pour h4
 * - --h5-font-size : Taille de police pour h5
 * - --h6-font-size : Taille de police pour h6
 * @class
 * @extends AHTMLCustomInternalElement
 */
export default class HTMLDropDownElement extends AHTMLCustomInternalElement {
  /**
   * Indique que cet élément peut être utilisé par un formulaire.
   *
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals#examples|ref}
   * @type {boolean}
   * @readonly
   * @static
   */
  static formAssociated = true;
  /**
   * @type {import('../lib/AHTMLComponent.js').default[]}
   */
  #_components = [];

  constructor() {
    super({ mode: EWebComponentMode.inline_block });
    /**
     * Evènement déclencher lorsqu'une option est sélectionné
     * @type {BnumEvent<DropDownCallback>}
     * @event
     */
    this.onvaluechanged = new BnumEvent();
    this.onvaluechanged.add('default', (value, originalEvent, caller) => {
      if (this.state.has('placeholder')) this.removeState('placeholder');
      this.#_setValidity();
      this.internals.setFormValue(value);

      this.dispatchEvent(
        new CustomEvent('custom:event:change', {
          detail: { value, originalEvent, caller },
        }),
      );
    });

    this.#_components.push(
      new DropDownVariationComponent(this),
      new RoundShapeComponent(this),
    );
  }

  /**
   * @type {HTMLWrapperElement}
   * @readonly
   */
  get wrapper() {
    return this.navigator.querySelector('bnum-wrapper');
  }

  /**
   * @type {string}
   * @readonly
   */
  get value() {
    return this.navigator.querySelector('select').value;
  }

  /**
   * En tête de l'élément
   * @type {number}
   * @readonly
   */
  get h() {
    return +(this.getAttribute('h') || 0);
  }

  /**
   * Code principal
   * @protected
   */
  _p_main() {
    super._p_main();
    this._p_before();

    /**
     * Id du label qui permettra de décrire cet élément
     * @type {string}
     * @package
     * @constant
     */
    const voiceId = this.generateId(
      (this.getAttribute('id') ?? 'dropdown__host') + '__voice',
    );

    //Modifications sur cet élément
    this.setAttribute('aria-labelledby', `${voiceId}2`);
    this.setState('bnum-dropdown');
    this.onclick = () => {
      this.navigator.querySelector('select').showPicker();
    };

    this.attrs({
      role: 'combobox',
      tabindex: 0,
    });

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

    //Ajout du shadow dom
    let context = this._p_start_construct({ delegatesFocus: true });

    //Génération des élément
    //Génération du select
    let select = document.createElement('select');
    select.addEventListener('change', (e) => {
      this.onvaluechanged.call(this.value, e, this);
    });
    select.setAttribute('tabindex', '-1');
    select.setAttribute('aria-labelledby', voiceId);

    select.append(
      ...MelEnumerable.from(this.children)
        .where((x) =>
          [
            HTMLBnumDropDownDefaultOption.TAG.toUpperCase(),
            HTMLBnumDropDownSelectedOption.TAG.toUpperCase(),
            HTMLBnumDropDownOption.TAG.toUpperCase(),
          ].includes(x.nodeName),
        )
        .select((e) => e.toOption()),
      ...MelEnumerable.from(this.children).where(
        (x) => x.nodeName === 'OPTION',
      ),
    );

    //Suppression des options qui ne servent plus
    this.#_removeOldOptions();

    //Génération du wrapper
    let wrapper = HTMLWrapperElement.CreateNode();
    wrapper.style.display = 'flex';
    wrapper.appendChild(select);

    //Génération du style
    let style = document.createElement('style');
    style.appendChild(document.createTextNode(this.#_style()));

    //Génération du label
    let voice = this.querySelector(BnumHtmlVoiceElement.TAG);
    if (!voice && this.hasAttribute('voice')) {
      voice = BnumHtmlVoiceElement.Create(this.getAttribute('voice'));
      this.removeAttribute('voice');
    }

    voice ??= BnumHtmlVoiceElement.Create('Choisissez une option');
    voice.setAttribute('id', voiceId);
    this.navigator.prepend(voice);

    voice = BnumHtmlVoiceElement.Create(
      voice.querySelector('label')?.textContent ||
        voice.navigator.querySelector('label').textContent,
    );
    voice.setAttribute('id', voiceId + '2');
    this.parentElement.append(voice);

    //Gestion des composants
    for (const component of this.#_components) {
      component.setup(wrapper);
    }

    //Ajout des éléments
    context.append(style, wrapper);

    //Gestion des états
    if (
      this.navigator
        .querySelector(`option[value="${this.value}"]`)
        .classList.contains('disabled')
    ) {
      this.setState('placeholder');
    }

    //Gestion du formulaire
    this.#_setValidity();
    this.internals.setFormValue(this.value);

    //Libération de la mémoire
    context = null;
    style = null;
    select = null;
    wrapper = null;
    voice = null;
  }

  /**
   * Action à faire avant le code principal
   * @protected
   * @virtual
   */
  _p_before() {}

  /**
   * Change la valeur du select
   * @param {*} value Nouvelle valeur, elle doit être dans le select
   * @returns {this}
   */
  select(value) {
    this.navigator.querySelector('select').value = value;
    this.onvaluechanged.call(value, new Event('change'), this);
    return this;
  }

  /**
   * @inheritdoc
   * @override
   * @returns {true}
   */
  shadowEnabled() {
    return true;
  }

  /**
   * C'est ici que le style de l'élément est défini
   * @returns {string}
   * @private
   */
  #_style() {
    return `      
        :host {
          cursor: pointer;
        }

        :host(:state(disabled)), :host(.disabled) {
          pointer-events: none;
          opacity: 0.5;
        }

        :host(:state(placeholder)) select {
          font-style: italic;
        }

      ${HTMLWrapperElement.TAG} {
        align-items: center;
      }

      select {
        border: none;
        background-color: transparent;
        width: var(--dropdown-width, 100%);
        height: var(--dropdown-height, 100%);
                  cursor: pointer;
                  ${this.#_setH()}
      }

      ${BnumHtmlShadowIcon.TAG} {
        display:contents;
      }

      ${this.#_components.map((x) => x?.style?.() ?? EMPTY_STRING).join(EMPTY_STRING)}
    `;
  }

  #_setH() {
    let style;
    switch (this.h) {
      case 1:
        style = 'font-size: var(--h1-font-size, 2.5rem);';
        break;

      case 2:
        style = 'font-size: var(--h2-font-size, 2rem);';
        break;

      case 3:
        style = 'font-size: var(--h3-font-size, 1.75rem);';
        break;
      case 4:
        style = 'font-size: var(--h4-font-size, 1.5rem);';
        break;
      case 5:
        style = 'font-size: var(--h5-font-size, 1.25rem);';
        break;
      case 6:
        style = 'font-size: var(--h6-font-size, 1rem);';
        break;

      default:
        style = EMPTY_STRING;
        break;
    }

    return style;
  }

  /**
   * Met à jour la validitée de l'élément
   * @returns {this}
   * @private
   */
  #_setValidity() {
    if (this.state.has('placeholder')) {
      this.internals.setValidity(
        { valueMissing: true },
        'Please select an item in the list.',
      );
    } else {
      let select = this.navigator.querySelector('select');
      this.internals.setValidity(
        select.validity.valid ? { valid: true } : { badInput: true },
        select.validationMessage,
      );
    }

    return this;
  }

  /**
   * Supprime les options custom qui ne sont pas interprété par le select
   * @returns {Promise<void>}
   * @private
   */
  async #_removeOldOptions() {
    await new Promise((ok) => {
      for (const option of this.querySelectorAll(
        `${HTMLBnumDropDownOption.TAG}, ${HTMLBnumDropDownDefaultOption.TAG}, ${HTMLBnumDropDownSelectedOption.TAG}`,
      )) {
        option.remove();
      }

      ok();
    });
  }

  /**
   * Génère une instance de cet élément
   * @returns {HTMLDropDownElement}
   * @static
   */
  static CreateNode() {
    return document.createElement('bnum-dropdown');
  }

  /**
   * @readonly
   * @returns {string}
   * @static
   */
  static get TAG() {
    return 'bnum-dropdown';
  }
}

HTMLDropDownElement.TryDefine(HTMLDropDownElement.TAG, HTMLDropDownElement);
/**
 * @class
 * @classdesc Voir {@link HTMLDropDownElement}
 * @extends HTMLDropDownElement
 */
export class HTMLAlternateDropDownElement extends HTMLDropDownElement {
  constructor() {
    super();
  }

  _p_before() {
    this.setAttribute(
      'data-variation',
      EDropDownVariations.toString(EDropDownVariations.alternate),
    );
  }

  /**
   * @readonly
   * @returns {string}
   * @static
   */
  static get TAG() {
    return 'alternate-dropdown';
  }
}

HTMLAlternateDropDownElement.TryDefine(
  HTMLAlternateDropDownElement.TAG,
  HTMLAlternateDropDownElement,
);
