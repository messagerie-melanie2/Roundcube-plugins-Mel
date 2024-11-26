import { EMPTY_STRING } from '../../../../mel_metapage/js/lib/constants/constants.js';
import {
  EWebComponentMode,
  HtmlCustomDataTag,
} from '../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/js_html_base_web_elements.js';
import { isNullOrUndefined } from '../../../../mel_metapage/js/lib/mel.js';
import { MelObject } from '../../../../mel_metapage/js/lib/mel_object.js';

/**
 * @class
 * @classdesc Représention html d'un block d'un espace de travail.
 * @extends HtmlCustomDataTag
 */
export class WorkspaceModuleBlock extends HtmlCustomDataTag {
  /**
   * Le composant se comporte de base comme une div.<br/>
   *
   * Liste des data du composant :
   *
   * data-title => Ajoute un titre au header
   *
   * data-button => Tâche sur lequel switcher
   *
   * data-button-text => Text du bouton. "Voir tout" par défaut
   *
   * data-button-icon => Icon du bouton à gauche. "arrow_right_alt" par défaut.
   *
   * data-small => 1 ou true. Réduit la taille du block si vrai.
   */
  constructor() {
    super({ mode: EWebComponentMode.div });
  }

  get headerTitle() {
    return this._p_get_data('title');
  }

  get buttonTask() {
    return this._p_get_data('button') || false;
  }

  get buttonText() {
    return this._p_get_data('button-text') || 'Voir tout';
  }

  get buttonIcon() {
    return this._p_get_data('button-icon') || 'arrow_right_alt';
  }

  get isSmall() {
    return [true, 'true', 1, '1'].includes(this._p_get_data('small'));
  }

  /**
   * Récupère le header du block
   * @type {HTMLDivElement}
   */
  get header() {
    return this.querySelector('.module-block-header');
  }

  /**
   * Récupère le contenu du block
   * @type {HTMLDivElement}
   */
  get content() {
    return this.querySelector('.module-block-content');
  }

  _p_main() {
    super._p_main();

    this.classList.add('melv2-card');

    if (this.isSmall) this.classList.add('mode-small');

    let childs = this.childNodes;

    let contents = document.createElement('div');
    contents.classList.add('module-block-content');

    if (childs && childs.length > 0) contents.append(...childs);

    let header = document.createElement('div');
    header.classList.add('module-block-header');

    if (
      !isNullOrUndefined(this.headerTitle) &&
      this.headerTitle !== EMPTY_STRING
    ) {
      let title = document.createElement('h3');
      title.appendChild(this.createText(this.headerTitle));

      header.appendChild(title);
      title = null;
    }

    if (this.buttonTask !== false) {
      let button = document.createElement('button');
      button.style.paddingTop = 0;
      button.style.paddingBottom = 0;
      button.classList.add(
        'mel-button',
        'no-margin-button',
        'no-button-margin',
      );

      let text = document.createElement('span');
      text.appendChild(this.createText(this.buttonText));
      text.style.verticalAlign = 'super';
      text.style.marginRight = '25px';

      let icon = document.createElement('bnum-icon');
      icon.setAttribute('data-icon', this.buttonIcon);

      button.append(text, icon);

      header.appendChild(button);

      button = null;
      text = null;
      icon = null;
    }

    this.append(header, contents);

    header = null;
    contents = null;
  }

  /**
   * Ajoute au contenu du block du jshtml
   * @param {____JsHtml} jshtml JsHtml à ajouter au contenu
   * @returns {WorkspaceModuleBlock} Chaîne
   */
  appendContentJsHtml(jshtml) {
    this.appendContent(jshtml.generate_dom());
    return this;
  }

  /**
   * Ajoute au contenu un élément du JQuery
   * @param {external:jQuery} query JQuery à ajouter au contenu
   * @returns {WorkspaceModuleBlock} Chaîne
   */
  appendContentJQuery(query) {
    this.appendContent(query[0]);
  }

  /**
   * Ajoute une node au contenu
   * @param {HTMLElement} node Node html à ajouter au contenu
   * @returns {WorkspaceModuleBlock} Chaîne
   */
  appendContent(node) {
    this.content.appendChild(node);

    return this;
  }

  /**
   * Remplace le contenu du block html
   * @param {HTMLElement | string | external:jQuery} node Node html, texte html ou jquery
   * @returns {WorkspaceModuleBlock} Chaîne
   */
  setContent(node) {
    $(this.content).html(node);
    return this;
  }

  /**
   * Met une iframe dans le contenu et la retourne
   * @param {string} url Url de la frame
   * @param {Object} [destructured={}] Paramètres optionnels
   * @param {number | string} [destructured.width='100%'] Largeur de l'iframe, `100%` par défaut
   * @param {number | string} [destructured.height='100%'] Hauteur de l'iframe, `100%` par défaut
   * @returns {HTMLIFrameElement} Iframe créée
   */
  setIframe(url, { width = '100%', height = '100%' } = {}) {
    let iframe = document.createElement('iframe');
    iframe.setAttribute('src', url);

    if (!isNullOrUndefined(width)) iframe.style.width = width;

    if (!isNullOrUndefined(height)) iframe.style.height = height;

    this.setContent(iframe);

    return iframe;
  }

  /**
   * Met une iframe dans le contenu à partir de la tâche, d'une action et d'autres paramètres et la retourne
   * @param {string} task Tâche
   * @param {Object} [param1={}] Paramètres optionnels
   * @param {?string} [param1.action=null] Action
   * @param {Object<string, *>} [param1.args={}] Paramètres de l'url
   * @param {number | string} [param1.width='100%'] Largeur de l'iframe, `100%` par défaut
   * @param {number | string} [param1.height='100%'] Hauteur de l'iframe, `100%` par défaut
   * @returns {HTMLIFrameElement} Iframe créée
   */
  setIframeFromTask(
    task,
    { action = null, args = {}, width = '100%', height = '100%' } = {},
  ) {
    return this.setIframe(MelObject.Url(task, { action, params: args }), {
      width,
      height,
    });
  }
}

//#region Tag Definition
{
  const TAG = 'bnum-workspace-module';
  if (!customElements.get(TAG))
    customElements.define(TAG, WorkspaceModuleBlock);
}
//#endregion
