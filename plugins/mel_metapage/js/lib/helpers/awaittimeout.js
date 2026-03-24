import { BnumPromise } from '../BnumPromise';

/**
 * @template T
 * @callback InnerPromiseCallback
 * @param {...any} args
 * @param {import('../BnumPromise').PromiseManager<?T>} promiseManager
 * @return {?T | Promise<?T>}
 */

/**
 * Lance un timeout que l'on peut attendre avec un await
 * @param {InnerPromiseCallback<T>} callback Fonction à lancer
 * @param {number} ms Temps d'attente en ms avant de lancer la fonction
 * @param  {...any} args Arguments additionnels
 * @returns {BnumPromise<?T>}
 * @template T
 */
export function awaitableTimeOut(callback, ms, ...args) {
  if (!callback) return BnumPromise.Resolved();
  return new BnumPromise((promise) => {
    promise.resolver.start();
    setTimeout(
      async (innerArgs) => {
        if (promise.state() === BnumPromise.PromiseStates.cancelled) return;

        const callbackArgs = [...(innerArgs || []), promise];

        try {
          let returnValue = null;
          if (callback.then) returnValue = await callback(...callbackArgs);
          else returnValue = callback(...callbackArgs);
          promise.resolver.resolve(returnValue);
        } catch (error) {
          promise.resolver.reject(error);
        }
      },
      ms,
      ...args,
    );
  });
}
