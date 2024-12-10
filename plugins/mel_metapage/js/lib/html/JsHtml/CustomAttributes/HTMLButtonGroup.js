import { EMPTY_STRING } from "../../../constants/constants";
import { BnumEvent } from "../../../mel_events.js";
import { ABaseMelEvent } from "./events.js";
import { HTMLMelButton } from "./HTMLMelButton.js";
import { EWebComponentMode, HtmlCustomDataTag } from "./js_html_base_web_elements.js";

export { HTMLButtonGroup };

class HTMLButtonGroup extends HtmlCustomDataTag {
  constructor() {
    super({ mode:EWebComponentMode.div });

    this.onbuttonclick = new BnumEvent();
    this.onbuttonclick.push((id, index, event, button, caller) => {
      this.dispatchEvent(new ButtonGroupEvent(id, index, event, button, caller));
    });
  }

  /**
   * @type {string[]}
   * @readonly
   */
  get buttons() {
    return this._p_get_data('buttons')?.replaceAll?.(' ', EMPTY_STRING)?.split?.(',') ?? [];
  }

  /**
   * @type {string[]}
   * @readonly
   */
  get buttonText() {
    return this._p_get_data('buttons-text')?.replaceAll?.(', ', ',')?.split?.(',')  ?? [];
  }

  /**
   * @type {string}
   * @readonly
   */
  get groupRole() {
    return this._p_get_data('role') || 'group';
  }

  /**
   * @type {string}
   * @readonly
   * @default 'Groupe de boutons d\'actions'
   */
  get voice() {
    return this._p_get_data('voice') || "Groupe de boutons d'actions"; 
  }

  _p_main() {
    super._p_main();

    this.setAttribute('role', this.groupRole);
    this.setAttribute('aria-label', this.voice);

    this.classList.add('btn-group-vertical');

    for (let index = 0, buttons = this.buttons, len = buttons.length, generated = null; index < len; ++index) {
      generated = HTMLMelButton.CreateNode({ contentsNode:this.createText(this.buttonText[index] ?? buttons[index]) });
      generated.addEventListener('click', this._onButtonClicked.bind(this, buttons[index], index));

      this.appendChild(generated);
      generated = null;
    }
  }

  /**
   * 
   * @param {number} index 
   * @returns {HTMLMelButton}
   */
  getButton(index) {
    return this.children?.[index];
  }

  _onButtonClicked(id, index, event) {
    this.onbuttonclick.call(id, index, event, this.getButton(index), this);
  }

  shadowEnabled() {
    return false;
  }

  /**
   * 
   * @param {*} buttons 
   * @param {*} param1 
   * @returns {HTMLButtonGroup}
   */
  static CreateNode(buttons, {
    texts = [],
    role = 'group',
    voice = "Groupe de boutons d'actions"
  } = {}) {
    let node = document.createElement(this.TAG);

    node.setAttribute('data-buttons', Array.isArray(buttons) ? buttons.join(', ') : buttons);

    if (texts && texts.length) node.setAttribute('data-buttons-text', Array.isArray(texts) ? texts.join(',') : texts);

    node.setAttribute('data-role', role);
    node.setAttribute('data-voice', voice?.replaceAll?.('"', "''") ?? "???");

    return node;
  }

  static get TAG() {
    return 'bnum-button-group';
  }
}

class ButtonGroupEvent extends ABaseMelEvent {
  #_id;
  #_index;
  #_baseEvent;
  #_button;
  constructor(id, index, baseEvent, button, caller) {
    super('button.clicked', caller);

    this.#_id = id;
    this.#_index = index;
    this.#_baseEvent = baseEvent;
    this.#_button = button;
  }

  /**
   * @type {string}
   * @readonly
   */
  get id() {
    return this.#_id;
  }

  /**
   * @type {number}
   * @readonly
   */
  get index() {
    return this.#_index;
  }

  /**
   * @type {Event}
   * @readonly
   */
  get baseEvent() {
    return this.#_baseEvent;
  }

  /**
   * @type {HTMLMelButton}
   * @readonly
   */
  get buttonCaller() {
    return this.#_button;
  }
}

{
  const TAG = HTMLButtonGroup.TAG;
  if (!customElements.get(TAG)) customElements.define(TAG, HTMLButtonGroup);
}
