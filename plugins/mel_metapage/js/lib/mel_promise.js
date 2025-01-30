import { BnumPromise } from './BnumPromise.js';
import { isAsync } from './mel.js';
import { BnumEvent } from './mel_events.js';

export { Mel_Promise, Mel_Ajax, WaitSomething };

/**
 * @callback MelPromiseCallback
 * @param {Mel_Promise} current_promise
 * @param {...any} Arguments
 * @returns {* | Promise<*>}
 */

/**
 * @callback WaitCallback
 * @returns {boolean} Si vrai, la boucle s'arrête.
 */

/**
 * @callback WaitCallbackAsync
 * @returns {Promise<boolean>} Si vrai, la boucle s'arrête.
 * @async
 */

/**
 * Ajoute des fonctionnalités aux promesses déjà existantes.
 * Pour que les fonctions asynchrones soient complètement compatible, le premier argument doit être la promesse elle même.
 * Ca sera utile pour arrêter la fonction si la fonction 'Abort' est appelé.
 * @template T
 * @deprecated Utilisez plutôt {@link BnumPromise}
 */
class Mel_Promise {
  /**
   *
   * @param {(current_promise: Mel_Promise<T>, ...args: any[]) => T | Promise<T> | Mel_Promise<T>} callback Fonction qui sera appelé
   * @param  {...any} args Arguments de la fonction
   */
  constructor(callback, ...args) {
    let current;
    if (callback.then) current = new BnumPromise(async () => await callback);
    else if (isAsync(callback))
      current = new BnumPromise(
        async (manager, ...argsEx) => {
          return await callback(this, ...[...argsEx, manager]);
        },
        ...args,
      );
    else
      current = new BnumPromise(
        (manager, ...argsEx) => {
          return callback(this, ...[...argsEx, manager]);
        },
        ...args,
      );

    /**
     * Récupère sous forme de BnumPromise
     * @returns {BnumPromise<T>}
     */
    this.toBnumPromise = () => current;

    /**
     * Vrai si la fonction est en cours d'éxécution
     * @returns {boolean}
     */
    this.isPending = () => current.isPending();
    /**
     * Vrai si la fonction est résolue
     * @returns {boolean}
     */
    this.isResolved = () => current.isResolved();
    /**
     * Vrai si la fonction à une erreur
     * @returns {boolean}
     */
    this.isRejected = () => current.isRejected();
    /**
     * Vrai si la fonction est stoppée
     * @returns {boolean}
     */
    this.isCancelled = () => current.isCancelled();
    /**
     * Fonction appelée lorsque l'on stope la fonction.
     */
    this.onAbort = new BnumEvent();
    current.onAbort.push((...a) => this.onAbort.call(...a));
    /**
     * Arrête la fonction
     * @returns {Mel_Promise}
     */
    this.abort = function () {
      return new Mel_Promise(async () => await current.abort());
    };
    this.create_promise = ({ callback, onAbort = () => {} }, ...args) => {
      return new Mel_Promise(
        async () => await current.createPromise({ callback, onAbort }, ...args),
      );
    };

    this.create_ajax_request = ({
      type,
      url,
      success,
      failed,
      onAbort = () => {},
      datas = null,
    }) => {
      return new Mel_Promise(
        async () =>
          await current.createAjaxRequest(url, {
            type,
            success,
            failed,
            onAbort,
            data: datas,
          }),
      );
    };

    this.create_ajax_post_request = ({
      url,
      success,
      failed,
      onAbort = () => {},
      datas = null,
    }) => {
      return this.create_ajax_request({
        type: 'POST',
        url,
        success,
        failed,
        onAbort,
        datas,
      });
    };

    this.create_ajax_get_request = ({
      url,
      success,
      failed,
      onAbort = () => {},
    }) => {
      return this.create_ajax_request({
        type: 'GET',
        url,
        success,
        failed,
        onAbort,
      });
    };

    this.await_all_childs = () => {
      return new Mel_Promise(async () => await current.awaitAllChilds());
    };

    this.all_child_generator = function* all_child_generator() {
      yield* current.allChildGenerator();
    };

    this.start_resolving = () => {
      current.setSignal(BnumPromise.PromiseStates.pending);
    };

    this.resolve = (why) => {
      current.setSignal(BnumPromise.PromiseStates.resolved, why);
    };

    this.reject = (why) => {
      current.setSignal(BnumPromise.PromiseStates.rejected, why);
    };

    current.start();

    //Async functions
    this.executor = async () => {
      return await current;
    };

    this.then = function () {
      const promise = this.executor();
      const value = promise.then.apply(promise, arguments);
      return new Mel_Promise(() => value);
    };

    this.catch = function () {
      const promise = this.executor();
      return promise.catch.apply(promise, arguments);
    };
    this.success = (call) => this.then(call);
    this.fail = (call) => this.then(() => {}, call);
    this.always = (call) => this.then(call, call);
  }

  *[Symbol.iterator]() {
    yield this;
    yield* this.all_child_generator();
  }

  /**
   *
   * @param {WaitCallback} whatIWait
   * @param {number} timeout second
   * @returns {WaitSomething}
   * @deprecated Utilisez plutôt {@link BnumPromise.Wait}
   */
  static wait(whatIWait, timeout = 5) {
    return new WaitSomething(whatIWait, timeout);
  }

  /**
   *
   * @param {WaitCallbackAsync} whatIWait
   * @param {number} [timeout=5]
   * @returns {WaitSomethingAsync}
   * @deprecated Utilisez plutôt {@link BnumPromise.Wait}
   */
  static wait_async(whatIWait, timeout = 5) {
    return new WaitSomethingAsync(whatIWait, timeout);
  }

  /**
   *
   * @param {number} ms
   * @returns {Mel_Promise<void>}
   * @deprecated Utilisez plutôt {@link BnumPromise.Sleep}
   */
  static Sleep(ms) {
    return new Mel_Promise((current) => {
      current.start_resolving();
      setTimeout(() => {
        current.resolve();
      }, ms);
    });
  }

  /**
   *
   * @returns {Mel_Promise}
   * @deprecated Utilisez plutôt {@link BnumPromise.Resolved}
   */
  static Resolved() {
    return new Mel_Promise(() => {});
  }
}

/**
 * @deprecated Utilisez plutôt {@link BnumPromise.Ajax}
 */
class Mel_Ajax extends Mel_Promise {
  constructor({ type, url, success, failed, datas = null }) {
    super(
      async () =>
        await BnumPromise.Ajax.Call(url, {
          type,
          success,
          failed,
          data: datas,
        }),
    );
  }
}

/**
 * @deprecated Utilisez plutôt {@link BnumPromise.Wait}
 */
class WaitSomething extends Mel_Promise {
  /**
   *
   * @param {WaitCallback} whatIWait
   * @param {number} timeout en secondes
   */
  constructor(whatIWait, timeout = 5) {
    let promise = new Mel_Promise((current) => {
      current.start_resolving();
      new Mel_Promise(async () => {
        let data = null;
        let it = 0;
        while (!whatIWait() && it < timeout * 100) {
          if (current.isCancelled()) {
            return {
              resolved: false,
              msg: 'aborted',
            };
          }

          await Mel_Promise.Sleep(100);
          ++it;
        }

        it = null;

        if (it >= timeout * 100)
          data = {
            resolved: false,
            msg: `timeout : ${timeout * 10}ms`,
          };
        else data = { resolved: true };

        return data;
      }).always((data) => {
        current.resolve(data);
      });
    });

    super(promise);
  }
}

/**
 * @class
 * @classdesc Attend une fonction asynchrone
 * @extends Mel_Promise
 * @package
 * @deprecated Utilisez plutôt {@link BnumPromise.Wait}
 */
class WaitSomethingAsync extends Mel_Promise {
  /**
   *
   * @param {WaitCallbackAsync} whatIWait
   * @param {number} timeout en secondes
   */
  constructor(whatIWait, timeout = 5) {
    let promise = new Mel_Promise(async (current) => {
      let state = false;
      for (let it = 0; it < timeout * 10; ++it) {
        state = await current.create_promise({
          /**
           *
           * @param {Mel_Promise} self
           */
          callback: (self) => {
            self.start_resolving();
            setTimeout(async () => {
              if (self.isCancelled()) self.reject('aborted');
              else self.resolve(await whatIWait());
            }, 100);
          },
        });

        if (current.isCancelled()) throw new Error('cancelled');

        if (state) break;
      }

      if (state) return { resolved: true };
      else
        return {
          resolved: false,
          msg: `timeout : ${timeout * 10}ms`,
        };
    });

    super(promise);
  }
}
