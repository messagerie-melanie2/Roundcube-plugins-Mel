import {
  BnumMessage,
  eMessageType,
} from '../../../mel_metapage/js/lib/classes/bnum_message';
import { FramesManager } from '../../../mel_metapage/js/lib/classes/frame_manager';
import { MelPopover } from '../../../mel_metapage/js/lib/classes/mel_popover';
import { Toolbar } from '../../../mel_metapage/js/lib/classes/toolbar';
import { BnumConnector } from '../../../mel_metapage/js/lib/helpers/bnum_connections/bnum_connections';
import { InternetNavigator } from '../../../mel_metapage/js/lib/helpers/InternetNavigator';
import { MelHtml } from '../../../mel_metapage/js/lib/html/JsHtml/MelHtml';
import { capitalize } from '../../../mel_metapage/js/lib/mel';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object';
import { JitsiAdaptor } from './classes/visio/jitsii';
import { VisioLoader } from './classes/visio/loader';
import { ToolbarFunctions } from './classes/visio/toolbar';
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

    this.loader = null;

    /**
     * @type {JitsiAdaptor}
     */
    this.jitsii = null;
    /**
     * @type {Toolbar}
     */
    this.toolbar = null;

    this._token = null;

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

    this.loader = new VisioLoader('#mm-webconf .loading-visio-text');
    this.jitsii = null;
    this._call_datas = webconf_helper.phone.getAll(this.data.wsp);
    this._token = this._get_jwt();
    this._toolbar = null;

    return this;
  }

  async get_call_data() {
    return await this._call_datas;
  }

  async start() {
    if (!VisioFunctions.CheckKeyIsValid(this.data.room)) {
      FramesManager.Instance.start_mode('reinit_visio');
    } else {
      const domain = rcmail.env['webconf.base_url']
        .replace('http://', '')
        .replace('https://', '');

      // //Si on est sous ff, avertir que c'est pas ouf d'utiliser ff
      // await this.navigatorWarning();

      this.loader.update_text('Récupération du jeton...');
      const token = await this._token;
      if (token.has_error) {
        BnumMessage.DisplayMessage(
          'Impossible de lancer la visio !',
          eMessageType.Error,
        );
        console.error(token);
        return;
      }

      let user = null;

      if (rcmail.env.current_user?.name && rcmail.env.current_user?.lastname)
        user = `${rcmail.env.current_user.name} ${rcmail.env.current_user.lastname}`;
      else user = rcmail.env.mel_metapage_user_emails[0];

      const options = {
        jwt: token.datas.jwt, //Récupère le token jwt pour pouvoir lancer la visio
        roomName: this.data.room,
        width: '100%',
        height: '100%',
        parentNode: document.querySelector('#mm-webconf'),
        onload: () => {
          let avatar_url = null;
          if (this.get_env('cid')) {
            avatar_url = this.url('addressbook', {
              action: 'photo',
              params: {
                _cid: this.get_env('cid'),
                _source: this.get_env('annuaire_source'),
              },
            });
          } else avatar_url = this.get_env('avatar_url');

          if (avatar_url) {
            this.jitsii.executeCommand('avatarUrl', avatar_url);
          }

          if (this.loader) {
            this.loader = this.loader.destroy();
            this.toolbar = this._create_toolbar();
          }
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
          email: rcmail.env.mel_metapage_user_emails[0],
          displayName: user,
        },
      };

      this.loader.update_text('Connexion à la visioconférence...');

      await wait(() => window.JitsiMeetExternalAPI === undefined);

      this.loader.update_text('Chargement de la visioconférence...');

      this.jitsii = new JitsiAdaptor(new JitsiMeetExternalAPI(domain, options));
    }
  }

  async _get_jwt() {
    let params = VisioConnectors.jwt.needed;
    params._room = this.data.room;
    return await BnumConnector.force_connect(VisioConnectors.jwt, { params });
  }

  _create_toolbar() {
    let toolbar = Toolbar.FromConfig(JSON.parse(this.get_env('visio.toolbar')));

    this.rcmail().env['visio.toolbar'] = null;

    for (let element of toolbar) {
      switch (element.id) {
        case 'share_screen':
          if (InternetNavigator.IsFirefox()) {
            toolbar.remove_item(element.id);
            continue;
          }
          break;

        default:
          break;
      }

      if (element.get) {
        for (let sub_element of element) {
          if (ToolbarFunctions[capitalize(sub_element.id.replace('-', '_'))])
            sub_element.add_action(
              ToolbarFunctions[
                capitalize(sub_element.id.replace('-', '_'))
              ].bind(ToolbarFunctions, this),
            );
        }
      } else if (ToolbarFunctions[capitalize(element.id)])
        element.add_action(
          ToolbarFunctions[capitalize(element.id)].bind(ToolbarFunctions, this),
        );
    }

    toolbar.generate(top.$('body'));

    // toolbar
    //   .get_button('more')
    //   .$item.attr('data-toggle', 'popover')
    //   .popover({
    //     html: true,
    //     content: '<p>yolo</p><br/><br/><i>yolo</i>',
    //     placement: 'top',
    //     container: top.$('body')[0],
    //   });
    // this.popover = new bootstrap.Popover(toolbar.get_button('more').$item[0], {
    //   html: true,
    //   content: '<p>yolo</p><br/><br/><i>yolo</i>',
    //   placement: 'top',
    //   container: top.$('body')[0],
    //   trigger: 'manual',
    // });
    const raw_actions = JSON.parse(this.get_env('visio.toolbar.more'));
    const pop_actions = MelHtml.start
      .btn_group_vertical()
      .each(
        (self, item) => {
          return self
            .button({ class: 'mel-popover-button' })
            .attr(
              'onclick',
              ToolbarFunctions[`Action_${item}`]
                ? ToolbarFunctions[`Action_${item}`].bind(
                    ToolbarFunctions,
                    this,
                  )
                : () => {},
            )
            .icon(raw_actions[item].icon)
            .end()
            .span()
            .text(raw_actions[item].text)
            .end()
            .end();
        },
        ...Object.keys(raw_actions),
      )
      .end();

    this.popover = new MelPopover(
      toolbar.get_button('more').$item,
      pop_actions,
      { config: { placement: 'top' }, container: top.$('body') },
    );

    $(this.popover._pop.element.popper)
      .find('.bnum-popover-content')
      .css('padding', 0);
    this.rcmail().env['visio.toolbar.more'] = null;

    return toolbar;
  }
}
