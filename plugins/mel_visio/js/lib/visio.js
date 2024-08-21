import {
  BnumMessage,
  eMessageType,
} from '../../../mel_metapage/js/lib/classes/bnum_message.js';
import { MelEnumerable } from '../../../mel_metapage/js/lib/classes/enum.js';
import { FramesManager } from '../../../mel_metapage/js/lib/classes/frame_manager.js';
import { MelPopover } from '../../../mel_metapage/js/lib/classes/mel_popover.js';
import { Toolbar } from '../../../mel_metapage/js/lib/classes/toolbar.js';
import { EMPTY_STRING } from '../../../mel_metapage/js/lib/constants/constants.js';
import { BnumConnector } from '../../../mel_metapage/js/lib/helpers/bnum_connections/bnum_connections.js';
import { InternetNavigator } from '../../../mel_metapage/js/lib/helpers/InternetNavigator.js';
import { MelHtml } from '../../../mel_metapage/js/lib/html/JsHtml/MelHtml.js';
import { capitalize } from '../../../mel_metapage/js/lib/mel.js';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
//import { Drive } from '../../../mel_metapage/js/lib/nextcloud/drive.js';
import { JitsiAdaptor } from './classes/visio/jitsii.js';
import { VisioLoader } from './classes/visio/loader.js';
import { ToolbarFunctions, VisioToolbar } from './classes/visio/toolbar.js';
import { VisioConnectors } from './connectors.js';
import { VisioFunctions } from './helpers.js';
export { Visio };

class Visio extends MelObject {
  constructor() {
    super();
  }

  main() {
    super.main();

    // FramesManager.Instance.attach('url', () => {
    //   const use_top = true;
    //   FramesManager.Helper.window_object.UpdateNavUrl(
    //     this.get_visio_url(),
    //     use_top,
    //   );

    //   Frames
    // });

    FramesManager.Instance.attach('before_url', () => {
      return 'break';
    });

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
     * @type {VisioToolbar}
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
      // if (this.data.wsp) {
      //   this._pad_promise = Drive.Instance.get(
      //     'pad',
      //     `/dossiers-${this.data.wsp}`,
      //   );
      // }

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

      {
        const use_top = true;
        FramesManager.Helper.window_object.UpdateNavUrl(
          this.get_visio_url(),
          use_top,
        );
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
            this._init_listeners();

            if (this.data.password) {
              this.jitsii.set_password(this.data.password);
            }
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

  get_visio_url() {
    const params = {
      _key: this.data.room,
    };

    if (this.data.wsp) params['_wsp'] = this.data.wsp;

    return this.url('webconf', {
      params,
    }).replace('&_is_from=iframe', EMPTY_STRING);
  }

  async _get_jwt() {
    let params = VisioConnectors.jwt.needed;
    params._room = this.data.room;
    return await BnumConnector.force_connect(VisioConnectors.jwt, { params });
  }

  _create_toolbar() {
    let toolbar = Toolbar.FromConfig(
      JSON.parse(this.get_env('visio.toolbar')),
      VisioToolbar,
    );

    this.rcmail().env['visio.toolbar'] = null;

    for (let element of toolbar) {
      if (element.attribs['data-inactive']) {
        toolbar.remove_item(element.id);
        continue;
      }

      switch (element.id) {
        case 'share_screen':
          if (InternetNavigator.IsFirefox()) {
            toolbar.remove_item(element.id);
            continue;
          }
          break;

        case 'documents':
        case 'pad':
          if (!this.data.wsp) toolbar.remove_item(element.id);
          break;

        default:
          break;
      }

      if (element.get) {
        for (let sub_element of element) {
          if (sub_element.attribs['data-inactive']) {
            element.remove_button(sub_element.id);

            if (
              MelEnumerable.from(element)
                .where((x) => !x.attribs.removed)
                .count() === 1
            ) {
              element.attribs['data-solo'] = true;
            }

            continue;
          }

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

    toolbar.toolbar().addClass('white-toolbar');

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

    // $(this.popover._pop.element.popper)
    //   .find('.bnum-popover-content')
    //   .css('padding', 0);
    this.rcmail().env['visio.toolbar.more'] = null;

    return toolbar;
  }

  async _init_listeners() {
    const promise_user_id = this.jitsii.get_user_id();

    this.jitsii.on_audio_mute_status_changed.push(
      this._event_on_audio_change.bind(this),
    );

    this.jitsii.on_video_mute_status_changed.push(
      this._event_on_video_change.bind(this),
    );

    this.jitsii.on_film_strip_display_changed.push(
      this._event_on_filmstrip_state_changed.bind(this),
    );

    this.jitsii.on_chat_updated.push(this._event_on_chat_updated.bind(this));

    this.jitsii.on_tile_view_updated.push(
      this._event_on_tileview_updated.bind(this),
    );

    this.jitsii.on_raise_hand_updated.push(
      this._event_on_raise_hand_updated.bind(this),
    );

    this.jitsii.on_share_screen_status_changed.push(
      this._event_on_share_screen_status_changed.bind(this),
    );

    this.jitsii.on_password_required.push(() => {
      this.jitsii._jitsi.executeCommand('password', this.data.password);
    });

    this.jitsii.on_chat_updated.call({
      unreadCount: 0,
      isOpen: false,
    });

    this.jitsii.on_share_screen_status_changed.call({
      on: false,
    });

    this.jitsii.on_raise_hand_updated.call({
      id: await promise_user_id,
      handRaised: 0,
    });
  }

  _event_on_audio_change(state) {
    this._update_icon_state(state.muted, 'mic');
  }

  _event_on_video_change(state) {
    this._update_icon_state(state.muted, 'camera');
  }

  _event_on_filmstrip_state_changed(state) {
    state = state.visible;
    return state;
  }

  _event_on_chat_updated(state) {
    this._update_icon_state(!state.isOpen, 'chat', (icon, disabled, button) => {
      if (state.unreadCount > 0) {
        icon = disabled
          ? button.$item.attr('data-has-unread-disabled-icon')
          : button.$item.attr('has-unread-icon');
      }

      if (state.isOpen) this.jitsii.get_frame({ jquery: false }).focus();
      else this.toolbar.get_button('chat').$item.focus();

      return icon;
    });
  }

  _event_on_tileview_updated(state) {
    this._update_icon_state(!state.enabled, 'moz');
  }

  async _event_on_raise_hand_updated(state) {
    const id = await this.jitsii.get_user_id();

    if (state.id === id)
      this._update_icon_state(state.handRaised === 0, 'handup');
  }

  _event_on_share_screen_status_changed(data) {
    this._update_icon_state(!data.on, 'share_screen');
  }

  _update_icon_state(disabled, button_id, callback_icon_ex = null) {
    const button = this.toolbar.get_button(button_id);

    if (button.$item.attr('data-disabled-icon')) {
      if (!(button.$item.attr('data-default-icon') || false))
        button.$item.attr(
          'data-default-icon',
          button.$item.children().first().text(),
        );

      const icon = !disabled
        ? button.$item.attr('data-default-icon')
        : button.$item.attr('data-disabled-icon');

      button.$item
        .children()
        .first()
        .text(
          callback_icon_ex
            ? callback_icon_ex(icon, disabled, button, this)
            : icon,
        );
    }

    const state_active = !disabled;
    this.toolbar.updateToolbarStateFromButton(state_active, button);

    return state_active;
  }
}
