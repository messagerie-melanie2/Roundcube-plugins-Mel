import { EMPTY_STRING } from '../../../../mel_metapage/js/lib/constants/constants.js';
import { BnumModules } from '../../../../mel_metapage/js/lib/helpers/dynamic_load_modules.js';
import {
  BnumHtmlIcon,
  BnumHtmlSeparate,
  EWebComponentMode,
  HtmlCustomTag,
} from '../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/js_html_base_web_elements.js';
import { PressedButton } from '../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/pressed_button_web_element.js';
import { BnumEvent } from '../../../../mel_metapage/js/lib/mel_events.js';
// import { isNullOrUndefined } from '../../../../mel_metapage/js/lib/mel.js';
import { MelObject } from '../../../../mel_metapage/js/lib/mel_object.js';
import { WorkspaceData } from '../workspaceData.js';
import { WspButton, WspNavigationButton } from './NavbarComponents/button.js';
import { WspNavBarDescription } from './NavbarComponents/components.js';
import { WspPageNavigation } from './NavbarComponents/nav.js';

export { WspNavBar };

/**
 * @enum {Symbol}
 */
const EFileType = {
  script: Symbol(),
  module: Symbol(),
  style: Symbol(),
};

class WspNavBar extends HtmlCustomTag {
  static #actions = [];
  #data = {};
  #pageNavigation = null;

  constructor() {
    super({ mode: EWebComponentMode.div });

    this.onactionclicked = new BnumEvent();
    this.onbuttonclicked = new BnumEvent();
    this.onstatetoggle = new BnumEvent();
    this.onquitbuttonclick = new BnumEvent();
  }

  /**
   * Id de l'espace
   * @type {string}
   * @readonly
   */
  get uid() {
    return this.workspace.uid;
  }

  /**
   * Image de l'espace
   * @type {string}
   * @readonly
   */
  get picture() {
    return this.workspace.logo;
  }

  /**
   * Description de l'espace
   * @type {string}
   * @readonly
   */
  get description() {
    return this.workspace.description;
  }

  /**
   * Titre de l'espace
   * @type {string}
   * @readonly
   */
  get title() {
    return this.workspace.title;
  }

  /**
   * Div principale du shadow-dom
   * @type {HTMLDivElement}
   * @readonly
   */
  get mainDiv() {
    return this.shadowRoot.querySelector(`#${this.id}`);
  }

  /**
   * Id de la div principale du shadow-dom
   * @type {string}
   * @readonly
   * @default `wsp-nav-${this.uid}`
   */
  get id() {
    return `wsp-nav-${this.uid}`;
  }

  /**
   * @type {WspPageNavigation}
   */
  get pageNavigation() {
    return this.#pageNavigation || this.querySelector('bnum-wsp-navigation');
  }

  /**
   * @type {WorkspaceData}
   */
  get workspace() {
    if (!this.#data.workspace) {
      const wsp = this.#_get_data('workspace');
      this.#data.workspace = new WorkspaceData(
        JSON.parse(wsp.replaceAll("¤'¤'", '"')),
      );
    }

    return this.#data.workspace;
  }

  /**
   * @type {{task:string, canBeHidden:boolean}[]}
   */
  get settings() {
    return JSON.parse(this.#_get_data('apps-settings').replaceAll("¤'¤'", '"'));
  }

  _p_main() {
    this.data('shadow', true);

    let shadow = this._p_start_construct();

    this.#_setup_styles().#_setup_scripts().#_setup_modules();

    let div = document.createElement('div');
    div.classList.add('nav', 'melv2-card');
    div.setAttribute('id', this.id);

    shadow.append(div);

    this._generate_back_button()
      ._generate_picture()
      ._generate_title()
      ._generate_description()
      ._generate_block();

    let style = document.createElement('link');
    style.setAttribute('rel', 'stylesheet');
    style.setAttribute('type', 'text/css');
    style.setAttribute(
      'href',
      `plugins/mel_workspace/skins/mel_elastic/navbar.css?v=${BnumModules.VERSION}`,
    );

    shadow.appendChild(style);

    let tmp = new WspPageNavigation({ parent: this, apps: this.settings });
    this.mainDiv.appendChild(tmp);
    tmp.onbuttonclicked.push(
      this.onbuttonclicked.call.bind(this.onbuttonclicked),
    );
    tmp.oniconclicked.push((...args) => {
      this.onstatetoggle.call(...args);
    });
    this.#pageNavigation = tmp;
    tmp = null;

    this._generate_minify_button();
    // top.history.replaceState(
    //   {},
    //   document.title,
    //   MelObject.Empty()
    //     .url('workspace', {
    //       action: 'navbar',
    //       params: {
    //         _uid: 'dev-du-bnum-1',
    //         _force_bnum: 1,
    //       },
    //     })
    //     .replace('is_from', 'rotomeca'),
    // );

    div = null;
    style = null;
    shadow = null;
  }

  _generate_back_button() {
    let button = new WspButton(this, {
      text: 'Retour',
      icon: 'arrow_left_alt',
    });
    button.setAttribute('data-position', 'left');
    button.style.maxWidth = '80px';
    button.style.marginBottom = '15px';
    button.onclick = this.onquitbuttonclick.call.bind(this.onquitbuttonclick);
    button.classList.add('quit-wsp-button');

    this.mainDiv.prepend(button);

    button = null;
    return this;
  }

  _generate_minify_button() {
    let button = PressedButton.Create();
    button.setAttribute('id', 'wsp-nav-minify-expand');
    button.classList.add('transparent-bckg');

    button.ontoggle.push((args, caller_any) => {
      const { newState } = args;
      /**
       * @type {PressedButton}
       */
      let caller = caller_any;

      //Si on minifie
      if (newState) {
        this.addClass('minified');
        caller.querySelector(BnumHtmlIcon.TAG).icon =
          'keyboard_double_arrow_right';
        caller.setAttribute(
          'title',
          "Maximiser la barre de navigation de l'espace.",
        );
      } else {
        this.removeClass('minified');
        caller.querySelector(BnumHtmlIcon.TAG).icon =
          'keyboard_double_arrow_left';
        caller.setAttribute(
          'title',
          "Minimiser la barre de navigation de l'espace.",
        );
      }

      caller = null;
    });

    let icon = BnumHtmlIcon.Create({ icon: 'keyboard_double_arrow_left' });
    button.appendChild(icon);

    this.style.position = 'relative';
    this.mainDiv.appendChild(button);
    icon = null;
    button = null;
    return this;
  }

  _generate_picture() {
    let img = document.createElement('img');
    img.classList.add('picture');
    img.src = this.picture;

    let div = document.createElement('div');
    div.classList.add('picture-container');
    div.append(img);

    const plugin = rcmail.triggerEvent('wsp.navbar.picture', {
      image: img,
      container: div,
      navBar: this,
      append: true,
    }) ?? { append: true };

    if (plugin.append) {
      if (plugin.container) div = plugin.container;
      this.mainDiv.append(div);
    }

    img = null;
    div = null;

    return this;
  }

  _generate_title() {
    let div = document.createElement('div');
    let span = document.createElement('h2');

    div.classList.add('wsp-title-container');
    span.classList.add('wsp-title');

    let titleText = document.createElement('span');
    titleText.appendChild(this.createText(this.title));

    span.appendChild(titleText);

    let button = document.createElement('button');
    button.classList.add(
      'transparent-bckg',
      'shadow-mel-button',
      'margin-left-5',
    );
    button.setAttribute('title', "Copier l'url de l'espace");

    button.onclick = MelObject.Empty().copy_to_clipboard.bind(
      MelObject.Empty(),
      MelObject.Empty()
        .url('workspace', {
          action: 'workspace',
          params: {
            _uid: this.workspace.uid,
            _force_bnum: 1,
          },
        })
        .replace('&_is_from=iframe', EMPTY_STRING),
    );

    let icon = new BnumHtmlIcon('content_copy');
    button.append(icon);

    span.append(button);

    div.append(span);

    const plugin = rcmail.triggerEvent('wsp.navbar.title', {
      buttonCopy: button,
      spanTitle: span,
      container: div,
      navBar: this,
      append: true,
    }) ?? { append: true };

    if (plugin.append) {
      if (plugin.container) div = plugin.container;
      this.mainDiv.appendChild(div);
    }

    span = null;
    div = null;
    icon = null;
    button = null;
    titleText = null;

    return this;
  }

  _generate_description() {
    /**
     * Composant "description" de la barre de navigation
     * @type {WspNavBarDescription}
     * @package
     */
    let description = new WspNavBarDescription({
      parent: this,
    }).setNavBarParent(this);

    const plugin = rcmail.triggerEvent('wsp.navbar.description', {
      description,
      navBar: this,
      append: true,
    }) ?? { append: true };

    if (plugin.append) {
      if (plugin.description) description = plugin.description;
      this.mainDiv.appendChild(description);
    }

    description = null;

    return this;
  }

  _generate_block() {
    let block = document.createElement('div');
    block.style.display = 'flex';
    block.style.flexDirection = 'column';
    block.style.marginTop = '15px';
    block.classList.add('options-containers');

    const plugin = rcmail.triggerEvent('wsp.navbar.button_block', {
      block,
      navBar: this,
      addSeparateAtEnd: true,
      break: false,
    }) ?? { break: false, addSeparateAtEnd: true };

    if (!plugin.break) {
      const items = [
        this._generate_invitation,
        this._generate_join,
        this._generate_start_visio,
        //this._generate_params,
        this._generate_members,
      ];

      /**
       * @type {?WspButton}
       */
      let generated;
      for (const callback of items) {
        generated = callback.call(this);

        if (generated) {
          generated.addEventListener(
            'click',
            this.onactionclicked.call.bind(
              this.onactionclicked,
              generated.getAttribute('data-up-nav'),
            ),
          );

          this.#_try_add(block, generated);
          generated = null;
        }
      }

      if (plugin.addSeparateAtEnd) {
        let separate = new BnumHtmlSeparate({ mode: EWebComponentMode.div });
        separate.style.display = 'block';
        separate.style.opacity = 1;
        separate.style.margin = '20px 30px';

        block.appendChild(separate);
        separate = null;
      }
    }

    if (block) this.mainDiv.appendChild(block);

    block = null;
  }

  #_try_add(node, nodeToAdd) {
    if (nodeToAdd) {
      node.appendChild(nodeToAdd);
      nodeToAdd = null;
    }

    return this;
  }

  _generate_invitation() {
    if (this.workspace.isJoin) {
      let button = new WspButton(this, {
        text: 'Inviter un membre',
        icon: 'person_add',
      });

      button.setAttribute('data-up-nav', 'invitation');

      return button;
    }

    return null;
  }

  _generate_join() {
    if (!this.workspace.isJoin) {
      let button = new WspButton(this, {
        style: WspButton.Style.white,
        text: "Rejoindre l'espace",
        icon: 'add',
      });

      button.setAttribute('data-up-nav', 'join');

      return button;
    }
  }

  _generate_start_visio() {
    if (
      this.workspace.isJoin &&
      ((this.workspace.isPublic && this.workspace.isAdmin) ||
        !this.workspace.isPublic) &&
      rcmail.env.plugin_list_visio === true
    ) {
      let button = new WspButton(this, {
        style: WspButton.Style.white,
        text: 'Commencer une visioconférence',
        icon: 'videocam',
      });

      button.setAttribute('data-up-nav', 'visio');

      return button;
    }
  }

  _generate_params() {
    if (this.workspace.isJoin && this.workspace.isAdmin) {
      let button = new WspButton(this, {
        style: WspButton.Style.white,
        text: 'Paramètres',
        icon: 'settings',
      });

      button.setAttribute('data-up-nav', 'settings');

      return button;
    }
  }

  _generate_members() {
    if (this.workspace.isJoin && !this.workspace.isAdmin) {
      let button = new WspButton(this, {
        style: WspButton.Style.white,
        text: 'Voir les membres',
        icon: 'info',
      });

      return button;
    }
  }

  #_get_data(data) {
    if (!this.#data[data]) {
      this.#data[data] =
        this.dataset[data] ?? this.getAttribute(`data-${data}`);
      this.removeAttribute(`data-${data}`);
    }

    return this.#data[data];
  }

  #_generate_script(file, { module = false } = {}) {
    let script = document.createElement('script');

    if (module) file += `?v=${BnumModules.VERSION}`;

    script.src = file;

    if (module) script.setAttribute('type', 'module');

    return script;
  }

  #_generate_css(file) {
    let css = document.createElement('link');
    css.setAttribute('rel', 'stylesheet');
    css.setAttribute('type', 'text/css');
    css.setAttribute('href', file);

    return css;
  }

  #_setup_modules() {
    return this.#_setup_files_type(EFileType.module);
  }

  #_setup_scripts() {
    return this.#_setup_files_type(EFileType.script);
  }

  /**
   *
   * @param {EFileType} type
   */
  #_setup_files_type(type) {
    let dataset = null;

    switch (type) {
      case EFileType.module:
        dataset = 'modules';
        break;

      case EFileType.script:
        dataset = 'scripts';
        break;

      case EFileType.style:
        dataset = 'css';
        break;

      default:
        throw new Error('Type non pris en charge');
    }

    const data = (this.data(dataset) ?? EMPTY_STRING)
      .replaceAll(' ', EMPTY_STRING)
      .split(',');

    this.removeAttribute(`data-${dataset}`);

    if (data.length > 0) {
      let generated;
      for (const element of data) {
        if (element === '' || !element) continue;

        switch (type) {
          case EFileType.module:
            generated = this.#_generate_script(element, { module: true });
            break;

          case EFileType.script:
            generated = this.#_generate_script(element, { module: false });
            break;

          case EFileType.style:
            generated = this.#_generate_css(element);
            break;

          default:
            throw new Error('Type non pris en charge');
        }

        this.shadowRoot.append(generated);
        generated = null;
      }
    }

    return this;
  }

  #_setup_styles() {
    return this.#_setup_files_type(EFileType.style);
  }

  hide() {
    this.style.display = 'none';
  }

  show() {
    this.style.display = EMPTY_STRING;
  }

  select(task, { background = true } = {}) {
    this.pageNavigation.select(task, { background });
    return this;
  }

  unselect({ task = 'all', background = true } = {}) {
    this.pageNavigation.unselect({ task, background });
    return this;
  }

  static AddActions(action) {
    this.#actions.push(action);
  }

  static CreateElement({ nav = document, workspace = null } = {}) {
    let node = nav.createElement('bnum-wsp-nav');

    if (workspace) {
      if (typeof workspace !== 'string')
        workspace = JSON.stringify(workspace).replaceAll('"', "¤'¤'");

      node.setAttribute('data-workspace', workspace);
    }

    return node;
  }

  static CreateElementFromData(
    uid,
    title,
    description,
    picture,
    { nav = document } = {},
  ) {
    return this.CreateElement({
      nav,
      workspace: { uid, title, description, picture },
    });
  }
}

{
  const TAG = 'bnum-wsp-nav';
  if (!customElements.get(TAG)) customElements.define(TAG, WspNavBar);
}
