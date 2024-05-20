import { MelHtml } from '../html/JsHtml/MelHtml.js';
import { BnumEvent } from '../mel_events.js';
import { MelObject } from '../mel_object.js';
import { NotifierObject } from './NotifierObject.js';
import { VisualiserObject } from './VisualiserObject.js';
export { RcmailDialog, RcmailDialogButton, RcmailDialogChoiceButton };

/**
 * @module Modal
 * @local DialogButtonConfig
 * @local RcmailDialog
 * @local RcmailDialogButton
 * @local RcmailDialogChoiceButton
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
 * @class
 * @classdesc Représente un bouton de dialog
 * @extends NotifierObject
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
      classes = '',
      click = null,
      hover = null,
      mouseenter = null,
      mouseleave = null,
    },
  ) {
    super();
    this._init()._setup(text, classes, click, hover, mouseenter, mouseleave);
  }

  _init() {
    /**
     * text du bouton
     * @type {string}
     */
    this.text = '';
    /**
     * Classes css du bouton
     * @type {string}
     */
    this.classes = '';
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

    return this;
  }

  _setup(text, classes, click, hover, mouseenter, mouseleave) {
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

    return this;
  }

  /**
   * Convertit en objet lisible par la fonction dialog de rcmail
   * @returns {DialogButtonConfig}
   */
  generate() {
    return {
      text: this.text,
      class: this.classes,
      click: this.click.call.bind(this.click),
      hover: this.hover.call.bind(this.hover),
      mouseenter: this.mouseenter.call.bind(this.mouseenter),
      mouseleave: this.mouseleave.call.bind(this.mouseleave),
    };
  }
}

/**
 * @class
 * @classdesc Représente un "bouton de choix", il s'agit d'un bouton qui contient un texte et une icône
 * @extends RcmailDialogButton
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
      classes = '',
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
    this.icon = '';
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
        click: this.ref.click.call.bind(this.ref.click),
        hover: this.ref.click.call.bind(this.ref.hover),
        mouseenter: this.ref.click.call.bind(this.ref.mouseenter),
        mouseleave: this.ref.click.call.bind(this.ref.mouseleave),
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
 * @classdesc Affiche une dialog en utilisant Rcmail
 * @extends MelObject
 * @tutorial modal
 */
class RcmailDialog extends MelObject {
  /**
   * Constructeur de la classe
   * @param {(____JsHtml | external:jQuery)} contents html en jshtml ou jquery
   * @param {Object} param1 Configuration de la dialog
   * @param {string} param1.title Titre de la dialog
   * @param {RcmailDialogButton[]} param1.buttons Boutons de la dialog
   * @param {Object} param2.options Options de la boite de dialogue. Voir {@link https://api.jqueryui.com/dialog/}
   * @frommoduleparam JsHtml contents {@linkto ____JsHtml}
   *
   */
  constructor(contents, { title = '', buttons = [], options = {} }) {
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
    this.title = '';
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

    this.show();
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
