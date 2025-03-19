import { BnumLog } from '../../../classes/bnum_log.js';
import { MelEnumerable } from '../../../classes/enum.js';
import { FramesManager } from '../../../classes/frame_manager.js';
import { JsHtml as MelHtml } from '../JsHtml.js';
import { HtmlCustomTag } from './js_html_base_web_elements.js';

export { MelWindow, MelWindowFrame };

class MelWindow extends HtmlCustomTag {
  constructor(id = null) {
    super();

    this._id = id;
  }

  _p_main() {
    super._p_main();

    this._id =
      this._id ?? this.dataset.windowId ?? this.getAttribute('data-window-id');

    this.addEventListener('click', this._event_on_click.bind(this));

    this.classList.add('mel-windows');
    this.id = `mel-window-${this._id}`;

    this.appendChild(this._generate_header().generate()[0]);
    this.appendChild(
      MelHtml.start
        .div({ class: 'mel-window-frame fullframe' })
        .end()
        .generate()[0],
    );
  }

  _event_on_click() {
    FramesManager.Helper.current.unselect_all();
    FramesManager.Helper.current.select_window(this._id);
  }

  _button_close_onclick() {
    FramesManager.Helper.current.delete_window(this._id);
  }

  _generate_header() {
    //prettier-ignore
    return MelHtml.start
    .div({ class: 'mel-window-header' })
      .div({ class: 'mel-window-title' }).end()
      .button({ class: 'bckg true' }).attr('onclick', this._button_close_onclick.bind(this))
        .webcomponents().icon('delete').end('icon')
      .end('button')
    .end('header');
  }

  add_frame(jshtml) {
    this.$.find('.mel-window-frame').append(
      MelWindowFrame.CreateNode().attach_frame(jshtml),
    );
    return this;
  }

  update_title(new_text) {
    this.$.find('.mel-window-title').text(new_text);
    return this;
  }

  update_title_html(new_html) {
    this.$.find('.mel-window-title').html(new_html);
    return this;
  }

  find_frame(task) {
    return this.$.find(`.mm-frame.${task}-frame`);
  }

  /**
   *
   * @param {string} id
   * @returns {MelWindow}
   */
  static CreateNode(id) {
    let node = document.createElement(this.TAG);
    node.setAttribute('data-window-id', id);

    return node;
  }

  static get TAG() {
    return 'bnum-mel-window';
  }
}

{
  const TAG = MelWindow.TAG;
  if (!customElements.get(TAG)) customElements.define(TAG, MelWindow);
}

class MelWindowFrame extends HtmlCustomTag {
  constructor() {
    super();
    this._attached = false;
    this._elements = {};
  }

  attach_frame(jshtml) {
    if (this._attached) {
      BnumLog.error(
        'attach_frame',
        'Une frame à déjà été attaché !',
        jshtml,
        this,
      );
      return this;
    } else this._attached = true;

    let generated = jshtml.generate()[0];

    this.classList.add(
      ...MelEnumerable.from(generated.classList).select((x) => `mw-${x}`),
    );

    const task = generated.dataset.frameTask || null;
    if (task) this.id = `mel-framewrapper-${task}`;

    this.style.width = '100%';
    this.style.height = '100%';
    this.style.display = 'block';

    this.appendChild(generated);

    return this;
  }

  add_element(key, jshtml, after = true) {
    if (this._elements[key]) this.remove_element(key);

    let $generated = jshtml.generate();

    if (after) $generated.appendTo(this.$);
    else $generated.prependTo(this.$);

    this._elements[key] = $generated;

    return this;
  }

  remove_element(key) {
    if (this._elements[key]) {
      this._elements[key].remove();
      this._elements[key] = null;
    }

    return this;
  }

  get_element(key) {
    return this._elements[key];
  }

  /**
   *
   * @returns {MelWindowFrame}
   */
  static CreateNode() {
    return document.createElement(this.TAG);
  }

  static get TAG() {
    return 'bnum-mel-window-frame';
  }
}

{
  const TAG = MelWindowFrame.TAG;
  if (!customElements.get(TAG)) customElements.define(TAG, MelWindowFrame);
}
