/**
 * @module JsHtml
 * @local JsHtml
 * @local ____JsHtml
 */

import { BnumEvent } from "../../mel_events.js";

export {JsHtml, ____JsHtml}

/**
 * @class
 * @classdesc Permet de générer du html en javascript et décrire du javascript sous forme html.
 * @package
 */
class ____JsHtml {
    /**
     * 
     * @param {string} balise 
     * @param {____JsHtml} parent 
     * @param {Object<string, string | function | number>} attribs 
     */
    constructor(balise, parent, attribs = {}) {
        this.balise = balise;
        this.attribs = attribs;
        this.childs = [];
        this._parent = parent;
    }

    /**
     * Ajoute une classe à la balise
     * @param {string} class_to_add Classe à ajouter
     * @returns {____JsHtml}
     */
    addClass(class_to_add) {
        let navigator = this._updated_balise();
        if (!navigator.hasClass(class_to_add)) navigator.attribs.class.push(class_to_add);
        return this;
    }

    /**
     * Si la balise à une classe ou non
     * @param {string} class_to_verify Classe à vérifier
     * @returns {____JsHtml}
     */
    hasClass(class_to_verify) {
        return this._updated_balise()._update_class().attribs.class.includes(class_to_verify);
    }

    /**
     * Supprime une classe à la balise
     * @param {string} class_to_remove Classe à supprimer 
     * @returns {____JsHtml}
     */
    removeClass(class_to_remove){
        let navigator = this._updated_balise();
        if (navigator.hasClass(class_to_remove)) navigator.attribs.class = navigator.attribs.class.filter(x => x !== class_to_remove);

        return this;
    }

    /**
     * Désactive la balise.
     * 
     * Ajoute la classe `disabled` et l'attribut `disabled`
     * @returns {____JsHtml}
     */
    disable() {
        return this.addClass('disabed').attr('disabled', 'disabled');
    }

    /**
     * Ajoute un attribut css à la balise
     * @param {string | Object<string, string>} key_or_attrib Clé ou attributs
     * @param {!string} value Valeur de la propriété css si il ne s'agit pas d'un attribut.
     * @returns {____JsHtml}
     */
    css(key_or_attrib, value = '') {
        if (typeof key_or_attrib === 'string') {
            let navigator = this._update_attribs()._updated_balise()._update_css();
            navigator.attribs.style[key_or_attrib] = value;
        }
        else {
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
     * @returns {____JsHtml}
     */
    _updated_balise() {
        if (this.childs.length > 0) {
            if (['img', 'input', 'br', 'hr'].includes(this.childs[this.childs.length - 1].balise)) return this.childs[this.childs.length - 1];
            else if (this.childs[this.childs.length - 1]._update_attribs().attribs?.one_line === true) return this.childs[this.childs.length - 1];
        }

        return this;
    }

    /**
     * Si un attribut existe ou non
     * @param {string} name Nom de l'attribut 
     * @returns {boolean}
     */
    hasAttr(name) {
        return !!this._updated_balise().attribs[name]
    }

    /**
     * Attribut à rajouter à la balise
     * @param {string} name Nom de la balise
     * @param {string} value valeur de l'attribut
     * @returns {____JsHtml}
     */
    attr(name, value) {
        let navigator = this._updated_balise();

        if (navigator._update_attribs()._isOn(name)) {
            navigator.attribs[name] = navigator._getOn(name);
            navigator.attribs[name].push(value);
        }
        else navigator.attribs[name] = value;
        return this;
    }

    attrs(attributes) {
        for (const key in attributes) {
            if (Object.hasOwnProperty.call(attributes, key)) {
                const element = attributes[key];
                this.attr(key, element);
            }
        }

        return this;
    }

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

    _isOn(name) {
        return name.length > 2 && name[0] === 'o' && name[1] === 'n';
    }

    _getOn(name) {
        if (!this.attribs[name]) this.attribs[name] = new BnumEvent();
        else if (!!this.attribs[name] && !(this.attribs[name] instanceof BnumEvent)) {
            const old = this.attribs[name];
            this.attribs[name] = new BnumEvent();

            if (typeof old === 'string') this.attribs[name].push((callback) => eval(callback), old);
            else this.attribs[name].push(old);
        };
        
        return this.attribs[name];
    }

    removeAttr(name) {
        this._updated_balise().attribs[name] = undefined;
        return this;
    }

    parent() {
        return this._parent;
    }

    tag(balise, attribs = {}) {
        return this._create(balise, this, attribs, false);
    }

    tag_one_line(balise, attribs = {}) {
        return this._create_oneline(balise, this, attribs);
    }

    a(attribs = {}){
        return this.tag('a', attribs);
    }

    dd(attribs = {}){
        return this.tag('dd', attribs);
    }

    dt(attribs = {}){
        return this.tag('dt', attribs);
    }

    dl(attribs = {}){
        return this.tag('dl', attribs);
    }

    div(attribs = {}) {
        return this.tag('div', attribs);
    }

    blockquote(attribs = {}) {
        return this.tag('blockquote', attribs);
    }

    ul(attribs = {}) {
        return this.tag('ul', attribs);
    }

    ol(attribs = {}) {
        return this.tag('ol', attribs);
    }

    li(attribs = {}) {
        return this.tag('li', attribs);
    }

    span(attribs = {}){
        return this.tag('span', attribs);
    }

    p(attribs = {}){
        return this.tag('p', attribs);
    }

    img(attribs = {}){
        return this.tag_one_line('img', attribs);
    }

    style() {
        return this.tag('style');
    }

    style_css_prop(key, value){
        return this.text(`${key}:${value};`);
    }

    _try_add_label(attribs = {}) {
        let html_input = this;
        if (!!attribs?.id && attribs?.label) {
            html_input = html_input.label({for:attribs.id}).text(attribs.label).end();
        }

        return html_input;
    }

    input(attribs = {}) {
        return this._try_add_label(attribs).tag_one_line('input', attribs);
    }

    select(attribs = {}) {
        return this._try_add_label(attribs).tag('select', attribs);
    }

    option(attribs = {}){
        return this.tag('option', attribs);
    }

    option_one_line(value, text, attribs = {}){
        attribs.value = value;
        return this.option(attribs).text(text).end();
    }

    textarea(attribs = {}) {
        return this._try_add_label(attribs).tag('textarea', attribs);
    }

    form(attribs = {}) {
        return this.tag('form', attribs);
    }

    button(attribs = {}) {
        return this.tag('button', attribs);
    }

    fieldset(attribs = {}) {
        return this.tag('fieldset', attribs);
    }

    label(attribs = {}){
        return this.tag('label', attribs);
    }

    legend(attribs = {}){
        return this.tag('legend', attribs);
    }

    meter(attribs = {}){
        return this.tag('meter', attribs);
    }

    optgroup(attribs = {}){
        return this.tag('optgroup', attribs);
    }

    output(attribs = {}){
        return this.tag('output', attribs);
    }

    progress(attribs = {}){
        return this.tag('progress', attribs);
    }

    br(){
        return this.tag_one_line('br');
    }

    hr(){
        return this.tag_one_line('hr');
    }

    address(attribs = {}) {
        return this.tag('address', attribs);
    }

    article(attribs = {}) {
        return this.tag('article', attribs);
    }

    aside(attribs = {}) {
        return this.tag('aside', attribs);
    }

    footer(attribs = {}) {
        return this.tag('footer', attribs);
    }

    header(attribs = {}) {
        return this.tag('header', attribs);
    }

    h(num, attribs = {}) {
        return this.tag(`h${num}`, attribs);
    }

    h1(attribs = {}) {
        return this.h(1, attribs);
    }

    h2(attribs = {}) {
        return this.h(2, attribs);
    }

    h3(attribs = {}) {
        return this.h(3, attribs);
    }

    h4(attribs = {}) {
        return this.h(4, attribs);
    }

    h5(attribs = {}) {
        return this.h(5, attribs);
    }

    h6(attribs = {}) {
        return this.h(6, attribs);
    }

    hgroup(attribs = {}) {
        return this.tag('hgroup', attribs);
    }

    main(attribs = {}) {
        return this.tag('main', attribs);
    }

    nav(attribs = {}) {
        return this.tag('nav', attribs);
    }

    section(attribs = {}) {
        return this.tag('section', attribs);
    }

    menu(attribs = {}) {
        return this.tag('menu', attribs);
    }

    iframe(attribs = {}) {
        return this.tag('iframe', attribs).end();
    }

    canvas(attribs = {}) {
        return this.tag('canvas', attribs);
    }

    script(attribs = {}) {
        return this.tag('script', attribs);
    }

    table(attribs = {}) {
        return this.tag('table', attribs);
    }

    caption(attribs = {}) {
        return this.tag('caption', attribs);
    }

    caption(attribs = {}) {
        return this.tag('caption', attribs);
    }

    col(){
        return this.tag_one_line('col');
    }

    colgroup(attribs = {}) {
        return this.tag('colgroup', attribs);
    }

    tbody(attribs = {}) {
        return this.tag('tbody', attribs);
    }

    td(attribs = {}) {
        return this.tag('td', attribs);
    }

    th(attribs = {}) {
        return this.tag('th', attribs);
    }

    tr(attribs = {}) {
        return this.tag('tr', attribs);
    }

    tfoot(attribs = {}) {
        return this.tag('tfoot', attribs);
    }

    tbody(attribs = {}) {
        return this.tag('tbody', attribs);
    }

    details(attribs = {}) {
        return this.tag('details', attribs);
    }

    summary(attribs = {}) {
        return this.tag('summary', attribs);
    }

    dialog(attribs = {}) {
        return this.tag('dialog', attribs);
    }

    comment(text) {
        return this.text(`<!-- ${text} -->`);
    }

    _(commentary){
        return this;
    }

    text(text) {
        return this._create(text, this, {is_raw:true}, true);
    }

    /**
     * 
     * @param {*} debug 
     * @returns {____JsHtml}
     */
    end(debug = null) {
        let end = this._parent._create(`/${this.balise}`, this._parent, null, true);

        if (!!debug) end.text(`<!-- ${debug} -->`);

        return end;
    }

    generate() {
        return this._generate({mode:1});
    }

    generate_html({joli_html = false}) {
        return this._generate({joli_html});
    }

    /**
     * 
     * @param {*} balise 
     * @param {*} parent 
     * @param {*} attribs 
     * @param {*} isend 
     * @returns {____JsHtml}
     */
    _create(balise, parent, attribs, isend) {
        this.childs.push(new this.constructor(balise, parent, attribs));
         
        return isend ? parent : this.childs[this.childs.length - 1];
    }

    _create_oneline(balise, parent, attribs){
        return this._create(balise, parent, attribs, true);
    }

    _update_class() {
        if (!this._update_attribs().attribs) this.attribs = {class:[]};
        else if (!this.attribs.class) this.attribs.class = [];
        else if (!!this.attribs.class && typeof this.attribs.class === 'string') this.attribs.class = this.attribs.class.split(' ');
        else if (!!this.attribs.class && !this.attribs.class instanceof Array) this.attribs.class = [this.attribs.class];

        return this;
    }

    _update_css() {
        if (!this.attribs) this.attribs = {style:{}};
        else if (!this.attribs.style) this.attribs.style = {};
        else if (!!this.attribs.style && typeof this.attribs.style === 'string') {
            const [key, value] = this.attribs.style.split(':');
            this.attribs.style = {[key]:value};
        }

        return this;
    }

    _generate({
        i = -1,
        mode = 0,
        joli_html = false,
    }) {
        let html = [];
        
        if ('start' !== this.balise) html.push(`${this.balise !== '/textarea' && joli_html ? this._create_blanks(i) : ''}${this._get_balise()}`);

        for (const iterator of this.childs) {
            html.push(iterator._generate({i:i + 1, joli_html}));
        }

        html = html.join(joli_html ? '\r\n' : '');

        switch (mode) {
            case 0:
                break;
            case 1:
                html = $(html);

                let id;
                let $item;
                const $nodes = [html, ...html.find("[data-on-id!=''][data-on-id]")];
                for (const iterator of $nodes) {
                    $item = $(iterator);
                    id = $item.attr('data-on-id');

                    if (!!id) {
                        for (const key in ____JsHtml.actions[id]) {
                            if (Object.hasOwnProperty.call(____JsHtml.actions[id], key)) {
                                const element = ____JsHtml.actions[id][key];
                                $item.on(key.replace('on', ''), (element instanceof BnumEvent ? element.call.bind(element) : element));
                            }
                        }
                        ____JsHtml.remove_id(id);
                        id = null;
                    }

                    $item = null;
                }

                break ;
            default:
                throw new Error('mode not exist');
        }

        return html;
    }

    _get_balise(){
        const memory_tag = typeof this.balise === 'function' ? this.balise(this) : this.balise;
        let balise;

        if (true === this.attribs?.is_raw) balise = memory_tag;
        else {
            balise = [`<${memory_tag}`];

            if (typeof this.attribs === 'string') {
                if ('' !== this.attribs) balise.push(this.attribs);
            } 
            else if(!!this.attribs && Object.keys(this.attribs).length > 0) {
                for (const key in this.attribs) {
                    if (Object.hasOwnProperty.call(this.attribs, key)) {
                        const element = this.attribs[key];

                        if (element === undefined || element === null) continue;
                        
                        if (!this._isOn(key) || (this._isOn(key) && typeof element !== 'function' && !(element instanceof BnumEvent))) {
                            
                            switch (key) {
                                case 'raw-content':
                                    break;

                                case 'data-custom-tag':
                                    continue;

                                case 'class':
                                    if (element instanceof Array) {
                                        var current_class = [];

                                        for (const iterator of element) {
                                            if (typeof iterator === 'function') current_class.push(iterator(this));
                                            else current_class.push(iterator);
                                        }

                                        balise.push(`${key}="${current_class.join(' ')}"`);
                                        current_class.length = 0;
                                        current_class = null;
                                        break;
                                    }

                                case 'style':
                                    if (typeof element === 'object') {
                                        var current_class = [];

                                        for (const key in element) {
                                            if (Object.hasOwnProperty.call(element, key)) {
                                                if (typeof element[key] === 'function') current_class.push(`${key}:${element[key](this)}`);
                                                else current_class.push(`${key}:${element[key]}`);
                                            }
                                        }

                                        balise.push(`${key}="${current_class.join(';')}"`);
                                        current_class.length = 0;
                                        current_class = null;
                                        break;
                                    }
                            
                                default:
                                    balise.push(`${key}="${(typeof element === 'function' ? element(this) : element)}"`);
                                    break;
                            }
                        }
                        else if (this._isOn(key)) {
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
            }
            else balise.push(`${(true === this.attribs?.one_line ? '/' : '')}>`);

            let join;
            if (balise.length === 2) join = '';      
            else join = ' ';

            if (!!this.attribs && !!this.attribs['raw-content']) balise.push((typeof this.attribs['raw-content'] === 'function' ? this.attribs['raw-content'](this) : this.attribs['raw-content']));

            balise = balise.join(join);
        }

        return balise;
    }

    _create_blanks(i){
        if (0 === i) return '';

        const tab = 4;
        let blanks = [];

        for (let index = 0, len = i*tab; index < len; ++index) {
            blanks.push(' ');            
        }

        return blanks.join('');
    }

    toString() {
        return this.generate_html({joli_html:true});
    }

    static start() {
        return new ____JsHtml('start', null);
    }

    static create_alias(alias, {
        online = false,
        before_callback = null,
        generate_callback = null,
        after_callback = null,
        tag = 'div'
    }) {
        ____JsHtml.prototype[alias] = function (attribs = {}, ...args) {
            if (!!before_callback) {
                const before = before_callback(attribs, ...args);

                if (!!before.attribs) attribs = before.attribs;
            }

            if (online && typeof attribs === 'object') attribs.one_line = true;

            let html = !!generate_callback ? generate_callback(this, attribs, ...args) : this._create(tag, this, typeof attribs === 'object' ? attribs : null, online);

            if (!!after_callback) {
                const call = after_callback(html, attribs, ...args);

                if (!!call && call instanceof ____JsHtml) html = call;
            }

            return html;
        };

        return this;
    }
}

____JsHtml.actions = {};
____JsHtml.generate_ids = function makeid(length = 5) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }

    if (Object.keys(this.actions).includes(result)) result = ____JsHtml.generate_ids(~~(Math.random()*100));

    return result;
}
____JsHtml.remove_id = function (id) {
    ____JsHtml.actions[id] = null;
}
____JsHtml.add_action = function(id, action, callback) {
    if (!____JsHtml.actions[id]) ____JsHtml.actions[id] = {}

    if (!____JsHtml.actions[id][action]) ____JsHtml.actions[id][action] = new BnumEvent();

    ____JsHtml.actions[id][action] = callback;
}

/**
 * @class
 * @classdesc Englobe les fonctions de la classe ____JsHtml
 * @package 
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
            }
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
    create_alias(alias, {
        online = false,
        before_callback = null,
        generate_callback = null,
        after_callback = null,
        tag = 'div'
    }) {
        return ____JsHtml.create_alias(alias, {
            online, 
            before_callback,
            generate_callback,
            after_callback,
            tag
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
        }
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
    async load_page(name, plugin = 'mel_metapage', skin = (window?.rcmail?.env?.skin ?? '')) {
        const load = top?.loadJsModule ?? parent?.loadJsModule ?? window?.loadJsModule;
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
 */
const JsHtml = new ____js_html___();