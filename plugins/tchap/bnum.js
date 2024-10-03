import { MelObject } from '../mel_metapage/js/lib/mel_object.js';

const ENABLE_AVATAR_LOADING = false;
export class TchapBnum extends MelObject {
  constructor() {
    super();
  }

  main() {
    super.main();

    if (ENABLE_AVATAR_LOADING) this.load_url();

    const button = top.$('#button-tchap-chat');

    if (button) {
      button.on('click', this._button_on_click.bind(this));
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
    rcmail.addEventListener('frame_loaded', (args) => {
      const { eClass } = args;

      if (
        (eClass === 'tchap' &&
          this.get_env('current_frame_name') === 'tchap') ||
        (eClass === 'discussion' &&
          this.get_env('current_frame_name') === 'discussion')
      ) {
        $('#button-tchap-chat')
          .addClass('disabled')
          .attr('disabled', 'disabled');

        if ($('.tchap-frame').hasClass('tchap-card')) {
          $('.tchap-frame').removeClass('tchap-card');
        }
      } else if ($('#button-tchap-chat').hasClass('disabled')) {
        $('#button-tchap-chat').removeClass('disabled').removeAttr('disabled');
      }
    });

    return this;
  }

  _button_on_click() {
    let $tchap_frame = this.select_frame('tchap');

    if (!this.have_frame('tchap') || !$tchap_frame.hasClass('tchap-card')) {
      this.switch_frame('tchap', { changepage: false });

      $('.tchap-frame').addClass('frame-card a-frame tchap-card');
    } else {
      $tchap_frame.removeClass('tchap-card');

      if (this.get_env('current_frame_name') !== 'tchap')
        $tchap_frame.css('display', 'none');
    }
  }
}
