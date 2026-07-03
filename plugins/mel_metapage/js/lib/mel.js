/**
 * @module Mel/UsefulFunctions
 */

export {
  isNullOrUndefined,
  isArrayLike,
  Classes,
  toHex,
  isDecimal,
  capitalize,
  getRelativePos,
  isAsync,
};

/**
 * Vérivie si un nombre est un nombre entier ou décimal.
 * @param {number} number
 * @returns {boolean} Si vrai, alors il s'agit d'un nombre décimal.
 * @example const state = isDecimal(value) ? 1 : 0;
 */
function isDecimal(number) {
  return ~~number !== number;
}

/**
 * Renvoie vrai si la variable vaut `null` ou `undefined`.
 * @param {?*} item Variable à tester
 * @returns {boolean}
 */
function isNullOrUndefined(item) {
  return item === null || item === undefined;
}

/**
 * Vérifie si une varible est un tableau ou quelque chose qui y ressemble
 * @param {*} item
 * @returns {bool}
 */
function isArrayLike(item) {
  return (
    !!item &&
    typeof item === 'object' &&
    // eslint-disable-next-line no-prototype-builtins
    item.hasOwnProperty('length') &&
    typeof item.length === 'number' &&
    item.length > 0 &&
    item.length - 1 in item
  );
}

/**
 * Change un nombre en base 10 en hexadécimal
 * @param {number} number
 * @returns {string} Hexadecimal number
 */
function toHex(number) {
  return number.toString(16);
}

/**
 * @typedef Class
 * Indique qu'il s'agit d'un objet qui est une classe. Le mot clé "new" peut être utiliser.
 */

/**
 * @typedef Classes
 * Indique qu'il s'agit d'un mélange de plusieurs classes. Le mot clé "new" peut être utiliser.
 */

/**
 * Permet de créer une "fusion" de deux classes.
 *
 * Cela permet d'avoir une classe qui hérite de 2 classe.
 * @param {Class} baseClass Classe de base
 * @param  {...Classes} mixins Autres classes
 * @returns {}
 */
const Classes = (baseClass, ...mixins) => {
  class base extends baseClass {
    constructor(...args) {
      super(...args);
      mixins.forEach((mixin) => {
        copyProps(this, new mixin());
      });
    }
  }
  let copyProps = (target, source) => {
    // this function copies all properties and symbols, filtering out some special ones
    Object.getOwnPropertyNames(source)
      .concat(Object.getOwnPropertySymbols(source))
      .forEach((prop) => {
        if (
          !prop.match(
            /^(?:constructor|prototype|arguments|caller|name|bind|call|apply|toString|length)$/,
          )
        )
          Object.defineProperty(
            target,
            prop,
            Object.getOwnPropertyDescriptor(source, prop),
          );
      });
  };
  mixins.forEach((mixin) => {
    // outside contructor() to allow aggregation(A,B,C).staticFunction() to be called etc.
    copyProps(base.prototype, mixin.prototype);
    copyProps(base, mixin);
  });
  return base;
};

function capitalize(s) {
  if (typeof s !== 'string') return '';

  s = s.toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getRelativePos(elm) {
  let pPos = elm.parentNode.getBoundingClientRect(), // parent pos
    cPos = elm.getBoundingClientRect(), // target pos
    pos = {};

  ((pos.top = cPos.top - pPos.top + elm.parentNode.scrollTop),
    (pos.right = cPos.right - pPos.right),
    (pos.bottom = cPos.bottom - pPos.bottom),
    (pos.left = cPos.left - pPos.left));

  return pos;
}

function isAsync(func) {
  return func.constructor.name === 'AsyncFunction';
}

/**
 * Retourne une version de `fn` qui ne s'exécute qu'une seule fois.
 *
 * Le résultat du premier appel est mis en cache et retourné directement
 * pour tous les appels suivants, sans réexécuter `fn`. La référence à `fn`
 * est libérée après le premier appel pour éviter les fuites mémoire.
 *
 * @param {T} fn - La fonction à n'exécuter qu'une seule fois.
 * @returns {T} Une nouvelle fonction qui délègue à `fn` uniquement au premier appel.
 *
 * @template {Function} T Type de la fonction à restreindre, doit être une {@link Function}.
 *
 * @example
 * ```ts
 * const initApp = once(() => {
 *   console.log('Initialisation...');
 *   return createApp();
 * });
 *
 * initApp(); // exécute fn, retourne l'app
 * initApp(); // retourne le même résultat, fn n'est pas réexécutée
 * ```
 */
export function once(fn) {
  let called = false;
  let result;
  let _fn = fn;
  return (...args) => {
    if (called) return result;
    called = true;
    result = _fn(...args);
    _fn = null;
    return result;
  };
}
