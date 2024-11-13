import { EMPTY_STRING } from '../constants/constants.js';
// import { ____JsHtml } from '../html/JsHtml/JsHtml.js';
import { MelHtml } from '../html/JsHtml/MelHtml.js';
import { BnumEvent } from '../mel_events.js';
import { Point, Rectangle } from '../mel_maths.js';
import { Color, ColorFromVariable } from './color.js';
import { MelEnumerable } from './enum.js';

export { Toolbar };

class ToolbarIcon {
  constructor(icon) {
    this._icon = icon;
  }

  generate() {
    return MelHtml.start.span({ class: this._icon }).end();
  }

  static Create(icon) {
    return new ToolbarIcon(icon);
  }
}

class ToolbarMaterialIcon extends ToolbarIcon {
  constructor(icon) {
    super(icon);
  }

  generate() {
    return MelHtml.start.icon(this._icon).end();
  }

  static Create(icon) {
    return new ToolbarMaterialIcon(icon);
  }
}

class ToolbarItem {
  constructor(id) {
    this.id = id;
    this._parent = null;
    this._icon = null;
    this._text = EMPTY_STRING;
    this.$item = null;
    this.actions = new BnumEvent();
    this.ongenerate = new BnumEvent();
    this.attribs = {};

    Object.defineProperty(this, '$item', {
      get: () => {
        return this._get_item_jquery();
      },
    });
  }

  _get_item_jquery() {
    return this._parent.toolbar().find(`#toolbar-button-${this.id}`);
  }

  set_parent(toolbar) {
    this._parent = toolbar;
    return this;
  }

  set_text(text) {
    this._text = text;
    return this;
  }

  set_icon(icon) {
    this._icon = icon;
    return this;
  }

  add_attribs(key, value) {
    this.attribs[key] = value;
    return this;
  }

  add_action(callback) {
    this.actions.push(callback);
    return this;
  }

  close_modification() {
    return this._parent;
  }

  clone() {
    let clone = new ToolbarItem().set_icon(this._icon).set_text(this._text);
    clone.actions = this.actions;

    return clone;
  }

  generate(additionnal_attribs = {}) {
    for (const key in this.attribs) {
      if (Object.prototype.hasOwnProperty.call(this.attribs, key)) {
        additionnal_attribs[key] = this.attribs[key];
      }
    }

    return ToolbarItem.Generate(this, additionnal_attribs);
  }

  /**
   * @static
   * @param {ToolbarItem} item
   * @param {Object<string, string | number | boolean>} additionnal_attribs
   * @returns {____JsHtml}
   */
  static Generate(item, additionnal_attribs = {}) {
    //prettier-ignore
    let button = MelHtml.start
      .button({ class: 'toolbar-button', id: `toolbar-button-${item.id}` }).attr('onmouseenter', item._on_enter.bind(item)).attr('onmouseleave', item._on_leave.bind(item)).attr('onclick', item.actions.call.bind(item.actions))
        .add_child(item._icon.generate())
        .span({ class:'toolbar-text' }).css('display', (item._text ? EMPTY_STRING : 'none'))
          .text(item._text)
        .end()
      .end();

    for (const key in additionnal_attribs) {
      if (Object.prototype.hasOwnProperty.call(additionnal_attribs, key)) {
        const element = additionnal_attribs[key];

        switch (key) {
          case 'class':
            for (const c of element.split(' ')) {
              button.first().addClass(c);
            }
            break;

          case 'style':
            for (const s of element.split(';')) {
              const [k, v] = s.split('=');
              button.first().css(k, v);
            }
            break;

          default:
            button.first().attr(key, element);
            break;
        }
      }
    }

    button = item.ongenerate.call(button, item) || button;

    return button;
  }

  _on_enter(e) {
    // e = $(e.currentTarget);
    // this._style = e.css('color');
    // e.css('color', EMPTY_STRING);
  }

  _on_leave(e) {
    // $(e.currentTarget).css('color', this._style);
    // this._style = null;
  }
}

class MultipleButtonToolbarItem extends ToolbarItem {
  constructor(id) {
    super(id);
    /**
     * @type {Array<ToolbarItem>}
     */
    this._others_buttons = [];
  }

  add_button(button) {
    const id = this._others_buttons.length;
    button.id = `${this.id}-${id}`;
    this._others_buttons.push(button);

    return this;
  }

  remove_button(id) {
    const index = this._others_buttons.findIndex((x) => x.id === id);

    this._others_buttons[index].attribs['removed'] = true;
    return this;
  }

  generate(main_button_additionnal_attribs = {}) {
    let base = super.generate(main_button_additionnal_attribs);

    if (this.attribs['data-solo']) return base;

    //prettier-ignore
    let entity = MelHtml.start.btn_group({ class: 'toolbar-button-group' })
                          .add_child(base)
                          .each((self, item) => {
                            return item.attribs.removed ? self : self.add_child(ToolbarItem.Generate(item, item.attribs));
                          }, ...this._others_buttons)
                        .end();

    base = null;

    return entity;
  }

  get(index) {
    return this._others_buttons[index];
  }

  *[Symbol.iterator]() {
    yield this;
    yield* this._others_buttons;
  }
}

class Toolbar {
  constructor(id) {
    let _shape = new Rectangle(Point.Zero(), '100%', '60px');
    let _color = new Color(0, 0, 0);

    this._icon_type = ToolbarIcon;
    this._$toolbar = null;
    this._items = [];
    this.x = null;
    this.y = null;
    this.width = null;
    this.heigth = null;
    this.color = EMPTY_STRING;
    this.id = null;

    Object.defineProperties(this, {
      id: {
        value: id,
        writable: false,
        enumerable: true,
        configurable: false,
      },
      x: {
        get: () => {
          return _shape.x;
        },
        set: (value) => {
          _shape.x = value;
          this._update_toolbar();
        },
      },
      y: {
        get: () => {
          return _shape.y;
        },
        set: (value) => {
          _shape.y = value;
          this._update_toolbar();
        },
      },
      width: {
        get: () => {
          return _shape.width;
        },
        set: (value) => {
          _shape.width = value;
          this._update_toolbar();
        },
      },
      heigth: {
        get: () => {
          return _shape.heigth;
        },
        set: (value) => {
          _shape.heigth = value;
          this._update_toolbar();
        },
      },
      color: {
        get: () => {
          return _color.toString();
        },
        set: (value) => {
          if (typeof value === 'string') _color = Color.fromHexa(value);
          else _color = value;
          this._update_toolbar();
        },
      },
    });
  }

  _update_toolbar() {
    if (this._$toolbar) {
      this._$toolbar.css({
        //'background-color': this.color,
        height: this.heigth,
        width: this.width,
        left: this.x,
        bottom: this.y,
      });
    }
  }

  set_icon_type(icon_type) {
    this._icon_type = icon_type;
    return this;
  }

  add_item(id, text, icon) {
    let item = new ToolbarItem(id)
      .set_parent(this)
      .set_text(text)
      .set_icon(this._icon_type.Create(icon));
    this._items.push(item);

    item = null;
    return this._items[this._items.length - 1];
  }

  add_mulitple_button_existing_item(id, array) {
    let item = new MultipleButtonToolbarItem(id);

    const first = array[0];
    item
      .set_parent(this)
      .set_text(first.text)
      .set_icon(this._icon_type.Create(first.icon));

    item = this._set_attribs_on_existing_item(first, item);

    let button;
    for (let index = 1; index < array.length; ++index) {
      const element = array[index];

      button = new ToolbarItem(id)
        .set_parent(this)
        .set_text(element.text)
        .set_icon(this._icon_type.Create(element.icon));

      item.add_button(this._set_attribs_on_existing_item(element, button));
    }

    this._items.push(item);
    item = null;

    return this._items[this._items.length - 1];
  }

  /**
   *
   * @param {*} existing_item
   * @returns {ToolbarItem}
   */
  add_existing_item(id, existing_item) {
    let item = this.add_item(id, existing_item.text, existing_item.icon);

    if (existing_item.action) item.add_action(existing_item.action);

    return this._set_attribs_on_existing_item(existing_item, item);
  }

  _set_attribs_on_existing_item(existing_item, item) {
    if (existing_item.data) {
      for (const key in existing_item.data) {
        if (Object.prototype.hasOwnProperty.call(existing_item.data, key)) {
          const element = existing_item.data[key];
          item.add_attribs(`data-${key}`, element);
        }
      }
    }

    return item;
  }

  remove_item(id) {
    this._items = this._items.filter((x) => x.id !== id);

    return this;
  }

  generate($parent, $additionnal_attribs = {}, context = window) {
    //prettier-ignore
    let nav = MelHtml.start
      .nav({ id: this.id, class: 'mel-nav-toolbar' })
        .ul({ unstyled: true })
          .each((self, item) => {
            return self.li().add_child(item.generate()).end();
          }, ...this._items)
        .end()
      .end();

    if (Object.keys($additionnal_attribs).length) {
      for (const key in $additionnal_attribs) {
        if (Object.prototype.hasOwnProperty.call($additionnal_attribs, key)) {
          const attrib_value = $additionnal_attribs[key];

          switch (key) {
            case 'class':
              for (const attrib_class of attrib_value.split(' ')) {
                nav.first().addClass(attrib_class);
              }
              break;

            case 'id':
              break;

            default:
              nav.first().attr(key, attrib_value);
              break;
          }
        }
      }
    }

    this._$toolbar = nav.generate({ context }).appendTo($parent);

    this._update_toolbar();

    // const raw_color_a = Color.fromRGB(
    //   this._$toolbar.css('background-color'),
    // ).toHexa();
    // const raw_color_b = Color.fromRGB(
    //   this._$toolbar.find('button').first().css('color'),
    // ).toHexa();
    // const colorA = mel_metapage.Functions.colors.kMel_extractRGB(raw_color_a);
    // const colorB = mel_metapage.Functions.colors.kMel_extractRGB(raw_color_b);

    // const isAAA = mel_metapage.Functions.colors.kMel_LuminanceRatioAAA(
    //   colorA,
    //   colorB,
    // );

    // if (!isAAA) this._$toolbar.find('button').css('color', 'black');

    return this.toolbar();
  }

  toolbar() {
    return this._$toolbar;
  }

  /**
   *
   * @param {string} id
   * @returns {ToolbarItem}
   */
  get_button(id) {
    return MelEnumerable.from(this._items)
      .where((x) => x.id === id)
      .first();
  }

  destroy() {
    return this.toolbar().hide().remove();
  }

  /**
   * @yields {ToolbarItem}
   */
  *[Symbol.iterator]() {
    yield* this._items;
  }

  static Item({
    icon = EMPTY_STRING,
    text = EMPTY_STRING,
    action = null,
    on_generate = null,
  }) {
    return { icon, text, action, on_generate };
  }

  static MultipleItem(items) {
    return items;
  }

  static New(id) {
    return new Toolbar(id);
  }

  /**
   *
   * @param {string} config
   * @param {typeof Toolbar} ToolbarType
   * @returns
   */
  static FromConfig(config, ToolbarType = Toolbar) {
    const shape = this._ParseShape(config.toolbar.shape);
    let toolbar = new ToolbarType(config.toolbar.id).set_icon_type(
      config.toolbar.icon_type === 'material-symbol'
        ? ToolbarMaterialIcon
        : ToolbarIcon,
    );

    toolbar.x = shape.x;
    toolbar.y = shape.y;
    toolbar.width = shape.width;
    toolbar.heigth = shape.height;
    toolbar.color = config.toolbar.color
      ? config.toolbar.color.includes('var:')
        ? new ColorFromVariable(
            config.toolbar.color.replaceAll('var:', EMPTY_STRING),
          )
        : config.toolbar.color
      : new Color();

    for (const key in config.toolbar.buttons) {
      if (Object.prototype.hasOwnProperty.call(config.toolbar.buttons, key)) {
        const button_data = config.toolbar.buttons[key];

        if (Array.isArray(button_data))
          toolbar.add_mulitple_button_existing_item(key, button_data);
        else toolbar.add_existing_item(key, button_data);
      }
    }

    return toolbar;
  }

  static _ParseShape(shape) {
    if ((shape || false) && shape !== EMPTY_STRING) {
      let rectangle = new Rectangle(Point.Zero, '100%', '60px');
      shape = shape.split(':')[1];

      let prop;
      for (const element of shape.split(',')) {
        switch (element.replaceAll(' ', EMPTY_STRING)[0]) {
          case 'x':
          case 'y':
            prop = element[0];
            break;

          case 'w':
            prop = 'width';
            break;

          case 'h':
            prop = 'height';
            break;

          default:
            continue;
        }

        this._SetShapeValue(
          rectangle,
          prop,
          element.replace(' ', EMPTY_STRING).slice(1),
        );
      }

      shape = null;
      prop = null;

      return rectangle;
    } else return new Rectangle(Point.Zero, '100%', '60px');
  }

  static _SetShapeValue(shape, prop, val) {
    shape[prop] = val;
  }
}

Toolbar.IconsType = {
  basic: ToolbarIcon,
  material: ToolbarMaterialIcon,
};
