import { JsHtml } from '../../../../mel_metapage/js/lib/html/JsHtml/JsHtml.js';
import { MelJsHtml } from '../../../../mel_metapage/js/lib/html/JsHtml/JsMelHtml.js';
export { templates as rcs_cell_template };

/**
 * Template du bouton "favoris" d'une ressource
 * @type {import('../../../../mel_metapage/js/lib/html/JsHtml/JsMelHtml.js').___MelJsHtml}
 * @constant
 */
const favorite_button_template = MelJsHtml.start
      .div({ class: 'star-button-parent' })
        .button({
          class: 'star-button',
          id: 'button-%0-%1',
          onclick: () => {throw new Error('Not implemented')},
          'data-favorite': '%0',
          'data-email': '%0',
        }).observe({ key:'favorite' })
          .webcomponents().icon('star').end()
        .end()
      .end();

/**
 * Template du bouton radio pour sélectionner une ressource
 * @type {import('../../../../mel_metapage/js/lib/html/JsHtml/JsHtml.js')._JsHtml}
 * @constant
 */
const radio_button_selector_template = JsHtml.start
.input_radio({
  class: 'resource-radio',
  id: 'radio-%0-%1',
  value: '%0',
  name: 'resa',
  'data-email': '%0',
}).observe({ key: 'radio' });

/**
 * @typedef RcsCellTemplate
 * @property {import('../../../../mel_metapage/js/lib/html/JsHtml/JsMelHtml.js').___MelJsHtml} favorite_button_template
 * @property {import('../../../../mel_metapage/js/lib/html/JsHtml/JsHtml.js')._JsHtml} radio_button_selector_template
 */

/**
 * Templates des cellules de la grille de ressources
 * @type {RcsCellTemplate}
 * @constant
 */
const templates = {
  /**
   * Template du bouton "favoris" d'une ressource
   * @type {import('../../../../mel_metapage/js/lib/html/JsHtml/JsMelHtml.js').___MelJsHtml}
   * @readonly
   */
  favorite_button_template,
  /**
   * Template du bouton radio pour sélectionner une ressource
   * @type {import('../../../../mel_metapage/js/lib/html/JsHtml/JsHtml.js')._JsHtml}
   * @readonly
   */
  radio_button_selector_template
};
