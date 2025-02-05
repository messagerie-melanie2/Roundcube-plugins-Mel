import { ____JsHtml } from './JsHtml.js';

export class ___MelJsHtml extends ____JsHtml {
  constructor(balise, parent, attribs = {}) {
    super(balise, parent, attribs);
  }

  /**
   *
   * @param {import('./JsHtml.js').Attribs} attribs
   * @returns {this}
   */
  input(attribs = {}) {
    return super.input(attribs).resolveNow((html) => {
      if (
        !['checkbox', 'button', 'color', 'file', 'image'].includes(attribs.type)
      ) {
        html.childs[html.childs.length - 1]
          .addClass('form-control')
          .addClass('input-mel');
      }

      return html;
    });
  }

  /**
   *
   * @param {import('./JsHtml.js').Attribs} attribs
   * @returns {this}
   */
  select(attribs = {}) {
    return super.select(attribs).addClass('form-control').addClass('input-mel');
  }

  /**
   *
   * @param {import('./JsHtml.js').Attribs} attribs
   * @returns {this}
   */
  button(attribs = {}) {
    return super
      .button(attribs)
      .addClass('mel-button')
      .addClass('no-button-margin')
      .addClass('no-margin-button')
      .css('border-style', 'solid');
  }

  /**
   *
   * @param {import('./JsHtml.js').Attribs} attribs
   * @returns {this}
   */
  mel_button(attribs = {}) {
    return this.button(attribs)
      .removeClass('no-button-margin')
      .removeClass('no-margin-button');
  }

  /**
   *
   * @param {import('./JsHtml.js').Attribs} attribs
   * @returns {this}
   */
  raw_button(attribs = {}) {
    return this.button(attribs).removeClass('mel-button');
  }

  text(text, plugin = 'mel_metapage') {
    return super.text(rcmail.gettext(text, plugin));
  }

  textarea(attribs = {}) {
    return super
      .textarea(attribs)
      .addClass('form-control')
      .addClass('input-mel');
  }

  accessibilty_setup_button({ isChild = false } = {}) {
    return this.accessibilty()
      .accessibilty_setup_button({ isChild, return_child: isChild })
      .addClass('mel-focus')
      .resolveNow((element) => (isChild ? element.parent() : element));
  }

  static start() {
    return new ___MelJsHtml('start', null);
  }
}

/**
 * @class
 * @classdesc Englobe les fonctions de la classe ____JsHtml
 * @package
 * @tutorial js-html
 */
class ____meljs_html___ {
  constructor() {
    /**
     * Commence un texte html en javascript
     * @type {___MelJsHtml}
     * @readonly
     */
    this.start = null;
    Object.defineProperties(this, {
      start: {
        get() {
          return ___MelJsHtml.start();
        },
        configurable: false,
        enumerable: false,
      },
    });
  }

  /**
   * Permet d'ajouter des nouvelles balises à l'écriture js html
   * @param {string} alias Nom de la fonction
   * @param {Object} param1
   * @param {boolean} param1.online Si la balise doit être sur une ligne
   * @param {function} param1.before_callback Fonction qui sera appelé avant la création de la balise
   * @param {function} param1.generate_callback Fonction qui sera appelé pour la création de la balise
   * @param {function} param1.after_callback Fonction qui sera appelé après la création de la balise
   * @param {string} param1.tag Nom de la balise
   * @returns {___MelJsHtml}
   * @deprecated Préferez l'héritage
   */
  create_alias(
    alias,
    {
      online = false,
      before_callback = null,
      generate_callback = null,
      after_callback = null,
      tag = 'div',
    },
  ) {
    return ___MelJsHtml.create_alias(alias, {
      online,
      before_callback,
      generate_callback,
      after_callback,
      tag,
    });
  }

  /**
   * Permet d'ajouter des nouvelles fonctions à l'écriture js html
   * @param {string} name Nom de la fonction
   * @param {function} callback Fonction qui sera appelé
   * @deprecated Préferez l'héritage
   */
  extend(name, callback) {
    ___MelJsHtml.prototype[name] = callback;
  }

  /**
   * Permet de maj une fonction de l'écriture js html
   * @param {string} name Nom de la fonction à override
   * @param {function} callback Nouvelle fonction arg1 => this, arg2 => ancienne fonction, arg3 => arguments de la fonction
   * @deprecated Préferez l'héritage
   */
  update(name, callback) {
    const old = ___MelJsHtml.prototype[name];
    ___MelJsHtml.prototype[name] = function (...args) {
      return callback(this, old, ...args);
    };
  }

  /**
   * Ecrit une page en js html
   * @param {function} callback Function qui contient le js html.
   * @param  {...any} args Arguments de la fonction `callback`
   * @returns {___MelJsHtml}
   * @deprecated Préferez l'héritage
   */
  write(callback, ...args) {
    return callback(this.start, ...args);
  }

  /**
   * Charge une page js html en fonction de la skin
   * @async
   * @param {string} name Nom du fichier
   * @param {string} plugin Nom du plugin qui contient le fichier
   * @param {string} skin Nom de la skin
   * @returns {Promise<null | ___MelJsHtml>}
   */
  async load_page(
    name,
    plugin = 'mel_metapage',
    skin = window?.rcmail?.env?.skin ?? '',
  ) {
    const load =
      top?.loadJsModule ?? parent?.loadJsModule ?? window?.loadJsModule;
    const returned = await load(plugin, name, `/skins/${skin}/js_templates/`);
    const keys = Object.keys(returned);
    const len = keys.length;

    if (len > 0) {
      for (let index = 0; index < len; ++index) {
        return returned[keys[index]];
      }
    }

    return null;
  }
}

/**
 * @type {____meljs_html___}
 * @description Permet de générer du html en javascript et d'écrire du javascript sous forme html.
 * @tutorial js-html
 */
export const MelJsHtml = new ____meljs_html___();
