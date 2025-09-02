import { EMPTY_STRING } from '../../../../mel_metapage/js/lib/constants/constants.js';
import { AHTMLCustomTemplateElement } from '../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/AHTMLCustomTemplateElement.js';
import { EWebComponentMode } from '../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/js_html_base_web_elements.js';
import { BnumEvent } from '../../../../mel_metapage/js/lib/mel_events.js';

export { HTMLResourceElement };

/**
 * @class
 * @classdesc Element qui contient les informations d'une ressource ainsi que ses actions
 * @extends AHTMLCustomTemplateElement
 */
class HTMLResourceElement extends AHTMLCustomTemplateElement {
  constructor() {
    super({ mode: EWebComponentMode.flex });
    this.onradioclicked = new BnumEvent();
    this.onfavoriteclicked = new BnumEvent();

    this.onradioclicked.add('default', (baseEvent, caller) => {
      this.dispatchEvent(
        new CustomEvent('custom:event:selected', {
          detail: { baseEvent, caller },
        }),
      );
    });

    this.onfavoriteclicked.add('default', (baseEvent, caller) => {
      this.dispatchEvent(
        new CustomEvent('custom:event:favorite.toggle', {
          detail: { baseEvent, caller },
        }),
      );
    });

    this._p_ontemplatecloned.push((data) => {
      if (data.attrib.includes('on')) {
        data.element.addEventListener(
          data.attrib.replace('on', EMPTY_STRING).toLowerCase(),
          this[`${data.namespace}Data`][data.attrib],
        );
      } else {
        data.element.setAttribute(
          data.attrib,
          this[`${data.namespace}Data`][data.attrib],
        );
      }
    });

    this._p_ontemplateclonedcontentrequested.push((data) => {
      if (data.namespace === 'label') {
        let label = this.parentElement.querySelector('.fc-cell-text');

        if (label) {
          data.element.appendChild(label);
          label.setAttribute('for', this.radioData.id);

          const city = this.getAttribute('data-city');
          if (city) {
            label.setAttribute('title', city);

            let nameForAria = ''; 
            try {nameForAria = this.radioData?.value || ''; } catch (_) {}
            const aria = nameForAria ? `${nameForAria} - ${city}` : city;
            label.setAttribute('aria-label', aria);
          }
          label.outerHTML = label.outerHTML.replaceAll('span', 'label');
        }
      }
    });
  }

  /**
   * Données de l'input radio
   * @type {{id:string, value:string, onclick:(e:Event)=>void, 'data-email':string}}
   * @readonly
   */
  get radioData() {
    return {
      id: this._p_get_data('radio-id'),
      value: this._p_get_data('radio-value'),
      onclick: (e) => this.onradioclicked.call(e, this),
      'data-email': this._p_get_data('radio-email'),
    };
  }

  /**
   * Donnée du bouton des favoris
   * @type {{id:string, onclick:(e:Event)=>void, 'data-email':string, 'data-favorite':boolean}}
   * @readonly
   */
  get buttonData() {
    return {
      id: this._p_get_data('button-id'),
      onclick: (e) => this.onfavoriteclicked.call(e, this),
      'data-email': this._p_get_data('button-email'),
      'data-favorite': this._p_get_data('button-favorite'),
    };
  }

  /**
   * Action principale
   * @protected
   */
  _p_main() {
    super._p_main();

    //L'élément à forcément besoin d'un template
    if (!this.linkedTemplate)
      throw new Error(
        "L'élément HTMLResourceElement doit avoir un template lié.",
      );

    /**
     * On supprime la classe form-control si elle existe.
     * Le template se base sur {@link MelJsHtml} pour générer les éléments. Celui-ci force le `form-control` sur l'input.
     * Comme on ne le veut pas, on le supprime.
     */
    if (this._p_get_data('form-control') !== 'enabled') {
      this.querySelectorAll('.form-control').forEach((el) => {
        el.classList.remove('form-control');
      });
    }

    //On check l'input si l'élément est considéré comme séléctionné
    if (this._p_get_data('selected')) {
      this.querySelector('input').setAttribute('checked', 'checked');
    }
  }

  /**
   * Permet de créer une node HTMLResourceElement
   * @param {Object} options
   * @param {string} [options.templateId='mel-cal-resources-template']
   * @param {boolean} [options.selected=false]
   * @param {string} options.rcsId Id de la ressource
   * @param {string} options.locationId Id de la localisation (si on réserve plusieurs ressources)
   * @param {string} options.email
   * @param {boolean} options.favorite
   * @param {string} options.value
   * @returns {HTMLResourceElement}
   * @static
   */
  static CreateNode({
    templateId = 'mel-cal-resources-template',
    selected = false,
    rcsId,
    locationId,
    email,
    favorite,
    value,
    city,
  }) {
    const id = `${rcsId}-${locationId}`;
    /**
     * @type {HTMLResourceElement}
     */
    let node = document.createElement(this.TAG);

    node.setAttribute('data-template-id', templateId);
    node.setAttribute('data-radio-id', `radio-${id}`);
    node.setAttribute('data-radio-value', value);
    node.setAttribute('data-radio-email', email);
    node.setAttribute('data-button-id', `button-${id}`);
    node.setAttribute('data-button-email', email);
    node.setAttribute('data-button-favorite', favorite);
    node.setAttribute('data-city', city);


    if (selected) node.setAttribute('data-selected', selected);

    return node;
  }

  /**
   * @default 'bnum-resource-selector'
   * @type {string}
   * @readonly
   * @static
   */
  static get TAG() {
    return 'bnum-resource-selector';
  }
}

{
  const TAG = HTMLResourceElement.TAG;
  if (!customElements.get(TAG)) customElements.define(TAG, HTMLResourceElement);
}
