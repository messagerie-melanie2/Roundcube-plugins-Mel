import { MelObject } from '../../../plugins/mel_metapage/js/lib/mel_object.js';

export class ABaseModule extends MelObject {
  constructor() {
    super();
  }

  init() {
    this._p_init();
    return this;
  }
  go() {
    this._p_main();
    return this;
  }
  after() {
    this._p_after();
    return this;
  }

  _p_init() {}
  _p_main() {}
  _p_after() {}

  static Start() {
    return new this.constructor();
  }
}
