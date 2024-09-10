import {
  FramesManager,
  MULTI_FRAME_FROM_NAV_BAR,
} from '../mel_metapage/js/lib/classes/frame_manager.js';
import { MelObject } from '../mel_metapage/js/lib/mel_object.js';

const ENABLE_AVATAR_LOADING = false;
export class TchapBnum extends MelObject {
  constructor() {
    super();
  }

  main() {
    super.main();

    this._tchap_state = false;

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

        if ($('.tchap-frame').hasClass('tchap-card')) {
          $('.tchap-frame').removeClass('tchap-card');
        }
      } else if ($button.hasClass('disabled')) {
        $button.removeClass('disabled').removeAttr('disabled');

        if (this._tchap_state) $button.click();
      }
    });

    return this;
  }

  _button_on_click() {
    let $tchap_frame = this.select_frame('tchap');

    if (!this.have_frame('tchap') || !$tchap_frame.hasClass('tchap-card')) {
      this.switch_frame('tchap', { changepage: false });

      $('.tchap-frame').addClass('frame-card a-frame tchap-card');
      this._tchap_state = true;
    } else {
      $tchap_frame.removeClass('tchap-card');

      if (this.get_env('current_frame_name') !== 'tchap')
        $tchap_frame.css('display', 'none');

      this._tchap_state = false;
    }
  }
}
