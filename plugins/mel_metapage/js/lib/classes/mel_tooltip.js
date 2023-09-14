import { EMPTY_STRING, TYPE_STRING } from "../constants/constants.js";
import { MainIconHtml } from "../html/html_icon.js";
import { Point, Rectangle } from "../mel_maths.js";
import { MelEnumerable } from "./enum.js";
import { Random } from "./random.js";
export {mel_tooltip, enum_tooltip_mode, enum_tooltip_position};

let ids = [];
class mel_tooltip {
    constructor($parent, {
        position = enum_tooltip_position.AUTO,
        content = EMPTY_STRING,
        mode = enum_tooltip_mode.HOVER,
        $context = $('body')
    }) {
        this._init()._setup($parent, position, content, mode)._create($context)._set_pos();
    }

    _init() {
        this.$parent = null;
        this.$ref = null;
        this.$close = null;
        this.$fullscreen_background = null;
        this._content = EMPTY_STRING;
        this._position = enum_tooltip_position.AUTO;
        this._mode = enum_tooltip_mode.HOVER;

        return this;
    }

    _setup($parent, position, content, mode) {
        this.$parent = $parent;
        this._content = content;
        this._position = position;
        this._mode = mode;

        this.$fullscreen_background = new mel_html2('div', {
            attribs:{class:'tooltip-fullscreen-background'},
            events: {
                click: () => {
                    this.hide();
                    this.$fullscreen_background.hide();
                }
            }
        }).create($('body'));

        return this;
    }

    _create($context) {
        let before_create = true;
        this.$ref = new mel_html2('div', {attribs:{class:'mel-tooltip', style:'display:none;'}});

        switch (typeof this._content) {
            case TYPE_STRING:
                this.$ref.addContent(mel_html.div({class:'mel-tooltip-content-wrapper'}, this._content));
                break;
            default:
                if (this._content instanceof mel_html) this.$ref.addContent(mel_html.div({class:'mel-tooltip-content-wrapper'}, this._content)); 
                else before_create = false
                break;
        }

        this.$ref = this.$ref.create($context);

        switch (this._mode) {
            case enum_tooltip_mode.CLICK_AND_FOCUS:
                this.$ref.on('focusout', (e) => {
                    if (this.is_active()) {
                        let hide = false;
                        if (e.relatedTarget !== null) {
                            if ($(e.relatedTarget).data('toggle-id') !== this.id()) {
                                let $parent = $(e.relatedTarget);

                                while ($parent[0].nodeName !== 'BODY' && !$parent.hasClass('mel-tooltip')) {
                                    $parent = $parent.parent();
                                }
            
                                if ($parent[0].nodeName === 'BODY') hide = true;
                                else $parent.focus();                                
                            }
                        } 
                        else hide = true;

                        if (hide) this.hide();
                    }
                });
                break;
        
            default:
                break;
        }

        this.$close = new mel_html2('button', {
            attribs:{class: `mel-button no-button-margin no-margin-button bckg true tooltip-close-button`},
            contents:new MainIconHtml('close', {}, {})
        });

        this.$close.onclick.push(() => {
            this.hide();
        })

        if (!before_create) this.$ref.append($('<div>').addClass('mel-tooltip-content-wrapper').append(this._content));

        this.$close = this.$close.generate().prependTo(this.$ref);

        this.$parent.data('toggle-id', mel_tooltip.generate_id());
        this.$fullscreen_background.attr('id', `${this.id()}-tooltip-fullscreen-background`);

        return this;
    }

    _set_pos() {
        const parent_rect = this.$parent[0].getClientRects()[0];
        const rectangle = new Rectangle(new Point(parent_rect.left, parent_rect.top), parent_rect.width, parent_rect.height);

        this.$ref.css({
            top: `${rectangle.y + rectangle.height + 15}px`,
            left: rectangle.x + 'px'
        });

        return this;
    }

    id() {
        return this.$parent.data('toggle-id');
    }

    show() {
        this.$ref.addClass('showed').attr('tabindex', 0).show().focus();
        this.$fullscreen_background.show();
        return this;
    }

    hide() {
        this.$fullscreen_background.hide();
        this.$ref.removeClass('showed').hide().attr('tabindex', -1).blur();
        this.$parent.focus();
        return this;
    }

    toggle() {
        return this.is_active() ? this.hide() : this.show();
    }

    is_active() {
        return this.$ref.is('.showed');
    }

    destroy() {
        this.$ref.remove();
        this.$close = null;
        this.$fullscreen_background.remove();
        this.$fullscreen_background = null;
        this.$ref = null;
        this.$parent = null;

        if (!!mel_tooltip.tooltips[this.id()]) mel_tooltip.remove_tooltip(this.id());
    }

    static generate_id() {
        const generate = () => MelEnumerable.choice('abcdefghijklmnopqrstuvwxyz').take(5).join(EMPTY_STRING) + Random.intRange(0, 10);
        let id;

        do {
            id = generate();
        } while (ids.includes(id));

        return id;
    }
}

mel_tooltip.tooltips = {};
mel_tooltip.add_tooltip = function (tooltip) {
    this.tooltips[tooltip.id()] = tooltip;
}

mel_tooltip.remove_tooltip = function (id) {
    this.tooltips[id]  = this.tooltips[id].destroy();
    ids = ids.filter(x => x !== id);
}

/**
 * @type {{AUTO: Symbol, TOP: Symbol, BOTTOM: Symbol, LEFT: Symbol, RIGHT: Symbol}}}
 */
const enum_tooltip_position = MelEnum.createEnum('enum_tooltip_position', {
    AUTO: Symbol('auto'),
    TOP: Symbol('^'),
    BOTTOM: Symbol('v'),
    LEFT: Symbol('<'),
    RIGHT: Symbol('>')
}, false);

/**
 * @type {{MANUAL: Symbol, HOVER: Symbol, CLICK: Symbol, CLICK_AND_FOCUS: Symbol}}
 */
const enum_tooltip_mode = MelEnum.createEnum('enum_tooltip_mode', {
    MANUAL: Symbol('manual'),
    HOVER: Symbol('hover'),
    CLICK: Symbol('click'),
    CLICK_AND_FOCUS: Symbol('click_and_focus')
}, false);

if (typeof $ !== 'undefined' && !!$.fn && !$.fn.mel_tooltip) {

    function _mel_tooltip($selected, action, ...args) {
        switch (action) {
            case 'init':
                let config = {};

                for (const key in args[0]) {
                    if (Object.hasOwnProperty.call(args[0], key)) {
                        const element = args[0][key];
                        config[key] = element;
                    }
                }

                mel_tooltip.add_tooltip(new mel_tooltip($selected, config));
                break;
        
            case 'show':
                mel_tooltip.tooltips[$selected.data('toggle-id')].show();
                break;

            case 'get':
                return mel_tooltip.tooltips[$selected.data('toggle-id')];

            case 'toggle':
                mel_tooltip.tooltips[$selected.data('toggle-id')].toggle();
                break;

            case 'hide':
                mel_tooltip.tooltips[$selected.data('toggle-id')].hide();
                break;

            default:
                break;
        }
    }

    $.fn.extend({
        mel_tooltip: function(action, ...args) {
            return _mel_tooltip(this, action, ...args);
        }
    })
}

$(window).on('resize', () => {
    for (const key in mel_tooltip.tooltips) {
        if (Object.hasOwnProperty.call(mel_tooltip.tooltips, key)) {
            var tooltip = mel_tooltip.tooltips[key];
            tooltip._set_pos();
        }
    }
});