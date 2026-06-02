/**
 * Encapsule un objet afin de lui appliquer des transformations en chaîne via des fonctions.
 * @template T - Le type de l'objet encapsulé
 */
class PipeObject {
  /** @type {T} */
  #_object;

  /**
   * Crée une nouvelle instance de `PipeObject`.
   * @param {T} obj - L'objet à encapsuler dans le pipe.
   */
  constructor(obj) {
    this.#_object = obj;
  }

  /**
   * Applique une fonction de transformation sur l'objet encapsulé
   * et retourne un nouveau `PipeObject` contenant le résultat.
   * @template Y - Le type retourné par la fonction de transformation
   * @param {function(T): Y} fn - La fonction à appliquer sur l'objet encapsulé.
   * @returns {PipeObject<Y>} Un nouveau `PipeObject` encapsulant le résultat de `fn`.
   */
  pipe(fn) {
    return new PipeObject(fn(this.#_object));
  }

  /**
   * Extrait et retourne l'objet encapsulé.
   * @returns {T} L'objet sous-jacent.
   */
  unpipe() {
    return this.#_object;
  }
}

/**
 * Crée un `PipeObject` à partir d'un objet, puis lui applique immédiatement
 * une première fonction de transformation.
 *
 * @template T - Le type de l'objet d'entrée
 * @template Y - Le type retourné par la fonction de transformation
 * @param {T} obj - L'objet à encapsuler.
 * @param {function(T): Y} fn - La première transformation à appliquer.
 * @returns {PipeObject<Y>} Un `PipeObject` encapsulant le résultat de `fn(obj)`.
 *
 * @example
 * const result = pipe([3, 1, 2], arr => arr.sort())
 *   .pipe(arr => arr.map(String))
 *   .unpipe();
 * // result => ['1', '2', '3']
 */
export function pipe(obj, fn) {
  return new PipeObject(obj).pipe(fn);
}
