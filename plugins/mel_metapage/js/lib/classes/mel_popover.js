import { EMPTY_STRING } from '../constants/constants';
import { MelHtml } from '../html/JsHtml/MelHtml';
import { MelEnumerable } from './enum';

const default_template = MelHtml.start
  .div({ class: 'bnum-popover' })
  .div({ class: 'bnum-popover-content' })
  .end()
  .end();

const default_arrow = '<div data-popper-arrow></div>';

export class MelPopover {
  /**
   *
   * @param {*} $item
   * @param {____JsHtml} tooltip
   * @param {*} config
   */
  constructor(
    $item,
    tooltip,
    {
      template = default_template,
      arrow = default_arrow,
      config = {},
      container = 'body',
    },
  ) {
    let $tmp = template
      .generate()
      .appendTo(typeof container === 'string' ? $(container) : container)
      .css({ 'min-width': '30px', 'min-height': '1px' });
    const width = tooltip
      .generate()
      .appendTo($tmp.find('.bnum-popover-content'))
      .css('width');

    $tmp
      .css('width', `${width}px`)
      .prepend($(arrow).addClass('bnum-popover-arrow'));

    $tmp.find('.bnum-popover-content').css('display', 'none');
    $tmp.find('.bnum-popover-arrow').addClass('hide');

    if (!config) config = {};
    if (!config.modifiers) config.modifiers = [];

    if (!MelEnumerable.from(config.modifiers).any((x) => x.name === 'offset')) {
      let offset;

      switch (config.placement) {
        case 'left':
        case 'right':
          offset = [8, 0];
          break;

        case 'top':
        case 'bottom':
        default:
          offset = [0, 8];
          break;
      }

      config.modifiers.push({
        name: 'offset',
        options: {
          offset,
        },
      });
    }

    this._pop = Popper.createPopper($item[0], $tmp[0], config);
    console.log(this);
  }

  show() {
    let $pop = $(this._pop.state.elements.popper);
    $pop.find('.bnum-popover-content').css('display', EMPTY_STRING);

    $pop.find('.bnum-popover-arrow').removeClass('hide');
    $pop = null;
    return this;
  }

  hide() {
    let $pop = $(this._pop.state.elements.popper);
    $pop.find('.bnum-popover-content').css('display', 'none');

    $pop.find('.bnum-popover-arrow').addClass('hide');

    $pop = null;
    return this;
  }

  toggle() {
    if (this.is_shown()) this.hide();
    else this.show();
  }

  is_shown() {
    return (
      $(this._pop.state.elements.popper)
        .find('.bnum-popover-content')
        .css('display') !== 'none'
    );
  }
}
