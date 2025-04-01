import { EMPTY_STRING } from '../../../../mel_metapage/js/lib/constants/constants.js';
import { EButtonType } from '../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/button/FormComponent.js';
import HTMLBnumButton, {
  HTMLBnumButtonSecondary,
} from '../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/button/HTMLBnumButton.js';
import { HTMLIconMelButton } from '../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/HTMLMelButton.js';
import {
  BnumHtmlIcon,
  EWebComponentMode,
  HtmlCustomDataTag,
} from '../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/js_html_base_web_elements.js';
import { isNullOrUndefined } from '../../../../mel_metapage/js/lib/mel.js';
import { BnumEvent } from '../../../../mel_metapage/js/lib/mel_events.js';
import { MelObject } from '../../../../mel_metapage/js/lib/mel_object.js';
import { NavBarManager } from '../program/navbar.generator.js';

export class WorkspaceModuleBlockTitle extends HtmlCustomDataTag {
  constructor() {
    super({ mode: EWebComponentMode.div });
  }

  _p_main() {
    super._p_main();

    if (
      this.style.display === 'flex' ||
      this.getAttribute('data-end-display') === 'flex'
    )
      this.style.alignItems = 'center';
  }

  /**
   * @default 'bnum-workspace-module-title'
   * @type {string}
   * @readonly
   * @static
   */
  static get TAG() {
    return 'bnum-workspace-module-title';
  }
}

WorkspaceModuleBlockTitle.TryDefine(
  WorkspaceModuleBlockTitle.TAG,
  WorkspaceModuleBlockTitle,
);

/**
 * @class
 * @classdesc Représention html d'un block d'un espace de travail.
 * @extends HtmlCustomDataTag
 */
export class WorkspaceModuleBlock extends HtmlCustomDataTag {
  /**
   * Attributs observés par le navigateur
   * @type {string[]}
   * @readonly
   * @static
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements}
   */
  static get observedAttributes() {
    return ['data-fullscreen'];
  }

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
   * data-button-ignore => "default-actions" => Ignore les actions par défaut
   *
   * data-button-type => 'primary', 'secondary', 'error'. Type du bouton. 'secondary' par défaut.
   *
   * data-small => 1 ou true. Réduit la taille du block si vrai.
   *
   */
  constructor() {
    super({ mode: EWebComponentMode.div });

    this.onrefresh = new BnumEvent();
    this.ontitlebuttonclicked = new BnumEvent();
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

  get buttonType() {
    return this._p_get_data('button-type') || 'secondary';
  }

  get buttonIgnore() {
    return this._p_get_data('button-ignore');
  }

  get isSmall() {
    return [true, 'true', 1, '1'].includes(this._p_get_data('small'));
  }

  get hasRefresh() {
    return ['true', true, 1, '1'].includes(this._p_get_data('button-refresh'));
  }

  get isFullscreen() {
    return this.hasAttribute('data-fullscreen');
  }

  /**
   * Récupère le header du block
   * @type {HTMLDivElement}
   * @readonly
   */
  get header() {
    return this.querySelector('.module-block-header');
  }

  /**
   * Récupère le contenu du block
   * @type {HTMLDivElement}
   * @readonly
   */
  get content() {
    return this.querySelector('.module-block-content');
  }

  /**
   * @type {string}
   * @readonly
   * @static
   */
  static get maxHeight() {
    return '300px';
  }

  /**
   * @type {string}
   * @readonly
   * @static
   */
  static get maxHeightSmall() {
    return '200px';
  }

  /**
   * @type {string}
   * @readonly
   * @static
   */
  static get minHeight() {
    return '300px';
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

      if (this.hasRefresh) {
        title.style.display = 'inline-block';
        title.style.marginBottom = 0;
        let titleContainer = document.createElement('div');
        titleContainer.classList.add('title-container');
        titleContainer.style.display = 'flex';
        titleContainer.style.alignItems = 'center';
        titleContainer.appendChild(title);

        title = null;
        title = titleContainer;
      }

      header.appendChild(title);
      title = null;
    }

    let customTitle = contents.querySelector(WorkspaceModuleBlockTitle.TAG);
    if (customTitle) {
      header.appendChild(customTitle);
      customTitle.style.display = null;
      customTitle = null;
    }

    if (this.hasRefresh) {
      let buttonRefresh = HTMLBnumButtonSecondary.StartCreate.setContent(
        BnumHtmlIcon.Refresh,
      )
        .setIconMargin(0)
        .generate();

      buttonRefresh.classList.add('refresh-button');

      buttonRefresh.style.display = 'inline-flex';
      buttonRefresh.style.marginLeft = '10px';
      buttonRefresh.style.padding = '4px';
      buttonRefresh.style.maxWidth = '34px';
      buttonRefresh.style.minWidth = '34px';
      buttonRefresh.style.minHeight = '34px';

      buttonRefresh.addEventListener('click', (e) => {
        this.onrefresh.call(e, this);
      });

      this.onrefresh.add('default', (e, caller) => {
        this.dispatchEvent(
          new CustomEvent('event:custom:refresh', {
            detail: { baseEvent: e, caller },
          }),
        );
      });

      (
        header.querySelector('.title-container') ??
        header.querySelector(WorkspaceModuleBlockTitle.TAG) ??
        header
      ).appendChild(buttonRefresh);

      buttonRefresh = null;
    }

    if (this.buttonTask !== false) {
      let button = HTMLBnumButton.StartCreate.setContent(
        this.createText(this.buttonText),
      )
        .setVariation(EButtonType.fromString(this.buttonType))
        .setIconPos('right')
        .setIcon(this.buttonIcon)
        .generate();

      if (this.buttonIgnore !== 'default-actions') {
        button.onclick = () => {
          NavBarManager.currentNavBar.select(this.buttonTask, {
            background: false,
          });
        };
      } else {
        button.onclick = (e) =>
          this.ontitlebuttonclicked.call({ e, block: this });

        this.ontitlebuttonclicked.add('default', (obj) => {
          this.dispatchEvent(
            new CustomEvent('event:custom:action', {
              detail: { baseEvent: obj.e, caller: obj.block },
            }),
          );
        });
      }

      header.appendChild(button);

      button = null;
    }

    header.querySelectorAll('[data-end-display]').forEach((el) => {
      el.style.display = el.getAttribute('data-end-display');
      el.removeAttribute('data-end-display');
    });
    contents.querySelectorAll('[data-end-display]').forEach((el) => {
      el.style.display = el.getAttribute('data-end-display');
      el.removeAttribute('data-end-display');
    });

    this.append(header, contents);

    header = null;
    contents = null;
  }

  /**
   * Est appelé quand un attribut de {@link observedAttributes} est modifié
   * @param {string} name
   * @param {string} oldValue
   * @param {string} newValue
   */
  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'data-fullscreen':
        this.parentElement.parentElement.classList[
          newValue === null ? 'remove' : 'add'
        ]('module-block__parent__parent--fullscreen');
        this.parentElement.classList[newValue === null ? 'remove' : 'add'](
          'module-block__parent--fullscreen',
        );
        break;

      default:
        break;
    }
  }
  /**
   * Désactive le bouton de rafraîchissement
   * @returns {this}
   */
  disableRefreshButton() {
    let button = this.header.querySelector('.refresh-button');

    if (button) {
      button.setAttribute('loading', 'loading');
      button = null;
    }

    return this;
  }

  /**
   * Active le bouton de rafraîchissement
   * @returns {this}
   */
  enableRefreshButton() {
    let button = this.header.querySelector('.refresh-button');

    if (button) {
      button.removeAttribute('loading');

      //Correction du style pour le bouton et éviter qu'il est une apparance étrange.
      if (button.style.width === 0) button.style.width = '34px';
      if (button.style.height === 0) button.style.height = '34px';

      button = null;
    }

    return this;
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

  appendIframe(url, { width = '100%', height = '100%' } = {}) {
    let iframe = document.createElement('iframe');
    iframe.setAttribute('src', url);

    if (!isNullOrUndefined(width)) iframe.style.width = width;

    if (!isNullOrUndefined(height)) iframe.style.height = height;

    this.appendContent(iframe);

    return iframe;
  }

  appendIframeFromTask(
    task,
    { action = null, args = {}, width = '100%', height = '100%' } = {},
  ) {
    return this.appendIframe(MelObject.Url(task, { action, params: args }), {
      width,
      height,
    });
  }

  /**
   * @readonly
   */
  static get Tag() {
    return 'bnum-workspace-module';
  }

  /**
   *
   * @param {WorkspaceModuleBlock} block
   * @param {(e:{detail: {baseEvent: Event, caller: WorkspaceModuleBlock}}) => void} callback
   * @static
   */
  static AddListenerAction(block, callback) {
    block.addEventListener('event:custom:action', callback);
    return block;
  }
}

//#region Tag Definition
{
  const TAG = WorkspaceModuleBlock.Tag;
  if (!customElements.get(TAG))
    customElements.define(TAG, WorkspaceModuleBlock);
}
//#endregion
