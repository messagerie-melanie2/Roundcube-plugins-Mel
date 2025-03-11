import { MelDialog } from '../../../../../mel_metapage/js/lib/classes/modal.js';
import { EMPTY_STRING } from '../../../../../mel_metapage/js/lib/constants/constants.js';
import HTMLBnumButton from '../../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/button/HTMLBnumButton.js';
import { EWebComponentMode } from '../../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/js_html_base_web_elements.js';
import { isNullOrUndefined } from '../../../../../mel_metapage/js/lib/mel.js';
import { MelObject } from '../../../../../mel_metapage/js/lib/mel_object.js';
import { NavBarComponent } from './base.js';

export { WspNavBarDescription };

/**
 * @class
 * @classdesc Composant de la description de l'espace de travail
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

  /**
   * @type {string}
   * @readonly
   */
  get description() {
    return this.parent?.description ?? this._p_get_data('description');
  }

  /**
   * @type {HTMLDivElement}
   * @readonly
   */
  get descriptionNode() {
    return this.querySelector('.description');
  }

  /**
   * Appelé lorsque la navabar s'affiche
   * @protected
   * @override
   */
  _p_main() {
    super._p_main();

    let element = this._p_start_construct();

    let mainDiv = document.createElement('div');
    mainDiv.classList.add('div-container');

    let description = document.createElement('span');
    description.classList.add('description', 'threelines');
    description.appendChild(this.createText(this.description));

    let descriptionContainer = HTMLBnumButton.StartCreate.setContent(
      description,
    )
      .setNoBackgroundVariation()
      .setSquare()
      .generate()
      .addClass('description-container', 'shadow-mel-button');

    //Ne pas pouvoir cliquer sur le bouton si il n'y a pas de descriptions
    if (!this.description || this.description.length === 0) {
      descriptionContainer.style.display = 'none';
    }

    descriptionContainer.addEventListener(
      'click',
      this.action_description_clicked.bind(this),
    );

    mainDiv.appendChild(descriptionContainer);
    element.appendChild(mainDiv);

    element = null;
    mainDiv = null;
    description = null;
    descriptionContainer = null;
  }

  /**
   * On libère les données en mémoire
   */
  destroy() {
    super.destroy();
  }

  /**
   * Action lorsque l'on clique sur la description.
   *
   * Lance une modale qui affiche la description en entier.
   */
  action_description_clicked() {
    let dialog = MelDialog.Create('index', $(this.descriptionNode).clone(), {
      title: MelObject.Empty().gettext('wsp_desc', 'mel_workspace'),
      options: {
        height: 200,
      },
    });
    dialog.show();

    dialog.update_option(
      'close',
      function (modal) {
        modal.destroy();
        modal = null;
      }.bind(null, dialog),
    );
  }
}

{
  const TAG = 'bnum-wsp-nav-description';
  if (!customElements.get(TAG))
    customElements.define(TAG, WspNavBarDescription);
}
