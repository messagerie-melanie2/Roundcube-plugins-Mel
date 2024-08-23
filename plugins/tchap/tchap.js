/**
 * @namespace Tchap
 * @property {module:Tchap} Module
 * @memberof Plugins
 */

/**
 * @module Tchap
 */

import { MainNav } from '../mel_metapage/js/lib/classes/main_nav.js';
import {
  EMPTY_STRING,
  TCHAT_UNREAD,
} from '../mel_metapage/js/lib/constants/constants.js';
import { MelObject } from '../mel_metapage/js/lib/mel_object.js';
import { Mel_Promise } from '../mel_metapage/js/lib/mel_promise.js';
export { tchap_manager };

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

    const url =
      rcmail.env.tchap_startup_url !== null &&
      rcmail.env.tchap_startup_url !== undefined
        ? rcmail.env.tchap_startup_url
        : rcmail.env.tchap_url;
    let $tchap = $('#tchap_frame').attr('src', url);

    if (navigator.appName === 'Microsoft Internet Explorer')
      $tchap[0].contentWindow.location.reload(true);

    //Ne pas afficher tchap en mode mobile
    if ((top ?? parent).$('html').hasClass('layout-phone')) {
      $('#tchap_frame').hide();
      $('#tchap_mobile').show();
    } else {
      this._tchap_mobile_mode_removed = true;
      // const loader = MEL_ELASTIC_UI.create_loader('tchaploader', true);
      // $('body').append(loader);
    }

    await Mel_Promise.wait(
      () =>
        this.tchap_frame().querySelector('.mx_QuickSettingsButton') !== null,
      60,
    );

    if (this.tchap_frame().querySelector('.mx_QuickSettingsButton') !== null) {
      this.change_theme();
    }

    //$('#tchaploader').hide();

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

    if (rcmail.env.display_tchap_sidebar === 'false')
      this.tchap_frame().querySelector('.mx_SpacePanel').style.display = 'none';

    //Mettre à jours les messages quand on vient sur le frame.
    const is_top = true;

    this.rcmail(is_top).addEventListener(
      'frame_loaded',
      (eClass, changepage, isAriane, querry, id, first_load) => {
        if (eClass === 'tchap') this.update_badge();
      },
    );
  }

  /**
   * Gestion des notifications sur la barre de gauche
   * @private
   * @return {Promise<void>}
   */
  async _notificationhandler() {
    this.update_badge();

    while (true) {
      if (this.get_env('current_frame_name') === 'tchap') await delay(10000);
      else await delay(30000);

      this._update_badge();
    }
  }

  /**
   * Met à jour le badge de notification du bouton lié à ce plugin de la barre de navigation principale.
   * @private
   */
  _update_badge() {
    if (
      this.tchap_frame().querySelector('.mx_NotificationBadge_count') !==
        null &&
      this.tchap_frame().querySelector('.mx_NotificationBadge_count')
        .innerHTML !== EMPTY_STRING
    ) {
      MainNav.update_badge(
        +this.tchap_frame().querySelector('.mx_NotificationBadge_count')
          .innerHTML,
        'tchap_badge',
      );
    } else if (
      this.tchap_frame().querySelector('.mx_NotificationBadge_visible') !==
        null &&
      this.tchap_frame()
        .querySelector('.mx_NotificationBadge_visible')
        .getAttribute('tabindex') !== '-1'
    ) {
      MainNav.update_badge_text(TCHAT_UNREAD, 'tchap_badge');
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
   * @returns {Document}
   */
  tchap_frame() {
    return $('#tchap_frame')[0].contentWindow.document;
  }

  /**
   * Change le thème de tchap
   * @public
   * @method
   */
  change_theme() {
    let frame_doc = $('#tchap_frame')[0].contentWindow.document;
    frame_doc.querySelector('.mx_QuickSettingsButton').click();
    frame_doc
      .querySelector('.mx_QuickThemeSwitcher .mx_Dropdown_input')
      .click();
    frame_doc
      .querySelector(
        `#mx_QuickSettingsButton_themePickerDropdown__${this.get_skin().color_mode()}`,
      )
      .click();
  }

  /**
   * Ouvre les paramètres de tchap
   * @public
   * @method
   */
  tchap_options() {
    let frame_doc = $('#tchap_frame')[0].contentWindow.document;
    frame_doc.querySelector('.mx_QuickSettingsButton').click();
    frame_doc
      .querySelector(
        '.mx_ContextualMenu > div > .mx_AccessibleButton_kind_primary_outline',
      )
      .click();
    top.m_mp_ToggleGroupOptionsUser();
  }

  /**
   * Options gérant l'affichage de la barre latérale de tchap
   * @public
   * @method
   */
  tchap_sidebar() {
    let mavaleur = top.$('#tchap_sidebar').prop('checked');
    this.http_internal_post({
      task: 'tchap',
      action: 'sidebar',
      params: { _showsidebar: mavaleur },
    });
    if (mavaleur) {
      this.tchap_frame().querySelector('.mx_SpacePanel').style.display = 'flex';
    } else {
      this.tchap_frame().querySelector('.mx_SpacePanel').style.display = 'none';
    }
  }

  /**
   * Deconnecte de tchap
   * @public
   * @method
   */
  tchap_disconnect() {
    let frame_doc = $('#tchap_frame')[0].contentWindow.document;
    frame_doc.querySelector('.mx_UserMenu_contextMenuButton').click();
    frame_doc.querySelector('.mx_UserMenu_iconSignOut').click();
    top.m_mp_ToggleGroupOptionsUser();
  }
}
