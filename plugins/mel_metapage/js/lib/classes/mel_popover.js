import { EMPTY_STRING } from '../constants/constants.js';
import { MelHtml } from '../html/JsHtml/MelHtml.js';
import { BnumEvent } from '../mel_events.js';
import { MelEnumerable } from './enum.js';

const default_template = MelHtml.start
  .div({ class: 'bnum-popover', role: 'dialog', 'aria-modal': true })
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
      context = window,
    } = {},
  ) {
    let $tmp = template
      .generate({ context })
      .appendTo(typeof container === 'string' ? $(container) : container)
      .css({ 'min-width': '30px', 'min-height': '1px' });
    const width = tooltip
      .generate({ context })
      .appendTo($tmp.find('.bnum-popover-content'))
      .css('width');

    $tmp
      .css('width', `${width}px`)
      .prepend($(arrow).addClass('bnum-popover-arrow'))
      .on('keydown', (e) => {
        console.log('e', e);
        switch (e.originalEvent.keyCode) {
          case 27:
            this.hide();
            break;

          default:
            break;
        }
      });

    $tmp.find('.bnum-popover-content').css('display', 'none');
    $tmp.find('.bnum-popover-arrow').addClass('hide');

    let $last = this._find_last_focusable($tmp);

    $tmp.find('.bnum-popover-content').append('<span tabindex=0></span>');

    if ($last && $last.length) {
      $last.on('focusout', () => {
        if (this.is_shown()) {
          let $element = this._find_first_focusable(
            $(this._pop.state.elements.popper),
          );

          if ($element) {
            $element[0].focus();
          }
        }
      });
    }

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

    this.onhide = new BnumEvent();

    $last = null;
    $tmp = null;
  }

  _find_last_focusable($element) {
    return this._find_focusable(
      MelEnumerable.from(this._flat_jquery($element))
        .select((x, i) => {
          return { x, i };
        })
        .orderByDescending((x) => x.i)
        .select((x) => x.x),
    );
  }

  _find_first_focusable($element) {
    return this._find_focusable(
      MelEnumerable.from(this._flat_jquery($element)),
    );
  }

  _find_focusable(elements) {
    // for (const element of $element) {
    //   if (aria.Utils.isFocusable(element)) return $(element);
    // }

    return elements
      .where((x) => aria.Utils.isFocusable(x?.[0] ? x[0] : x))
      .firstOrDefault();
  }

  *_flat_jquery($element) {
    yield $element;
    for (const element of $element.children()) {
      yield* this._flat_jquery($(element));
    }
  }

  show() {
    let $pop;
    let $button;

    $pop = $(this._pop.state.elements.popper);

    $pop.find('.bnum-popover-content').css('display', EMPTY_STRING);
    $pop.find('.bnum-popover-arrow').removeClass('hide');

    $button = $pop.find('button');

    if ($button.length > 0) $button.first().focus();
    else $pop.css('tabindex', 0).focus();

    $button = null;
    $pop = null;

    return this;
  }

  hide() {
    let $pop = $(this._pop.state.elements.popper);
    $pop.find('.bnum-popover-content').css('display', 'none');

    $pop.find('.bnum-popover-arrow').addClass('hide');

    $pop = null;

    this.onhide.call();
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
