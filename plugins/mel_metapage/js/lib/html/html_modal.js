import { MelEnumerable } from "../classes/enum.js";
import { Random } from "../classes/random.js";
import { MelArray } from "../helpers/array.js";
export { modal_html };

class modal_html extends mel_html2 {
    constructor(title, desc, id = null) {
        super('div', {});

        let _title = title;
        let _desc = desc;

        /**
         * Id de la modale
         * @type {string}
         */
        this.id = EMPTY_STRING;
        this.title_id = EMPTY_STRING;
        this.desc_id = EMPTY_STRING;
        this.title = EMPTY_STRING;
        this.desc = EMPTY_STRING;
        Object.defineProperties(this, {
            id: {
                get: function() {
                    return this.attribs['id'];
                },
                configurable: true
            },
            title_id: {
                get: function() {
                    return `title-for-label-for-this-modal-${this.id}`;
                },
                configurable: true
            },
            desc_id: {
                get: function() {
                    return `desc-for-label-for-this-modal-${this.id}`;
                },
                configurable: true
            },
            title: {
                get: function() {
                    return _title;
                },
                set: (value) => {
                    _title = value;
                    this._p_on_title_change(_title);
                },
                configurable: true
            },
            desc: {
                get: function() {
                    return _desc;
                },
                set: (value) => {
                    _desc = value;
                    this._p_on_desc_change(_desc);
                },
                configurable: true
            }
        });

        this.setId(id || modal_html._generateId({test:true}));

        let _elements = {};

        this.add_element = function (key, value) {
            _elements[key] = value;
        };

        this.push_element = (value) => {
            let id;

            do {
                id = modal_html._generateId({test:false});
            } while (!!_elements[id]);

            this.add_element(id, value);

            return id;
        }

        this.clear_elements = () => {
            _elements = {};
        }

        Object.defineProperties(this, {
            elements: {
                get: function*() {
                    for (const key in _elements) {
                        if (Object.hasOwnProperty.call(_elements, key)) {
                            yield _elements[key];
                        }
                    }
                },
                configurable: true
            },
        });
    }

    _p_on_title_change(new_title){}
    _p_on_desc_change(new_desc){}

    _before_generate() {
        super._before_generate();
        this._set_attribs();

        this.push_element(this._generate_title());
        this.push_element(this._generate_desc());
    }

    _generateContent($html) {
        this._set_childs();
        return super._generateContent($html);
    }

    _set_attribs() {
        this.setId(this.id || modal_html._generateId({test:true}));
        this.setAttr('aria-modal', true)
            .setAttr('role', 'dialog')
            .setAttr('aria-labelledby', this.title_id)
            .setAttr('aria-describedby', this.desc_id);
    }

    _generate_title() {
        return new mel_html('span', {class:'sr-only', id:this.title_id}, this.title);
    }

    _generate_desc() {
        return new mel_html('span', {class:'sr-only', id:this.desc_id}, this.desc);
    }

    _set_childs() {
        let it = 0;
        for (const iterator of this.elements) {
            this.jcontents[it++] = iterator;
        }
    }

    create($parent, focusAfterClosed, focusFirst, additionnal_attribs = {}) {
        let $generated = super.create($parent, additionnal_attribs);
        new aria.Dialog($generated[0], focusAfterClosed, focusFirst);
        return $generated;
    }

    static _generateId({test = true}) {
        const base = MelEnumerable.from(MelArray.Alphabet()).aggregate(MelArray.Numbers);
        let id = null;

        while (id === null || (test && $(`#${id}`).length > 0)) {
            id = 'modal-' + MelEnumerable.choice(base).take(Random.intRange(10,15)).join(EMPTY_STRING);
        }

        return id;
    }
}

modal_html.modal_class = 'modal';
modal_html.modal_fade_class = 'fade';