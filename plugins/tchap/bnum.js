import {
  FramesManager,
  MULTI_FRAME_FROM_NAV_BAR,
} from '../mel_metapage/js/lib/classes/frame_manager.js';
//import { MelHtml } from '../mel_metapage/js/lib/html/JsHtml/MelHtml.js';
import { MelObject } from '../mel_metapage/js/lib/mel_object.js';
import { Mel_Promise } from '../mel_metapage/js/lib/mel_promise.js';
import { MelHtml } from '../tchap/js/lib/jshtmlex.js';

const ENABLE_AVATAR_LOADING = false;
export class TchapBnum extends MelObject {
  constructor() {
    super();
  }

  main() {
    super.main();

    this._tchap_state = false;
    this._anchor = false;

    this.$tchap_frame = null;
    this.$tchap_frame_container = null;
    this.tchap_frame_container_element = null;

    Object.defineProperties(this, {
      $tchap_frame: {
        get: () => this.select_frame('tchap'),
      },
      $tchap_frame_container: {
        get: () => this.$tchap_frame.parent(),
      },
      tchap_frame_container_element: {
        get: () => this.$tchap_frame_container[0],
      },
    });

    if (ENABLE_AVATAR_LOADING) this.load_url();

    const button = top.$('#button-tchap-chat');

    if (button) {
      if (MULTI_FRAME_FROM_NAV_BAR) button.remove();
      else button.on('click', this._button_on_click.bind(this));
    }

    this._init_listener();
  }

  load_url() {
    return this.http_internal_get({
      task: 'tchap',
      action: 'avatar_url',
      on_success: (data) => {
        data = JSON.parse(data);

        if (data) {
          $('#user-picture').html($('<img />'));
          $('#user-picture img')[0].onerror = function () {
            $('#user-picture').html(
              "<span class='no-image avatar'>" +
                rcmail.env.username.slice(0, 1).toUpperCase() +
                '</span>',
            );
          };

          $('#user-picture img').attr('src', data);

          this.save('tchap_avatar_url', data);
        }
      },
    });
  }

  _init_listener() {
    rcmail.addEventListener('frame.opened', (args) => {
      const { task } = args;
      const not = ['tchap', 'discussion', 'visio'];

      let $button = $('#button-tchap-chat');

      if (
        not.includes(task) &&
        not.includes(FramesManager.Instance.current_frame().task)
      ) {
        $button.addClass('disabled').attr('disabled', 'disabled');

        if (this.$tchap_frame_container.hasClass('tchap-card')) {
          this.$tchap_frame_container.removeClass('tchap-card');
        }

        this.tchap_frame_container_element.remove_element('tchap');
      } else if ($button.hasClass('disabled')) {
        $button.removeClass('disabled').removeAttr('disabled');

        if (this._tchap_state) $button.click();
      }
    });

    return this;
  }

  async _button_on_click() {
    if (
      !this.have_frame('tchap') ||
      !this.$tchap_frame_container.hasClass('tchap-card')
    ) {
      this.switch_frame('tchap', { changepage: false });

      await Mel_Promise.wait(() => !!this.$tchap_frame_container.length);

      this.$tchap_frame_container.addClass('frame-card a-frame tchap-card');

      this.tchap_frame_container_element.add_element(
        'tchap',
        MelHtml.start
          .tchap_actions(
            this._button_on_click.bind(this),
            () => {
              if (this._anchor) {
                FramesManager.Instance.remove_tag('attach');
                this.tchap_frame_container_element
                  .get_element('tchap')
                  .find('.button-anchor bnum-icon')
                  .text('view_column_2');
                this._anchor = false;
              } else {
                FramesManager.Instance.add_tag('attach');
                this.tchap_frame_container_element
                  .get_element('tchap')
                  .find('.button-anchor bnum-icon')
                  .text('display_external_input');
                this._anchor = true;
              }
            },
            () => FramesManager.Instance.switch_frame('tchap', {}),
          )
          .end(),
        false,
      );

      if (this._anchor) {
        this.tchap_frame_container_element
          .get_element('tchap')
          .find('.button-anchor bnum-icon')
          .text('display_external_input');
      }

      this._tchap_state = true;
    } else {
      this.tchap_frame_container_element.remove_element('tchap');
      this.$tchap_frame_container.removeClass('tchap-card');

      if (this.get_env('current_frame_name') !== 'tchap')
        this.$tchap_frame_container.css('display', 'none');

      if (this._anchor) {
        this._anchor = false;
        FramesManager.Instance.remove_tag('attach');
      }

      this._tchap_state = false;
    }
  }
}
