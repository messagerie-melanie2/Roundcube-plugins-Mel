import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';

export class PageNavBar extends MelObject {
  constructor() {
    super();

    console.log('[PageNavBar]test', window, parent, top);
  }

  static Start() {
    return new PageNavBar();
  }
}

PageNavBar.Start();
