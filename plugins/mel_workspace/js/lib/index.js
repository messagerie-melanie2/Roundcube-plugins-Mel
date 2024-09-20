import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';

export class IndexWorkspace extends MelObject {
  constructor() {
    super();
  }

  main() {
    super.main();

    $('#mode-block')
      .on('api:pressed', (e) => {
        $(e.currentTarget).attr('tabindex', -1);
        document
          .querySelector('#mode-list')
          .unpress()
          .setAttribute('tabindex', 0);
        let control = $('bnum-tabs')
          .removeClass('mode-list')
          .find('button.mel-tabheader.active')
          .attr('aria-controls');

        $(`#${control}`).focus();
      })
      .parent()
      .find('[aria-pressed="true"], [data-start-pressed="true"]')
      .attr('tabindex', -1);

    $('#mode-list').on('api:pressed', (e) => {
      $(e.currentTarget).attr('tabindex', -1);
      document
        .querySelector('#mode-block')
        .unpress()
        .setAttribute('tabindex', 0);
      let control = $('bnum-tabs')
        .addClass('mode-list')
        .find('button.mel-tabheader.active')
        .attr('aria-controls');

      $(`#${control}`).focus();
    });
  }
}
