import { EMPTY_STRING } from '../../../../constants/constants.js';
import { BnumEvent } from '../../../../mel_events.js';
import { html_events } from '../../../html_events.js';
import HTMLBnumButton from '../button/HTMLBnumButton.js';
import {
  EWebComponentMode,
  HtmlCustomDataTag,
} from '../js_html_base_web_elements.js';

/**
 * @class
 * @classdesc Visxualise un évènement
 * @extends HtmlCustomDataTag
 */
export default class HTMLEventVisualiser extends HtmlCustomDataTag {
  #_event;
  constructor() {
    super({ mode: EWebComponentMode.div });
    /**
     * Fonctionnement custom du clique sur un évènement
     * @type {BnumEvent<(args: { date: Date, source: string, event: any }) => void>}
     * @event
     */
    this.oncustomswitch = new BnumEvent();
    this.oncustomswitch.add('default', (args) => {
      this.dispatchEvent(
        new CustomEvent('event:custom:click', { detail: args }),
      );
    });
  }

  /**
   * @readonly
   * @type {boolean}
   */
  get customSwitch() {
    return ['1', 1, true, 'true'].includes(this._p_get_data('custom-switch'));
  }

  _p_main() {
    super._p_main();

    if (this.#_event) this.#_loadEvent();
  }

  /**
   * Visualise un évènement
   * @param {*} event
   * @returns {this}
   */
  setEvent(event) {
    this.#_event = event;

    if (this.elementLoaded) this.#_loadEvent();
    return this;
  }

  /**
   * Charge l'évènement et l'affiche
   * @private
   */
  #_loadEvent() {
    this.innerText = EMPTY_STRING;
    // eslint-disable-next-line new-cap
    let html = new html_events(this.#_event);
    if (this.customSwitch) {
      html.onaction.add(
        'events',
        /**
         * @param {HTMLEventVisualiser} visualiser
         * @this {html_events}
         */
        function (visualiser) {
          const date = this.date;
          const source = this.event.calendar;
          const event = this.event;

          visualiser.oncustomswitch.call({ date, source, event });
        }.bind(html, this),
      );
    }
    this.appendChild(html.generate()[0]);
    HTMLBnumButton.ToButton(this.querySelector('.melv2-event-clickable'));
  }

  /**
   * Créer une node
   * @param {*} event Evènement de l'agenda
   * @param {Object} [param1={}]
   * @param {?(args: { date: Date, source: string, event: any }) => void} [param1.customClick=null]
   * @returns {HTMLEventVisualiser}
   * @static
   */
  static CreateNode(event, { customClick = null } = {}) {
    let node = document.createElement(this.TAG);

    if (customClick) {
      node.setAttribute('data-custom-switch', true);
      node.addEventListener('event:custom:click', customClick);
    }

    return node.setEvent(event);
  }

  /**
   * @readonly
   * @type {string}
   * @static
   */
  static get TAG() {
    return 'bnum-event-visualiser';
  }
}

HTMLEventVisualiser.TryDefine(HTMLEventVisualiser.TAG, HTMLEventVisualiser);
