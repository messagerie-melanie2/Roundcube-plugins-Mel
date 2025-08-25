import { MelEnumerable } from '../../../../../mel_metapage/js/lib/classes/enum.js';
import { FramesManager } from '../../../../../mel_metapage/js/lib/classes/frame_manager.js';
import { MainNav } from '../../../../../mel_metapage/js/lib/classes/main_nav.js';
import {
  BnumHtmlIcon,
  BnumHtmlSrOnly,
  EWebComponentMode,
} from '../../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/js_html_base_web_elements.js';
import { PressedButton } from '../../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/pressed_button_web_element.js';
import { BnumEvent } from '../../../../../mel_metapage/js/lib/mel_events.js';
import { NavBarComponent } from './base.js';
import { WspNavigationButton } from './button.js';

/**
 * Namespace utilisé pour générer des identifiants uniques dans le composant de navigation.
 * @type {string}
 * @constant
 * @package
 */
const NAMESPACE = 'wsp-page-nav';

/**
 * Composant de navigation principal pour la barre de navigation de l'espace de travail.
 * @class
 * @extends NavBarComponent
 */
export class WspPageNavigation extends NavBarComponent {
  /**
   * Liste des applications à afficher dans la navigation.
   * @type {?Array<Object>}
   * @private
   */
  #apps = null;

  /**
   * Identifiant unique du composant de navigation.
   * @type {?string}
   * @private
   */
  #id = null;

  /**
   * Crée une nouvelle instance de WspPageNavigation.
   * @constructor
   */
  constructor() {
    super({ mode: EWebComponentMode.div, parent });
    this.#id = this.generateId(NAMESPACE);
    /**
     * Événement déclenché lors du clic sur un bouton de navigation.
     * @type {BnumEvent}
     */
    this.onbuttonclicked = new BnumEvent();
    /**
     * Événement déclenché lors du clic sur une icône de navigation.
     * @type {BnumEvent}
     */
    this.oniconclicked = new BnumEvent();
  }

  /**
   * Retourne la liste des applications à afficher dans la navigation.
   * @returns {Array<Object<string, any>>}
   */
  get applications() {
    if (!this.#apps) {
      let apps = this.data('apps');
      apps = JSON.parse(apps);
      this.#apps = apps;
    }

    if (this.hasAttribute('data-apps')) this.removeAttribute('data-apps');

    return this.#apps;
  }

  /**
   * Retourne l'élément DOM de la navigation.
   * @returns {HTMLElement}
   */
  get nav() {
    return this.querySelector(`#${this.#id}`);
  }

  /**
   * Initialise le composant principal.
   * @protected
   */
  _p_main() {
    super._p_main();

    const voiceId = this.generateId(NAMESPACE);

    let nav = document.createElement('ul');
    let voice = BnumHtmlSrOnly.Create();

    nav.setAttribute('id', this.#id);
    nav.setAttribute('role', 'menu');
    nav.setAttribute('aria-labelledBy', voiceId);
    voice.setAttribute('id', voiceId);

    this.append(voice, nav);

    this._generate_nav();

    voice = null;
    nav = null;
  }

  /**
   * Génère la structure de la navigation à partir des applications.
   * @private
   */
  _generate_nav() {
    const plugins = rcmail.triggerEvent('wsp.navbar.navigation', {
      caller: this,
      apps: this.applications,
      break: false,
    }) ?? { apps: this.applications, break: false };

    for (const app of MelEnumerable.from(plugins.apps).orderBy(
      (x) => x.order ?? Infinity,
    )) {
      if (app) this.#_generate_element(app);
    }
  }

  /**
   * Génère un élément de navigation pour une application donnée.
   * @param {Object} obj - Objet application à afficher.
   * @private
   */
  #_generate_element(obj) {
    const { task: taskData, canBeHidden, icon } = obj;
    const [plugin, task] = taskData.includes('.')
      ? taskData.split('.')
      : ['mel_workspace', taskData];

    let li = document.createElement('li');
    li.setAttribute('role', 'presentation');

    const text = FramesManager.Instance.get_frame('workspace', {
      jquery: false,
    }).contentWindow.rcmail.gettext(`${plugin}.${task}`);

    let button = WspNavigationButton.Create({
      parent: this,
      startingPressedState: ['true', true].includes(
        this.parent.startingStates[task],
      ),
      text,
    });
    button.classList.add('not-busy-only');
    button.onbuttonclick.push(
      this.onbuttonclicked.call.bind(this.onbuttonclicked),
      task,
    );
    button.oniconclicked.push(
      this.oniconclicked.call.bind(this.oniconclicked),
      task,
    );
    button.setAttribute('role', 'menuitem');
    button.setAttribute('data-task', task);

    button.setAttribute('data-can-be-hidden', canBeHidden);

    let hiddenIcon = null;
    if (icon !== ':nav:') {
      hiddenIcon = BnumHtmlIcon.Create({ icon });
    } else {
      hiddenIcon = document.createElement('span');
      hiddenIcon.classList.add(`${task}-computed-icon`, 'computed-icon');
      const { content: taskIcon, font } = MainNav.get_icon_data(task);
      let style = this.parent.querySelector('style');

      if (!style) {
        style = document.createElement('style');
        this.parent.navigator.appendChild(style);
      }

      style.appendChild(
        this.createText(`
        .${task}-computed-icon::before {
          content: "\\${taskIcon}";
          font-family:${font};
        }
        `),
      );

      style = null;
    }

    hiddenIcon.classList.add('maximised-hidden');
    button.afterstyle.push((icon, button) => {
      button.prepend(icon);
    }, hiddenIcon);

    li.appendChild(button);
    this.nav.appendChild(li);

    li = null;
    button = null;
    hiddenIcon = null;
  }

  /**
   * Sélectionne un bouton de navigation selon la tâche.
   * @param {string} task - Nom de la tâche à sélectionner.
   * @param {Object} [options] - Options de sélection.
   * @param {boolean} [options.background=true] - Sélection en arrière-plan.
   * @returns {WspPageNavigation}
   */
  select(task, { background = true } = {}) {
    this.unselect();

    switch (task) {
      case 'settings':
        task = 'workspace_params';
        break;

      case 'more':
        task = 'workspace_user';
        break;

      default:
        break;
    }

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

  /**
   * Désélectionne un ou plusieurs boutons de navigation.
   * @param {Object} [options]
   * @param {string} [options.task='all'] - Tâche à désélectionner ou 'all' pour tout.
   * @param {boolean} [options.background=true] - Désélection en arrière-plan.
   * @returns {WspPageNavigation}
   */
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

  /**
   * Crée une nouvelle instance du composant de navigation.
   * @param {Object} [param0]
   * @param {HTMLElement} [param0.parent=null] - Élément parent.
   * @param {Array<Object>} [param0.apps=null] - Liste des applications.
   * @returns {WspPageNavigation}
   * @static
   */
  static Create({ parent = null, apps = null } = {}) {
    let node = document.createElement(this.TAG);
    if (parent) node.setNavBarParent(parent);
    if (apps) node.setAttribute('data-apps', JSON.stringify(apps));

    return node;
  }

  /**
   * Tag HTML du composant.
   * @readonly
   * @static
   * @returns {string}
   */
  static get TAG() {
    return 'bnum-wsp-navigation';
  }
}

{
  const TAG = 'bnum-wsp-navigation';
  if (!customElements.get(TAG)) customElements.define(TAG, WspPageNavigation);
}
