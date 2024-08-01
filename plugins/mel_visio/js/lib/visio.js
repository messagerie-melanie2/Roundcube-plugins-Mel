import { FramesManager } from '../../../mel_metapage/js/lib/classes/frame_manager';
import { BnumConnector } from '../../../mel_metapage/js/lib/helpers/bnum_connections/bnum_connections';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object';
import { VisioData } from './classes/structures/data';
import { VisioLoader } from './classes/visio/loader';
import { VisioConnectors } from './connectors';
import { VisioFunctions } from './helpers';
export { Visio };

class Visio extends MelObject {
  constructor() {
    super();
  }

  main() {
    super.main();

    this._init()._setup().start();
  }
  /**
   * @private
   */
  _init() {
    /**
     * @type {VisioData}
     * @readonly
     */
    this.data = null;

    this.loader = new VisioLoader('#mm-webconf .loading-visio-text');

    this.jitsii = null;

    this._token = this._get_jwt();

    return this;
  }

  /**
   * @private
   */
  _setup() {
    Object.defineProperty(this, 'data', {
      get() {
        return rcmail.env['visio.data'];
      },
    });

    return this;
  }

  async start() {
    if (!VisioFunctions.CheckKeyIsValid(this.data.room)) {
      FramesManager.Instance.start_mode('reinit_visio');
    } else {
      const domain = rcmail.env['webconf.base_url']
        .replace('http://', '')
        .replace('https://', '');

      //Si on est sous ff, avertir que c'est pas ouf d'utiliser ff
      await this.navigatorWarning();

      this.loader.update_text('Récupération du jeton...');
      const debug_token = await this._token;
      const options = {
        jwt: await this._token, //Récupère le token jwt pour pouvoir lancer la visio
        roomName: this.data.room,
        width: '100%',
        height: '100%',
        parentNode: document.querySelector('#mm-webconf'),
        onload: () => {
          this.loader = this.loader.destroy();
        },
        configOverwrite: {
          hideLobbyButton: true,
          startWithAudioMuted: false,
          startWithVideoMuted: true,
          prejoinConfig: {
            enabled: false,
          },
          toolbarButtons: [
            'filmstrip',
            // 'microphone', 'camera', 'closedcaptions', 'desktop', 'embedmeeting', 'fullscreen',
            // 'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
            // 'livestreaming', 'etherpad', 'sharedvideo', 'shareaudio', 'settings', 'raisehand',
            // 'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
            // 'tileview', 'select-background', 'download', 'help', 'mute-everyone', 'mute-video-everyone', 'security'
          ],
        },
        interfaceConfigOverwrite: {
          // INITIAL_TOOLBAR_TIMEOUT:1,
          // TOOLBAR_TIMEOUT:-1,
          HIDE_INVITE_MORE_HEADER: true,
          //TOOLBAR_BUTTONS : [""]
        },
        userInfo: {
          email: rcmail.env['webconf.user_datas'].email,
          displayName:
            rcmail.env['webconf.user_datas'].name === null
              ? rcmail.env['webconf.user_datas'].email
                ? rcmail.env['webconf.user_datas'].email
                : 'Bnum user'
              : rcmail.env['webconf.user_datas'].name, //.split("(")[0].split("-")[0]
        },
      };

      this.loader.update_text('Connexion à la visioconférence...');

      await wait(() => window.JitsiMeetExternalAPI === undefined);

      this.jitsii = new JitsiMeetExternalAPI(domain, options);
    }
  }

  async _get_jwt() {
    return (await BnumConnector.force_connect(VisioConnectors.jwt, {}))?.datas;
  }
}
