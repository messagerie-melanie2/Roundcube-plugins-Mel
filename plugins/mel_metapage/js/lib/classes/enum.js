/**
 * @module MelLinq
 */

import { isArrayLike } from '../mel.js';

export { MelEnumerable, MelKeyValuePair };
/**
 * @callback WhereCallback
 * @param {*} item
 * @param {number} index
 * @returns {Boolean}
 */

/**
 * @callback SelectCallback
 * @param {*} item
 * @param {number} index
 * @returns {*}
 */

/**
 * @callback SelectorCallback
 * @param {*} item
 * @returns {*}
 */

/**
 * @class
 * @classdesc Représentation d'un valeur et de sa clé
 */
class MelKeyValuePair {
  /**
   *
   * @param {!string | !number} key Clé qui est lié à la valeur
   * @param {*} value Valeur
   */
  constructor(key, value) {
    let _key = key;
    let _value = value;

    /**
     * Clé qui est lié à la valeur
     * @type {!string | !number}
     * @readonly
     */
    this.key;
    /**
     * Valeur qui est lié à une clé
     * @type {*}
     * @readonly
     */
    this.value;
    Object.defineProperties(this, {
      key: {
        get: () => {
          return _key;
        },
        configurable: false,
      },
      value: {
        get: () => {
          return _value;
        },
        configurable: false,
      },
    });
  }
}

class RotomecaGenerator {
  constructor(iterable) {
    this.iterable = iterable;
  }

  *[Symbol.iterator]() {
    for (const iterator of this.next()) {
      yield iterator;
    }
  }

  where(callback) {
    return new RotomecaWhereGenerator(this, callback);
  }

  select(callback) {
    return new RotomecaSelectGenerator(this, callback);
  }

  groupBy(key_selector, value_selector = null) {
    return new RotomecaGroupByGenerator(this, key_selector, value_selector);
  }

  orderBy(selector) {
    return new RotomecaOrderGenerator(this, selector);
  }

  orderByDescending(selector) {
    return new RotomecaOrderByDesendingGenerator(this, selector);
  }

  then(selector) {
    return new RotomecaThenGenerator(this, selector);
  }

  thenDescending(selector) {
    return new RotomecaThenDescendingGenerator(this, selector);
  }

  reverse() {
    return new RotomecaReverseGenerator(this);
  }

  take(howMany) {
    return new RotomecaTakeGenerator(this, howMany);
  }

  add(item) {
    return this.aggregate(item);
  }

  aggregate(iterable) {
    return new RotomecaAggegateGenerator(this, iterable);
  }

  remove(item) {
    return new RotomecaRemoveGenerator(this, item);
  }

  removeAt(index) {
    return new RotomecaRemoveAtIndexGenerator(this, index);
  }

  distinct(selector = null) {
    return new RotomecaDistinctGenerator(this, selector);
  }

  except(array) {
    return new RotomecaExceptGenerator(this, array);
  }

  intersect(array) {
    return new RotomecaIntersectGenerator(this, array);
  }

  union(array, c = null) {
    return new RotomecaUnionGenerator(this, array, c);
  }

  any(callback = null) {
    let it = 0;
    for (const iterator of this) {
      if (!callback) return true;
      else if (callback(iterator, it++)) return true;
    }

    return false;
  }

  all(callback = null) {
    return !this.any((value, index) => {
      return !callback(value, index);
    });
  }

  contains(item) {
    return this.any((value, index) => {
      return value === item;
    });
  }

  first(callback = null) {
    const not_exist = Symbol();
    const value = this.firstOrDefault(not_exist, callback);

    if (value === not_exist) throw 'Item not exist';
    else return value;
  }

  firstOrDefault(default_value = null, callback = null) {
    let generator = callback ? this.where(callback) : this;

    for (const iterator of generator) {
      return iterator;
    }

    return default_value;
  }

  last(where = null) {
    const not_exist = Symbol();
    const value = this.lastOrDefault({ default_value: not_exist, where });

    if (value === not_exist) throw 'Item not exist';
    else return value;
  }

  lastOrDefault({ default_value = null, where = null }) {
    let generator = this;

    if (where) generator = generator.where(where);

    let last = default_value;
    for (const iterator of generator) {
      last = iterator;
    }

    return last;
  }

  flat() {
    return new RotomecaFlatGenerator(this);
  }

  *next() {
    let iterable;

    if (typeof this.iterable === 'function' && !!this.iterable.prototype.next)
      iterable = this.iterable();
    else iterable = this.iterable;

    for (const iterator of iterable) {
      yield iterator;
    }
  }

  count() {
    if (!this.length) {
      this.length = 0;
      for (const iterator of this) {
        ++this.length;
      }
    }

    return this.length;
  }

  join(separator = '') {
    return this.toArray().join(separator);
  }

  sum({ where = null, selector = null }) {
    let generator = this;

    if (where) generator = generator.where(where);
    if (selector) generator = generator.select(selector);

    let sum = 0;
    for (const iterator of generator) {
      sum += iterator;
    }

    return sum;
  }

  _findMinMax() {
    let array = this.toArray();
    const length = array.length;

    let max, min, i;

    if (length % 2 !== 0) {
      max = array[0];
      min = array[0];
      i = 1;
    } else {
      if (array[0] >= array[1]) {
        max = array[0];
        min = array[1];
      } else {
        max = array[1];
        min = array[0];
      }
      i = 2;
    }

    while (i < length) {
      if (array[i] < array[i + 1]) {
        if (array[i] < min) min = array[i];
        if (array[i + 1] > max) max = array[i + 1];
      } else {
        if (array[i + 1] < min) min = array[i + 1];
        if (array[i] > max) max = array[i];
      }
      i += 2;
    }

    return { min, max };
  }

  max(selector = null) {
    let generator = selector ? this.select(selector) : this;

    return generator._findMinMax().max;
  }

  min(selector = null) {
    let generator = selector ? this.select(selector) : this;

    return generator._findMinMax().min;
  }

  toArray() {
    let arr = [];
    for (const iterator of this) {
      arr.push(iterator);
    }

    return arr;
  }

  toJsonObject(key_selector, value_selector) {
    let i = 0;
    let obj = {};
    for (const iterator of this) {
      obj[key_selector(iterator, i)] = value_selector(iterator, i);
      ++i;
    }

    return obj;
  }
}

class ARotomecaCallbackGenerator extends RotomecaGenerator {
  constructor(iterable, callback) {
    super(iterable);
    this.callback = callback;
  }
}

class RotomecaWhereGenerator extends ARotomecaCallbackGenerator {
  constructor(iterable, callback) {
    super(iterable, callback);
  }

  *next() {
    let star_parent = super.next();

    let i = 0;
    for (const iterator of star_parent) {
      if (this.callback(iterator, i++)) yield iterator;
    }
  }
}

class RotomecaSelectGenerator extends ARotomecaCallbackGenerator {
  constructor(iterable, callback) {
    super(iterable, callback);
  }

  *next() {
    let star_parent = super.next();

    let i = 0;
    for (const iterator of star_parent) {
      yield this.callback(iterator, i++);
    }
  }
}

class ARotomecaKeyValueSelector extends ARotomecaCallbackGenerator {
  constructor(iterable, key_selector, value_selector = null) {
    super(iterable, value_selector);
    this.key_selector = key_selector;
  }
}

class RotomecaGroupedItems {
  constructor(key, iterable) {
    this.iterable = iterable;
    this.key = key;
  }

  *next() {
    let star_parent = this.iterable;

    for (const iterator of star_parent) {
      yield new MelKeyValuePair(this.key, iterator);
    }
  }

  get_values(try_get_array = true) {
    if (try_get_array && this.iterable instanceof MelEnumerable) {
      if (Array.isArray(this.iterable.generator()))
        return this.iterable.generator();
      else if (
        this.iterable.generator() instanceof RotomecaGenerator &&
        Array.isArray(this.iterable.generator().iterable)
      )
        return this.iterable.generator().iterable;
    }

    return this.iterable;
  }
}

class RotomecaGroupByGenerator extends ARotomecaKeyValueSelector {
  constructor(iterable, key_selector, value_selector = null) {
    super(iterable, key_selector, value_selector);
  }

  *next() {
    let star_parent = super.next();

    let key;
    let datas = {};
    for (const item of star_parent) {
      key = this.key_selector(item);

      if (!datas[key]) datas[key] = [];

      datas[key].push(this.callback ? this.callback(item) : item);
    }

    for (const key in datas) {
      if (Object.hasOwnProperty.call(datas, key)) {
        const element = datas[key];
        yield new RotomecaGroupedItems(key, MelEnumerable.from(element));
      }
    }
  }
}

class ARotomecaOrderGenerator extends ARotomecaCallbackGenerator {
  constructor(iterable, selector) {
    super(iterable, selector);
  }

  sort(a, b) {
    return 0;
  }

  *next() {
    let star_parent = super.next();

    let array = [];

    for (const iterator of star_parent) {
      array.push(iterator);
    }

    array = array.sort((a, b) => {
      return this.sort(a, b);
    });

    for (const iterator of array) {
      yield iterator;
    }

    array = null;
  }
}

class RotomecaOrderGenerator extends ARotomecaOrderGenerator {
  constructor(iterable, selector) {
    super(iterable, selector);
  }

  sort(a, b) {
    super.sort(a, b);
    a = this.callback(a);
    b = this.callback(b);
    if (a > b) return 1;
    else if (b > a) return -1;
    return 0;
  }
}

class RotomecaOrderByDesendingGenerator extends RotomecaOrderGenerator {
  constructor(iterable, selector) {
    super(iterable, selector);
  }

  sort(a, b) {
    return -super.sort(a, b);
  }
}

class RotomecaThenGenerator extends ARotomecaOrderGenerator {
  constructor(iterable, selector) {
    super(iterable, selector);
  }

  sort(a, b) {
    super.sort(a, b);
    if (a === b) {
      a = this.callback(a);
      b = this.callback(b);

      if (a > b) return 1;
      else if (b > a) return -1;
    }

    return 0;
  }
}

class RotomecaThenDescendingGenerator extends RotomecaThenGenerator {
  constructor(iterable, selector) {
    super(iterable, selector);
  }

  sort(a, b) {
    return -super.sort(a, b);
  }
}

class ARotomecaItemModifierGenerator extends RotomecaGenerator {
  constructor(iterable, item) {
    super(iterable);
    this.item = item;
  }

  *next() {
    yield* super.next();
  }
}

class RotomecaAggegateGenerator extends ARotomecaItemModifierGenerator {
  constructor(iterable, item) {
    super(iterable, item);
  }

  *next() {
    let star_parent = super.next();

    for (const iterator of star_parent) {
      yield iterator;
    }

    if (
      Array.isArray(this.item) ||
      typeof this.item[Symbol.iterator] === 'function'
    ) {
      for (const iterator of this.item) {
        yield iterator;
      }
    } else if (typeof this.item === 'function' && !!this.item.prototype.next) {
      for (const iterator of this.item()) {
        yield iterator;
      }
    } else yield this.item;
  }
}

class ARotomecaRemoverGenerator extends ARotomecaItemModifierGenerator {
  constructor(iterable, item) {
    super(iterable, item);
  }

  *next() {
    let star_parent = super.next();
    this.before();

    for (const iterator of star_parent) {
      if (this.compare(iterator) !== this.item) yield iterator;
    }

    this.after();
  }

  compare(item) {
    return item;
  }

  before() {}
  after() {}
}

class RotomecaRemoveGenerator extends ARotomecaRemoverGenerator {
  constructor(iterable, item) {
    super(iterable, item);
  }
}

class RotomecaRemoveAtIndexGenerator extends ARotomecaRemoverGenerator {
  constructor(iterable, item) {
    super(iterable, item);
    this.it = 0;
  }

  compare(item) {
    super.compare(item);
    return this.it++;
  }

  before() {
    super.before();
    this.it = 0;
  }
}

class RotomecaFlatGenerator extends RotomecaGenerator {
  constructor(iterable) {
    super(iterable);
  }

  *next() {
    let star_parent = super.next();

    for (const iterator of star_parent) {
      yield* this.generate(iterator);
    }
  }

  *generate(iterator) {
    if (this.check(iterator)) {
      for (const item of iterator) {
        if (this.check(item)) {
          yield* this.generate(item);
        } else yield item;
      }
    } else yield iterator;
  }

  check(iterator) {
    return (
      typeof iterator !== 'string' &&
      (Array.isArray(iterator) ||
        isArrayLike(iterator) ||
        typeof iterator[Symbol.iterator] === 'function')
    );
  }
}

//TO ADD
class RotomecaDistinctGenerator extends ARotomecaCallbackGenerator {
  constructor(iterable, selector) {
    super(iterable, selector);
  }

  *next() {
    let star_parent = super.next();
    let things = [];
    const have_selector = !!this.callback;

    let item;
    for (const iterator of star_parent) {
      item = have_selector ? this.callback(iterator) : iterator;
      if (!things.includes(item)) {
        yield item;
        things.push(item);
      }
    }

    things = null;
  }
}

//TO ADD
class RotomecaExceptGenerator extends ARotomecaItemModifierGenerator {
  constructor(iterable, array) {
    super(iterable, MelEnumerable.from(array).generator());
  }

  *next() {
    let star_parent = super.next();

    for (const iterator of star_parent) {
      if (!this.item.contains(iterator)) {
        yield iterator;
      }
    }
  }
}

class RotomecaUnionGenerator extends ARotomecaItemModifierGenerator {
  constructor(iterable, array, callback = null) {
    super(iterable, array);
    this.callback = callback;

    this.things = [];
    this.current = null;
  }

  *next() {
    let star_parent = super.next();
    const have_selector = !!this.callback;

    this.things = [];
    this.current = null;

    yield* this.generate(have_selector, star_parent);
    yield* this.generate(have_selector, this.item);

    this.things = [];
    this.current = null;
  }

  *generate(have_selector, generator) {
    for (const iterator of generator) {
      this.current = have_selector ? this.callback(iterator) : iterator;
      if (!this.things.includes(this.current)) {
        yield this.current;
        this.things.push(this.current);
      }
    }
  }
}

class RotomecaIntersectGenerator extends ARotomecaItemModifierGenerator {
  constructor(iterable, array) {
    super(iterable, array);
  }

  *next() {
    let star_parent = super.next();

    for (const iterator of star_parent) {
      if (this.item.contains(iterator)) {
        yield iterator;
      }
    }
  }
}

class RotomecaReverseGenerator extends RotomecaGenerator {
  constructor(iterable) {
    super(iterable); //RotomecaOrderByDesendingGenerator
  }

  *next() {
    let order = MelEnumerable.from(super.next()).toArray();

    for (let len = order.length, index = len - 1; index >= 0; --index) {
      yield order[index];
    }
  }
}

class RotomecaTakeGenerator extends ARotomecaItemModifierGenerator {
  constructor(iterable, number) {
    super(iterable, number);
  }

  *next() {
    let p = super.next();

    let it = 0;
    for (const iterator of p) {
      yield iterator;

      if (++it === this.item) break;
    }
    it = null;
  }
}

class ObjectKeyEnumerable extends RotomecaGenerator {
  constructor(object) {
    super();
    this.iterable = MelEnumerable.from(this._generate.bind(this, object));
  }

  *_generate(object) {
    for (const key in object) {
      if (Object.hasOwnProperty.call(object, key)) {
        const element = object[key];
        yield new MelKeyValuePair(key, element);
      }
    }
  }
}

/**
 * @callback RGenerator
 * @returns {MelEnumerable}
 */

/**
 * Classe principale des enumerations.
 *
 * Permet d'avoir un comportement semblable à System.Linq du C#
 * @class
 * @see {@link https://docs.microsoft.com/en-us/dotnet/api/system.linq}
 * @hideconstructor
 */
class MelEnumerable {
  /**
   * @param {Generator | Array | MelEnumerable | RotomecaGenerator | JSON} generator
   */
  constructor(generator) {
    let _generator = generator;

    /**
     * Récupère le générateur.
     * @readonly
     * @type {RGenerator}
     */
    this.generator = undefined;
    Object.defineProperty(this, 'generator', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: function () {
        return _generator;
      },
    });
  }

  /**
   * Récupère que les éléments dont callback retourne "vrai"
   * @param {WhereCallback} callback Fonction qui servira à tester les éléments
   * @generator
   * @returns {MelEnumerable}
   */
  where(callback) {
    return new MelEnumerable(this.generator().where(callback));
  }

  /**
   * Sélectionne une donnée à partir des éléments de l'énumération
   * @param {SelectCallback} selector
   * @generator
   * @returns {MelEnumerable}
   */
  select(selector) {
    return new MelEnumerable(this.generator().select(selector));
  }

  /**
   * Groupe les données par clé et par valeur.
   * @param {SelectorCallback} key_selector Génère les différentes clés
   * @param {?SelectorCallback} value_selector Génère les différentes valeurs, l'élément entier est pris si null
   * @returns {MelEnumerable}
   * @generator
   */
  groupBy(key_selector, value_selector = null) {
    return new MelEnumerable(
      this.generator().groupBy(key_selector, value_selector),
    );
  }

  /**
   * Tri les données (croissant)
   * @param {SelectorCallback} selector
   * @returns {MelEnumerable}
   * @generator
   */
  orderBy(selector) {
    return new MelEnumerable(this.generator().orderBy(selector));
  }

  /**
   * Tri les données (décroissant)
   * @param {SelectorCallback} selector
   * @returns {MelEnumerable}
   * @generator
   */
  orderByDescending(selector) {
    return new MelEnumerable(this.generator().orderByDescending(selector));
  }

  /**
   * Tri les données (croissant), à utiliser après orderBy
   * @param {SelectorCallback} selector
   * @returns {MelEnumerable}
   * @generator
   */
  then(selector) {
    return new MelEnumerable(this.generator().then(selector));
  }

  /**
   * Tri les données (décroissant), à utiliser après orderBy
   * @param {SelectorCallback} selector
   * @returns {MelEnumerable}
   * @generator
   */
  thenDescending(selector) {
    return new MelEnumerable(this.generator().thenDescending(selector));
  }

  /**
   * Ajoute un objet à l'énumération
   * @param {*} item
   * @returns {MelEnumerable}
   * @generator
   */
  add(item) {
    return new MelEnumerable(this.generator().add(item));
  }

  /**
   * Ajoute un itérable à l'énumération
   * @param {Array | Generator} iterable
   * @returns {MelEnumerable}
   * @generator
   */
  aggregate(iterable) {
    return new MelEnumerable(this.generator().aggregate(iterable));
  }

  /**
   * Supprime un objet à l'énumération si il est présent
   * @param {*} item
   * @returns {MelEnumerable}
   * @generator
   */
  remove(item) {
    return new MelEnumerable(this.generator().remove(item));
  }

  /**
   * Supprime un objet à un index de l'énumération si il est présent
   * @param {number} index
   * @returns {MelEnumerable}
   * @generator
   */
  removeAt(index) {
    return new MelEnumerable(this.generator().removeAt(index));
  }

  /**
   * Empèche d'avoir 2 valeurs identiques dans l'énumération
   * @param {?SelectorCallback} selector
   * @returns {MelEnumerable}
   * @generator
   */
  distinct(selector = null) {
    return new MelEnumerable(this.generator().distinct(selector));
  }

  /**
   * Empèche d'avoir les valeurs du tableau dans l'énumération
   * @param {any[] | Generator} array
   * @returns {MelEnumerable}
   * @generator
   */
  except(array) {
    return new MelEnumerable(this.generator().except(array));
  }

  /**
   * Empèche d'avoir les valeurs en commun du tableau dans l'énumération
   * @param {any[] | Generator} array
   * @returns {MelEnumerable}
   * @generator
   */
  intersect(array) {
    return new MelEnumerable(this.generator().intersect(array));
  }

  /**
   * Fusionne les 2 tableaux
   * @param {any[] | Generator} array
   * @param {?SelectorCallback} selector
   * @returns {MelEnumerable}
   * @generator
   */
  union(array, selector = null) {
    return new MelEnumerable(this.generator().union(array, selector));
  }

  /**
   * Renvoie l'énumération à l'envers
   * @returns {MelEnumerable}
   * @generator
   */
  reverse() {
    return new MelEnumerable(this.generator().reverse());
  }

  /**
   * Prend les x premiers éléments
   * @param {number} howMany x premiers éléments à prendre
   * @returns {MelEnumerable}
   * @generator
   */
  take(howMany) {
    return new MelEnumerable(this.generator().take(howMany));
  }

  /**
   * Retourne vrai si il y a au moins un élément dans l'énumération.
   * @param {?WhereCallback} callback Si défini, éffectue un `where` avant de faire le any.
   * @returns {boolean}
   * @see {@link MelEnumerable~where}
   */
  any(callback = null) {
    return this.generator().any(callback);
  }

  /**
   * Retourne vrai si tout les éléments existent dans l'énumération.
   * @param {?WhereCallback} callback Si défini, éffectue un `where` avant de faire le all.
   * @returns {boolean}
   * @see {@link MelEnumerable~where}
   */
  all(callback = null) {
    return this.generator().all(callback);
  }

  /**
   * Retourne vrai si l'élément existe dans l'énumération.
   * @param {*} item
   * @returns {boolean}
   */
  contains(item) {
    return this.generator().contains(item);
  }

  /**
   * Retourne le premier élément dans l'énumération.
   * @param {?WhereCallback} callback Si défini, éffectue un `where` avant de faire le first.
   * @returns {*}
   * @throws If null
   */
  first(callback = null) {
    return this.generator().first(callback);
  }

  /**
   * Retourne le premier élément dans l'énumération.
   * @param {?any} default_value Valeur par défaut si on ne trouve rien
   * @param {?WhereCallback} callback Si défini, éffectue un `where` avant de faire le firstOrDefault.
   * @returns {*}
   */
  firstOrDefault(default_value = null, callback = null) {
    return this.generator().firstOrDefault(default_value, callback);
  }

  /**
   * La fonction `last` renvoie le dernier élément d'un générateur, éventuellement filtré par une
   * condition.
   * @param {?WhereCallback} where - Le paramètre "where" est une fonction qui détermine si un élément doit être
   * inclus ou non dans la recherche. Il permet de filtrer les éléments avant de retrouver le dernier. Si
   * la fonction "where" renvoie vrai pour un élément, celui-ci sera inclus dans la recherche ; sinon, ce
   * sera
   * @returns Le dernier élément du générateur qui satisfait la condition donnée.
   */
  last(where = null) {
    return this.generator().last(where);
  }

  /**
   * La fonction renvoie le dernier élément d'un générateur ou une valeur par défaut si le générateur est
   * vide.
   * @param {Object} param0
   * @param {?any} [param0.default_value=null] Valeur par défaut si on ne trouve rien
   * @param {?WhereCallback} [param0.where=null] Fonction where qui sera appliqué avant de récupérer le dernier élément
   * @returns La fonction lastOrDefault renvoie le résultat de l'appel de la fonction lastOrDefault du
   * générateur avec les paramètres fournis.
   */
  lastOrDefault({ default_value = null, where = null }) {
    return this.generator().lastOrDefault({ default_value, where });
  }

  /**
   * Si il y a des tableaux dans les tableaux, transforme tout en un seul tableau
   * @returns {MelEnumerable}
   * @generator
   */
  flat() {
    return new MelEnumerable(this.generator().flat());
  }

  *[Symbol.iterator]() {
    for (const iterator of this.generator()) {
      yield iterator;
    }
  }

  /**
   * Change l'énumération en chaîne de charactères
   * @param {string} separator
   * @returns {string}
   */
  join(separator = '') {
    return this.generator().join(separator);
  }

  /**
   * Fait la somme des éléments de l'énumération
   * @param {Object} param0 Si défini, le `where` sera pris en compte avant le `select`
   * @param {?WhereCallback} where Prendre seulement ce qui nous intéresse dans le sum
   * @param {?SelectCallback} selector Séléctionner le membre sur lequel on veut faire un sum
   * @returns {number}
   * @throws Si selector retourne autre chose qu'un nombre
   * @see {@link WhereCallback}
   * @see {@link SelectCallback}
   */
  sum({ where = null, selector = null }) {
    return this.generator().sum({ where, selector });
  }

  /**
   * Compte le nombre d'éléments dans l'énumération
   * @returns {number}
   */
  count() {
    return this.generator().count();
  }

  /**
   * Récupère la valeur maximale de l'énumération
   * @param {?SelectorCallback} selector Séléctionne la valeur à comparer
   * @returns {number}
   */
  max(selector = null) {
    return this.generator().max(selector);
  }

  /**
   * Récupère la valeur minimale de l'énumération
   * @param {?SelectorCallback} selector Séléctionne la valeur à comparer
   * @returns {number}
   */
  min(selector = null) {
    return this.generator().min(selector);
  }

  /**
   * Transforme en tableau
   * @returns {Array}
   */
  toArray() {
    return this.generator().toArray();
  }

  /**
   * Convertit en objet
   * @param {SelectCallback} key_selector
   * @param {SelectCallback} value_selector
   * @returns {{}} style {index1:value1 etc....}
   */
  toJsonObject(key_selector, value_selector) {
    return this.generator().toJsonObject(key_selector, value_selector);
  }

  /**
   * Convertit un objet/un tableau en enumerable
   * @generator
   * @param {Array | RotomecaGenerator | MelEnumerable | {} | Generator} item Objet à convertir en enumerable
   * @returns {MelEnumerable}
   */
  static from(item) {
    const is_array_like = isArrayLike(item);
    if (
      Array.isArray(item) ||
      (typeof item[Symbol.iterator] === 'function' && !is_array_like)
    )
      return new MelEnumerable(new RotomecaGenerator(item));
    else if (item instanceof RotomecaGenerator) return new MelEnumerable(item);
    else if (typeof item === 'object' && !is_array_like) {
      return this.from(new ObjectKeyEnumerable(item));
    } else if (is_array_like)
      return new MelEnumerable(new RotomecaGenerator(Array.from(item)));
    else if (typeof item === 'function' && !!item.prototype.next)
      return new MelEnumerable(new RotomecaGenerator(item));
    else return new MelEnumerable(new RotomecaGenerator([item]));
  }

  /**
   * Récupère des éléments au hasard dans un tableau
   * @param {Array | RotomecaGenerator | MelEnumerable | {} | Generator} item
   * @param  {...any} args Autres objets qui seront pris au hasard
   * @returns {MelEnumerable}
   * @generator
   */
  static choice(item, ...args) {
    item = MelEnumerable.from(item)
      .aggregate(args || [])
      .toArray();
    const min = 0;
    const max = item.length - 1;

    const generator = function* () {
      while (true) {
        yield item[Math.floor(Math.random() * (max - min + 1) + min)];
      }
    };

    return MelEnumerable.from(generator);
  }

  /**
   * Génère les éléments sous forme d'un cycle.
   * @param {Array | RotomecaGenerator | MelEnumerable | {} | Generator} item Initialisateur
   * @param  {...any} args Initialisateurs
   * @returns {MelEnumerable}
   * @generator
   */
  static cycle(item, ...args) {
    item = MelEnumerable.from(item)
      .aggregate(args || [])
      .toArray();
    let it = 0;

    const generator = function* () {
      while (true) {
        yield item[it++];

        if (it === item.length) it = 0;
      }
    };

    return MelEnumerable.from(generator);
  }

  /**
   * Génère un énumérable vide
   * @returns {MelEnumerable}
   * @generator
   */
  static empty() {
    return MelEnumerable.from([]);
  }

  /**
   * Génère des valeurs commençant par "start", pendant "count" par pas de "step"
   *
   * (ex: (0,5,2) => [0,2,4,6,8])
   * @param {number} start Valeur de départ
   * @param {number} count Pendant combien d'itérations ?
   * @param {number} step pas
   * @returns {MelEnumerable}
   * @generator
   */
  static range(start, count, step = 1) {
    let it = 0;
    const generator = function* () {
      while (it++ < count) {
        yield start;

        start += step;
      }
    };

    return MelEnumerable.from(generator);
  }

  /**
   * Génère des valeurs commençant par "start", pendant "count" par pas de "step" (décroissant)
   *
   * (ex: (0,5,2) => [0, -2, -4, -6, -8])
   * @param {number} start Valeur de départ
   * @param {number} count Pendant combien d'itérations ?
   * @param {number} step pas
   * @returns {MelEnumerable}
   * @generator
   */
  static rangeDown(start, count, step = 1) {
    return MelEnumerable.range(start, count, -step);
  }

  /**
   * Génère des valeurs commençant par "start" indéfiniment par pas de "step"
   * @param {number} start Valeur de départ
   * @param {number} step pas
   * @returns {MelEnumerable}
   * @generator
   */
  static toInfinity(start = 0, step = 1) {
    return MelEnumerable.range(start, Number.POSITIVE_INFINITY, step);
  }

  /**
   * Génère des valeurs commençant par "start" indéfiniment par pas de "step" (décroissant)
   * @param {number} start Valeur de départ
   * @param {number} step pas
   * @returns {MelEnumerable}
   * @generator
   */
  static toNegativeInfinity(start = 0, step = 1) {
    return MelEnumerable.toInfinity(start, -step);
  }

  static generate(callback) {
    const generator = function* () {
      while (true) {
        yield callback();
      }
    };

    return MelEnumerable.from(generator);
  }

  /**
   * Génère des nombres au hasard
   * @param {number} min
   * @param {number} max
   * @returns
   * @generator
   */
  static random(min = 0, max = 1000) {
    return MelEnumerable.generate(() => {
      return Math.random() * (max - min + 1) + min;
    });
  }

  static async fromAsync(async_generator) {
    let arr = [];

    let next;
    while ((next = await async_generator.next()) && !next.done) {
      arr.push(next.value);
    }

    return MelEnumerable.from(arr);
  }
}
