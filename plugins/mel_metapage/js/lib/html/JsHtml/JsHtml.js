export {JsHtml}

class RotomecaHtml {
    constructor(balise, parent, attribs = {}) {
        this.balise = balise;
        this.attribs = attribs;
        this.childs = [];
        this._parent = parent;
    }

    addClass(class_to_add) {
        if (!this.hasClass(class_to_add)) this.attribs.class.push(class_to_add);
        return this;
    }

    hasClass(class_to_verify) {
        return this._update_class().attribs.class.includes(class_to_verify);
    }

    css(key_or_attrib, value = '') {
        if (typeof key_or_attrib === 'string') {
            if (!this._update_css().attribs.style[key_or_attrib]) this.attribs.style[key_or_attrib] = value;
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
        return this.tag('ul', attribs);
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
        return this.tag('th', attribs);
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

    _create(balise, parent, attribs, isend) {
        this.childs.push(new this.constructor(balise, parent, attribs));
         
        return isend ? parent : this.childs[this.childs.length - 1];
    }

    _create_oneline(balise, parent, attribs){
        return this._create(balise, parent, attribs, true);
    }

    _update_class() {
        if (!this.attribs) this.attribs = {class:[]};
        else if (!this.attribs.class) this.attribs.class = [];
        else if (!!this.attribs.class && typeof this.attribs.class === 'string') this.attribs.class = this.attribs.class.split(' ');
        else if (!!this.attribs.class && !this.attribs.class instanceof Array) this.attribs.class = [this.attribs.class];

        return this;
    }

    _update_css() {
        if (!this.attribs) this.attribs = {style:{}};
        else if (!this.attribs.style) this.attribs.style = {};

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
                for (const iterator of html.find("[data-on-id!=''][data-on-id]")) {
                    $item = $(iterator);
                    id = $item.attr('data-on-id');

                    $item.on(RotomecaHtml.actions[id].action.replace('on', ''), RotomecaHtml.actions[id].callback);

                    RotomecaHtml.remove_id(id);
                    id = null;
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
                        
                        if (!key.includes('on') || (key.includes('on') && typeof element !== 'function')) {
                            
                            switch (key) {
                                case 'raw-content':
                                    break;

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
                            
                                default:
                                    balise.push(`${key}="${(typeof element === 'function' ? element(this) : element)}"`);
                                    break;
                            }
                        }
                        else if (key.includes('on')) {
                            var id = RotomecaHtml.generate_ids();
                            balise.push(`data-on-id="${id}"`);
                            RotomecaHtml.add_action(id, key, element);
                            id = null;
                        }
                    }
                }
            }

            balise.push(`${(true === this.attribs?.one_line ? '/' : '')}>`);

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

    static start() {
        return new RotomecaHtml('start', null);
    }

    static create_alias(alias, {
        online = false,
        before_callback = null,
        generate_callback = null,
        after_callback = null,
        tag = 'div'
    }) {
        RotomecaHtml.prototype[alias] = function (attribs = {}, ...args) {
            if (!!before_callback) {
                const before = before_callback(attribs, ...args);

                if (!!before.attribs) attribs = before.attribs;
            }

            if (online && typeof attribs === 'object') attribs.one_line = true;

            let html = !!generate_callback ? generate_callback(this, attribs, ...args) : this._create(tag, this, typeof attribs === 'object' ? attribs : null, online);

            if (!!after_callback) {
                const call = after_callback(html, attribs, ...args);

                if (!!call && call instanceof RotomecaHtml) html = call;
            }

            return html;
        };

        return this;
    }
}

RotomecaHtml.actions = {};
RotomecaHtml.generate_ids = function makeid(length = 5) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }

    if (Object.keys(this.actions).includes(result)) result = RotomecaHtml.generate_ids(~~(Math.random()*100));

    return result;
}
RotomecaHtml.remove_id = function (id) {
    RotomecaHtml.actions[id] = null;
}
RotomecaHtml.add_action = function(id, action, callback) {
    RotomecaHtml.actions[id] = {action, callback};
}

/**
 * Fonctions utiles pour écrire du html en javascript.
 * @type {{start:RotomecaHtml, create_alias:function, extend:function}} 
 * 
 */
const JsHtml = {};
Object.defineProperties(JsHtml, {
    start: {
        get() {
            return RotomecaHtml.start();
        },
        configurable: false,
        enumerable: false,
    },
    create_alias: {
        get() {
            return RotomecaHtml.create_alias;
        },
        configurable: false,
        enumerable: false,
    },
    extend:{
        value: function (name, callback) {
            RotomecaHtml.prototype[name] = callback;
        }
    },
    update:{
        value: function (name, callback) {
            const old = RotomecaHtml.prototype[name];
            RotomecaHtml.prototype[name] = function (...args) {
                return callback(this, old, ...args);
            }
        }
    }
});