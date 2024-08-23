import { MelEnumerable } from '../../../mel_metapage/js/lib/classes/enum.js';
import { EMPTY_STRING } from '../../../mel_metapage/js/lib/constants/constants.js';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';

export { FavoriteLoader };

/**
 * Contient les classes utiles pour la récupération et gestion des resources favorites
 * @module Resources/Favorites/Loaders
 * @local FavoriteData
 * @local FavoriteLoader
 * @local FavoriteLoaderWrapper
 */

/**
 * @typedef FavoriteData
 * @property {string} date
 * @property {import('./resource_base.js').ResourceData[]} data
 *
 */

/**
 * @class
 * @classdesc Récupère les données favorites. Récupère les favoris depuis le stockage local. Chaque jour, les données sont récupérés depuis le serveur avant d'être stocké en local.
 * @extends {MelObject}
 */
class FavoriteLoader extends MelObject {
  /**
   * Constructeur de la classe.
   *
   * Un loader existe par type de ressource.
   * @param {string} type Type de ressource. (flex office etc....)
   */
  constructor(type) {
    super(type);
  }

  /**
   * Fonction principale de la classe
   * @private
   * @param {string} type Type de ressource. (flex office etc....)
   * @override
   */
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

  /**
   * Sauvegarde des favoris en local
   * @param {import('./resource_base.js').ResourceData[]} favs Favoris à sauvegarder
   * @returns {FavoriteLoader} Chaînage
   */
  save_favorites(favs) {
    let loaded = this._set_date(moment().startOf('day'));

    loaded.data = favs;

    this.save(this.key, loaded);

    return this;
  }

  /**
   * Ajoute des favoris au stockage local
   * @param  {...import('./resource_base.js').ResourceData} favs Favoris à ajouter
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

  /**
   * Supprime des favoris. Se base sur les emails qui sont uniques.
   * @param  {...string} emails Favoris à supprimer
   * @returns {FavoriteLoader} Chaînage
   */
  remove_favorites(...emails) {
    let loaded = this._get_data_saved();

    loaded.data = MelEnumerable.from(loaded.data)
      .where((x) => !emails.includes(x.email))
      .toArray();

    return this.save_favorites(loaded.data);
  }

  clear() {
    this._cleared = true;
    return this._set_date(moment().startOf('day').substract(1, 'd'));
  }

  /**
   * Vérifie si les données sont obsolète ou non
   * @param {?FavoriteData} [loaded=null] Données déjà chargés. Si ce n'est pas le cas, les récupère depuis lo stockage local. Evite les chargements multiples.
   * @returns {boolean} Si vrai : pas obsolète, sinon obsolète.
   */
  is_same_date(loaded = null) {
    return (
      (loaded?.date ?? this._get_data_saved().date) ===
      moment().startOf('day').format()
    );
  }

  /**
   * Force la récupèration des données, sans passer par la récupération serveur.
   * @returns {import('./resource_base.js').ResourceData[]}
   */
  force_load_favorites() {
    return this._get_data_saved().data;
  }

  /**
   * Récupère les favoris, si les favoris local sont obsolète, les récupères depuis la bdd.
   * @returns {Promise<import('./resource_base.js').ResourceData[]}
   * @async
   */
  async load_favorites() {
    const loaded = this._get_data_saved();

    if (this._cleared || !this.is_same_date(loaded)) {
      const busy = rcmail.set_busy(true, 'loading');
      this._cleared = false;

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
   * Met le jour en cours en données local.
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
   * Récupère les données locales
   * @private
   * @returns {FavoriteData}
   */
  _get_data_saved() {
    return this.load(this.key, { date: moment().format(), data: [] });
  }

  /**
   * Sauvegarde les favoris dans le stockage local
   * @param {string} type Type de resource (flex office etc....)
   * @param {import('./resource_base.js').ResourceData[]} favs Favoris à sauvegarder
   * @returns {FavoriteLoader} Instance
   * @static
   */
  static Save(type, favs) {
    return this._Get(type).save_favorites(favs);
  }

  /**
   * Ajoute des favoris au stockage local
   * @param {string} type Type de resource (flex office etc....)
   * @param {...import('./resource_base.js').ResourceData} favs Favoris à sauvegarder
   * @returns {FavoriteLoader} Instance
   * @static
   */
  static Add(type, ...favs) {
    return this._Get(type).add_favorites(...favs);
  }

  /**
   * Supprime des favoris. Se base sur les emails qui sont uniques.
   * @param {string} type Type de resource (flex office etc....)
   * @param  {...string} emails Favoris à supprimer
   * @returns {FavoriteLoader} Chaînage
   * @static
   */
  static Remove(type, ...emails) {
    return this._Get(type).remove_favorites(...emails);
  }

  /**
   * Vérifie si les données sont obsolète ou non
   * @param {string} type Type de resource (flex office etc....)
   * @returns {boolean} Si vrai : pas obsolète, sinon obsolète.
   * @static
   */
  static IsSameDate(type) {
    return this._Get(type).is_same_date();
  }

  /**
   * Le prochain chargement de favoris sera depuis la bdd.
   * @param {?string} [type=null]
   * @returns {FavoriteData | typeof FavoriteLoader}
   */
  static Clear(type = null) {
    if (type) return this._Get(type).clear();
    else {
      const keys = Object.keys(
        JSON.parse(
          localStorage.getItem(mel_metapage.Storage._getDataStore().name),
        ),
      );

      for (const iterator of MelEnumerable.from(keys).where((x) =>
        x.includes('favorite-'),
      )) {
        mel_metapage.Storage.remove(iterator);
      }
      return this;
    }
  }

  /**
   * Force la récupèration des données, sans passer par la récupération serveur.
   * @param {string} type Type de resource (flex office etc....)
   * @returns {import('./resource_base.js').ResourceData[]}
   * @static
   */
  static Force_Load(type) {
    return this._Get(type).force_load_favorites();
  }

  /**
   * Récupère les favoris, si les favoris local sont obsolète, les récupères depuis la bdd.
   * @param {string} type Type de resource (flex office etc....)
   * @returns {Promise<import('./resource_base.js').ResourceData[]}
   * @async
   * @static
   */
  static async Load(type) {
    let instance = this._Get(type);

    if (instance._promise) {
      let data = await instance._promise;
      instance._promise = null;

      return data;
    } else return await this._Get(type).load_favorites();
  }

  /**
   * Commence à récupèrer les favoris depuis la base
   * @param {string} type Type de resource (flex office etc....)
   * @returns {typeof FavoriteLoader}
   * @static
   */
  static StartLoading(type) {
    if (!this.IsSameDate(type)) {
      this._Get(type)._promise = this.Load(type);
    }

    return this;
  }

  /**
   * Récupère une instance de FavoriteLoader en fonction du type.
   *
   * Les instances sont détruites au bout de 5 minutes.
   * @private
   * @param {string} type Type de resource (flex office etc....)
   * @returns {FavoriteLoader} Instance
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

/**
 * @typedef FavoriteLoaderWrapper
 * @property {?number} timeout Id du timeout
 * @property {FavoriteLoader} loader Instance du loader
 */

/**
 * Instances de FavoritesLoaders
 * @package
 * @type {Object<string, FavoriteLoaderWrapper>}
 * @frommodule Resources/Favorites/Loaders {@linkto FavoriteLoaderWrapper}
 */
let instances = {};
