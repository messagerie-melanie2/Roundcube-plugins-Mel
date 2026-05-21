import { WrapperObject } from '../../mel_metapage/js/lib/BaseObjects/WrapperObject.js';
import { FramesManager } from '../../mel_metapage/js/lib/classes/frame_manager.js';
import { MelObject } from '../../mel_metapage/js/lib/mel_object.js';
import { VisioFunctions } from './lib/helpers.js';

/**
 * Contient les classes d'aide pour utiliser ou lancer la visioconférence correctement.
 * @module Visio/Helper
 * @local BnumVisio
 * @local VisioHelper
 */

/**
 * @class
 * @classdesc Classe d'aide de la visioconférence. Donne des fonctions utile pour appeler ou utiliser la visio
 */
class BnumVisio extends MelObject {
  /**
   * Contient les fonctions qui permettent de récupérer les codes voxify ou de lancer une visio.
   */
  constructor() {
    super();
  }

  /**
   *Cette fonction est appelé dans le constructeur.
   * @override
   */
  main() {
    super.main();

    this.rcmail().addEventListener('visio.start', (args) => {
      const { room: key, workspace: wsp, locks, pass, extra } = args;

      this.start({ key, wsp, locks, pass, extra });
    });
  }

  /**
   * Récupère l'url de voxify
   * @returns {Promise<string>}
   * @async
   */
  async voxify_url() {
    //Si on récupère déjà l'url, ça ne sert à rien de le redemander, on attend la résolution précédente.
    if (this.voxify_url.waiting) {
      let it = 0;
      await new Promise((ok, nok) => {
        const interval = setInterval(() => {
          console.debug('Waiting voxify url...');
          if (!this.voxify_url.waiting) {
            clearInterval(interval);
            console.debug('Voxify url ok !');
            ok();
          }

          if (++it > 50) {
            this.voxify_url.waiting = false;
            console.debug('Voxify url not ok !');
            nok();
          }
        }, 100);
      });
    }

    let navigator = top ?? parent ?? window;

    if (!navigator.voxify_url) {
      this.voxify_url.waiting = true;
      console.info('Starting get voxify url !');
      await MelObject.Empty().http_internal_get({
        task: 'mel_settings',
        action: 'get',
        params: {
          _option: 'voxify_url',
          _default_value: 'https://webconf.numerique.gouv.fr/voxapi',
        },
        on_success(data) {
          console.info('Voxify url ok !');
          data = JSON.parse(data);
          navigator.voxify_url = data;
        },
      });
      console.info('Finishing get voxify url !');
      this.voxify_url.waiting = false;
    }

    return navigator.voxify_url;
  }

  /**
   * Récupère le numéro de téléphone lié à la visioconférence
   * @param {string} webconf Room de la visio
   * @returns {Promise<string>}
   * @async
   */
  async getWebconfPhoneNumber(webconf) {
    const url = `${await this.voxify_url()}/api/v1/conn/jitsi/phoneNumbers?conference=${webconf}@conference.webconf.numerique.gouv.fr`;
    let phoneNumber = null;
    window.disable_x_roundcube = true;

    await this.http_call({
      url,
      on_success: (data) => {
        const indicator = rcmail.env['mel_metapage.webconf_voxify_indicatif'];
        if (
          !!data &&
          data.numbersEnabled &&
          !!data.numbers[indicator] &&
          data.numbers[indicator].length > 0
        )
          phoneNumber = data.numbers[indicator][0];
      },
      type: 'GET',
    });

    window.disable_x_roundcube = false;

    return phoneNumber;
  }

  /**
   * Récupère le code pin lié à la visio
   * @param {string} webconf Room de la visio
   * @returns {Promise<?string>}
   * @async
   */
  async getWebconfPhonePin(webconf) {
    const url = `${await this.voxify_url()}/api/v1/conn/jitsi/conference/code?conference=${webconf}@conference.webconf.numerique.gouv.fr`;
    let phoneNumber = null;
    window.disable_x_roundcube = true;
    // await mel_metapage.Functions.get(url, {}, (datas) => {
    //   if (!!datas && !!datas.id) phoneNumber = datas.id;
    // });
    await this.http_call({
      url,
      on_success: (data) => {
        if (data?.id) phoneNumber = data.id;
      },
      type: 'GET',
    });

    window.disable_x_roundcube = false;

    return phoneNumber;
  }

  /**
   * Récupère les données téléphonique de la visio
   * @param {string} webconf
   * @returns {Promise<{number:string, pin:string, room:string}>}
   * @async
   */
  async getWebconfPhone(webconf) {
    const [number, pin] = await Promise.allSettled([
      this.getWebconfPhoneNumber(webconf),
      this.getWebconfPhonePin(webconf),
    ]);
    return { number: number.value, pin: pin.value, room: webconf };
  }

  /**
   * Lance une visio
   * @param {Object} [options={}]
   * @param {?string} [options.key=null] Room de la visio. Si null, ouvre la page de choix de la room.
   * @param {?string} [options.wsp=null] Espace de travail rattaché à la visio.
   * @param {?string} [options.locks = null] Elements à lock
   * @param {?string} [options.pass=null] Mot de passe de la visio
   * @param {?string} [options.extra=null] Modes en plus
   * @return {void}
   */
  start({
    key = null,
    wsp = null,
    locks = null,
    pass = null,
    extra = null,
  } = {}) {
    let config = {};

    if (key) {
      if (key === '¤random¤') key = VisioFunctions.generateWebconfRoomName();
      config._key = key;
    }
    if (wsp) config._wsp = wsp;
    if (locks) config._locks = locks;
    if (pass) config._pass = pass;
    if (extra) config._need_config = extra === 'need_config';

    // FramesManager.Instance.start_mode(
    //   'visio',
    //   !key || config._need_config ? null : 'visio',
    //   config,
    // );
    this.startVisioMode({
      page: !key || config._need_config ? null : 'visio',
      params: config,
    });
  }

  async startVisioMode({ page = 'index', params = {} } = {}) {
    if (!page) {
      if (params) params._page = 'index';

      await FramesManager.Instance.switch_frame('webconf', {
        args: params ?? { _page: 'index' },
      });
    } else if (page !== 'index') {
      // GARDE : si une visio est déjà en cours
      if (window.current_visio) {
        const _window = top ?? parent ?? window;
        const $html = _window.$('html');
  
        if (!$html.hasClass('fullscreen-visio')) {
          // Visio minimisée → on la remet en plein écran
          FramesManager.Instance.switch_frame('webconf', {});
          $html.addClass('fullscreen-visio').removeClass('visio-minimised');
          
          _window.$('#visio-back-button')
            .attr('title', 'Minimiser la visioconférence')
            .find('bnum-icon').text('fullscreen_exit');
        }
        // déjà en plein écran : on ne fait rien
        return;
      }
      params._page = page || 'init';
      FramesManager.Instance.close_except_selected()
        .disable_manual_multiframe()
        .start_custom_multi_frame()
        .get_window()
        .hide();
      window.current_visio = await FramesManager.Instance.open_another_window(
        'webconf',
        params,
      );
      FramesManager.Instance.get_window()
        .set_cannot_be_select()
        //.set_remove_on_change()
        .add_tag('dispo-visio');
      FramesManager.Instance.select_window(0);
    }
  }

  stopVisio() {
    FramesManager.Instance.enable_manual_multiframe().stop_custom_multi_frame();
    return this;
  }

  reinitVisio() {
    FramesManager.Instance.close_except_selected().get_window().show();
    return this.stopVisio().startVisioMode();
  }

  /**
   * Initialise l'helper
   * @returns {BnumVisio} Chaînage
   */
  startInstance() {
    return this;
  }
}

/**
 * Donne des fonctions utile pour appeler ou utiliser la visio
 * @type {WrapperObject<BnumVisio>}
 * @constant
 * @frommodule Visio/Helper {@linkto BnumVisio}
 */
export const VisioHelper = new WrapperObject(BnumVisio);

VisioHelper.Instance.startInstance();
