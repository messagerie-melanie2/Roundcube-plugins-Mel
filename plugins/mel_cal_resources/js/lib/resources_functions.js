import { EMPTY_STRING } from '../../../mel_metapage/js/lib/constants/constants';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { ResourcesBase } from './resource_base.js';

export { ResourceBaseFunctions };

class FunctionFrom {
  constructor(callback, thisArgs) {
    this._callback = callback;
    this._this = thisArgs;
  }

  call(...args) {
    return this._callback.call(this._this, ...args);
  }

  get(...args) {
    return this._callback.bind(this._this, ...args);
  }
}

class ResourceBaseFunctions extends MelObject {
  constructor(resourceBase) {
    super(resourceBase);
  }

  main(resourceBase) {
    this._resourceBase = resourceBase;

    const mobj_functions = Object.getOwnPropertyNames(MelObject.prototype);

    for (const iterator of Object.getOwnPropertyNames(this.__proto__)) {
      if (!mobj_functions.includes(iterator))
        this[iterator] = new FunctionFrom(
          this[iterator],
          this._resourceBase,
        ).get();
    }
  }

  /**
   * @this {ResourcesBase}
   */
  on_star_clicked(e) {
    const busy = this.rcmail().set_busy(true, 'loading');
    const id = $(e.currentTarget).data('email');
    const favorite = !JSON.parse(
      $(e.currentTarget).attr('data-favorite') ?? 'false',
    );

    $(e.currentTarget)
      .attr('data-favorite', favorite)
      .addClass('disabled')
      .attr('disabled', 'disabled');

    this.http_internal_post({
      task: 'mel_cal_resources',
      action: 'set_favorite',
      params: {
        _favorite: favorite,
        _uid: id,
      },
      on_success: (data) => {
        if (!this.get_env('fav_resources'))
          this.rcmail().env.fav_resources = [];

        this.rcmail().env.fav_resources[id] = favorite;
        this._on_data_changed();
        this.rcmail().set_busy(false, 'loading', busy);
        return data;
      },
    });
  }
}
