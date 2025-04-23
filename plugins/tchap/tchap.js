/**
 * @namespace Tchap
 * @property {module:Tchap} Module
 * @memberof Plugins
 */

/**
 * @module Tchap
 */

import { BnumPromise } from '../mel_metapage/js/lib/BnumPromise.js';
import { FramesManager } from '../mel_metapage/js/lib/classes/frame_manager.js';
import { MainNav } from '../mel_metapage/js/lib/classes/main_nav.js';
import {
  EMPTY_STRING,
  TCHAT_UNREAD,
} from '../mel_metapage/js/lib/constants/constants.js';
import { MelObject } from '../mel_metapage/js/lib/mel_object.js';
export { tchap_manager };

const SETTING_BUTTON = 'mx_UserMenu_contextMenuButton';
const PARAMS_BUTTON = 'mx_UserMenu_iconSettings';
const DISCONNECT_BUTTON = 'mx_UserMenu_iconSignOut';
const LEFT_PANEL = 'mx_SpacePanel';
const CONTEXTUAL_MENU = 'mx_ContextualMenu';
const THEME_BUTTON = 'mx_UserMenu_contextMenu_themeButton';
const CURRENT_THEME_BODY_CLASS = 'cpd-theme-light';
const CONTEXTUAL_MENU_BACKGROUND = 'mx_ContextualMenu_background';
const SLEEP_ON_TASK = 2500;
const SLEEP_OUTSIDE = 30000;

/**
 * @class
 * @classdesc Classe de gestion de tchap en JS
 * @extends {MelObject}
 */
class tchap_manager extends MelObject {
  constructor() {
    super();
  }

  // #region ReadOnlyVar
  /**
   * Document de la frame de tchap
   * @type {Document}
   * @readonly
   */
  get tchapContext() {
    return this.tchap_frame()[0].contentWindow.document;
  }

  /**
   * Badge qui contient si il y a des messages non-lu
   * @type {HTMLElement}
   * @readonly
   */
  get badge() {
    return this.tchapContext.querySelector(
      '.mx_SpaceButton_home .mx_SpacePanel_badgeContainer .mx_NotificationBadge_count',
    );
  }

  /**
   * Bouton qui ouvre le menu des paramètres
   * @type {HTMLElement}
   * @readonly
   */
  get settingMenuButton() {
    return this.tchapContext.querySelector(`.${SETTING_BUTTON}`);
  }

  /**
   * Ouvre le menu des paramètres puis récupère le bouton qui ouvre les paramètres.
   * @type {Promise<HTMLElement>}
   * @readonly
   */
  get settingButton() {
    this.settingMenuButton.click();
    return this.#_getHtmlElementMenu(`.${CONTEXTUAL_MENU}  .${PARAMS_BUTTON}`, {
      updateCallback: (e) => {
        return e?.parentElement;
      },
    });
  }

  /**
   * Ouvre le menu des paramètres puis récupère le bouton de déconnexion.
   * @type {Promise<HTMLElement>}
   * @readonly
   */
  get disconnectButton() {
    this.settingMenuButton.click();
    return this.#_getHtmlElementMenu(
      `.${CONTEXTUAL_MENU}  .${DISCONNECT_BUTTON}`,
      {
        updateCallback: (e) => {
          return e?.parentElement;
        },
      },
    );
  }

  /**
   * Panneau de gauche
   * @type {HTMLElement}
   * @readonly
   */
  get leftPanel() {
    return this.tchapContext.querySelector(`.${LEFT_PANEL}`);
  }

  /**
   * Div en arrière plan lorsque le menu des paramètres est ouvert.
   * @type {HTMLElement}
   * @readonly
   */
  get contextualMenuBackground() {
    return this.tchapContext.querySelector(`.${CONTEXTUAL_MENU_BACKGROUND}`);
  }

  /**
   * Ouvre le menu des paramètres puis récupère le bouton de thème.
   * @type {Promise<HTMLElement>}
   * @readonly
   */
  get themeButton() {
    this.settingMenuButton.click();
    return this.#_getHtmlElementMenu(`.${CONTEXTUAL_MENU}  .${THEME_BUTTON}`);
  }

  /**
   * Messages non-lu
   * @type {string | number}
   * @readonly
   */
  get unread() {
    if (!this.badge) return null;

    const val = +(this.badge.textContent || 'user_defined_unread');

    return isNaN(val) ? TCHAT_UNREAD : val;
  }
  // #endregion

  // #region Main
  /**
   * @async
   * @package
   */
  async main() {
    super.main();
    if ($('#wait_box').length) $('#wait_box').hide();

    /**
     * Interrupteur local qui défini si tchap à été lancer en mode mobile puis redimensionner.
     *
     * La page de "redirection" ne doit pas être afficher en cas de redimensionnement.
     * @private
     * @type {boolean}
     */
    this._tchap_mobile_mode_removed = false;

    const url = this.get_env('tchap_startup_url') || this.get_env('tchap_url');
    let $tchap = $('#tchap_frame').attr('src', url);

    if (navigator.appName === 'Microsoft Internet Explorer')
      $tchap[0].contentWindow.location.reload(true);

    //Ne pas afficher tchap en mode mobile
    if ((top ?? parent).$('html').hasClass('layout-phone')) {
      $('#tchap_frame').hide();
      $('#tchap_mobile').show();
    } else {
      this._tchap_mobile_mode_removed = true;
    }

    this.tchap_frame().on('load', () => {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
      this.observer = new MutationObserver((mutations) => {
        for (const element of mutations) {
          if (element.type === 'childList') {
            if (element.target.classList.contains('mx_LeftPanel_wrapper')) {
              if (this.needObserver && this.appInitialized) {
                this.#_setElements();
                this.needObserver = false;
              } else if (!this.appInitialized) {
                this.#_initElements();
                this.appInitialized = true;
              }
            } else if (
              this.appInitialized &&
              !this.needObserver &&
              element.target.classList.contains('mx_AuthBody')
            ) {
              this.needObserver = true;
            }
          }
        }
      });

      this.observer.observe(this.tchapContext.querySelector('body'), {
        childList: true,
        subtree: true,
      });
    });
  }
  //#endregion
  // #region private
  /**
   * Gestion des notifications sur la barre de gauche
   * @private
   * @return {Promise<void>}
   */
  async _notificationhandler() {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      this.update_badge();

      await this.sleep(
        FramesManager.Instance.currentTask === 'tchap'
          ? SLEEP_ON_TASK
          : SLEEP_OUTSIDE,
      );
    }
  }

  /**
   * Met à jour le badge de notification du bouton lié à ce plugin de la barre de navigation principale.
   * @private
   */
  _update_badge() {
    const val = this.unread;
    if (val) {
      MainNav.update_badge(val, 'tchap_badge');
    } else {
      MainNav.update_badge(0, 'tchap_badge');
    }
  }

  #_initElements() {
    console.log('Init elements');
    if (this._tchap_mobile_mode_removed) {
      window.addEventListener('resize', () => {
        if (
          !this._tchap_mobile_mode_removed &&
          $('html').hasClass('layout-phone')
        ) {
          $('#tchap_frame').hide();
          $('#tchap_mobile').show();
        } else {
          $('#tchap_frame').show();
          $('#tchap_mobile').hide();
        }
      });
    }

    this.rcmail().addEventListener(
      'switched_color_theme',
      this.change_theme.bind(this),
    );
    this.rcmail().addEventListener(
      'tchap.options',
      this.tchap_options.bind(this),
    );
    this.rcmail().addEventListener(
      'tchap.sidebar',
      this.tchap_sidebar.bind(this),
    );
    this.rcmail().addEventListener(
      'tchap.disconnect',
      this.tchap_disconnect.bind(this),
    );
    this._notificationhandler();

    //Mettre à jours les messages quand on vient sur le frame.
    const is_top = true;

    this.rcmail(is_top).addEventListener('frame_loaded', (eClass) => {
      if (eClass === 'tchap') this.update_badge();
    });

    if (this.get_env('plugin_list_workspace')) {
      this._try_observe_html()._update_tchap_left_panel();
    }

    this.#_setElements();

    console.log('Ended elements');
  }
  #_setElements() {
    const CONNECTED_SELECTOR = `.${SETTING_BUTTON}`;

    if (this.get_env('display_tchap_sidebar') === 'false')
      this.leftPanel.style.display = 'none';

    if (this.tchapContext.querySelector(CONNECTED_SELECTOR) !== null) {
      try {
        this.change_theme();
      } catch (error) {
        console.warn(
          '/!\\[tchamanager]Erreur lors du premier changement de thème',
          error,
        );
      }
    }

    if (this.get_env('plugin_list_workspace')) this._update_tchap_left_panel();
  }

  async #_getHtmlElementMenu(selector, { updateCallback = (e) => e } = {}) {
    await BnumPromise.Wait(
      () => !!updateCallback(this.tchapContext.querySelector(selector)),
    );
    return updateCallback(this.tchapContext.querySelector(selector));
  }
  // #endregion
  // #region publics

  /**
   * Met à jour le badge de notification du bouton lié à ce plugin de la barre de navigation principale.
   *
   * Initialise le badge si besoin.
   */
  update_badge() {
    MainNav.try_add_round('.button-tchap', 'tchap_badge');
    this._update_badge();
  }

  /**
   * Retourne la frame de tchap
   * @public
   * @returns {external:Jquery}
   */
  tchap_frame() {
    return $('#tchap_frame');
  }

  /**
   * Change le thème de tchap
   * @public
   * @method
   */
  async change_theme() {
    const color = this.get_skin().color_mode();
    const tchap_color = this.tchapContext
      .querySelector('body')
      .classList.contains(CURRENT_THEME_BODY_CLASS)
      ? 'light'
      : 'dark';
    // debugger;
    if (color !== tchap_color) {
      let button = await this.themeButton; //?.click?.();
      button?.click?.();

      if (this.contextualMenuBackground) this.contextualMenuBackground.click();
    }
  }

  /**
   * Ouvre les paramètres de tchap
   * @public
   * @method
   */
  async tchap_options() {
    (await this.settingButton)?.click?.();
    top.m_mp_ToggleGroupOptionsUser();
  }

  /**
   * Options gérant l'affichage de la barre latérale de tchap
   * @public
   * @method
   */
  tchap_sidebar() {
    let checked = top.$('#tchap_sidebar').prop('checked');
    this.http_internal_post({
      task: 'tchap',
      action: 'sidebar',
      params: { _showsidebar: checked },
    });

    this.leftPanel.style.display = checked ? EMPTY_STRING : 'none';
  }

  /**
   * Deconnecte de tchap
   * @public
   * @method
   */
  async tchap_disconnect() {
    (await this.disconnectButton)?.click?.();
    top.m_mp_ToggleGroupOptionsUser();
  }

  // #endregion
  /**
   * Observe le html pour détecter si on cache ou affiche le panneau de gauche de tchap si 'mwsp' est présent dans la classe de l'élément html
   * @private
   * @returns {tchap_manager}
   */
  _try_observe_html() {
    // Selectionne le noeud dont les mutations seront observées
    let targetNode = document.querySelector('html');

    // Options de l'observateur (quelles sont les mutations à observer)
    let config = { attributes: true, childList: false, subtree: false };

    // Créé une instance de l'observateur lié à la fonction de callback
    let observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'class'
        ) {
          this._update_tchap_left_panel();
          break;
        }
      }
    });

    observer.observe(targetNode, config);

    return this;
  }

  /**
   * Cache ou affiche le panneau de gauche de tchap si 'mwsp' est présent dans la classe de l'élément html
   * @private
   */
  _update_tchap_left_panel() {
    let style;
    if (document.querySelector('html').classList.contains('mwsp'))
      style = 'none';
    else style = 'flex';

    FramesManager.Instance.get_frame('tchap')[0]
      .contentWindow.$('#tchap_frame')[0]
      .contentWindow.document.querySelector(
        '.mx_LeftPanel_wrapper',
      ).style.display = style;
  }
}
