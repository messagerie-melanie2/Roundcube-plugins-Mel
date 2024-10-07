import { EMPTY_STRING } from '../../../../../mel_metapage/js/lib/constants/constants.js';
import { EWebComponentMode } from '../../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/js_html_base_web_elements.js';
import { isNullOrUndefined } from '../../../../../mel_metapage/js/lib/mel.js';
import { NavBarComponent } from './base.js';

export { WspNavBarDescription };

/**
 * @class
 * @classdesc
 * @extends NavBarComponent
 * @package
 */
class WspNavBarDescription extends NavBarComponent {
  /**
   * Permet d'assigner la description et/ou d'assigner le parent.
   * @param {Object} [param0={}]
   * @param {?string} [param0.description=null] Description de l'espace
   * @param {?WspNavBar} [param0.parent=null] NavBar parente
   */
  constructor({ description = null, parent = null } = {}) {
    super({ mode: EWebComponentMode.div, parent });

    description ??= parent?.description;

    if (description !== EMPTY_STRING && !isNullOrUndefined(description))
      this._p_save_into_data('description', description);
  }

  get description() {
    return this.parent?.description ?? this._p_get_data('description');
  }

  _p_main() {
    super._p_main();

    let element = this._p_start_construct();

    let mainDiv = document.createElement('div');

    let description = document.createElement('div');
    description.classList.add('description');
    description.appendChild(this.createText(this.description));

    mainDiv.appendChild(description);
    element.appendChild(mainDiv);

    element = null;
    mainDiv = null;
    description = null;
  }
}

{
  const TAG = 'bnum-wsp-nav-description';
  if (!customElements.get(TAG))
    customElements.define(TAG, WspNavBarDescription);
}
