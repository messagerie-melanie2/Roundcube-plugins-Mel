/**
 * @namespace Tchap
 * @memberof Plugins
 */

import { MelObject } from '../mel_metapage/js/lib/mel_object.js';

export class TchapInit extends MelObject {
  constructor() {
    super();
  }

  main() {
    super.main();
  }

  generate_listeners() {
    const button = top.$('#button-tchap-chat')[0];

    if (button) {
      button.click(this.button_left_clicked.bind(this));
    }
  }

  button_left_clicked() {}
}

$(document).ready(() => {
  const button = top.$('#button-tchap-chat')[0];

  if (button) {
    button.addEventListener('click', () => {
      let $tchap_frame = $('.tchap-frame');

      if ($tchap_frame.length && !$tchap_frame.hasClass('tchap-card')) {
        mel_metapage.Functions.change_frame('tchap', false, false);
        $('.tchap-frame').addClass('frame-card a-frame tchap-card');
      } else {
        $tchap_frame.removeClass('tchap-card');

        if (rcmail.env.current_frame_name !== 'tchap')
          $tchap_frame.css('display', 'none');
      }
      //affiché la frame
    });
    rcmail.addEventListener('frame_loaded', (args) => {
      const { eClass } = args;

      if (
        (eClass === 'tchap' && rcmail.env.current_frame_name === 'tchap') ||
        (eClass === 'discussion' &&
          rcmail.env.current_frame_name === 'discussion')
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
  }
});
