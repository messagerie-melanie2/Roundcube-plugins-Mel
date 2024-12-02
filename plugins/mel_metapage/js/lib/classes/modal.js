import { EMPTY_STRING } from '../constants/constants.js';
import { MelHtml } from '../html/JsHtml/MelHtml.js';
import { BnumEvent } from '../mel_events.js';
import { MelObject } from '../mel_object.js';
import { Mel_Promise } from '../mel_promise.js';
import { NotifierObject } from './NotifierObject.js';
import { VisualiserObject } from './VisualiserObject.js';
import { BaseStorage } from './base_storage.js';
export {
  RcmailDialog,
  RcmailDialogButton,
  RcmailDialogChoiceButton,
  MelDialog,
  DialogPage,
  JQueryDialogPage,
};

/**
 * Contient les classes utiles pour la création d'une dialogue.
 * @module Modal
 * @local DialogButtonConfig
 * @local SwitchPageCallback
 * @local RcmailDialog
 * @local RcmailDialogButton
 * @local RcmailDialogChoiceButton
 * @local RcmailDialogChoiceButtonVisualiser
 * @local DialogPage
 * @local DialogPageManager
 * @local MelDialog
 * @local JQueryDialogPage
 */

/**
 * @typedef {Object} DialogButtonConfig
 * @property {?string} classes Classes css du bouton
 * @property {?string} text Texte du bouton
 * @property {?EventClickCallback} click exécuter lors du clique du bouton
 * @property {?EventHoverCallback} hover exécuter lors du survol du bouton
 * @property {?EventMouseEnterCallback} mouseenter exécuter lors de l'entrée de la souris dans le bouton
 * @property {?EventMouseLeaveCallback} mouseleave exécuter lors de la sortie de la souris du bouton
 */

/**
 * @callback SwitchPageCallback
 * @param {Object} params
 * @param {string} params.name Nom de la nouvele page courrante
 * @param {DialogPage} params.page Nouvelle page courrante
 * @param {DialogPageManager} params.manager Manager de la dialog
 * @return {void}
 *
 */

/**
 * @class
 * @classdesc Représente un bouton de dialog
 * @extends NotifierObject
 * @tutorial meldialog
 */
class RcmailDialogButton extends NotifierObject {
  /**
   * Constructeur de la classe
   * @param {string} text Label du bouton
   * @param {Object} param1 Configuration du bouton
   * @param {!string} param1.classes Classes css du bouton
   * @param {?EventClickCallback} param1.click Callback appelé lorsqu'on clique sur le bouton
   * @param {?EventHoverCallback} param1.hover Callback appelé lorsqu'on survole le bouton
   * @param {?EventMouseLeaveCallback} param1.mouseenter Callback appelé lorsqu'on entre dans le bouton
   * @param {?EventMouseLeaveCallback} param1.mouseleave Callback appelé lorsqu'on sort du bouton
   */
  constructor(
    text,
    {
      classes = EMPTY_STRING,
      click = null,
      hover = null,
      mouseenter = null,
      mouseleave = null,
      options = null,
    },
  ) {
    super();
    this._init()._setup(
      text,
      classes,
      click,
      hover,
      mouseenter,
      mouseleave,
      options,
    );
  }

  _init() {
    /**
     * text du bouton
     * @type {string}
     */
    this.text = EMPTY_STRING;
    /**
     * Classes css du bouton
     * @type {string}
     */
    this.classes = EMPTY_STRING;
    /**
     * Callback appelé lorsqu'on clique sur le bouton
     * @type {BnumEvent<EventClickCallback>}
     */
    this.click = new BnumEvent();
    /**
     * Callback appelé lorsqu'on survole le bouton
     * @type {BnumEvent<EventHoverCallback>}
     */
    this.hover = new BnumEvent();
    /**
     * Callback appelé lorsqu'on entre dans le bouton
     * @type {BnumEvent<EventMouseEnterCallback>}
     */
    this.mouseenter = new BnumEvent();
    /**
     * Callback appelé lorsqu'on sort du bouton
     * @type {BnumEvent<EventMouseLeaveCallback>}
     */
    this.mouseleave = new BnumEvent();

    /**
     * Options en plus du bouton
     * @type {?Object<string, *>}
     */
    this.options = null;

    return this;
  }

  _setup(text, classes, click, hover, mouseenter, mouseleave, options) {
    this._p_addProp('text', { value: text });

    if (click) this.click.push(click);
    if (hover) this.hover.push(hover);
    if (mouseenter) this.mouseenter.push(mouseenter);
    if (mouseleave) this.mouseleave.push(mouseleave);

    let _classes = classes;
    Object.defineProperty(this, 'classes', {
      get() {
        return `mel-button no-button-margin no-margin-button ${_classes}`;
      },
      set: (value) => {
        _classes = value;
        this.on_prop_update.call('classes', this.classes, this);
      },
    });

    this.options = options;

    return this;
  }

  /**
   * Convertit en objet lisible par la fonction dialog de rcmail
   * @returns {DialogButtonConfig}
   */
  generate() {
    let generated = {
      text: this.text,
      class: this.classes,
      click: this.click.call.bind(this.click),
      hover: this.hover.call.bind(this.hover),
      mouseenter: this.mouseenter.call.bind(this.mouseenter),
      mouseleave: this.mouseleave.call.bind(this.mouseleave),
    };

    if (this.options) {
      for (const key in this.options) {
        if (Object.prototype.hasOwnProperty.call(this.options, key)) {
          const element = this.options[key];
          generated[key] = element;
        }
      }
    }

    return generated;
  }

  /**
   * Génère un bouton qui permettra de sauvegarder les données
   * @static
   * @param {Object} param0
   * @param {string=} param0.text Texte du bouton
   * @param {?BnumEvent=} param0.click Callback appelé lorsqu'on clique sur le bouton
   * @param {?BnumEvent=} param0.mouseenter Callback appelé lorsqu'on entre dans le bouton
   * @param {?BnumEvent=} param0.mouseleave Callback appelé lorsqu'on sort du bouton
   * @returns {RcmailDialogButton}
   */
  static ButtonSave({
    text = 'Enregistrer',
    classes = EMPTY_STRING,
    click = null,
    mouseenter = null,
    mouseleave = null,
    options = null,
  } = {}) {
    return new RcmailDialogButton(text, {
      classes: `mel-button no-button-margin no-margin-button ${classes}`,
      click: click?.call?.bind?.(click),
      mouseenter: mouseenter?.call?.bind?.(mouseenter),
      mouseleave: mouseleave?.call?.bind?.(mouseleave),
      options,
    });
  }

  static ButtonCancel({
    text = 'Annuler',
    classes = EMPTY_STRING,
    click = null,
    mouseenter = null,
    mouseleave = null,
    options = null,
  } = {}) {
    return new RcmailDialogButton(text, {
      classes: `mel-button no-button-margin no-margin-button btn btn-danger ${classes}`,
      click: click?.call?.bind?.(click),
      mouseenter: mouseenter?.call?.bind?.(mouseenter),
      mouseleave: mouseleave?.call?.bind?.(mouseleave),
      options,
    });
  }
}

/**
 * @class
 * @classdesc Représente un "bouton de choix", il s'agit d'un bouton qui contient un texte et une icône
 * @extends RcmailDialogButton
 * @tutorial meldialog
 */
class RcmailDialogChoiceButton extends RcmailDialogButton {
  /**
   * Constructeur de la classe
   * @param {string} text Texte du bouton
   * @param {string} icon Icône du bouton (Material Symbol)
   * @param {Object} param2 Configuration du bouton
   * @param {!string} param2.classes Classes css du bouton
   * @param {?EventClickCallback} param2.click Callback appelé lorsqu'on clique sur le bouton
   * @param {?EventHoverCallback} param2.hover Callback appelé lorsqu'on survole le bouton
   * @param {?EventMouseEnterCallback} param2.mouseenter Callback appelé lorsque la souris entre dans le bouton
   * @param {?EventMouseLeaveCallback} param2.mouseleave Callback appelé lorsque la souris sort du bouton
   */
  constructor(
    text,
    icon,
    {
      classes = EMPTY_STRING,
      click = null,
      hover = null,
      mouseenter = null,
      mouseleave = null,
    },
  ) {
    super(text, {
      classes,
      click,
      hover,
      mouseenter,
      mouseleave,
    });

    /**
     * Icône du bouton (Material Symbol)
     * @type {string}
     */
    this.icon = EMPTY_STRING;
    this._p_addProp('icon', {
      value: icon,
    });
  }
}

/**
 *
 * @class
 * @classdesc Représentation du bouton. Si la classe du bouton change, le html change aussi.
 * @extends VisualiserObject
 * @package
 */
class RcmailDialogChoiceButtonVisualiser extends VisualiserObject {
  /**
   * Constructeur de la classe
   * @param {RcmailDialogButton} button Bouton à afficher en html
   */
  constructor(button) {
    super(button);
  }

  /**
   * Retourne l'élément en jshtml
   * @protected
   * @override
   * @returns {____JsHtml}
   * @frommodulereturn JsHtml
   */
  _p_draw() {
    return super
      ._p_draw()
      .button({
        class: this._get_button_classes(this.ref.classes),
        onclick: this.ref.click.call.bind(this.ref.click),
        onhover: this.ref.click.call.bind(this.ref.hover),
        onmouseenter: this.ref.click.call.bind(this.ref.mouseenter),
        onmouseleave: this.ref.click.call.bind(this.ref.mouseleave),
      })
      .icon(this.ref.icon, { class: 'block' })
      .end()
      .span({ class: 'btn-txt' })
      .text(this.ref.text)
      .end()
      .end();
  }

  /**
   * Classes de la bouton
   * @param {string} classes Classes additionnels
   * @private
   * @returns {string}
   */
  _get_button_classes(classes) {
    return `${classes} btn btn-block-mel btn-secondary btn-mel`;
  }

  /**
   * Met à jours le texte du bouton
   * @param {string} value Nouveau texte
   * @private
   */
  _prop_update_text(value) {
    this.$ref.find('.btn-txt').text(value);
  }

  /**
   * Met à jours les classes du bouton
   * @param {string} value Nouvelles classes
   * @private
   */
  _prop_update_classes(value) {
    this.$ref[0].classList = [];
    this.$ref.addClass(this._get_button_classes(value));
  }

  /**
   * Met à jours l'icône du bouton
   * @private
   * @param {string} value Nouveau bouton
   * @private
   */
  _prop_update_icon(value) {
    this.$ref.find('bnum-icon').text(value);
  }
}

/**
 * @class
 * @classdesc Affiche une dialog en utilisant Rcmail (déprécier, utilisez plutôt {@link MelDialog})
 * @extends MelObject
 * @deprecated
 * @tutorial modal
 *
 */
class RcmailDialog extends MelObject {
  /**
   * Constructeur de la classe
   * @deprecated
   * @param {(____JsHtml | external:jQuery)} contents html en jshtml ou jquery
   * @param {Object} param1 Configuration de la dialog
   * @param {string} param1.title Titre de la dialog
   * @param {RcmailDialogButton[]} param1.buttons Boutons de la dialog
   * @param {Object} param2.options Options de la boite de dialogue. Voir {@link https://api.jqueryui.com/dialog/}. `disable_show_on_start` désactive l'affichage à la création si vrai.
   * @frommoduleparam JsHtml contents {@linkto ____JsHtml}
   *
   */
  constructor(contents, { title = EMPTY_STRING, buttons = [], options = {} }) {
    super(contents, title, buttons, options);
  }

  _init() {
    /**
     * Contenu de la dialog
     * @type {____JsHtml}
     * @frommodule JsHtml
     */
    this.contents = MelHtml.start;
    /**
     * Titre de la dialog
     * @type {string}
     */
    this.title = EMPTY_STRING;
    /**
     * Boutons de la dialog
     * @type {RcmailDialogButton[]}
     */
    this.buttons = [];
    /**
     * Options de la dialog
     * @type {Object}
     */
    this.options = {};
    /**
     * Dialog
     * @type {external:jQuery}
     * @package
     */
    this._$dialog = $();

    return this;
  }

  _setup(contents, title, buttons, options) {
    Object.defineProperties(this, {
      contents: {
        get() {
          return contents;
        },
      },
      title: {
        get() {
          return title;
        },
      },
      buttons: {
        get() {
          return buttons;
        },
      },
      options: {
        get() {
          return options;
        },
      },
    });

    return this;
  }

  /**
   * Actions principales
   * @param  {...any} args Arguments envoyé par le constructeur
   */
  main(...args) {
    {
      super.main(...args);
      const [contents, title, buttons, options] = args;
      this._init()._setup(contents, title, buttons, options);
    }

    if (!this.options?.disable_show_on_start) this.show();
  }

  /**
   * Cache la dialog
   * @returns {RcmailDialog} Chaînage
   */
  hide() {
    return this.destroy();
  }

  /**
   * Affiche la dialog
   * @returns {RcmailDialog} Chaînage
   */
  show() {
    let $contents = this.contents.generate
      ? this.contents.generate()
      : this.contents;

    this._$dialog = this.rcmail().show_popup_dialog(
      $contents[0],
      this.title,
      this.buttons.map((x) => x.generate()),
      this.options,
    );
    return this;
  }

  /**
   * Supprime la dialog
   * @returns {RcmailDialog} Chaînage
   */
  destroy() {
    this._$dialog.dialog('destroy');
    return this;
  }

  /**
   * Affiche X boutons qui permettront de faire certaines actions
   * @param {string} title Titre de la modale
   * @param  {...RcmailDialogChoiceButton} buttons Bouttons qui seront affichés
   * @returns {RcmailDialog}
   */
  static DrawChoices(title, ...buttons) {
    let $html = MelHtml.start.flex_container().end().generate();

    for (const iterator of buttons) {
      $html.append(new RcmailDialogChoiceButtonVisualiser(iterator).$ref);
    }

    return new RcmailDialog($html, { title });
  }

  /**
   * Affiche 2 boutons qui permettront de faire certaines actions
   * @param {string} title Titre de la modale
   * @param {RcmailDialogChoiceButton} button1 Option 1
   * @param {RcmailDialogChoiceButton} button2 Option 2
   * @returns {RcmailDialog}
   */
  static DrawChoice(title, button1, button2) {
    return this.DrawChoices(title, button1, button2);
  }
}

/**
 * @class
 * @classdesc Données d'une page de dialog
 * @tutorial meldialog
 */
class DialogPage {
  /**
   * Constructeur de la classe
   * @param {string} name Nom de la page, lui sert d'id.
   * @param {object} params Contenu de la page
   * @param {?____JsHtml} params.content Contenu de la page
   * @param {!string} params.title Titre de la page
   * @param {RcmailDialogButton[]} params.buttons Boutons de la page
   * @frommoduleparam {JsHtml} params.content {@linkto ____JsHtml}
   */
  constructor(name, { content = null, title = EMPTY_STRING, buttons = [] }) {
    this._init()._setup(name, content, title, buttons);
  }

  _init() {
    /**
     * Contenu de la dialog
     * @type {?____JsHtml}
     * @frommodule JsHtml {@linkto ____JsHtml}
     */
    this.content = null;
    /**
     * Id de la dialog
     * @type {string}
     */
    this.name = EMPTY_STRING;
    /**
     * Titre de la dialog
     * @type {string}
     */
    this.title = EMPTY_STRING;
    /**
     * Boutons de la dialog
     * @type {RcmailDialogButton[]}
     */
    this.buttons = [];

    return this;
  }

  _setup(name, content, title, buttons) {
    this.name = name;
    this.content = content;
    this.title = title;
    this.buttons = buttons;
    return this;
  }

  /**
   * Permet de modifier le contenu de la dialog
   * @param {Object} param0
   * @param {!boolean} param0.force_restart Si on recommence l'écriture de la page ou non
   * @returns {____JsHtml}
   * @frommodulereturn JsHtml
   */
  start_update_content({ force_restart = false }) {
    if (force_restart) this.content = MelHtml.start;

    return this.content;
  }

  /**
   * Récupère sous format jQuery
   * @returns {external:jQuery}
   */
  get() {
    return (this.content || MelHtml.start.placeholder().end()).generate();
  }

  /**
   * Créer une page avec plusieurs choix de boutons
   * @param {string} title Titre de la modale
   * @param {Object} param1
   * @param {!string} param1.name Nom de la page
   * @param {RcmailDialogChoiceButton[]} param1.buttons Boutons de la page
   * @returns {JQueryDialogPage} Page créée
   */
  static DrawChoices(title, { name = 'choices', buttons = [] }) {
    let $html = MelHtml.start.flex_container().end().generate();

    for (const iterator of buttons) {
      $html.append(new RcmailDialogChoiceButtonVisualiser(iterator).$ref);
    }

    return new JQueryDialogPage(name, { title, content: $html });
  }

  /**
   * Créer une page avec 2 boutons
   * @param {string} title Titre de la modale
   * @param {RcmailDialogChoiceButton} button1 Premier bouton
   * @param {RcmailDialogChoiceButton} button2 Second bouton
   * @param {string} name Id de la page
   * @returns {JQueryDialogPage}
   */
  static DrawChoice(title, button1, button2, name = 'choice') {
    return this.DrawChoices(title, { name, buttons: [button1, button2] });
  }

  /**
   * Permet de modifier un objet 'RcmailDialogButton'.
   * @callback OnButtonCreatedCallback
   * @param {RcmailDialogButton} button
   * @returns {RcmailDialogButton}
   */

  /**
   * Permet de modifier un objet 'DialogPage'
   * @callback OnPageCreatedCallback
   * @param {DialogPage} page
   * @returns {DialogPage}
   */

  /**
   * Affiche une page de confirmation.
   *
   * Le bouton de confirmation peut ou pas s'activer au bout de X secondes.
   * @param {string} text Texte de la modale.
   * @param {EventClickCallback} callback Action à faire lorsque l'on clique sur la confirmation
   * @param {Object} optionnals Paramètres optionnels
   * @param {string} [optionnals.title=''] Titre de la modale
   * @param {string} [optionnals.button_confirm='Ok'] Texte du bouton de confirmation
   * @param {string} [optionnals.button_confirm='Annuler'] Texte du bouton d'annulation
   * @param {string} [optionnals.name='confirm'] Id de la page
   * @param {?EventClickCallback} [optionnals.oncancel=null] Action à l'annulation. Si null, ferme la modale.
   * @param {boolean} [optionnals.center=false] Centrer le texte ?
   * @param {?OnButtonCreatedCallback} [optionnals.on_button_ok_object_created=null] Est appelé après la création du bouton de confirmation. Permet de modifier le bouton.
   * @param {?OnButtonCreatedCallback} [optionnals.on_button_cancel_object_created=null] Est appelé après la création du bouton d'annulation. Permet de modifier le bouton.
   * @param {?OnPageCreatedCallback} [optionnals.on_page_object_created=null] Est appelé après la création de la page. Permet de modifier la page.
   * @returns {DialogPage}
   * @static
   */
  static DrawConfirm(
    text,
    callback,
    {
      title = EMPTY_STRING,
      button_confirm = 'Ok',
      button_cancel = 'Annuler',
      name = 'confirm',
      oncancel = null,
      center = false,
      on_button_ok_object_created = null,
      on_button_cancel_object_created = null,
      on_page_object_created = null,
    },
  ) {
    let rcbutton_ok = RcmailDialogButton.ButtonSave({
      text: button_confirm,
      click: callback,
    }); /*new RcmailDialogButton(button_confirm, {
      click: callback,
    });*/

    rcbutton_ok = on_button_ok_object_created?.(rcbutton_ok) ?? rcbutton_ok;

    let rcbutton_cancel = RcmailDialogButton.ButtonCancel({
      text: button_cancel,
      click: oncancel ? oncancel : () => {},
    });
    /*new RcmailDialogButton(button_cancel, {
      click: oncancel ? oncancel : () => {},
    });*/

    rcbutton_cancel =
      on_button_cancel_object_created?.(rcbutton_cancel) ?? rcbutton_cancel;

    let page = new DialogPage(name, {
      title: title,
      buttons: [rcbutton_cancel, rcbutton_ok],
    });

    page
      .start_update_content({ force_restart: true })
      .div({ style: `text-align:${center ? 'center' : 'left'}` })
      .css('width', '100%')
      .text(text)
      .end();

    return on_page_object_created?.(page) ?? page;
  }
}

/**
 * @class
 * @classdesc Données d'une page de dialog, le conteu est en jQuery.
 * @extends DialogPage
 */
class JQueryDialogPage extends DialogPage {
  /**
   * Constructeur de la classe
   * @param {string} name Nom de la page, lui sert d'id.
   * @param {object} params Contenu de la page
   * @param {?external:jQuery} params.content Contenu de la page
   * @param {!string} params.title Titre de la page
   * @param {RcmailDialogButton[]} params.buttons Boutons de la page
   */
  constructor(name, { content = null, title = EMPTY_STRING, buttons = [] }) {
    super(name, { content, title, buttons });
    /**
     * Contenu de la dialog
     * @type {external:jQuery}
     * @overload
     * @override
     */
    this.content = content;
  }

  /**
   * Permet de modifier le contenu de la dialog
   * @param {Object} param0
   * @param {?external:jQuery} param0.new_content Si on recommence l'écriture de la page ou non
   * @returns {?external:jQuery}
   * @override
   */
  start_update_content({ new_content = null }) {
    if (new_content) this.content = new_content;

    return this.content;
  }

  /**
   * Récupère sous format jQuery
   * @returns {external:jQuery}
   */
  get() {
    return this.content ?? $();
  }
}

/**
 * @class
 * @classdesc Gère les différentes pages de la dialog
 * @package
 */
class DialogPageManager {
  /**
   * Constructeur de la classe
   * @param  {...DialogPage} pages Pages par défaut
   */
  constructor(...pages) {
    this._init()._setup(...pages);
  }

  _init() {
    /**
     * Pages de la dialog
     * @type {module:BaseStorage~BaseStorage<DialogPage>}
     * @package
     * @frommodule Modal {@linkto DialogPage}
     */
    this._pages = new BaseStorage();
    /**
     * Page actuelle
     * @type {string}
     */
    this._current_page = null;

    /**
     * @type {BnumEvent<SwitchPageCallback>}
     * @frommodule Modal {@linkto SwitchPageCallback}
     */
    this.onswitchpage = new BnumEvent();

    return this;
  }

  _setup(...pages) {
    this.add_pages(...pages);
    return this;
  }

  _add_page(page) {
    this._pages.add(page.name, page);

    return this;
  }

  _add_no_create_page(name, content, { title = EMPTY_STRING, buttons = [] }) {
    const page = content?.before
      ? new JQueryDialogPage(name, { content, title, buttons })
      : new DialogPage(name, { content, title, buttons });

    return this._add_page(page);
  }

  /**
   * Ajoute une page. Si vous souhaitez ajouter une page déjà existante, donnez la en argument de `page_or_name`.
   *
   * Sinon, donnez le nom de la page (son id) et le contenu de la page.
   * @param {(string | DialogPage)} page_or_name
   * @param {Object} overloads
   * @param {(?external:jQuery | ?____JsHtml | undefined)} overloads.content Contenu de la page (jQuery, jsHtml ou undefined)
   * @param {!string} overloads.title Titre de la page
   * @param {RcmailDialogButton[]} overloads.buttons Boutons de la page
   * @returns {DialogPageManager}
   * @frommoduleparam JsHtml overloads.content {@linkto ____JsHtml}
   */
  add_page(
    page_or_name,
    { content = undefined, title = EMPTY_STRING, buttons = [] },
  ) {
    if (content !== undefined)
      return this._add_no_create_page(page_or_name, content, {
        title,
        buttons,
      });
    else return this._add_page(page_or_name);
  }

  /**
   * Ajoute plusieurs pages
   * @param  {...DialogPage} pages Pages à ajouter
   * @returns {DialogPageManager} Chaînage
   */
  add_pages(...pages) {
    for (const page of pages) {
      this.add_page(page);
    }

    return this;
  }

  /**
   * Si le manager contient des pages ou non
   * @returns {boolean}
   */
  has_pages() {
    return Object.keys(this._pages).length > 0;
  }

  /**
   * Change de page
   * @param {string} name Nom de la page à afficher
   * @throws {Error} Si la page n'existe pas
   */
  switch_page(name) {
    this._current_page = name;
    this.onswitchpage.call({
      name,
      page: this._pages.get(this._current_page),
      manager: this,
    });
  }
}

/**
 * @class
 * @classdesc Affiche une dialog en utilisant Rcmail
 * @tutorial meldialog
 * @tutorial meldialogex
 */
class MelDialog {
  /**
   * Si vous ne souhaitez pas créer un objet page, utilisez la fonction static `Create`
   * @param {DialogPage} page Contenu de la dialog
   * @param {Object} options Options de la boite de dialogue. Voir {@link https://api.jqueryui.com/dialog/}
   * @see {@link MelDialog.Create}
   * @see {@link https://api.jqueryui.com/dialog/|jQueryUI}
   */
  constructor(page, options = {}) {
    this._init()._setup(page, options)._main();
  }

  _init() {
    /**
     * Gestionnaire de page
     * @type {DialogPageManager}
     */
    this.page_manager = new DialogPageManager();
    /**
     * Options de la dialog
     * @type {Object}
     */
    this.options = {};
    /**
     * Dialog
     * @type {external:jQuery}
     * @package
     */
    this._$dialog = null;
    /**
     * Nom de la première page
     * @type {string}
     * @private
     */
    this._first_page_name = EMPTY_STRING;
    return this;
  }

  _setup(page, options) {
    this.options = options;
    this._first_page_name = page.name;
    this.page_manager.add_page(page, {});
    return this;
  }

  _main() {
    this.page_manager.onswitchpage.push(this._update_page.bind(this));
  }

  /**
   * Met à jours le contenu de la dialogue lors d'un changement de page.
   * @param {{name:string, page:DialogPage, manager:DialogPageManager}} args Arguments envoyer par l'évènement
   * @returns {external:jQuery}
   * @package
   */
  _update_page(args) {
    const { name, page } = args;
    let $querry = this._$dialog.find(`#${name}`);
    this._$dialog.find('.mel-dialog-page').hide();

    if ($querry.length) $querry.show();
    else {
      const $page = page.get();
      this._$dialog.append(
        $('<div>').attr('id', name).addClass('mel-dialog-page').append($page),
      );
    }

    this.update_option('title', page.title);
    this.update_option(
      'buttons',
      page.buttons.map((x) => x.generate()),
    );

    return this._$dialog.find(`#${name}`);
  }

  get dialog() {
    return this._$dialog;
  }

  get dialogContainer() {
    return this.dialog.parent();
  }

  /**
   * Affiche la dialogue
   */
  show({ context = window } = {}) {
    if (!this._$dialog) {
      if (!this.options.close) this.options.close = () => {};

      this._$dialog = context.rcmail.show_popup_dialog(
        $('<div>').attr('id', this.options?.id || 'mel-dialog')[0],
        EMPTY_STRING,
        [],
        this.options,
      );

      this.switch_page(this._first_page_name);
    } else this._$dialog.dialog('open');
  }

  /**
   * Cache la dialogue
   */
  hide() {
    this._$dialog.dialog('close');
  }

  /**
   * Supprime la dialogue
   */
  destroy() {
    this._$dialog.dialog('destroy');
  }

  /**
   * Met à jour une option de la dialogue
   * @param {string} name Nom de l'option
   * @param {*} value Valeur de l'option
   * @see {@link https://api.jqueryui.com/dialog/|jQueryUI}
   */
  update_option(name, value) {
    this._$dialog.dialog('option', name, value);
  }

  /**
   * Met à jours plusieurs options de la dialogue
   * @param {Object<string, *>} options  Options à ajouter
   */
  update_options(options) {
    for (const key in options) {
      if (Object.hasOwnProperty.call(options, key)) {
        const element = options[key];
        this.update_option(key, element);
      }
    }
  }

  /**
   * Ajoute une page à la dialogue
   * @param {DialogPage | string} page_or_name Page à ajouter, si vous ne souhaitez pas passer par un objet `DialogPage`, donnez le nom de la page, puis définissez les variables du paramètre déstructuré.
   * @param {Object} param1
   * @param {?____JsHtml | ?external:jQuery} param1.content Contenu de la page
   * @param {!string} param1.title Titre de la page
   * @param {RcmailDialogButton[]} param1.buttons Boutons de la page
   * @frommoduleparam JsHtml param1.content {@linkto ____JsHtml}
   */
  add_page(
    page_or_name,
    { content = undefined, title = EMPTY_STRING, buttons = [] },
  ) {
    this.page_manager.add_page(page_or_name, { content, title, buttons });
  }

  /**
   * Change la page de la dialogue
   * @param {string} name Nom de la page
   * @returns {void}
   * @throws {Error} Si la page n'existe pas
   */
  switch_page(name) {
    return this.page_manager.switch_page(name);
  }

  /**
   * Ajoute une page de choix à la modale.
   * @param {string} title Titre de la page
   * @param {Object} param1
   * @param {!string} param1.name Nom de la page
   * @param {RcmailDialogChoiceButton[]} param1.buttons Boutons de la page
   * @returns {void}
   */
  draw_choices(title, { name = 'choices', buttons = [] }) {
    return this.add_page(DialogPage.DrawChoices(title, { name, buttons }));
  }

  /**
   * Ajoute une page à 2 choix à la modale.
   * @param {string} title Titre de la page
   * @param {RcmailDialogChoiceButton} button1 Bouton de gauche
   * @param {RcmailDialogChoiceButton} button2 Bouton de droite
   * @param {string} name Id de la page
   * @returns {void}
   */
  draw_choice(title, button1, button2, name = 'choice') {
    return this.add_page(DialogPage.DrawChoice(title, button1, button2, name));
  }

  /**
   * Créer une dialog sans passer parge la création d'un objet `DialogPage`
   * @param {string} name Nom (id) de la page
   * @param {external:jQuery | ____JsHtml} content Contenu de la page
   * @param {Object} param2
   * @param {string} param2.title Titre de la page
   * @param {RcmailDialogButton[]} param2.buttons Boutons de la page
   * @param {Object} options Options de la boite de dialogue. Voir {@link https://api.jqueryui.com/dialog/}
   * @returns {MelDialog}
   * @frommoduleparam JsHtml content {@linkto ____JsHtml}
   */
  static Create(
    name,
    content,
    { title = EMPTY_STRING, options = {}, buttons = [] },
  ) {
    const page = content?.before
      ? new JQueryDialogPage(name, { content, title, buttons })
      : new DialogPage(name, { content, title, buttons });
    return new MelDialog(page, options);
  }

  /**
   *
   * @param {*} text
   * @param {*} callback
   * @param {*} param2
   * @returns
   */
  static CreateConfirmDialog(
    text,
    callback,
    {
      title = EMPTY_STRING,
      button_confirm = 'Ok',
      button_cancel = 'Annuler',
      name = 'confirm',
      oncancel = null,
      center = false,
      on_button_ok_object_created = null,
      on_button_cancel_object_created = null,
      on_page_object_created = null,
      options = {},
    },
  ) {
    const page = DialogPage.DrawConfirm(text, callback, {
      title,
      button_confirm,
      button_cancel,
      name,
      oncancel,
      center,
      on_button_cancel_object_created,
      on_button_ok_object_created,
      on_page_object_created,
    });

    return new MelDialog(page, options);
  }

  /**
   * Affiche une page de confirmation.
   *
   * Le bouton de confirmation peut ou pas s'activer au bout de X secondes.
   * @param {string} text Texte de la modale.
   * @param {Object} optionnals Paramètres optionnels
   * @param {EventClickCallback} [optionnals.onok=(()=>{})] Action à faire lors de la validation
   * @param {string} [optionnals.title=''] Titre de la modale
   * @param {string} [optionnals.button_confirm='Ok'] Texte du bouton de confirmation
   * @param {string} [optionnals.button_confirm='Annuler'] Texte du bouton d'annulation
   * @param {?EventClickCallback} [optionnals.oncancel=null] Action à l'annulation. Si null, ferme la modale.
   * @param {boolean} [optionnals.center=false] Centrer le texte ?
   * @param {boolean} [optionnals.waiting_button_enabled=0] En seconde, au bout de combien de temps le bouton de confirmation est actif.
   * @param {Object<string, any>} [optionnals.options={}]  Options de la boite de dialogue. Voir {@link https://api.jqueryui.com/dialog/}
   * @returns {DialogPage}
   * @example var can = await MelDialog.Confirm('Veux-tu supprimer cet espace ?', {waiting_button_enabled:5, title:'Confirmation'});
   * @static
   */
  static async Confirm(
    text,
    {
      onok = () => {},
      title = EMPTY_STRING,
      button_confirm = 'Ok',
      button_cancel = 'Annuler',
      oncancel = null,
      center = false,
      waiting_button_enabled = 0,
      options = {},
    },
  ) {
    return await new Mel_Promise((current_promise) => {
      current_promise.start_resolving();
      let function_ok = null;

      if (waiting_button_enabled > 0) {
        //On désactive le bouton de confirmation
        function_ok = (button) => {
          button.classes += ' disabled needToBeEnabled';
          return button;
        };
      }

      let dialog = this.CreateConfirmDialog(
        text,
        (...args) => {
          onok(...args);
          dialog.hide();
          //On détruit la modale après appuie du bouton
          setTimeout(
            (_dialog) => {
              _dialog.destroy();
            },
            1000,
            dialog,
          );
          current_promise.resolve(true);
        },
        {
          title,
          button_confirm,
          button_cancel,
          center,
          options,
          on_button_ok_object_created: function_ok,
          oncancel: (...args) => {
            if (oncancel) oncancel(...args);
            dialog.hide();
            //On détruit la modale après appuie du bouton
            setTimeout(
              (_dialog) => {
                _dialog.destroy();
              },
              1000,
              dialog,
            );
            current_promise.resolve(false);
          },
        },
      );

      dialog.show();

      //On vire le bouton "close"
      dialog._$dialog.parent().find('button.ui-dialog-titlebar-close').remove();

      if (waiting_button_enabled > 0) {
        dialog._$dialog
          .parent()
          .find('.needToBeEnabled')
          .append(
            $('<span>')
              .css('margin-left', '5px')
              .attr('id', 'ntbeid')
              .text(`(${waiting_button_enabled})`),
          );
        let it = 0;
        const interval = setInterval(
          (_$button, _waiting_button_enabled) => {
            if (it >= _waiting_button_enabled) {
              _$button.removeClass('disabled');
              _$button.find('#ntbeid').remove();
              clearInterval(interval);
            } else {
              _$button
                .find('#ntbeid')
                .text(`(${_waiting_button_enabled - it})`);

              ++it;
            }
          },
          1000,
          dialog._$dialog.parent().find('.needToBeEnabled'),
          waiting_button_enabled,
        );
      }
    });
  }
}

/**
 * Transforme en MelDialog
 * @returns {MelDialog}
 */
RcmailDialog.prototype.to_mel_dialog = function to_mel_dialog() {
  return MelDialog.Create('index', this.contents, {
    title: this.title,
    buttons: this.buttons,
    options: this.options,
  });
};
