import { MelDialog } from '../../../../../mel_metapage/js/lib/classes/modal.js';
import { EMPTY_STRING } from '../../../../../mel_metapage/js/lib/constants/constants.js';
import HTMLBnumButton from '../../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/button/HTMLBnumButton.js';
import { EWebComponentMode } from '../../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/js_html_base_web_elements.js';
import { isNullOrUndefined } from '../../../../../mel_metapage/js/lib/mel.js';
import { MelObject } from '../../../../../mel_metapage/js/lib/mel_object.js';
import { NavBarComponent } from './base.js';

export { WspNavBarDescription };

/**
 * Permet d'afficher et de gérer la description d'un espace de travail dans la barre de navigation.
 * @class
 * @extends NavBarComponent
 * @package
 */
class WspNavBarDescription extends NavBarComponent {
  /**
   * Indique si le composant a été initialisé.
   * @type {boolean}
   * @private
   */
  #_initialized = false;

  /**
   * Constructeur du composant WspNavBarDescription.
   * Permet d'assigner la description et/ou d'assigner le parent.
   * @param {Object} [param0={}]
   * @param {?string} [param0.description=null] Description de l'espace
   * @param {?WspNavBar} [param0.parent=null] NavBar parente
   */
  constructor() {
    super({ mode: EWebComponentMode.div });
  }

  /**
   * Retourne la description de l'espace de travail.
   * @type {string}
   * @readonly
   */
  get description() {
    return this.parent?.description ?? this._p_get_data('description');
  }

  /**
   * Retourne le noeud HTML contenant la description.
   * @type {HTMLDivElement}
   * @readonly
   */
  get descriptionNode() {
    return this.querySelector('.description');
  }

  /**
   * Méthode principale appelée lors de l'affichage de la navbar.
   * Initialise le composant et construit l'affichage de la description.
   * @protected
   * @override
   */
  _p_main() {
    super._p_main();

    this.#_initialize();

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

    // Ne pas pouvoir cliquer sur le bouton si il n'y a pas de descriptions
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
   * Libère les données en mémoire et détruit le composant.
   */
  destroy() {
    super.destroy();
  }

  /**
   * Action déclenchée lors du clic sur la description.
   * Affiche une modale contenant la description complète.
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

  /**
   * Initialise le composant si ce n'est pas déjà fait.
   * @private
   * @returns {WspNavBarDescription} L'instance du composant.
   */
  #_initialize() {
    if (!this.#_initialized) {
      this.#_initialized = true;

      const description =
        this._p_get_data('description') || parent?.description;

      if (description !== EMPTY_STRING && !isNullOrUndefined(description))
        this._p_save_into_data('description', description);
    }

    return this;
  }

  /**
   * Crée une nouvelle instance du composant WspNavBarDescription.
   * @param {Object} [options={}] Options de création.
   * @param {?string} [options.description=null] Description à afficher.
   * @param {?WspNavBar} [options.parent=null] Parent NavBar.
   * @returns {WspNavBarDescription} Instance du composant.
   * @static
   */
  static Create({ description = null, parent = null } = {}) {
    /**
     * @type {WspNavBarDescription}
     */
    let node = document.createElement(this.TAG);

    if (parent) node.setNavBarParent(parent);

    if (description !== EMPTY_STRING && !isNullOrUndefined(description))
      node.setAttribute('data-description', description);

    return node;
  }

  /**
   * Retourne le tag HTML du composant.
   * @readonly
   * @static
   * @type {string}
   */
  static get TAG() {
    return 'bnum-wsp-nav-description';
  }
}

// Définition du composant customElement si non déjà défini.
/**
 * Déclare le composant customElement pour WspNavBarDescription si nécessaire.
 */
{
  const TAG = WspNavBarDescription.TAG;
  if (!customElements.get(TAG))
    customElements.define(TAG, WspNavBarDescription);
}
