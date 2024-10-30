import {
  BnumHtmlSrOnly,
  EWebComponentMode,
} from '../../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/js_html_base_web_elements.js';
import { PressedButton } from '../../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/pressed_button_web_element.js';
import { BnumEvent } from '../../../../../mel_metapage/js/lib/mel_events.js';
import { NavBarComponent } from './base.js';
import { WspNavigationButton } from './button.js';

const NAMESPACE = 'wsp-page-nav';
export class WspPageNavigation extends NavBarComponent {
  #apps = null;
  #id = null;

  constructor({ parent = null, apps = null } = {}) {
    super({ mode: EWebComponentMode.div, parent });

    this.#apps = apps ?? [
      'home',
      'calendar',
      'stockage',
      'forum',
      'wekan',
      'useful_link',
      'tchap',
    ];
    this.#id = this.generateId(NAMESPACE);
    this.onbuttonclicked = new BnumEvent();
  }

  get applications() {
    if (!this.#apps) {
      let apps = this.data('apps');
      apps = JSON.parse(apps);
      this.#apps = apps;
    }

    if (this.hasAttribute('data-apps')) this.removeAttribute('data-apps');

    return this.#apps;
  }

  get nav() {
    return this.querySelector(`#${this.#id}`);
  }

  _p_main() {
    super._p_main();

    const voiceId = this.generateId(NAMESPACE);

    let nav = document.createElement('ul');
    let voice = new BnumHtmlSrOnly();

    nav.setAttribute('id', this.#id);
    nav.setAttribute('role', 'menu');
    nav.setAttribute('aria-labelledBy', voiceId);
    voice.setAttribute('id', voiceId);

    this.append(voice, nav);

    this._generate_nav();

    voice = null;
    nav = null;
  }

  _generate_nav() {
    const plugins = rcmail.triggerEvent('wsp.navbar.navigation', {
      caller: this,
      apps: this.applications,
      break: false,
    }) ?? { apps: this.applications, break: false };

    for (const app of plugins.apps) {
      if (app) this.#_generate_element(app);
    }
  }

  #_generate_element(task) {
    let li = document.createElement('li');
    li.setAttribute('role', 'presentation');

    let button = new WspNavigationButton(this, {
      text: `mel_metapage.${task}`,
    });
    button.onbuttonclick.push(
      this.onbuttonclicked.call.bind(this.onbuttonclicked),
      task,
    );
    button.setAttribute('role', 'menuitem');
    button.setAttribute('data-task', task);

    li.appendChild(button);
    this.nav.appendChild(li);

    li = null;
    button = null;
  }

  select(task, { background = true } = {}) {
    this.unselect();
    /**
     * @type {PressedButton}
     */
    let button = this.querySelector(
      `[data-task="${task}"] ${PressedButton.TAG}.left-button`,
    );
    if (background) button.select();
    else button.press();

    button = null;

    return this;
  }

  unselect({ task = 'all', background = true } = {}) {
    if (!task || task === 'all') {
      let selected = this.querySelectorAll('[data-task]');

      for (const element of selected) {
        this.unselect({ task: element.dataset.task, background });
      }

      selected = null;
    } else {
      /**
       * @type {PressedButton}
       */
      let button = this.querySelector(
        `[data-task="${task}"] ${PressedButton.TAG}.left-button`,
      );
      if (background) button.unselect();
      else button.unpress();

      button = null;
    }

    return this;
  }
}

{
  const TAG = 'bnum-wsp-navigation';
  if (!customElements.get(TAG)) customElements.define(TAG, WspPageNavigation);
}
