import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';

export class IndexWorkspace extends MelObject {
  constructor() {
    super();
  }

  main() {
    super.main();

    $('#mode-block').on('api:pressed', () => {
      document.querySelector('#mode-list').unpress();
      $('[data-linked-to="subscribed"]').removeClass('mode-list');
    });

    $('#mode-list').on('api:pressed', () => {
      document.querySelector('#mode-block').unpress();
      $('[data-linked-to="subscribed"]').addClass('mode-list');
    });
  }
}
