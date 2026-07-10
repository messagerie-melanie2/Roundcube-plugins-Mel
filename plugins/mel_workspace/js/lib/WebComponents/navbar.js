/* eslint-disable quotes */
import { HTMLBnumButton } from '../../../../../skins/mel_elastic/design-system/ds-module-bnum.js';
import { HTMLBnumPrimaryButton } from '../../../../../skins/mel_elastic/design-system/ds-module-bnum.js';
import { HTMLBnumToggleButton } from '../../../../../skins/mel_elastic/design-system/ds-module-bnum.js';
import { HTMLBnumDangerButton } from '../../../../../skins/mel_elastic/design-system/ds-module-bnum.js';
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
import { MelObject } from '../../../../mel_metapage/js/lib/mel_object.js';
import { WorkspaceData } from '../program/workspaceData.js';
import { WspButton } from './NavbarComponents/button.js';
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

/**
 * Web component de la barre de navigation d'un espace de travail (workspace).
 *
 * Affiche l'image, le titre, la description et les actions disponibles
 * (inviter, rejoindre, envoyer un message, visioconférence, etc.) selon les
 * droits de l'utilisateur sur l'espace, ainsi que la navigation entre les
 * applications de l'espace via {@link WspPageNavigation}.
 */
class WspNavBar extends HtmlCustomTag {
  /** @type {Array} Actions enregistrées globalement pour toutes les instances */
  static #actions = [];
  /** @type {Object} Cache interne des données lues depuis les attributs `data-*` */
  #data = {};
  /** @type {?WspPageNavigation} Instance du composant de navigation entre applications */
  #pageNavigation = null;

  /**
   * Initialise le composant et ses événements exposés.
   */
  constructor() {
    super({ mode: EWebComponentMode.div });

    this.onactionclicked = new BnumEvent();
    this.onbuttonclicked = new BnumEvent();
    this.onstatetoggle = new BnumEvent();
    this.onquitbuttonclick = new BnumEvent();
    this.onuserrequested = new BnumEvent();
    this.onuserchanged = new BnumEvent();
  }

  /**
   * Utilisateurs de l'espace, obtenus en délégant à l'écouteur de
   * {@link WspNavBar#onuserrequested}.
   * @type {Object}
   * @readonly
   */
  get users() {
    return this.onuserrequested.call() || {};
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
   */
  get picture() {
    return this.workspace.logo;
  }

  set picture(value) {
    this.workspace.logo = value;

    let src = this.navigator.querySelector('.picture-container img');
    src.setAttribute('src', value);

    src = null;
  }

  /**
   * Description de l'espace
   * @type {string}
   */
  get description() {
    return this.workspace.description;
  }

  set description(value) {
    this.workspace.description = value;

    let newDesc = WspNavBarDescription.Create({
      description: value,
      parent: this,
    });

    let desc = this.navigator.querySelector('bnum-wsp-nav-description');
    desc.replaceWith(newDesc);

    desc = null;
    newDesc = null;
  }

  /**
   * Titre de l'espace
   * @type {string}
   */
  get title() {
    return this.workspace.title;
  }

  set title(value) {
    this.workspace.title = value;

    let title = this.navigator.querySelector('.wsp-title');
    title.textContent = value;
    title = null;

    title = this.navigator.querySelector('.picture-container div');

    if (title) {
      title.textContent = value.slice(0, 3).toUpperCase();
      title = null;
    }
  }

  /**
   * Hashtag (thématique) de l'espace.
   * @type {string}
   */
  get hashtag() {
    return this.workspace.hashtag;
  }

  set hashtag(value) {
    this.workspace.hashtag = value;

    let hashtag = this.navigator.querySelector('.hashtag');
    hashtag.textContent = `#${value}`;
    hashtag.setAttribute('title', `#${value} - Thématique de l'espace`);

    hashtag = null;
  }

  /**
   * Couleur associée à l'espace, appliquée à tous les éléments `.colored`
   * du composant (image par défaut, etc.).
   * @type {string}
   */
  get color() {
    return this.workspace.color;
  }

  set color(value) {
    this.workspace.color = value;

    const querry = this.mainDiv.querySelectorAll('.colored');

    if (querry && querry.length) {
      for (const element of querry) {
        element.style.backgroundColor = value;
      }
    }
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
   * Composant de navigation entre les applications de l'espace.
   * @type {WspPageNavigation}
   * @readonly
   */
  get pageNavigation() {
    return this.#pageNavigation || this.querySelector('bnum-wsp-navigation');
  }

  /**
   * Données de l'espace de travail, décodées à la demande depuis
   * l'attribut `data-workspace` (JSON encodé avec un échappement particulier
   * des guillemets, voir {@link WspNavBar.CreateElement}).
   * @type {WorkspaceData}
   * @readonly
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
   * Paramètres des applications de l'espace (tâches disponibles et
   * possibilité de les masquer), décodés depuis l'attribut `data-apps-settings`.
   * @type {{task:string, canBeHidden:boolean}[]}
   * @readonly
   */
  get settings() {
    return JSON.parse(
      (this.#_get_data('apps-settings') || JSON.stringify([])).replaceAll(
        "¤'¤'",
        '"',
      ),
    );
  }

  /**
   * @type {string}
   * @readonly
   */
  get currentTask() {
    return this.navigator
      .querySelector('bnum-wsp-navigation-button[aria-pressed="true"]')
      .getAttribute('data-task');
  }

  /**
   * Construit le shadow-dom de la barre de navigation : styles, scripts et
   * modules déclarés en attributs, bouton retour, image, titre, description,
   * blocs d'actions, navigation entre applications et bouton de réduction.
   * Appelée par {@link HtmlCustomTag} lors de la connexion du composant au DOM.
   */
  _p_main() {
    // this.attachInternals().states.add('can-be-busy');
    this.classList.add('can-be-busy');
    this.data('shadow', true);

    let shadow = this._p_start_construct();
    this.#_setup_styles().#_setup_scripts().#_setup_modules();

    let div = document.createElement('div');
    div.classList.add('nav', 'melv2-card');
    div.setAttribute('id', this.id);
    div.style.display = 'none';

    shadow.append(div);

    this._generate_picture()
      ._generate_title()
      ._generate_description()
      ._generate_block();

    let tmp = WspPageNavigation.Create({ parent: this, apps: this.settings });
    this.mainDiv.appendChild(tmp);
    tmp.onbuttonclicked.push(
      this.onbuttonclicked.call.bind(this.onbuttonclicked),
    );
    tmp.oniconclicked.push((...args) => {
      this.onstatetoggle.call(...args);
    });
    this.#pageNavigation = tmp;
    tmp = null;

    this._generate_minify_button()._generate_back_button();

    div.style.display = null;
    div = null;
    //style = null;
    shadow = null;
  }

  /**
   * Génère le bouton de retour affiché en haut de la barre de navigation.
   * @returns {WspNavBar} L'instance courante, pour chaînage.
   */
  _generate_back_button() {
    // let button = WspButton.Create({
    //   parent: this,
    //   text: 'Retour',
    //   icon: 'arrow_left_alt',
    // });
    // button.setAttribute('id', 'wsp-quit-button');
    // button.setAttribute('data-position', 'left');
    // button.style.maxWidth = '80px';
    // button.style.marginBottom = '15px';
    // button.onclick = this.onquitbuttonclick.call.bind(this.onquitbuttonclick);
    // button.classList.add('quit-wsp-button', 'white');
    const button = HTMLBnumDangerButton.Create({
      text: 'Revenir aux espaces',
      icon: 'arrow_back',
      iconPos: 'left',
      hideOn: 'touch',
    });
    button.setAttribute('id', 'wsp-quit-button');
    button.addEventListener(
      'click',
      this.onquitbuttonclick.call.bind(this.onquitbuttonclick),
    );

    this.mainDiv.appendChild(button);
    return this;
  }

  /**
   * Génère le bouton permettant de réduire/étendre la barre de navigation
   * et bascule la classe `minified` sur le composant selon son état.
   * @returns {WspNavBar} L'instance courante, pour chaînage.
   */
  _generate_minify_button() {
    const button = HTMLBnumToggleButton.Create({
      variation: 'secondary',
      iconMargin: '0',
      icon: 'keyboard_double_arrow_left',
      rounded: true,
    }).attr('id', 'wsp-nav-minify-expand');

    button.onpressedchange.push((pressed) => {
      if (pressed) {
        this.addClass('minified');
        button.icon = 'keyboard_double_arrow_right';
        button.setAttribute(
          'title',
          "Maximiser la barre de navigation de l'espace.",
        );
      } else {
        this.removeClass('minified');
        button.icon = 'keyboard_double_arrow_left';
        button.setAttribute(
          'title',
          "Minimiser la barre de navigation de l'espace.",
        );
      }
    });

    this.style.position = 'relative';
    this.mainDiv.appendChild(button);
    return this;
  }

  /**
   * Génère l'image de l'espace ; en cas d'échec de chargement, affiche à la
   * place un badge coloré avec les initiales du titre de l'espace. Émet
   * l'événement `wsp.navbar.picture` pour permettre à d'autres plugins de
   * remplacer ou d'annuler l'ajout du conteneur.
   * @returns {WspNavBar} L'instance courante, pour chaînage.
   */
  _generate_picture() {
    let img = document.createElement('img');
    img.classList.add('picture');
    img.onload = () => {
      let picture = this.navigator.querySelector('.picture-container img');
      let text = this.navigator.querySelector('.picture-container div');

      if (text) text.remove();

      picture.style.display = null;

      picture = null;
      text = null;
    };
    img.onerror = () => {
      let picture = this.navigator.querySelector('.picture-container img');
      let text = this.navigator.querySelector('.picture-container div');

      picture.style.display = 'none';

      if (!text) {
        text = this.navigator.querySelector('.picture-container');
        let span = document.createElement('div');
        span.classList.add('no-picture', 'colored');
        span.style.backgroundColor = this.workspace.color;

        //Génération de la couleur du texte
        {
          const rgb_1 = mel_metapage.Functions.colors.kMel_extractRGB(
            this.workspace.color,
          );
          const rgb_2 =
            mel_metapage.Functions.colors.kMel_extractRGB('#000000');

          if (
            mel_metapage.Functions.colors.kMel_LuminanceRatioAAA(rgb_1, rgb_2)
          )
            span.style.color = '#000000';
          else span.style.color = '#FFFFFF';
        }

        span.appendChild(this.createText(this.title.slice(0, 3).toUpperCase()));

        text.appendChild(span);
        span = null;
      }

      picture = null;
      text = null;
    };
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

  /**
   * Génère le titre de l'espace ainsi que le bouton de copie de son URL.
   * Émet l'événement `wsp.navbar.title` pour permettre à d'autres plugins de
   * remplacer ou d'annuler l'ajout du conteneur.
   * @returns {WspNavBar} L'instance courante, pour chaînage.
   */
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
      MelObject,
      MelObject.Url('workspace', {
        params: {
          _uid: this.workspace.uid,
        },
      }).replace('&_is_from=iframe', EMPTY_STRING),
      { text: "L'url de l'espace a bien été copié !" },
    );

    let icon = BnumHtmlIcon.Create('content_copy');
    button.append(icon);

    // span.append(button);

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

  /**
   * Génère le composant de description de l'espace. Émet l'événement
   * `wsp.navbar.description` pour permettre à d'autres plugins de remplacer
   * ou d'annuler son ajout.
   * @returns {WspNavBar} L'instance courante, pour chaînage.
   */
  _generate_description() {
    /**
     * Composant "description" de la barre de navigation
     * @type {WspNavBarDescription}
     * @package
     */
    let description = WspNavBarDescription.Create({
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

  /**
   * Génère le hashtag (thématique) de l'espace s'il en possède un.
   * @returns {WspNavBar} L'instance courante, pour chaînage.
   */
  _generate_hashtag() {
    if (this.workspace.hashtag || false) {
      let hashtag = document.createElement('span');
      hashtag.classList.add('hashtag');
      hashtag.setAttribute(
        'title',
        `#${this.workspace.hashtag} - Thématique de l'espace`,
      );

      hashtag.appendChild(this.createText(`#${this.workspace.hashtag}`));

      this.shadowRoot.appendChild(hashtag);

      hashtag = null;
    }

    return this;
  }

  /**
   * Génère le bloc de boutons d'action de l'espace (envoyer un message,
   * inviter, rejoindre, visioconférence...) et relaie leurs clics via
   * {@link WspNavBar#onactionclicked}. Émet l'événement
   * `wsp.navbar.button_block` pour permettre à d'autres plugins d'empêcher
   * la génération par défaut ou de retirer le séparateur final.
   */
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
        this._generate_send,
        this._generate_invitation,
        this._generate_join,
        this._generate_start_visio,
        // this._generate_leave,
        //this._generate_params,
        //this._generate_members,
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
        let separate = BnumHtmlSeparate.Create();
        separate.style.display = 'block';
        separate.style.opacity = 1;
        separate.style.margin = '20px 30px';

        block.appendChild(separate);
        separate = null;
      }
    }

    if (block) this.mainDiv.appendChild(block);

    block = null;

    return this;
  }

  /**
   * Ajoute `nodeToAdd` à `node` s'il est défini.
   * @param {HTMLElement} node - Élément parent recevant l'ajout.
   * @param {?HTMLElement} nodeToAdd - Élément à ajouter, ignoré si `null`.
   * @returns {WspNavBar} L'instance courante, pour chaînage.
   */
  #_try_add(node, nodeToAdd) {
    if (nodeToAdd) {
      node.appendChild(nodeToAdd);
      nodeToAdd = null;
    }

    return this;
  }

  /**
   * Génère le bouton d'invitation d'un membre, réservé aux administrateurs
   * d'un espace déjà rejoint.
   * @returns {?WspButton} Le bouton généré, ou `null` si non applicable.
   */
  _generate_invitation() {
    if (this.workspace.isJoin && this.workspace.isAdmin) {
      return this.#_generateButton({
        text: 'Inviter un membre',
        icon: 'person_add',
        dataUpNav: 'invitation',
      });
    }

    return null;
  }

  /**
   * Génère le bouton permettant de quitter l'espace, sauf si l'utilisateur
   * est l'unique administrateur restant.
   * @returns {?WspButton} Le bouton généré, ou `null` si non applicable.
   */
  _generate_leave() {
    if (
      this.workspace.isJoin &&
      !(this.workspace.isAdmin && this.workspace.isAdminAlone)
    ) {
      let button = WspButton.Create({
        parent: this,
        // eslint-disable-next-line quotes
        text: "Quitter l'espace",
        icon: 'logout',
      });

      button.setAttribute('data-up-nav', 'leave');

      return button;
    }

    return null;
  }

  /**
   * Génère le bouton permettant de rejoindre l'espace, affiché uniquement
   * si l'utilisateur ne l'a pas encore rejoint.
   * @returns {?WspButton} Le bouton généré, ou `undefined` si non applicable.
   */
  _generate_join() {
    if (!this.workspace.isJoin) {
      return this.#_generateButton({
        // eslint-disable-next-line quotes
        text: "Rejoindre l'espace",
        icon: 'add',
        dataUpNav: 'join',
      });
    }
  }

  /**
   * Génère un bouton d'action de la barre de navigation, stylé via le design
   * system bnum (`HTMLBnumButton`).
   * @param {Object} options - Options de génération du bouton.
   * @param {string} options.text - Texte affiché sur le bouton.
   * @param {string} options.icon - Icône associée au bouton.
   * @param {string} options.dataUpNav - Valeur de l'attribut `data-up-nav`, utilisée pour identifier l'action au clic.
   * @param {string} [options.variation='primary'] - Variation visuelle du bouton (`primary`, `secondary`, etc.).
   * @returns {HTMLBnumButton} Le bouton généré.
   */
  #_generateButton({ text, icon, dataUpNav, variation = 'primary' }) {
    return HTMLBnumButton.Create({
      text,
      icon,
      variation,
      hideOn: 'touch',
    })
      .attr('data-up-nav', dataUpNav)
      .addClass('wsp-action-button');
  }

  /**
   * Génère le bouton d'envoi d'un message aux participants, désactivé si
   * l'espace ne compte pas au moins deux membres.
   * @returns {?WspButton} Le bouton généré, ou `undefined` si non applicable.
   */
  _generate_send() {
    if (this.workspace.isJoin && !this.workspace.isPublic) {
      // let button = WspButton.Create({
      //   parent: this,
      //   style: WspButton.Style.classic,
      //   text: 'Ecrire aux participants',
      //   icon: 'mail',
      // });
      const button = this.#_generateButton({
        text: 'Ecrire aux participants',
        icon: 'mail',
        dataUpNav: 'send',
      });

      if (!this.users?.emails || this.users.emails.length <= 1)
        button.attrs({
          disable: 'disabled',
          'aria-disabled': true,
        });

      return button;
    }
  }

  /**
   * Active ou désactive le bouton d'envoi de message selon le nombre actuel
   * de participants de l'espace.
   * @returns {WspNavBar} L'instance courante, pour chaînage.
   */
  tryUpdateSendButton() {
    let button = this.mainDiv.querySelector('[data-up-nav="send"]');

    if (button) {
      if (!this.users?.emails || this.users.emails.length <= 1)
        button.disable();
      else button.enable();
    }

    return this;
  }

  /**
   * Génère le bouton de démarrage d'une visioconférence, si le plugin de
   * visio est actif et que l'utilisateur a le droit de démarrer un appel
   * (admin sur un espace public, ou tout membre sur un espace privé).
   * @returns {?WspButton} Le bouton généré, ou `undefined` si non applicable.
   */
  _generate_start_visio() {
    if (
      this.workspace.isJoin &&
      ((this.workspace.isPublic && this.workspace.isAdmin) ||
        !this.workspace.isPublic) &&
      rcmail.env.plugin_list_visio === true
    ) {
      return this.#_generateButton({
        text: 'Visioconférence',
        icon: 'videocam',
        dataUpNav: 'visio',
        variation: 'secondary',
      });
    }
  }

  /**
   * Génère le bouton d'accès aux paramètres de l'espace, réservé aux
   * administrateurs d'un espace déjà rejoint.
   * @returns {?WspButton} Le bouton généré, ou `null` si non applicable.
   */
  _generate_params() {
    if (this.workspace.isJoin && this.workspace.isAdmin) {
      let button = WspButton.Create({
        parent: this,
        style: WspButton.Style.white,
        text: 'Paramètres',
        icon: 'settings',
      });

      button.setAttribute('data-up-nav', 'settings');

      return button;
    }
  }

  /**
   * Génère le bouton permettant de consulter la liste des membres,
   * affiché uniquement pour les membres non administrateurs.
   * @returns {?WspButton} Le bouton généré, ou `null` si non applicable.
   */
  _generate_members() {
    if (this.workspace.isJoin && !this.workspace.isAdmin) {
      let button = WspButton.Create({
        parent: this,
        style: WspButton.Style.white,
        text: 'Voir les membres',
        icon: 'info',
      });

      return button;
    }
  }

  /**
   * Lit et met en cache la valeur d'un attribut `data-*` du composant, puis
   * retire l'attribut source du DOM.
   * @param {string} data - Nom de la donnée (sans le préfixe `data-`).
   * @returns {?string} Valeur trouvée, ou `null`/`undefined` si absente.
   */
  #_get_data(data) {
    if (!this.#data[data]) {
      this.#data[data] =
        this.dataset[data] ?? this.getAttribute(`data-${data}`);
      this.removeAttribute(`data-${data}`);
    }

    return this.#data[data];
  }

  /**
   * Crée un élément `<script>` pointant vers le fichier donné.
   * @param {string} file - Chemin du script à charger.
   * @param {{module?: boolean}} [options] - Si `module` est vrai, le script
   * est chargé en tant que module ESM avec un paramètre de cache-busting.
   * @returns {HTMLScriptElement} L'élément `<script>` créé (non inséré dans le DOM).
   */
  #_generate_script(file, { module = false } = {}) {
    let script = document.createElement('script');

    if (module) file += `?v=${BnumModules.VERSION}`;

    script.src = file;

    if (module) script.setAttribute('type', 'module');

    return script;
  }

  /**
   * Crée un élément `<link>` de feuille de style pointant vers le fichier donné.
   * @param {string} file - Chemin du fichier CSS à charger.
   * @returns {HTMLLinkElement} L'élément `<link>` créé (non inséré dans le DOM).
   */
  #_generate_css(file) {
    let css = document.createElement('link');
    css.setAttribute('rel', 'stylesheet');
    css.setAttribute('type', 'text/css');
    css.setAttribute('href', file);

    return css;
  }

  /**
   * Insère dans le shadow-dom les modules ESM déclarés via l'attribut
   * `data-modules` (liste séparée par des virgules).
   * @returns {WspNavBar} L'instance courante, pour chaînage.
   */
  #_setup_modules() {
    return this.#_setup_files_type(EFileType.module);
  }

  /**
   * Insère dans le shadow-dom les scripts classiques déclarés via l'attribut
   * `data-scripts` (liste séparée par des virgules).
   * @returns {WspNavBar} L'instance courante, pour chaînage.
   */
  #_setup_scripts() {
    return this.#_setup_files_type(EFileType.script);
  }

  /**
   * Lit l'attribut `data-*` correspondant au type de ressource donné, puis
   * génère et insère dans le shadow-dom chaque script/module/feuille de
   * style listé.
   * @param {EFileType} type - Type de ressource à traiter (script, module ou style).
   * @returns {WspNavBar} L'instance courante, pour chaînage.
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

  /**
   * Insère dans le shadow-dom le contenu CSS déclaré via l'attribut `data-css`.
   * @returns {WspNavBar} L'instance courante, pour chaînage.
   */
  #_setup_styles() {
    let style = document.createElement('style');
    style.appendChild(this.createText(this.data('css')));
    this.navigator.appendChild(style);
    style = null;
    this.removeAttribute('data-css');
    return this;
  }

  /**
   * Masque la barre de navigation.
   */
  hide() {
    this.style.display = 'none';
  }

  /**
   * Affiche la barre de navigation.
   */
  show() {
    this.style.display = EMPTY_STRING;
  }

  /**
   * Sélectionne une tâche dans la navigation entre applications.
   * @param {string} task - Nom de la tâche à sélectionner.
   * @param {{background?: boolean}} [options] - `background` évite de
   * déclencher la navigation si vrai (sélection silencieuse).
   * @returns {WspNavBar} L'instance courante, pour chaînage.
   */
  select(task, { background = true } = {}) {
    this.pageNavigation.select(task, { background });
    return this;
  }

  /**
   * Désélectionne une tâche (ou toutes) dans la navigation entre applications.
   * @param {{task?: string, background?: boolean}} [options] - `task` vaut
   * `'all'` par défaut pour tout désélectionner ; `background` évite de
   * déclencher la navigation si vrai.
   * @returns {WspNavBar} L'instance courante, pour chaînage.
   */
  unselect({ task = 'all', background = true } = {}) {
    this.pageNavigation.unselect({ task, background });
    return this;
  }

  /**
   * Simule un clic sur le bouton retour pour quitter l'espace.
   */
  quit() {
    this.mainDiv.querySelector('#wsp-quit-button').click();
  }

  /**
   * Enregistre une action globale, partagée par toutes les instances de la
   * barre de navigation.
   * @param {*} action - Action à enregistrer.
   */
  static AddActions(action) {
    this.#actions.push(action);
  }

  /**
   * Crée un élément `<bnum-wsp-nav>` configuré via ses attributs `data-*`.
   * @param {Object} [options] - Options de création.
   * @param {Document} [options.nav] - Document dans lequel créer l'élément.
   * @param {Object|string} [options.workspace] - Données de l'espace (objet
   * sérialisé en JSON, ou chaîne déjà encodée).
   * @param {string} [options.css] - CSS à injecter dans le shadow-dom.
   * @param {string} [options.modules] - Liste de modules ESM à charger, séparés par des virgules.
   * @param {string} [options.scripts] - Liste de scripts classiques à charger, séparés par des virgules.
   * @param {string} [options.settings] - Paramètres des applications de l'espace, sérialisés en JSON.
   * @param {Function} [options.onuserrequested] - Écouteur de {@link WspNavBar#onuserrequested}.
   * @param {Function} [options.onuserchanged] - Écouteur de {@link WspNavBar#onuserchanged}.
   * @returns {WspNavBar} L'élément créé, non encore inséré dans le DOM.
   */
  static CreateElement({
    nav = document,
    workspace = null,
    css = null,
    modules = null,
    scripts = null,
    settings = null,
    onuserrequested = null,
    onuserchanged = null,
  } = {}) {
    /**
     * @type {WspNavBar}
     */
    let node = nav.createElement('bnum-wsp-nav');

    if (workspace) {
      if (typeof workspace !== 'string')
        workspace = JSON.stringify(workspace).replaceAll('"', "¤'¤'");

      node.setAttribute('data-workspace', workspace);
    }

    if (css) node.setAttribute('data-css', css);
    if (modules) node.setAttribute('data-modules', modules);
    if (scripts) node.setAttribute('data-scripts', scripts);
    if (settings) node.setAttribute('data-apps-settings', settings);

    if (onuserrequested) node.onuserrequested.push(onuserrequested);
    if (onuserchanged) node.onuserchanged.push(onuserchanged);

    return node;
  }

  /**
   * Raccourci de {@link WspNavBar.CreateElement} pour créer l'élément à
   * partir des informations essentielles de l'espace.
   * @param {string} uid - Identifiant de l'espace.
   * @param {string} title - Titre de l'espace.
   * @param {string} description - Description de l'espace.
   * @param {string} picture - URL de l'image de l'espace.
   * @param {{nav?: Document}} [options] - Document dans lequel créer l'élément.
   * @returns {WspNavBar} L'élément créé, non encore inséré dans le DOM.
   */
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
