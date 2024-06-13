import { MelEnumerable } from '../../../mel_metapage/js/lib/classes/enum';
import { EMPTY_STRING } from '../../../mel_metapage/js/lib/constants/constants';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';

export { FavoriteLoader };

/**
 * @typedef FavoriteData
 * @property {string} date
 * @property {import('./resource_base.js').ResourceData[]} data
 *
 */

class FavoriteLoader extends MelObject {
  constructor(type) {
    super(type);
  }

  main(type) {
    super.main(type);

    this._type = type;

    this.key = EMPTY_STRING;

    Object.defineProperties(this, {
      key: {
        value: `favorite-${this._type}`,
        enumerable: true,
        writable: false,
        configurable: false,
      },
    });
  }

  save_favorites(favs) {
    let loaded = this._set_date(moment().startOf('day'));

    loaded.data = favs;

    this.save(this.key, loaded);

    return this;
  }

  /**
   *
   * @param  {...import('./resource_base.js').ResourceData} favs
   * @returns {FavoriteLoader} chaînage
   */
  add_favorites(...favs) {
    let loaded = this._get_data_saved();

    for (const iterator of favs) {
      if (!loaded.data.filter((x) => x.email === iterator.email).length) {
        loaded.data.push(iterator);
      }
    }

    return this.save_favorites(loaded.data);
  }

  remove_favorites(...emails) {
    let loaded = this._get_data_saved();

    loaded.data = MelEnumerable.from(loaded.data)
      .where((x) => !emails.includes(x.email))
      .toArray();

    return this.save_favorites(loaded.data);
  }

  is_same_date(loaded = null) {
    return (
      (loaded?.date ?? this._get_data_saved().date) ===
      moment().startOf('day').format()
    );
  }

  force_load_favorites() {
    return this._get_data_saved().data;
  }

  /**
   *
   * @returns {Promise<import('./resource_base.js').ResourceData[]}
   */
  async load_favorites() {
    const loaded = this._get_data_saved();

    if (!this.is_same_date(loaded)) {
      const busy = rcmail.set_busy(true, 'loading');

      await this.http_internal_post({
        task: 'mel_cal_resources',
        action: 'load_favorites',
        on_success: (rcs) => {
          if (typeof rcs === 'string') rcs = JSON.parse(rcs);

          this.save_favorites(rcs || []);
        },
      }).always(() => {
        rcmail.set_busy(false, 'loading', busy);
      });

      return await this.load_favorites();
    } else return loaded.data;
  }

  /**
   * @private
   * @param {external:moment} date
   * @returns {FavoriteData}
   */
  _set_date(date) {
    let loaded = this._get_data_saved();

    loaded.date = date.format();

    return loaded;
  }

  /**
   * @private
   * @returns {FavoriteData}
   */
  _get_data_saved() {
    return this.load(this.key, { date: moment().format(), data: [] });
  }

  static Save(type, favs) {
    return this._Get(type).save_favorites(favs);
  }

  static Add(type, ...favs) {
    return this._Get(type).add_favorites(...favs);
  }

  static Remove(type, ...emails) {
    return this._Get(type).remove_favorites(...emails);
  }

  static IsSameDate(type) {
    return this._Get(type).is_same_date();
  }

  static Force_Load(type) {
    return this._Get(type).force_load_favorites();
  }

  /**
   *
   * @returns {Promise<import('./resource_base.js').ResourceData[]}
   */
  static async Load(type) {
    let instance = this._Get(type);

    if (instance._promise) {
      let data = await instance._promise;
      instance._promise = null;

      return data;
    } else return await this._Get(type).load_favorites();
  }

  static StartLoading(type) {
    if (!this.IsSameDate(type)) {
      this._Get(type)._promise = this.Load(type);
    }

    return this;
  }

  /**
   *
   * @param {*} type
   * @returns {FavoriteLoader}
   */
  static _Get(type) {
    if (!instances[type]) {
      instances[type] = {
        timeout: null,
        loader: new FavoriteLoader(type),
      };

      if (instances[type].timeout) clearTimeout(instances[type].timeout);

      instances[type].timeout = setTimeout(
        () => {
          instances[type] = null;
        },
        5 * 60 * 60 * 1000,
      );
    }

    return instances[type].loader;
  }
}

let instances = {};
