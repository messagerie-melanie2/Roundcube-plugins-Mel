import { BnumEvent } from '../../../mel_events.js';
import { EWebComponentMode } from './js_html_base_web_elements.js';
import AHTMLCustomInternalElement from './lib/AHTMLCustomInternalElement.js';

export { AHTMLCustomTemplateElement, CAN_TEMPLATE };

/**
 * Si la prise en charge des templates HTML est disponible
 * @type {boolean}
 * @constant
 */
const CAN_TEMPLATE = 'content' in document.createElement('template');

if (!CAN_TEMPLATE) {
  alert(
    "Le prise en charge des templates n'est pas disponible et le site risque de ne pas fonctionner correctement.",
  );
}

/**
 * @callback OnTemplateCloned
 * @param {{attrib:string, element: HTMLElement, namespace:string}} data
 * @return {void}
 */

/**
 * @callback OnTemplateClonedContentRequested
 * @param {{element: HTMLElement, namespace:string}} data
 * @return {void}
 */

/**
 * @class
 * @classdesc Élément HTML personnalisé qui permet de lier un template à un élément
 * @extends HtmlCustomDataTag
 * @abstract
 */
class AHTMLCustomTemplateElement extends AHTMLCustomInternalElement {
  constructor({ mode = EWebComponentMode.inline_block } = {}) {
    super({ mode });

    /**
     * @type {BnumEvent<OnTemplateCloned>}
     * @protected
     */
    this._p_ontemplatecloned = new BnumEvent();
    /**
     * @type {BnumEvent<OnTemplateClonedContentRequested>}
     * @protected
     */
    this._p_ontemplateclonedcontentrequested = new BnumEvent();
  }

  /**
   * Récupère le template lié à cet élément si il existe
   * @type {?HTMLTemplateElement}
   * @readonly
   */
  get linkedTemplate() {
    const id = this._p_get_data('template-id');

    if (id || false) return document.querySelector(`template#${id}`);
    else return null;
  }

  /**
   * Doit être surchargée par les classe fille.
   *
   * C'est ici que les instructions de setup doivent être mises.
   * @protected
   * @returns {this} Chaîne
   */
  _p_main() {
    super._p_main();

    if (CAN_TEMPLATE && this.linkedTemplate) {
      this.appendChild(this.linkedTemplate.content.cloneNode(true));

      for (const element of this.querySelectorAll(
        '[data-template-namespace]',
      )) {
        if (element.hasAttribute('data-template-elements')) {
          for (const attrib of element
            .getAttribute('data-template-elements')
            .split(',')) {
            this._p_ontemplatecloned.call({
              element,
              attrib,
              namespace: element.getAttribute('data-template-namespace'),
            });
          }
        } else if (element.hasAttribute('data-template-content')) {
          this._p_ontemplateclonedcontentrequested.call({
            element,
            namespace: element.getAttribute('data-template-namespace'),
          });
        }
      }
    }
  }
}
