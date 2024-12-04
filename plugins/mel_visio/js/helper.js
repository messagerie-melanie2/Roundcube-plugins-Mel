import { FramesManager } from '../../mel_metapage/js/lib/classes/frame_manager.js';
import {
  MelObject,
  WrapperObject,
} from '../../mel_metapage/js/lib/mel_object.js';
import { VisioFunctions } from './lib/helpers.js';

class BnumVisio extends MelObject {
  constructor() {
    super();
  }

  main() {
    super.main();

    this.rcmail().addEventListener('visio.start', (args) => {
      const { room: key, workspace: wsp, locks, pass, extra } = args;

      this.start({ key, wsp, locks, pass, extra });
    });
  }

  async voxify_url() {
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
      voxify_url.waiting = true;
      console.info('Starting get voxify url !');
      await mel_metapage.Functions.get(
        mel_metapage.Functions.url('mel_settings', 'get'),
        {
          _option: 'voxify_url',
          _default_value: 'https://webconf.numerique.gouv.fr/voxapi',
        },
        (datas) => {
          console.info('Voxify url ok !');
          datas = JSON.parse(datas);
          navigator.voxify_url = datas;
        },
      );
      console.info('Finishing get voxify url !');
      voxify_url.waiting = false;
    }

    return navigator.voxify_url;
  }

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

  async getWebconfPhonePin(webconf) {
    const url = `${await this.voxify_url()}/api/v1/conn/jitsi/conference/code?conference=${webconf}@conference.webconf.numerique.gouv.fr`;
    let phoneNumber = null;
    window.disable_x_roundcube = true;
    await mel_metapage.Functions.get(url, {}, (datas) => {
      if (!!datas && !!datas.id) phoneNumber = datas.id;
    });
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

    FramesManager.Instance.start_mode('visio', null, config);
  }

  startInstance() {
    return this;
  }
}

export const VisioHelper = new WrapperObject(BnumVisio);

VisioHelper.Instance.startInstance();
