import { ___MelJsHtml } from './JsMelHtml.js';

/**
 * @class
 * @classdesc
 * @deprecated Utilisez MelJsHtml ou JsHtml
 */
class ___MelHtml extends ___MelJsHtml {
  constructor(balise, parent, attribs = {}) {
    super(balise, parent, attribs);
  }

  /**
   *
   * @param {string} label
   * @param {Object} [options={}]
   * @returns {this}
   * @deprecated Utilisez {@link ____JsHtml.accessibilty}
   */
  input_text_floating(
    label,
    { div_attribs = {}, label_attribs = {}, inputs_attribs = {} } = {},
  ) {
    return this.accessibilty().input_text_floating(label, {
      div_attribs,
      label_attribs,
      inputs_attribs,
    });
  }

  /**
   *
   * @param {import('./JsHtml').Attribs} attribs
   * @returns {this}
   * @deprecated Utilisez {@link ____JsHtml.bootstrap}
   */
  row(attribs = {}) {
    return this.bootstrap().row(attribs);
  }

  /**
   *
   * @param {import('./JsHtml').Attribs} attribs
   * @returns {this}
   * @deprecated Utilisez {@link ____JsHtml.bootstrap}
   */
  column(attribs = {}) {
    return this.bootstrap().column(attribs);
  }

  /**
   *
   * @param {import('./JsHtml').Attribs} attribs
   * @returns {this}
   * @deprecated Utilisez {@link ____JsHtml.bootstrap}
   */
  col_1(attribs = {}) {
    return this.bootstrap().col_1(attribs);
  }

  /**
   *
   * @param {import('./JsHtml').Attribs} attribs
   * @returns {this}
   * @deprecated Utilisez {@link ____JsHtml.bootstrap}
   */
  col_2(attribs = {}) {
    return this.bootstrap().col_2(attribs);
  }

  /**
   *
   * @param {import('./JsHtml').Attribs} attribs
   * @returns {this}
   * @deprecated Utilisez {@link ____JsHtml.bootstrap}
   */
  col_3(attribs = {}) {
    return this.bootstrap().col_3(attribs);
  }

  /**
   *
   * @param {import('./JsHtml').Attribs} attribs
   * @returns {this}
   * @deprecated Utilisez {@link ____JsHtml.bootstrap}
   */
  col_4(attribs = {}) {
    return this.bootstrap().col_4(attribs);
  }

  /**
   *
   * @param {import('./JsHtml').Attribs} attribs
   * @returns {this}
   * @deprecated Utilisez {@link ____JsHtml.bootstrap}
   */
  col_5(attribs = {}) {
    return this.bootstrap().col_5(attribs);
  }
  /**
   *
   * @param {import('./JsHtml').Attribs} attribs
   * @returns {this}
   * @deprecated Utilisez {@link ____JsHtml.bootstrap}
   */
  col_6(attribs = {}) {
    return this.bootstrap().col_6(attribs);
  }

  /**
   *
   * @param {import('./JsHtml').Attribs} attribs
   * @returns {this}
   * @deprecated Utilisez {@link ____JsHtml.bootstrap}
   */
  col_7(attribs = {}) {
    return this.bootstrap().col_7(attribs);
  }

  /**
   *
   * @param {import('./JsHtml').Attribs} attribs
   * @returns {this}
   * @deprecated Utilisez {@link ____JsHtml.bootstrap}
   */
  col_8(attribs = {}) {
    return this.bootstrap().col_8(attribs);
  }

  /**
   *
   * @param {import('./JsHtml').Attribs} attribs
   * @returns {this}
   * @deprecated Utilisez {@link ____JsHtml.bootstrap}
   */
  col_9(attribs = {}) {
    return this.bootstrap().col_9(attribs);
  }

  /**
   *
   * @param {import('./JsHtml').Attribs} attribs
   * @returns {this}
   * @deprecated Utilisez {@link ____JsHtml.bootstrap}
   */
  col_10(attribs = {}) {
    return this.bootstrap().col_10(attribs);
  }

  /**
   *
   * @param {import('./JsHtml').Attribs} attribs
   * @returns {this}
   * @deprecated Utilisez {@link ____JsHtml.bootstrap}
   */
  col_11(attribs = {}) {
    return this.bootstrap().col_11(attribs);
  }

  /**
   *
   * @param {import('./JsHtml').Attribs} attribs
   * @returns {this}
   * @deprecated Utilisez {@link ____JsHtml.bootstrap}
   */
  col_12(attribs = {}) {
    return this.bootstrap().col_12(attribs);
  }

  /**
   *
   * @param {import('./JsHtml').Attribs} attribs
   * @returns {this}
   * @deprecated Utilisez {@link ____JsHtml.bootstrap}
   */
  card(attribs = {}) {
    return this.bootstrap().card(attribs);
  }

  /**
   *
   * @param {import('./JsHtml').Attribs} attribs
   * @returns {this}
   * @deprecated Utilisez {@link ____JsHtml.bootstrap}
   */
  card_body(attribs = {}) {
    return this.bootstrap().card_body(attribs);
  }

  /**
   *
   * @param {import('./JsHtml').Attribs} attribs
   * @returns {this}
   * @deprecated Utilisez {@link ____JsHtml.bootstrap}
   */
  card_title(attribs = {}) {
    return this.bootstrap().card_title(attribs);
  }

  /**
   *
   * @param {import('./JsHtml').Attribs} attribs
   * @returns {this}
   * @deprecated Utilisez {@link ____JsHtml.bootstrap}
   */
  card_subtitle(attribs = {}) {
    return this.bootstrap().card_subtitle(attribs);
  }

  /**
   *
   * @param {import('./JsHtml').Attribs} attribs
   * @returns {this}
   * @deprecated Utilisez {@link ____JsHtml.bootstrap}
   */
  card_text(attribs = {}) {
    return this.bootstrap().card_text(attribs);
  }

  /**
   *
   * @param {import('./JsHtml').Attribs} attribs
   * @returns {this}
   * @deprecated Utilisez {@link ____JsHtml.bootstrap}
   */
  card_link(url = '#', attribs = {}) {
    return this.bootstrap().card_link(url, attribs);
  }

  /**
   *
   * @param {import('./JsHtml').Attribs} attribs
   * @returns {this}
   * @deprecated Utilisez {@link ____JsHtml.bootstrap}
   */
  card_img_top(src, attribs = {}) {
    return this.bootstrap().card_img_top(src, attribs);
  }

  /**
   *
   * @param {import('./JsHtml').Attribs} attribs
   * @returns {this}
   * @deprecated Utilisez {@link ____JsHtml.bootstrap}
   */
  card_container(src, attribs = {}) {
    return this.bootstrap().card_container(src, attribs);
  }

  /**
   * @returns {this}
   * @deprecated Utilisez {@link ____JsHtml.bootstrap}
   */
  center() {
    return this.bootstrap().center();
  }

  /**
   *
   * @param {import('./JsHtml').Attribs} attribs
   * @returns {this}
   * @deprecated Utilisez {@link ____JsHtml.bootstrap}
   */
  btn_group(attribs = {}) {
    return this.bootstrap().btn_group(attribs);
  }

  /**
   *
   * @param {import('./JsHtml').Attribs} attribs
   * @returns {this}
   * @deprecated Utilisez {@link ____JsHtml.bootstrap}
   */
  btn_group_vertical(attribs = {}) {
    return this.bootstrap().btn_group_vertical(attribs);
  }

  /**

   * @returns {this}
   * @deprecated Utilisez {@link ____JsHtml.bootstrap}
   */
  loader({
    mode = 'inline-block',
    color = undefined,
    spinner = 'border',
    center = false,
    attribs = {},
  }) {
    return this.bootstrap().loader({ mode, color, spinner, center, attribs });
  }

  /**
   *
   * @param {import('./JsHtml').Attribs} attribs
   * @returns {this}
   * @deprecated Utilisez {@link ____JsHtml.webcomponents}
   */
  icon(icon, attribs = {}) {
    return this.webcomponents().icon(icon, attribs);
  }

  /**
   *
   * @param {import('./JsHtml').Attribs} attribs
   * @returns {this}
   * @deprecated Utilisez {@link ____JsHtml.webcomponents}
   */
  screen_reader(attribs = {}) {
    return this.webcomponents().screen_reader(attribs);
  }

  /**
   *
   * @param {import('./JsHtml').Attribs} attribs
   * @returns {this}
   * @deprecated Utilisez {@link ____JsHtml.webcomponents}
   */
  sr(attribs = {}) {
    return this.webcomponents().sr(attribs);
  }

  /**
   *
   * @param {import('./JsHtml').Attribs} attribs
   * @returns {this}
   * @deprecated Utilisez {@link ____JsHtml.webcomponents}
   */
  separate(attribs = {}) {
    return this.webcomponents().separate(attribs);
  }

  /**
   *
   * @param {import('./JsHtml').Attribs} attribs
   * @returns {this}
   * @deprecated Utilisez {@link ____JsHtml.webcomponents}
   */
  flex_container(attribs = {}) {
    return this.webcomponents().flex_container(attribs);
  }

  /**
   *
   * @param {import('./JsHtml').Attribs} attribs
   * @returns {this}
   * @deprecated Utilisez {@link ____JsHtml.webcomponents}
   */
  centered_flex_container(attribs = {}) {
    return this.webcomponents().centered_flex_container(attribs);
  }

  /**
   *
   * @param {import('./JsHtml').Attribs} attribs
   * @returns {this}
   * @deprecated Utilisez {@link ____JsHtml.webcomponents}
   */
  placeholder(attribs = {}) {
    return this.webcomponents().placeholder(attribs);
  }

  static start() {
    return new ___MelHtml('start', null);
  }
}

/**
 * @class
 * @classdesc Englobe les fonctions de la classe ____JsHtml
 * @package
 * @tutorial js-html
 */
class ____mel_html___ {
  constructor() {
    /**
     * Commence un texte html en javascript
     * @type {___MelHtml}
     * @readonly
     */
    this.start = null;
    Object.defineProperties(this, {
      start: {
        get() {
          return ___MelHtml.start();
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
   * @returns {___MelHtml}
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
    return ___MelHtml.create_alias(alias, {
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
    ___MelHtml.prototype[name] = callback;
  }

  /**
   * Permet de maj une fonction de l'écriture js html
   * @param {string} name Nom de la fonction à override
   * @param {function} callback Nouvelle fonction arg1 => this, arg2 => ancienne fonction, arg3 => arguments de la fonction
   * @deprecated Préferez l'héritage
   */
  update(name, callback) {
    const old = ___MelHtml.prototype[name];
    ___MelHtml.prototype[name] = function (...args) {
      return callback(this, old, ...args);
    };
  }

  /**
   * Ecrit une page en js html
   * @param {function} callback Function qui contient le js html.
   * @param  {...any} args Arguments de la fonction `callback`
   * @returns {___MelHtml}
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
   * @returns {Promise<null | ___MelHtml>}
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
 * @type {____mel_html___}
 * @description Permet de générer du html en javascript et d'écrire du javascript sous forme html.
 * @tutorial js-html
 */
export const MelHtml = new ____mel_html___();
