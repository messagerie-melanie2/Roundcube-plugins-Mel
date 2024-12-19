/**
 * @namespace Tchap
 * @property {module:Tchap} Module
 * @memberof Plugins
 */

/**
 * @module Tchap
 */

import { FramesManager } from '../mel_metapage/js/lib/classes/frame_manager.js';
import { MainNav } from '../mel_metapage/js/lib/classes/main_nav.js';
import {
  EMPTY_STRING,
  TCHAT_UNREAD,
} from '../mel_metapage/js/lib/constants/constants.js';
import { MelObject } from '../mel_metapage/js/lib/mel_object.js';
import { Mel_Promise } from '../mel_metapage/js/lib/mel_promise.js';
export { tchap_manager };

const SETTING_BUTTON = 'mx_UserMenu_contextMenuButton';
const PARAMS_BUTTON = 'mx_UserMenu_iconSettings';
const DISCONNECT_BUTTON = 'mx_UserMenu_iconSignOut';
const LEFT_PANEL = 'mx_SpacePanel';
const CONTEXTUAL_MENU = 'mx_ContextualMenu';
const THEME_BUTTON = 'mx_UserMenu_contextMenu_themeButton';
const CURRENT_THEME_BODY_CLASS = 'cpd-theme-light';

/**
 * @class
 * @classdesc Classe de gestion de tchap en JS
 * @extends {MelObject}
 */
class tchap_manager extends MelObject {
  constructor() {
    super();
  }

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

    {
      const CONNECTED_SELECTOR = `.${SETTING_BUTTON}`;
      await Mel_Promise.wait(
        () => this.tchapContext.querySelector(CONNECTED_SELECTOR) !== null,
        60,
      );

      if (this.tchapContext.querySelector(CONNECTED_SELECTOR) !== null) {
        try {
          this.change_theme();
        } catch (error) {
          console.warn('/!\\[tchapmanager]Il y a une erreur lors du changement de thème', error):
        }
      }
    }

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

    if (this.get_env('display_tchap_sidebar') === 'false')
      this.leftPanel.style.display = 'none';

    //Mettre à jours les messages quand on vient sur le frame.
    const is_top = true;

    this.rcmail(is_top).addEventListener('frame_loaded', (eClass) => {
      if (eClass === 'tchap') this.update_badge();
    });
  }

  /**
   * Gestion des notifications sur la barre de gauche
   * @private
   * @return {Promise<void>}
   */
  async _notificationhandler() {
    this.update_badge();

    while (true) {
      if (FramesManager.Instance.currentTask === 'tchap') await delay(2500);
      else await delay(30000);

      this._update_badge();
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
   * @type {Document}
   * @readonly
   */
  get tchapContext() {
    return this.tchap_frame()[0].contentWindow.document;
  }

  get badge() {
    return this.tchapContext.querySelector(
      '.mx_SpaceButton_home .mx_SpacePanel_badgeContainer .mx_NotificationBadge_count',
    );
  }

  get unread() {
    if (!this.badge) return null;

    const val = +(this.badge.textContent || 'user_defined_unread');

    return isNaN(val) ? TCHAT_UNREAD : val;
  }

  /**
   * @type {HTMLElement}
   * @readonly
   */
  get settingMenuButton() {
    return this.tchapContext.querySelector(`.${SETTING_BUTTON}`);
  }

  /**
   * @type {HTMLElement}
   * @readonly
   */
  get settingButton() {
    this.settingMenuButton.click();
    return this.tchapContext.querySelector(
      `.${CONTEXTUAL_MENU}  .${PARAMS_BUTTON}`,
    ).parentElement;
  }

  /**
   * @type {HTMLElement}
   * @readonly
   */
  get disconnectButton() {
    this.settingMenuButton.click();
    return this.tchapContext.querySelector(
      `.${CONTEXTUAL_MENU}  .${DISCONNECT_BUTTON}`,
    ).parentElement;
  }

  /**
   * @type {HTMLElement}
   * @readonly
   */
  get leftPanel() {
    return this.tchapContext.querySelector(`.${LEFT_PANEL}`);
  }

  /**
   * @type {HTMLElement}
   * @readonly
   */
  get themeButton() {
    this.settingMenuButton.click();
    return this.tchapContext.querySelector(`.${THEME_BUTTON}`);
  }

  /**
   * Change le thème de tchap
   * @public
   * @method
   */
  change_theme() {
    const color = this.get_skin().color_mode();
    const tchap_color = this.tchapContext
      .querySelector('body')
      .classList.contains(CURRENT_THEME_BODY_CLASS)
      ? 'light'
      : 'dark';

    if (color !== tchap_color) this.themeButton.click();
  }

  /**
   * Ouvre les paramètres de tchap
   * @public
   * @method
   */
  tchap_options() {
    this.settingButton.click();
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
  tchap_disconnect() {
    this.disconnectButton.click();
    top.m_mp_ToggleGroupOptionsUser();
  }
}
