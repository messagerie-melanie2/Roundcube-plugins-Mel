import { MelObject } from '../mel_metapage/js/lib/mel_object.js';

export class TchapBnum extends MelObject {
  constructor() {
    super();
  }

  main() {
    super.main();

    this.load_url();
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
}
