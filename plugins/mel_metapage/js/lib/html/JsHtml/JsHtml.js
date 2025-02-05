/**
 * @module JsHtml
 * @local JsHtml
 * @local ____JsHtml
 * @local AttribData
 * @local Attribs
 * @local EachCallback
 * @local ActionCallback
 * @tutorial js-html
 * @tutorial mel-html
 */

import { BnumEvent } from '../../mel_events.js';
import { HtmlCustomDataTag } from './CustomAttributes/js_html_base_web_elements.js';
import { JsHtmlAccessibility } from './JsAccessibilityHtml.js';
import { JsBoostrapHtml } from './JsBootstrapHtml.js';
import { JsCustomHtml } from './JsCustomHtml.js';

export { JsHtml, ____JsHtml };

/**
 * [(string | function | number)]Une chaîne de charactère, une fonction ou un nombre. (ex : 'test', test.bind(this), 5)
 * @typedef {(string | function | number)} AttribData
 */

/**
 * [(string | Object<string, AttribData>)]Une chaîne de charactère ou un objet (ex : 'class:test', {class:'test'})
 * @typedef {(string | Object<string, AttribData>)} Attribs
 */

/**
 * Callback utiliser pour la fonction "each" du JsHtml.
 * @callback EachCallback
 * @param {____JsHtml} jsHtml JsHtml en cours
 * @param {*} item Objet de la boucle
 * @return {____JsHtml} Chaîne de JsHtml
 */

/**
 * Callback utiliser pour la fonction "action" du JsHtml.
 * @callback ActionCallback
 * @param {____JsHtml} jsHtml JsHtml en cours
 * @param {...*} args Arguments
 * @return {____JsHtml} Chaîne de JsHtml
 */

/**
 * @typedef {____JsHtml} _JsHtml
 */

/**
 * @class
 * @classdesc Permet de générer du html en javascript et décrire du javascript sous forme html.
 * @package
 * @tutorial js-html
 */
class ____JsHtml {
  /**
   * @type {BnumEvent<ActionCallback>}
   * @private
   * @event
   */
  #_onResolve;
  #_parent;
  #_observed = false;
  /**
   *
   * @param {string} balise
   * @param {____JsHtml} parent
   * @param {Attribs} attribs
   */
  constructor(balise, parent, attribs = {}) {
    this.balise = balise;
    this.attribs = attribs;
    this.childs = [];
    this.#_parent = parent;
    this.#_onResolve = new BnumEvent();
  }

  /**
   * Observe un élément, ce qui permet de les retrouver plus tard
   * @param {Object} [options={}]
   * @param {?string} [options.key=null]
   * @returns {this}
   */
  observe({ key = null } = {}) {
    if (this.balise[0] === '/')
      throw new Error("L'observeur doit être sur la balise ouvrante !");

    key ??= this._update_attribs().attribs.id;

    if (!key) throw new Error('Vous devez définir un id !');

    this.#_observed = key;
    return this._update_attribs();
  }

  /**
   * Ajoute une classe à la balise
   * @param {string} class_to_add Classe à ajouter
   * @returns {this}
   */
  addClass(class_to_add) {
    let navigator = this._updated_balise();
    if (!navigator.hasClass(class_to_add))
      navigator.attribs.class.push(class_to_add);
    return this;
  }

  /**
   * Si la balise à une classe ou non
   * @param {string} class_to_verify Classe à vérifier
   * @returns {this}
   */
  hasClass(class_to_verify) {
    return this._updated_balise()
      ._update_class()
      .attribs.class.includes(class_to_verify);
  }

  /**
   * Supprime une classe à la balise
   * @param {string} class_to_remove Classe à supprimer
   * @returns {this}
   */
  removeClass(class_to_remove) {
    let navigator = this._updated_balise();
    if (navigator.hasClass(class_to_remove))
      navigator.attribs.class = navigator.attribs.class.filter(
        (x) => x !== class_to_remove,
      );

    return this;
  }

  /**
   * Désactive la balise.
   *
   * Ajoute la classe `disabled` et l'attribut `disabled`
   * @returns {this}
   */
  disable() {
    return this.addClass('disabed').attr('disabled', 'disabled');
  }

  /**
   * Ajoute un attribut css à la balise
   * @param {(string | Object<string, string>)} key_or_attrib Clé ou attributs
   * @param {!string} value Valeur de la propriété css si il ne s'agit pas d'un attribut.
   * @returns {this}
   */
  css(key_or_attrib, value = '') {
    if (typeof key_or_attrib === 'string') {
      let navigator = this._update_attribs()._updated_balise()._update_css();
      navigator.attribs.style[key_or_attrib] = value;
    } else {
      for (const key in key_or_attrib) {
        if (Object.hasOwnProperty.call(key_or_attrib, key)) {
          const element = key_or_attrib[key];
          this.css(key, element);
        }
      }
    }

    return this;
  }

  /**
   * Récupère la bonne balise.
   * @private
   * @returns {this}
   */
  _updated_balise() {
    if (this.childs.length > 0) {
      if (
        ['img', 'input', 'br', 'hr'].includes(
          this.childs[this.childs.length - 1].balise,
        )
      )
        return this.childs[this.childs.length - 1];
      else if (
        this.childs[this.childs.length - 1]._update_attribs().attribs
          ?.one_line === true
      )
        return this.childs[this.childs.length - 1];
    }

    return this;
  }

  /**
   * Si un attribut existe ou non
   * @param {string} name Nom de l'attribut
   * @returns {boolean}
   */
  hasAttr(name) {
    return !!this._updated_balise().attribs[name];
  }

  /**
   * Attribut à rajouter à la balise
   * @param {string} name Nom de la balise
   * @param {string} value valeur de l'attribut
   * @returns {this}
   */
  attr(name, value) {
    let navigator = this._updated_balise();

    if (navigator._update_attribs()._isOn(name)) {
      navigator.attribs[name] = navigator._getOn(name);
      navigator.attribs[name].push(value);
    } else navigator.attribs[name] = value;
    return this;
  }

  /**
   * Attributs à rajouter à la balise
   * @param {Object<string, string>} attributes Attributs à ajouter
   * @returns {this}
   */
  attrs(attributes) {
    for (const key in attributes) {
      if (Object.hasOwnProperty.call(attributes, key)) {
        const element = attributes[key];
        this.attr(key, element);
      }
    }

    return this;
  }

  /**
   * Met à jours les attributs. Si il s'agissait d'une chaîne de caractère à la base, elle est transformée en objet.
   * @private
   * @returns {this}
   */
  _update_attribs() {
    if (typeof this.attribs === 'string') {
      const regex = /\s(\w+?)="(.+?)"/g;
      const str = this.attribs;
      this.attribs = {};

      for (const iterator of str.matchAll(regex)) {
        this.attribs[iterator[1]] = iterator[2];
      }
    }

    return this;
  }

  /**
   * Vérifie si un attribut est un évènement.
   * @param {string} name Nom de l'attribut.
   * @private
   * @returns {boolean}
   */
  _isOn(name) {
    return name.length > 2 && name[0] === 'o' && name[1] === 'n';
  }

  /**
   * Récupère un atrribut d'évènement.
   * @param {string} name Nom de l'attribut.
   * @returns {Function}
   * @private
   */
  _getOn(name) {
    if (!this.attribs[name]) this.attribs[name] = new BnumEvent();
    else if (
      !!this.attribs[name] &&
      !(this.attribs[name] instanceof BnumEvent)
    ) {
      const old = this.attribs[name];
      this.attribs[name] = new BnumEvent();

      if (typeof old === 'string')
        this.attribs[name].push((callback) => eval(callback), old);
      else this.attribs[name].push(old);
    }

    return this.attribs[name];
  }

  /**
   * Supprime un attribut
   * @param {string} name Nom de l'attribut
   * @returns {this}
   */
  removeAttr(name) {
    this._updated_balise().attribs[name] = undefined;
    return this;
  }

  /**
   * Récupère la balise parente.
   * @returns {P}
   * @template {____JsHtml} P
   */
  parent() {
    return this.#_parent;
  }

  /**
   * Récpère le premier enfant
   * @returns {C}
   * @template {____JsHtml} C
   */
  first() {
    return this.childs[0];
  }

  /**
   *
   * @returns {JsHtmlAccessibility<this>}
   *
   */
  accessibilty() {
    return new JsHtmlAccessibility(this);
  }

  /**
   *
   * @returns {JsBoostrapHtml<this>}
   *
   */
  bootstrap() {
    return new JsBoostrapHtml(this);
  }

  /**
   *
   * @returns {JsCustomHtml<this>}
   *
   */
  webcomponents() {
    return new JsCustomHtml(this);
  }

  /**
   * @param {typeof import('./ABaseModulesJsHtml.js').ABaseModulesJsHtml<this>} CustomNamespace
   * @returns {import('./ABaseModulesJsHtml.js').ABaseModulesJsHtml<this>}
   */
  namespace(CustomNamespace) {
    return new CustomNamespace(this);
  }

  /**
   * Ajoute une balise enfant à la balise actuelle et la retourne.
   *
   * Terminez par {@link end} pour fermer la balise.
   * @param {string} balise Nom de la balise
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this} Balise créée
   *
   */
  tag(balise, attribs = {}) {
    return this._create(balise, this, attribs, false);
  }

  /**
   * Ajoute une balise enfant à la balise actuelle et la retourne.
   *
   * Il s'agit d'une balise qui ne possède pas de balise de fermeture comme `input` ou `br`
   * @param {string} balise Nom de la balise
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this} Balise créée
   *
   */
  tag_one_line(balise, attribs = {}) {
    return this._create_oneline(balise, this, attribs);
  }

  /**
   * Permet de générer un custom élément à la volé ou d'en afficher un déjà existant.
   * @param {string | typeof HtmlCustomDataTag | {tag:string, onconnected:(element:HtmlCustomDataTag)=>{}, hasShadowDom:boolean, }} element
   * @param {Attribs} attribs
   * @returns {this}
   *
   */
  customElement(element, attribs = {}) {
    const CUSTOM_TAG_PREFIX = 'bnum-custom';
    window.tags ??= {};

    //Si le tag est un string ou est déjà défini
    if (
      typeof element === 'string' ||
      (!!element?.tag && !!window.tags[element.tag])
    ) {
      //Si onconnected existe
      if (window.tags[element].onconnected) {
        attribs['oncustom:event:generated:show'] =
          window.tags[element].onconnected;
      }

      return this.tag(
        element.includes('-') ? element : `${CUSTOM_TAG_PREFIX}-${element}`,
        attribs,
      );
    } else if (element.TAG) {
      //Si il s'agit d'une classe déjà existante
      HtmlCustomDataTag.TryDefine(element.TAG, element);
      return this.tag(element.TAG, attribs);
    } else {
      // Sinon, on le créé
      const tag = element.tag.includes('-')
        ? element.tag
        : `${CUSTOM_TAG_PREFIX}-${element.tag}`;

      let tmp = `
      (() => {
        class HTMLCreated${element.tag.toUpperCase()} extends HtmlCustomDataTag {
          constructor() {
            super();
          }
  
          _p_main() {
            super._p_main();
            this.dispatchEvent(new CustomEvent('custom:event:generated:show',{detail:{current:this}}));
          }
        }
  
        return HTMLCreated${element.tag.toUpperCase()};
  })();
        `;

      tmp = eval(tmp);
      HtmlCustomDataTag.TryDefine(tag, tmp);

      attribs['data-shadow'] = element.hasShadowDom ?? false;

      attribs['oncustom:event:generated:show'] = function (callback, event) {
        callback.call(event.detail.current, event.detail.current);
      }.bind(undefined, element.onconnected);

      window.tags[element.tag] = {
        class: tmp,
        onconnected: attribs['oncustom:event:generated:show'],
      };

      return this.tag(tag, attribs);
    }
  }

  if(condition) {
    return this.tag('if', { condition });
  }

  #_endif() {
    let current = this;
    while (!['if', 'elseif', 'else'].includes(current.balise)) {
      current = current.end();
    }

    return current.end();
  }

  elseif(condition) {
    return this.#_endif().tag('elseif', { condition });
  }

  else() {
    return this.#_endif().tag('else');
  }

  endif() {
    return this.#_endif().tag('endif').end();
  }

  /**
   * Met de côté une fonction qui sera résolue à la génération du jshtml.
   * @param {ActionCallback} callback
   * @param  {...any} args
   * @returns {this}
   *
   */
  resolve(callback, ...args) {
    this.#_onResolve.push(callback, this, ...args);
    return this;
  }

  /**
   * Execute une fonction qui renvoi du jshtml
   * @param {ActionCallback} callback
   * @param  {...any} args
   * @returns {this}
   *
   */
  resolveNow(callback, ...args) {
    return callback(this, ...args) ?? this;
  }

  /**
   * Ajoute une balise `a` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  a(attribs = {}) {
    return this.tag('a', attribs);
  }

  /**
   * Ajoute une balise `dd` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  dd(attribs = {}) {
    return this.tag('dd', attribs);
  }

  /**
   * Ajoute une balise `dt` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  dt(attribs = {}) {
    return this.tag('dt', attribs);
  }

  /**
   * Ajoute une balise `dl` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  dl(attribs = {}) {
    return this.tag('dl', attribs);
  }

  /**
   * Ajoute une balise `div` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  div(attribs = {}) {
    return this.tag('div', attribs);
  }

  /**
   * Ajoute une balise `blockquote` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  blockquote(attribs = {}) {
    return this.tag('blockquote', attribs);
  }

  /**
   * Ajoute une balise `ul` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  ul(attribs = {}) {
    let ul = this.tag('ul', attribs);

    if (attribs.unstyled) {
      ul.removeAttr('unstyled').addClass('list-unstyled');
    }

    return ul;
  }

  /**
   * Ajoute une balise `ol` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  ol(attribs = {}) {
    return this.tag('ol', attribs);
  }

  /**
   * Ajoute une balise `li` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  li(attribs = {}) {
    return this.tag('li', attribs);
  }

  /**
   * Ajoute une balise `span` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  span(attribs = {}) {
    return this.tag('span', attribs);
  }

  /**
   * Ajoute une balise `p` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  p(attribs = {}) {
    return this.tag('p', attribs);
  }

  /**
   * Ajoute une balise `img` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  img(attribs = {}) {
    return this.tag_one_line('img', attribs);
  }

  /**
   * Ajoute une balise `style` à la balise actuelle et la retourne.
   * @returns {this}
   *
   */
  style() {
    return this.tag('style');
  }

  /**
   * Ajoute une propriété css. Idéalement après une balise `style`.
   * @param {string} key Clé de la propriété css
   * @param {string} value Valeur de la propriété css
   * @returns {this}
   *
   * @see {@link ____JsHtml.style}
   */
  style_css_prop(key, value) {
    return this.text(`${key}:${value};`);
  }

  /**
   * Essaye d'ajouter un label.
   * @param {Attribs} attribs
   * @returns {this}
   *
   * @private
   */
  _try_add_label(attribs = {}) {
    let html_input = this;
    if (!!attribs?.id && attribs?.label) {
      html_input = html_input
        .label({ for: attribs.id })
        .text(attribs.label)
        .end();
    }

    return html_input;
  }

  /**
   * Ajoute une balise `input` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  input(attribs = {}) {
    return this._try_add_label(attribs).tag_one_line('input', attribs);
  }

  #_input(type, attribs) {
    attribs ??= {};

    attribs.type = type;
    return this.input(attribs);
  }

  /**
   *
   * @param {Attribs} attribs
   * @returns {this}
   *
   * @deprecated N'utilisez pas d'input pour les bouttons !!!!
   */
  input_button(attribs = {}) {
    return this.#_input('button', attribs);
  }

  /**
   *
   * @param {Attribs} attribs
   * @returns {this}
   *
   */
  input_checkbox(attribs = {}) {
    return this.#_input('checkbox', attribs);
  }

  /**
   *
   * @param {Attribs} attribs
   * @returns {this}
   *
   */
  input_color(attribs = {}) {
    return this.#_input('color', attribs);
  }

  /**
   *
   * @param {Attribs} attribs
   * @returns {this}
   *
   */
  input_date(attribs = {}) {
    return this.#_input('date', attribs);
  }

  /**
   *
   * @param {Attribs} attribs
   * @returns {this}
   *
   */
  input_datetime_local(attribs = {}) {
    return this.#_input('datetime_local', attribs);
  }

  /**
   *
   * @param {Attribs} attribs
   * @returns {this}
   *
   */
  input_email(attribs = {}) {
    return this.#_input('email', attribs);
  }

  /**
   *
   * @param {Attribs} attribs
   * @returns {this}
   *
   */
  input_file(attribs = {}) {
    return this.#_input('file', attribs);
  }

  /**
   *
   * @param {Attribs} attribs
   * @returns {this}
   *
   */
  input_hidden(attribs = {}) {
    return this.#_input('hidden', attribs);
  }

  /**
   *
   * @param {Attribs} attribs
   * @returns {this}
   *
   */
  input_month(attribs = {}) {
    return this.#_input('month', attribs);
  }

  /**
   *
   * @param {Attribs} attribs
   * @returns {this}
   *
   */
  input_number(attribs = {}) {
    return this.#_input('number', attribs);
  }

  /**
   *
   * @param {Attribs} attribs
   * @returns {this}
   *
   */
  input_image(attribs = {}) {
    return this.#_input('image', attribs);
  }

  /**
   *
   * @param {Attribs} attribs
   * @returns {this}
   *
   */
  input_password(attribs = {}) {
    return this.#_input('password', attribs);
  }

  /**
   *
   * @param {Attribs} attribs
   * @returns {this}
   *
   */
  input_radio(attribs = {}) {
    return this.#_input('radio', attribs);
  }

  /**
   *
   * @param {Attribs} attribs
   * @returns {this}
   *
   */
  input_reset(attribs = {}) {
    return this.#_input('reset', attribs);
  }

  /**
   *
   * @param {Attribs} attribs
   * @returns {this}
   *
   */
  input_search(attribs = {}) {
    return this.#_input('search', attribs);
  }

  /**
   *
   * @param {Attribs} attribs
   * @returns {this}
   *
   */
  input_submit(attribs = {}) {
    return this.#_input('submit', attribs);
  }

  /**
   *
   * @param {Attribs} attribs
   * @returns {this}
   *
   */
  input_tel(attribs = {}) {
    return this.#_input('tel', attribs);
  }

  /**
   *
   * @param {Attribs} attribs
   * @returns {this}
   *
   */
  input_text(attribs = {}) {
    return this.#_input('text', attribs);
  }

  /**
   *
   * @param {Attribs} attribs
   * @returns {this}
   *
   */
  input_time(attribs = {}) {
    return this.#_input('time', attribs);
  }

  /**
   *
   * @param {Attribs} attribs
   * @returns {this}
   *
   */
  input_url(attribs = {}) {
    return this.#_input('url', attribs);
  }

  /**
   *
   * @param {Attribs} attribs
   * @returns {this}
   *
   */
  input_week(attribs = {}) {
    return this.#_input('week', attribs);
  }

  /**
   * Ajoute une balise `select` à la balise actuelle et la retourne.
   *
   * Si l'attribut `label` éxiste, ajoute un `label` avant les `select`.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  select(attribs = {}) {
    return this._try_add_label(attribs).tag('select', attribs);
  }

  /**
   * Ajoute une balise `option` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  option(attribs = {}) {
    return this.tag('option', attribs);
  }

  /**
   * Ajoute une balise `option` à la balise actuelle et la retourne.
   *
   * Pas besoin de mettre une balise `end` pour fermer l'option.
   * @param {string} value Valeur de l'option
   * @param {string} text Texte de l'option
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  option_one_line(value, text, attribs = {}) {
    attribs.value = value;
    return this.option(attribs).text(text).end();
  }

  /**
   * Ajoute une balise `textarea` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  textarea(attribs = {}) {
    return this._try_add_label(attribs).tag('textarea', attribs);
  }

  /**
   * Ajoute une balise `form` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  form(attribs = {}) {
    return this.tag('form', attribs);
  }

  /**
   * Ajoute une balise `button` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  button(attribs = {}) {
    return this.tag('button', attribs);
  }

  /**
   * Ajoute une balise `fieldset` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  fieldset(attribs = {}) {
    return this.tag('fieldset', attribs);
  }

  /**
   * Ajoute une balise `label` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  label(attribs = {}) {
    return this.tag('label', attribs);
  }

  /**
   * Ajoute une balise `legend` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  legend(attribs = {}) {
    return this.tag('legend', attribs);
  }

  /**
   * Ajoute une balise `meter` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  meter(attribs = {}) {
    return this.tag('meter', attribs);
  }

  /**
   * Ajoute une balise `optgroup` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  optgroup(attribs = {}) {
    return this.tag('optgroup', attribs);
  }

  /**
   * Ajoute une balise `output` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  output(attribs = {}) {
    return this.tag('output', attribs);
  }

  /**
   * Ajoute une balise `progress` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  progress(attribs = {}) {
    return this.tag('progress', attribs);
  }

  /**
   * Ajoute une balise `br` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   * @deprecated
   */
  br() {
    return this.tag_one_line('br');
  }

  /**
   * Ajoute une balise `hr` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  hr() {
    return this.tag_one_line('hr');
  }

  /**
   * Ajoute une balise `address` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  address(attribs = {}) {
    return this.tag('address', attribs);
  }

  /**
   * Ajoute une balise `article` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  article(attribs = {}) {
    return this.tag('article', attribs);
  }

  /**
   * Ajoute une balise `aside` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  aside(attribs = {}) {
    return this.tag('aside', attribs);
  }

  /**
   * Ajoute une balise `footer` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  footer(attribs = {}) {
    return this.tag('footer', attribs);
  }

  /**
   * Ajoute une balise `header` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  header(attribs = {}) {
    return this.tag('header', attribs);
  }

  /**
   * Ajoute une balise `h` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  h(num, attribs = {}) {
    return this.tag(`h${num}`, attribs);
  }

  /**
   * Ajoute une balise `h1` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  h1(attribs = {}) {
    return this.h(1, attribs);
  }

  /**
   * Ajoute une balise `h2` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  h2(attribs = {}) {
    return this.h(2, attribs);
  }

  /**
   * Ajoute une balise `h3` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  h3(attribs = {}) {
    return this.h(3, attribs);
  }

  /**
   * Ajoute une balise `h4` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  h4(attribs = {}) {
    return this.h(4, attribs);
  }

  /**
   * Ajoute une balise `h5` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  h5(attribs = {}) {
    return this.h(5, attribs);
  }

  /**
   * Ajoute une balise `h6` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  h6(attribs = {}) {
    return this.h(6, attribs);
  }

  /**
   * Ajoute une balise `hgroup` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  hgroup(attribs = {}) {
    return this.tag('hgroup', attribs);
  }

  /**
   * Ajoute une balise `main` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  main(attribs = {}) {
    return this.tag('main', attribs);
  }

  /**
   * Ajoute une balise `nav` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  nav(attribs = {}) {
    return this.tag('nav', attribs);
  }

  /**
   * Ajoute une balise `section` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  section(attribs = {}) {
    return this.tag('section', attribs);
  }

  /**
   * Ajoute une balise `menu` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  menu(attribs = {}) {
    return this.tag('menu', attribs);
  }

  /**
   * Ajoute une balise `iframe` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  iframe(attribs = {}, close = true) {
    let tmp = this.tag('iframe', attribs);

    if (close) return tmp.end();
    else return tmp;
  }

  /**
   * Ajoute une balise `canvas` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  canvas(attribs = {}) {
    return this.tag('canvas', attribs);
  }

  /**
   * Ajoute une balise `script` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  script(attribs = {}) {
    return this.tag('script', attribs);
  }

  /**
   * Ajoute une balise `table` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  table(attribs = {}) {
    return this.tag('table', attribs);
  }

  /**
   * Ajoute une balise `caption` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  caption(attribs = {}) {
    return this.tag('caption', attribs);
  }

  /**
   * Ajoute une balise `thead` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  thead(attribs = {}) {
    return this.tag('thead', attribs);
  }

  /**
   * Ajoute une balise `col` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  col() {
    return this.tag_one_line('col');
  }

  /**
   * Ajoute une balise `colgroup` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  colgroup(attribs = {}) {
    return this.tag('colgroup', attribs);
  }

  /**
   * Ajoute une balise `tbody` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  tbody(attribs = {}) {
    return this.tag('tbody', attribs);
  }

  /**
   * Ajoute une balise `td` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  td(attribs = {}) {
    return this.tag('td', attribs);
  }

  /**
   * Ajoute une balise `th` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  th(attribs = {}) {
    return this.tag('th', attribs);
  }

  /**
   * Ajoute une balise `tr` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  tr(attribs = {}) {
    return this.tag('tr', attribs);
  }

  /**
   * Ajoute une balise `tfoot` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  tfoot(attribs = {}) {
    return this.tag('tfoot', attribs);
  }

  /**
   * Ajoute une balise `details` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  details(attribs = {}) {
    return this.tag('details', attribs);
  }

  /**
   * Ajoute une balise `summary` à la balise actuelle et la retourne.
   * @param {Attribs} attribs Attributs de la balise
   * @returns {this}
   *
   */
  summary(attribs = {}) {
    return this.tag('summary', attribs);
  }

  dialog(attribs = {}) {
    return this.tag('dialog', attribs);
  }

  /**
   * Affichera un commentaire html
   * @param {string} text Commentaire à afficher
   * @returns {this}
   * @template {this} J
   */
  comment(text) {
    return this.text(`<!-- ${text} -->`);
  }

  /**
   * Commentaire qui ne sera pas affiché
   * @param {string} commentary Commentaire
   * @returns {this}
   */
  // eslint-disable-next-line no-unused-vars
  _(commentary) {
    return this;
  }

  /**
   * Affiche un texte brute
   * @param {string} text Texte à afficher
   * @returns {this}
   *
   */
  text(text) {
    return this._create(text, this, { is_raw: true }, true);
  }

  /**
   * Termine une balise
   * @param {?string} debug Commentaire à afficher pour pouvoir s'y retrouver plus facilement
   * @returns {this}
   *
   * @example JsHtml.start.div().end()
   */
  end(debug = null) {
    let end = this.#_parent._create(
      `/${this.balise}`,
      this.#_parent,
      null,
      true,
    );

    if (debug) end.text(`<!-- ${debug} -->`);

    return end;
  }

  /**
   * Permet d'ajouter des éléments en jshtml qui nécéssitent d'être bouclés.
   * @param {EachCallback} callback Action
   * @param  {...*} items Objets
   * @returns {this}
   *
   */
  each(callback, ...items) {
    let html = this;
    for (const iterator of items) {
      html = callback(this, iterator);
    }

    return html;
  }

  /**
   * Actions à éxécuter dans le JsHtml.
   * @param {ActionCallback} callback
   * @param  {...any} args Arguments qui seront transmits au callback
   * @returns {this}
   *
   */
  action(callback, ...args) {
    return callback(this, ...args);
  }

  /**
   *
   * @param {____JsHtml} item
   */
  #_revert_conds(item) {
    for (const element of item.childs) {
      if (element.childs.length) this.#_revert_conds(element);
      if (element.balise.includes('_'))
        element.balise = element.balise.split('_')[1];
    }
  }

  #_generate_and_revert({ mode = 0, context = window, joli_html = false }) {
    let generated = this._generate({ mode, context, joli_html });

    this.#_revert_conds(this);

    return generated;
  }

  /**
   *
   * @param {{key:string, value:HTMLElement}[]} arr
   * @returns {Object<string, HTMLElement>}
   */
  #_toJson(arr) {
    let obj = {};
    for (const element of arr) {
      obj[element.key] = element.value;
    }

    return obj;
  }

  /**
   * Génère en jQuery
   * @returns {external:jQuery}
   */
  generate({ context = window } = {}) {
    return this.#_generate_and_revert({ mode: 1, context });
  }

  generate_dom() {
    return this.#_generate_and_revert({ mode: 1 })[0];
  }

  /**
   *
   * @param {Object} [options={}]
   * @param {Window} [options.context=window]
   * @param {boolean} [options.jQuery=true]
   * @returns {{observed:Object<string, (jQuery | HTMLElement)>, generated:(jQuery | HTMLElement), free:() => null}}
   */
  generate_with_observer({ context = window, jQuery = true } = {}) {
    let arr = this.#_generate_and_revert({ mode: 1, context });

    return {
      observed: this.#_toJson(
        [...arr]
          .map((x) => {
            x = $(x);
            let array = Array.from(
              x.find('[data-rotomeca-framework-observer]'),
            );

            if (!!x.attr('data-rotomeca-framework-observer')) array.push(x);

            return array;
          })
          .flat()
          .map((x) => {
            x = $(x);
            const key = x.attr('data-rotomeca-framework-observer');
            x.removeAttr('data-rotomeca-framework-observer');
            return { key, value: jQuery ? x : x[0] };
          }),
      ),
      generated: jQuery ? arr : arr[0],
      free() {
        this.observed = null;
        this.generated = null;
        return null;
      },
    };
  }

  /**
   * Génère le code en html brut. Les fonctions des évènements ne fonctionneront pas.
   * @param {Object} param0
   * @param {boolean} param0.joli_html Si on doit mettre en forme le html (retour à la ligne et tabulations)
   * @returns {string}
   */
  generate_html({ joli_html = false }) {
    return this.#_generate_and_revert({ joli_html });
  }

  /**
   * Ajoute un JsHtml enfant
   * @param {____JsHtml} jshtml JsHtml à ajouter
   * @returns {____JsHtml}
   */
  add_child(jshtml) {
    if (jshtml.balise === 'start') {
      this.childs.push(
        ...jshtml.childs.map((x) => {
          x.parent = this;
          return x;
        }),
      );
    } else {
      jshtml.parent = this;
      this.childs.push(jshtml);
    }

    return this;
  }

  /**
   * Ajoute une balise html enfant.
   * @param {string} balise Balise à ajouter en enfant
   * @param {____JsHtml} parent Parent de la balise
   * @param {Attribs} attribs Attributs de la balise
   * @param {boolean} isend Si la balise est une balise de fermeture
   * @returns {____JsHtml}
   */
  _create(balise, parent, attribs, isend) {
    this.childs.push(new this.constructor(balise, parent, attribs));

    return isend ? parent : this.childs[this.childs.length - 1];
  }

  /**
   * Ajoute une balise enfant qui ne possède pas de balises de fermeture.
   * @param {string} balise Balise à ajouter en enfant
   * @param {____JsHtml} parent Parent de la balise
   * @param {Attribs} attribs Attributs de la balise
   * @returns {____JsHtml}
   */
  _create_oneline(balise, parent, attribs) {
    return this._create(balise, parent, attribs, true);
  }

  /**
   * Si la classe est sous forme de string, le transforme en objet.
   * @returns {____JsHtml}
   * @private
   */
  _update_class() {
    if (!this._update_attribs().attribs) this.attribs = { class: [] };
    else if (!this.attribs.class) this.attribs.class = [];
    else if (!!this.attribs.class && typeof this.attribs.class === 'string')
      this.attribs.class = this.attribs.class.split(' ');
    else if (!!this.attribs.class && (!this.attribs.class) instanceof Array)
      this.attribs.class = [this.attribs.class];

    return this;
  }

  /**
   * Si le css est sous forme de string, le transforme en objet.
   * @returns {____JsHtml}
   * @private
   */
  _update_css() {
    if (!this.attribs) this.attribs = { style: {} };
    else if (!this.attribs.style) this.attribs.style = {};
    else if (!!this.attribs.style && typeof this.attribs.style === 'string') {
      const [key, value] = this.attribs.style.split(':');
      this.attribs.style = { [key]: value };
    }

    return this;
  }

  /**
   *
   * @param {____JsHtml} jshtml
   */
  #_generate_w_conditions(jshtml) {
    const IF = 'if';
    const ELSE = 'else';
    const ELSIF = 'elseif';
    const ENDIF = 'endif';

    let condition;

    if (jshtml.balise === IF) {
      condition = jshtml._update_attribs().attribs.condition;

      if (typeof condition === 'function') condition = condition();

      if (condition) {
        jshtml.balise = `ok_${IF}`;
      } else {
        let valid = false;
        for (const element of jshtml
          .parent()
          .childs.filter((x) => x.balise === ELSIF || x.balise === ENDIF)) {
          if (element.balise === ENDIF) break;

          condition = element._update_attribs().attribs.condition;

          if (typeof condition === 'function') condition = condition();

          if (condition) {
            valid = true;
            element.balise = `ok_${ELSIF}`;
            break;
          }
        }

        if (!valid) {
          const SEARCH_ELSE = jshtml
            .parent()
            .childs.filter((x) => x.balise === ELSE || x.balise === ENDIF);

          for (const element of SEARCH_ELSE) {
            if (element.balise === ELSE) {
              element.balise = `ok_${ELSE}`;
              break;
            } else {
              break;
            }
          }
        }
      } // END ELSE

      for (const element of jshtml
        .parent()
        .childs.filter((x) => [IF, ELSIF, ELSE, ENDIF].includes(x.balise))) {
        if (element.balise === ENDIF) {
          element.balise = `finished_${ENDIF}`;
          break;
        } else {
          element.balise = `ignored_${element.balise}`;
        }
      }
    } // END MAIN IF

    return jshtml;
  }

  /**
   * Génère le html.
   * @param {*} param0
   * @returns {(string | external:jQuery)}
   * @private
   */
  _generate({ i = -1, mode = 0, joli_html = false, context = window }) {
    const IGNORED_BALISES = ['start', 'if', 'elseif', 'else', 'endif']
      .map((x) => [x, `/${x}`, `ignored_${x}`, `finished_${x}`, `ok_${x}`])
      .flat();
    let html = [];
    let current = this.#_generate_w_conditions(this);

    if (current.#_onResolve.haveEvents()) {
      let resolved = current.#_onResolve.call();

      if (Array.isArray(resolved)) {
        for (const element of resolved) {
          current = element ?? current;
        }
      } else current = resolved ?? current;
    }

    if (!IGNORED_BALISES.includes(current.balise))
      html.push(
        `${this.balise !== '/textarea' && joli_html ? this._create_blanks(i) : ''}${this._get_balise()}`,
      );

    if (
      !current.balise.includes('ignored_') &&
      !current.balise.includes('finished_')
    ) {
      for (const iterator of current.childs) {
        html.push(iterator._generate({ i: i + 1, joli_html, context }));
      }
    }

    html = html.join(joli_html ? '\r\n' : '');

    switch (mode) {
      case 0:
        break;
      case 1:
        html = context.$(html);

        // eslint-disable-next-line no-case-declarations
        let id;
        // eslint-disable-next-line no-case-declarations
        let $item;
        // eslint-disable-next-line no-case-declarations
        let $node;
        // eslint-disable-next-line no-case-declarations, quotes
        const $nodes = [html, ...html.find("[data-on-id!=''][data-on-id]")];
        for (const iterator of $nodes) {
          $item = context.$(iterator);

          for (const node of $item) {
            $node = context.$(node);
            id = $node.attr('data-on-id');

            if (id) {
              for (const key in ____JsHtml.actions[id]) {
                if (Object.hasOwnProperty.call(____JsHtml.actions[id], key)) {
                  const element = ____JsHtml.actions[id][key];
                  $node.on(
                    key.replace('on', ''),
                    element instanceof BnumEvent
                      ? element.call.bind(element)
                      : element,
                  );
                }
              }
              ____JsHtml.remove_id(id);
              id = null;
            }

            $node = null;
          }

          $item = null;
        }

        break;
      default:
        throw new Error('mode not exist');
    }

    return html;
  }

  /**
   * Récupère une balise générée
   * @returns {string}
   * @private
   */
  _get_balise() {
    var current_class;
    const memory_tag =
      typeof this.balise === 'function' ? this.balise(this) : this.balise;
    let balise;

    if (this.#_observed)
      this.attr('data-rotomeca-framework-observer', this.#_observed);

    if (this.attribs?.is_raw === true) balise = memory_tag;
    else {
      balise = [`<${memory_tag}`];

      if (typeof this.attribs === 'string') {
        if (this.attribs !== '') balise.push(this.attribs);
      } else if (!!this.attribs && Object.keys(this.attribs).length > 0) {
        for (const key in this.attribs) {
          if (Object.hasOwnProperty.call(this.attribs, key)) {
            const element = this.attribs[key];

            if (element === undefined || element === null) continue;

            if (
              !this._isOn(key) ||
              (this._isOn(key) &&
                typeof element !== 'function' &&
                !(element instanceof BnumEvent))
            ) {
              switch (key) {
                case 'raw-content':
                  break;

                case 'data-custom-tag':
                  continue;

                case 'class':
                  if (element instanceof Array) {
                    current_class = [];

                    for (const iterator of element) {
                      if (typeof iterator === 'function')
                        current_class.push(iterator(this));
                      else current_class.push(iterator);
                    }

                    balise.push(`${key}="${current_class.join(' ')}"`);
                    current_class.length = 0;
                    current_class = null;
                    break;
                  }

                case 'style':
                  if (typeof element === 'object') {
                    current_class = [];

                    // eslint-disable-next-line no-shadow
                    for (const key in element) {
                      if (Object.hasOwnProperty.call(element, key)) {
                        if (typeof element[key] === 'function')
                          current_class.push(`${key}:${element[key](this)}`);
                        else current_class.push(`${key}:${element[key]}`);
                      }
                    }

                    balise.push(`${key}="${current_class.join(';')}"`);
                    current_class.length = 0;
                    current_class = null;
                    break;
                  }

                default:
                  balise.push(
                    `${key}="${typeof element === 'function' ? element(this) : element}"`,
                  );
                  break;
              }
            } else if (this._isOn(key)) {
              // eslint-disable-next-line vars-on-top
              var id = id || ____JsHtml.generate_ids();
              balise.push(`data-on-id="${id}"`);
              ____JsHtml.add_action(id, key, this._getOn(key));
            }
          }
        }
      }

      id = null;

      if (this.attribs?.['data-custom-tag'] && this.attribs?.one_line) {
        balise.push('>');
        balise.push(`</${this.balise}>`);
      } else balise.push(`${this.attribs?.one_line === true ? '/' : ''}>`);

      let join;
      if (balise.length === 2) join = '';
      else join = ' ';

      if (!!this.attribs && !!this.attribs['raw-content'])
        balise.push(
          typeof this.attribs['raw-content'] === 'function'
            ? this.attribs['raw-content'](this)
            : this.attribs['raw-content'],
        );

      balise = balise.join(join);
    }

    return balise;
  }

  /**
   * Créer un espace
   * @return {string}
   * @private
   */
  _create_blanks(i) {
    if (i === 0) return '';

    const tab = 4;
    let blanks = [];

    for (let index = 0, len = i * tab; index < len; ++index) {
      blanks.push(' ');
    }

    return blanks.join('');
  }

  /**
   * Même effet que {@link ____JsHtml.generate_html}
   * @returns {string}
   */
  toString() {
    return this.generate_html({ joli_html: true });
  }

  /**
   * Commence une session de JsHtml.
   * @returns {____JsHtml}
   * @static
   */
  static start() {
    return new ____JsHtml('start', null);
  }

  /**
   * Créer un alias.
   *
   * Permet de créer une nouvelle balise html en js html.
   * @param {string} alias Nom de la fonction.
   * @param {Object} param1
   * @param {boolean} param1.online Si la balise doit être sur une ligne.
   * @param {function} param1.before_callback Fonction qui sera appelé avant la création de la balise.
   * @param {function} param1.generate_callback Fonction qui sera appelé pour la création de la balise.
   * @param {function} param1.after_callback Fonction qui sera appelé après la création de la balise.
   * @param {string} param1.tag Nom de la balise.
   * @returns {typeof ____JsHtml}
   */
  static create_alias(
    alias,
    {
      online = false,
      before_callback = null,
      generate_callback = null,
      after_callback = null,
      tag = 'div',
    },
  ) {
    ____JsHtml.prototype[alias] = function (attribs = {}, ...args) {
      if (before_callback) {
        const before = before_callback(attribs, ...args);

        if (before.attribs) attribs = before.attribs;
      }

      if (online && typeof attribs === 'object') attribs.one_line = true;

      let html = generate_callback
        ? generate_callback(this, attribs, ...args)
        : this._create(
            tag,
            this,
            typeof attribs === 'object' ? attribs : null,
            online,
          );

      if (after_callback) {
        const call = after_callback(html, attribs, ...args);

        if (!!call && call instanceof ____JsHtml) html = call;
      }

      return html;
    };

    return this;
  }
}

/**
 * Sauvegarde les fonctions des balises pour les appliqués après lors de la génération.
 * @type {Object.<string, function>}
 * @static
 */
____JsHtml.actions = {};
/**
 * Génère un id.
 * @param {!number} length Taille de l'id
 * @returns {string}
 * @static
 */
____JsHtml.generate_ids = function generate_ids(length = 5) {
  let result = '';
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }

  if (Object.keys(this.actions).includes(result))
    result = ____JsHtml.generate_ids(~~(Math.random() * 100));

  return result;
};
/**
 * Supprime une action.
 * @param {string} id Id de l'action à supprimée
 * @static
 */
____JsHtml.remove_id = function (id) {
  ____JsHtml.actions[id] = null;
};

/**
 * Ajoute une action pour l'utiliser plus tard.
 * @param {string} id Id de l'action
 * @param {string} action Nom de l'action
 * @param {function} callback Callback de l'évènement
 * @static
 */
____JsHtml.add_action = function (id, action, callback) {
  if (!____JsHtml.actions[id]) ____JsHtml.actions[id] = {};

  if (!____JsHtml.actions[id][action])
    ____JsHtml.actions[id][action] = new BnumEvent();

  ____JsHtml.actions[id][action] = callback;
};

/**
 * @class
 * @classdesc Englobe les fonctions de la classe ____JsHtml
 * @package
 * @tutorial js-html
 */
class ____js_html___ {
  constructor() {
    /**
     * Commence un texte html en javascript
     * @type {____JsHtml}
     * @readonly
     */
    this.start = null;
    Object.defineProperties(this, {
      start: {
        get() {
          return ____JsHtml.start();
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
   * @returns
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
    return ____JsHtml.create_alias(alias, {
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
   */
  extend(name, callback) {
    ____JsHtml.prototype[name] = callback;
  }

  /**
   * Permet de maj une fonction de l'écriture js html
   * @param {string} name Nom de la fonction à override
   * @param {function} callback Nouvelle fonction arg1 => this, arg2 => ancienne fonction, arg3 => arguments de la fonction
   */
  update(name, callback) {
    const old = ____JsHtml.prototype[name];
    ____JsHtml.prototype[name] = function (...args) {
      return callback(this, old, ...args);
    };
  }

  /**
   * Ecrit une page en js html
   * @param {function} callback Function qui contient le js html.
   * @param  {...any} args Arguments de la fonction `callback`
   * @returns {____JsHtml}
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
   * @returns {Promise<null | ____JsHtml>}
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
 * @memberof module:JsHtml
 * @type {____js_html___}
 * @description Permet de générer du html en javascript et d'écrire du javascript sous forme html.
 * @tutorial js-html
 */
const JsHtml = new ____js_html___();
