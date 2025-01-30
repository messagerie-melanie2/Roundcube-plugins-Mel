import { isAsync } from './mel.js';
import { BnumEvent as JsEvent } from './mel_events.js';

export { BnumPromise };

/**
 * Contient les classes utiles aux promesses du Bnum
 * @module BnumPromise
 * @local PromiseManager
 * @local PromiseManagerAsync
 * @local PromiseCallback
 * @local PromiseCallbackAsync
 * @local BnumPromise
 * @local EPromiseState
 * @local CheckStateCallback
 * @local ResolvingState
 * @local BnumAjax
 * @local EAjaxMethod
 * @local MethodCallback
 * @local SuccessCallback
 * @local ErrorCallback
 * @local BnumResolvedPromise
 */

/**
 * @callback SuccessCallback
 * @param {D} data
 * @returns {R}
 * @template D
 * @template R
 */

/**
 * @callback ErrorCallback
 * @param {...any} args
 * @return {any[]}
 */

/**
 * @callback MethodCallback
 * @return {void}
 */

/**
 * @callback CheckStateCallback
 * @returns {EPromiseState}
 */

/**
 * Permet de savoir l'état de la promise et de pouvoir résoudre ou non la promesse
 * @template T
 * @typedef PromiseManager
 * @property {ResolvingState<T> | null | undefined} resolver Null on async function
 * @property {CheckStateCallback} state
 */

/**
 * @typedef PromiseManagerAsync
 * @property {CheckStateCallback} state
 */

/**
 * @template T
 * @callback PromiseCallback
 * @param {PromiseManager<T>} manager
 * @param {...any} args
 * @return {T}
 */

/**
 * @async
 * @template T
 * @callback PromiseCallbackAsync
 * @param {PromiseManager<T>} manager
 * @param {...any} args
 * @return {BnumPromise<T> | Promise<T>}
 */

/**
 * @class
 * @classdesc
 * @template {Object} T
 */
class BnumPromise {
  #_childs = [];
  #_callback;
  /**
   * @type {EPromiseState}
   */
  #_state;
  #_promise;
  #_cancel_completed;
  #_args;

  /**
   *
   * @param {PromiseCallback<T> | PromiseCallbackAsync<T>} callback
   * @param  {...any} args Arguments qui seront envoyé au callback
   * @frommoduleparam BnumPromise callback {@linkto PromiseCallbackAsync}
   */
  constructor(callback, ...args) {
    this.#_callback = callback;
    this.#_state = EPromiseState.pending;
    this.#_cancel_completed = false;
    this.#_args = args;

    /**
     * @type {JsEvent<() => void>}
     * @event
     */
    this.onAbort = new JsEvent();
    /**
     * @type {JsEvent<(signal:any, ...args) => void>}
     * @event
     */
    this.onSignalChanged = new JsEvent();
  }

  /**
   * Envoi un signal qui lancera {@link BnumPromise.onSignalChanged}
   * @param {any} signal
   * @param  {...any} args
   * @fires BnumPromise.onSignalChanged
   */
  setSignal(signal, ...args) {
    this.onSignalChanged.call(signal, ...args);
  }

  /**
   * Etat courant de la promesse
   * @type {EPromiseState}
   * @readonly
   */
  get state() {
    return this.#_state;
  }

  /**
   * Si la promesse a commencé ou non
   * @type {boolean}
   * @readonly
   */
  get isStarted() {
    return !!this.#_promise;
  }

  /**
   *
   * @param {BnumPromise} promise_creator
   * @param {*} param1
   * @returns {BnumPromise}
   * @private
   */
  #_create_promises(promise_creator, { onAbort = () => {} } = {}) {
    let deleted = false;
    let tmp = promise_creator();
    tmp.onAbort.push(onAbort);

    if (tmp.start) tmp.start();

    const index = this.#_childs.push(tmp) - 1;
    const key = this.onAbort.push(async () => {
      console.log('ABORT !', tmp);
      await tmp.abort();
      if (this.onAbort.events[key]) this.onAbort.remove(key);

      if (!deleted) {
        deleted = true;
        this.#_childs = this.#_childs.filter((x, i) => i !== index);
      }
    });

    tmp.always(() => {
      if (!deleted) {
        deleted = true;
        this.#_childs = this.#_childs.filter((x, i) => i !== index);
      }
    });

    return tmp;
  }

  /**
   * Créer une sous promesse fille
   * @async
   * @param {Object} options
   * @param {PromiseCallback<Y> | PromiseCallbackAsync<Y>} options.callback
   * @param {MethodCallback} [options.onAbort=()=>{}]
   * @param  {...any} args Arguments à donner à la nouvelle promesse
   * @returns {BnumPromise<Y>}
   * @template Y
   * @frommoduleparam BnumPromise options.callback {@linkto PromiseCallbackAsync}
   */
  createPromise({ callback, onAbort = () => {} }, ...args) {
    const promiseCreator = () => {
      return new BnumPromise(callback, ...args);
    };

    return this.#_create_promises(
      promiseCreator,
      { callback, onAbort },
      ...args,
    );
  }

  /**
   * Créer une requête ajax fille
   * @async
   * @param {string} url Url de la requête
   * @param {Object} [options={}]
   * @param {EAjaxMethod} [options.type=EAjaxMethod.get] Type de la requête
   * @param {SuccessCallback<D, Y>} [options.success=(d)=>d] Action à faire si tout se déroule bien.
   * @param {ErrorCallback} [options.failed=(...args)=>args] Action à faire si la la requête à échoué.
   * @param {MethodCallback} [options.onAbort=()=>{}] Action à faire lorsque la variable mère s'arrête
   * @param {Object<string, any> | string | null} [options.data=null] Body de la requête. Ne fonctionne pas avec get.
   * @returns {BnumPromise<Y>}
   * @template D
   * @template Y
   */
  createAjaxRequest(
    url,
    {
      type = BnumAjax.EAjaxMethod.get,
      success = (d) => d,
      failed = (...args) => args,
      onAbort = () => {},
      data = null,
    } = {},
  ) {
    const promiseCreator = () => {
      return BnumAjax.Call(url, { type, success, failed, data });
    };
    return this.#_create_promises(promiseCreator, {
      onAbort,
    });
  }

  /**
   * Créer une requête ajax "post" fille
   * @async
   * @param {string} url Url de la requête
   * @param {Object} [options={}]
   * @param {SuccessCallback<D, Y>} [options.success=(d)=>d] Action à faire si tout se déroule bien.
   * @param {ErrorCallback} [options.failed=(...args)=>args] Action à faire si la la requête à échoué.
   * @param {MethodCallback} [options.onAbort=()=>{}] Action à faire lorsque la variable mère s'arrête
   * @param {Object<string, any> | string | null} [options.data=null] Body de la requête.
   * @returns {BnumPromise<Y>}
   * @template D
   * @template Y
   */
  createAjaxPostRequest(
    url,
    { success = () => {}, failed = () => {}, onAbort = () => {}, data = null },
  ) {
    return this.createAjaxRequest({
      type: EAjaxMethod.post,
      url,
      success,
      failed,
      onAbort,
      data,
    });
  }

  /**
   * Créer une requête ajax "get" fille
   * @async
   * @param {string} url Url de la requête
   * @param {Object} [options={}]
   * @param {SuccessCallback<D, Y>} [options.success=(d)=>d] Action à faire si tout se déroule bien.
   * @param {ErrorCallback} [options.failed=(...args)=>args] Action à faire si la la requête à échoué.
   * @param {MethodCallback} [options.onAbort=()=>{}] Action à faire lorsque la variable mère s'arrête
   * @returns {BnumPromise<Y>}
   * @template D
   * @template Y
   */
  createAjaxGetRequest(
    url,
    { success = () => {}, failed = () => {}, onAbort = () => {} },
  ) {
    return this.createAjaxRequest({
      type: EAjaxMethod.get,
      url,
      success,
      failed,
      onAbort,
    });
  }

  /**
   * Récupère une promesse qui attend que toute les promesses filles ont finie d'être résolue.
   * @returns {BnumPromise<Array<PromiseSettledResult<any>>>}
   */
  awaitAllChilds() {
    return BnumPromise.AllSettled(...this.#_childs);
  }

  *allChildGenerator() {
    yield* this.#_childs;
  }

  /**
   * Si la promesse est en cours
   * @returns {boolean}
   */
  isPending() {
    return this.state === EPromiseState.pending;
  }

  /**
   * Si la promesse est résolue sans erreur
   * @returns {boolean}
   */
  isResolved() {
    return this.state === EPromiseState.resolved;
  }

  /**
   * Si la promesse à planter ou a été rejetée.
   * @returns {boolean}
   */
  isRejected() {
    return this.state === EPromiseState.rejected;
  }

  /**
   * Si la promesse a été annulée
   * @returns {boolean}
   */
  isCancelled() {
    return this.state === EPromiseState.cancelled;
  }

  /**
   * Arrète la promesse.
   * @returns {BnumPromise<boolean>}
   * @async
   * @fires BnumPromise.onAbort
   */
  abort() {
    this.#_state = EPromiseState.cancelled;

    return new BnumPromise(async () => {
      await new Promise((r, j) => {
        let it = 0;
        const interval = setInterval(() => {
          if (this.#_cancel_completed) {
            clearInterval(interval);
            r(it);
          } else if (it++ > 100) {
            clearInterval(interval);
            j(new Error('Wainting infinite'));
          }
        }, 100);
      });

      return this.#_cancel_completed;
    });
  }

  async #_startPromise() {
    return await new Promise((ok, nok) => {
      const callback = this.#_callback;
      const isAbortablePromise = !!callback.then && !!callback.abort;

      let waiting_promise;

      //Stop la fonction si elle à besoin d'être stoppée
      const check_stop = setInterval(() => {
        if (this.isCancelled() === true) {
          console.info(
            'i[RotomecaPromise]cancelled !',
            waiting_promise,
            callback,
          );
          clearInterval(check_stop);

          if (isAbortablePromise) callback.abort();
          if (waiting_promise?.abort) waiting_promise.abort();

          new Promise((r, j) => {
            try {
              this.onAbort.call();
              this.#_cancel_completed = true;
              r();
            } catch (error) {
              this.#_cancel_completed = true;
              j(error);
            }
          });
          rej('Cancelled');
        }
      }, 100);

      try {
        if (isAbortablePromise) {
          //Si c'est une promesse
          waiting_promise = callback;
        } else {
          //Si la fonction est asynchrone
          if (callback.constructor.name === 'AsyncFunction')
            waiting_promise = callback(
              { state: () => this.state },
              ...this.#_args,
            );
          else {
            let resolver = new ResolvingState(ok, nok, check_stop);
            this.onSignalChanged.add('resolver', (signal, args) => {
              switch (signal) {
                case EPromiseState.pending:
                  resolver.start();
                  break;

                case EPromiseState.resolved:
                  resolver.resolve(args);
                  break;

                case EPromiseState.rejected:
                  resolver.reject(args);
                  break;

                default:
                  break;
              }
            });

            //Si c'est une fonction + classique
            const val = callback(
              { resolver, state: () => this.state },
              ...this.#_args,
            );

            if (val?.then) waiting_promise = val;
            else {
              if (!resolver.resolving) {
                clearInterval(check_stop);
                ok(val);
              }
            }
          }
        }

        if (waiting_promise) {
          waiting_promise.then(
            (datas) => {
              clearInterval(check_stop);
              ok(datas);
            },
            (error) => {
              clearInterval(check_stop);
              nok(error);
            },
          );
        }
      } catch (error) {
        console.error('###[RotomecaPromise]', error);
        nok(error);
      }
    }).then(
      (d) => {
        this.onSignalChanged.remove('resolver');
        this.#_state = EPromiseState.resolved;
        return d;
      },
      (r) => {
        this.onSignalChanged.remove('resolver');
        this.#_state = EPromiseState.rejected;
        console.error('Promise Rejected : ', r);
        return r;
      },
    );
  }

  /**
   * Démarre la promesse.
   * @returns {BnumPromise<T>} Chaînage
   */
  start() {
    if (!this.isStarted) this.#_promise = this.#_startPromise();
    else console.warn('/!\\[RotomecaPromise] Already started !');

    return this;
  }

  async executor() {
    if (!this.isStarted) this.start();

    return await this.#_promise;
  }

  /**
   * Action à faire ensuite.
   * @param {SuccessCallback<T, Y>} onfullfiled
   * @param {ErrorCallback} onerror
   * @returns {BnumPromise<Y>}
   * @template Y
   * @async
   */
  then(onfullfiled, onerror = (data) => data) {
    const promise = this.executor();
    const value = promise.then.apply(promise, [onfullfiled, onerror]);
    return new BnumPromise(() => value).start();
  }

  /**
   * Action lorsque la promesse plante
   * @param {SuccessCallback<T, Y>} onrejected
   * @returns {BnumPromise<Y>}
   * @template Y
   * @async
   */
  catch(onrejected = (data) => data) {
    const promise = this.executor();
    const catched = promise.catch.apply(promise, [onrejected]);
    return new BnumPromise(() => catched).start();
  }

  /**
   * Action au succès
   * @param {SuccessCallback<T, Y>} onSuccess
   * @returns {BnumPromise<Y>}
   * @template Y
   * @async
   */
  success(onSuccess) {
    return this.then(onSuccess);
  }

  /**
   * Action si rejeté
   * @param {SuccessCallback<T, Y>} onSuccess
   * @returns {BnumPromise<Y>}
   * @template Y
   * @async
   */
  fail(onFailed) {
    return this.then(() => {}, onFailed);
  }

  /**
   * Action à faire quoi qu'il arrive
   * @param {SuccessCallback<T, Y>} onSuccess
   * @returns {BnumPromise<Y>}
   * @template Y
   * @async
   */
  always(onAlways) {
    return this.then(onAlways, onAlways);
  }

  /**
   * Attend qu'un callback renvoit "vrai".
   * @async
   * @param {(...args:any[]) => boolean | (...args:any[]) => (Promise<boolean> | BnumPromise<boolean> | Mel_Promise<boolean>)} whatIWait
   * @param {Object} [options={}]
   * @param {number} [options.timeout=5] Au bout de combien de secondes la boucle s'arrête
   * @returns {BnumPromise<{resolved:boolean, msg:(string | undefined)}>}
   */
  static Wait(whatIWait, { timeout = 5 } = {}) {
    return new BnumPromise(
      function (manager, callback, seconds) {
        manager.resolver.start();
        new BnumPromise(
          async function (_, parentManager, parentCallback, parentSeconds) {
            try {
              let data = null;
              let it = 0;
              while (
                isAsync(parentCallback)
                  ? !(await parentCallback())
                  : !parentCallback() && it < parentSeconds * 100
              ) {
                if (parentManager.state() === EPromiseState.cancelled) {
                  return {
                    resolved: false,
                    msg: 'aborted',
                  };
                }

                await BnumPromise.Sleep(100);
                ++it;
              }

              it = null;

              if (it >= parentSeconds * 100)
                data = {
                  resolved: false,
                  msg: `timeout : ${parentSeconds * 10}ms`,
                };
              else data = { resolved: true };

              return data;
            } catch (error) {
              parentManager.resolver.reject(error);
            }
          },
          manager,
          callback,
          seconds,
        ).success((value) => {
          manager.resolver.resolve(value);
        });
      },
      whatIWait,
      timeout,
    ).start();
  }

  /**
   * Attend x millisecondes avant de continuer
   * @param {number} ms Millisecondes
   * @returns {BnumPromise<void>}
   * @static
   * @async
   */
  static Sleep(ms) {
    return new BnumStartedPromise((manager, ms) => {
      manager.resolver.start();
      setTimeout(() => {
        manager.resolver.resolve();
      }, ms);
    }, ms);
  }

  /**
   * Récupère une promesse résolue
   * @returns {BnumResolvedPromise}
   * @async
   * @static
   */
  static Resolved() {
    return new BnumResolvedPromise();
  }

  /**
   * "Creates a Promise that is resolved with an array of results when all of the provided Promises resolve, or rejected when any Promise is rejected"
   * @async
   * @param  {...(BnumPromise | Promise)} promises
   * @returns {BnumPromise<any[]>}
   */
  static All(...promises) {
    return new BnumStartedPromise(async () => await Promise.all(promises));
  }

  /**
   * "Creates a Promise that is resolved with an array of results when all of the provided Promises resolve or reject"
   * @async
   * @param  {...(BnumPromise | Promise)} promises
   * @returns {BnumPromise<Array<PromiseSettledResult<any>>>}
   */
  static AllSettled(...promises) {
    return new BnumStartedPromise(
      async () => await Promise.allSettled(promises),
    );
  }

  /**
   * Créer un démarre une promesse bnum.
   * @param {PromiseCallback<Y> | PromiseCallbackAsync<Y>} callback
   * @param  {...any} args
   * @returns {BnumPromise<Y>}
   * @template {Object} Y
   */
  static Start(callback, ...args) {
    return new BnumStartedPromise(callback, ...args);
  }

  /**
   * @type {typeof EPromiseState}
   * @readonly
   * @static
   */
  static get PromiseStates() {
    return EPromiseState;
  }

  /**
   * Fonctions Ajax
   * @type {typeof BnumAjax}
   * @readonly
   * @frommodule BnumPromise {@linkto BnumAjax}
   */
  static get Ajax() {
    return BnumAjax;
  }
}

/**
 * @class
 * @classdesc Donne des fonctions utile pour les appels ajax.
 * @hideconstructor
 */
class BnumAjax {
  /**
   * Lance un appel ajax
   * @async
   * @param {string} url Url à atteindre
   * @param {Object} [options={}]
   * @param {EAjaxMethod} [options.type=EAjaxMethod.get] Type de requête
   * @param {(data:T) => Y} [options.success=(d)=>d]  Action si la requête réussie.
   * @param {(...args:any[]) => any[]} [options.failed] Action si la requête échoue.
   * @param {Object<string, string | number | boolean> | string | null | undefined} [options.data=null] Données à envoyer, ne fonctionne pas avec "get"
   * @returns {BnumPromise<Y>}
   * @static
   * @template T
   * @template Y
   */
  static Call(
    url,
    {
      type = this.EAjaxMethod.get,
      success = (d) => d,
      failed = (...a) => a,
      data = null,
    } = {},
  ) {
    if (typeof type === 'symbol') {
      type = Object.keys(EAjaxMethod)
        .find((x) => EAjaxMethod[x] === type)
        .toUpperCase();
    }

    let parameters = { type, url, success, failed };

    if (data) parameters.data = data;

    return new BnumPromise((manager, config) => {
      manager.resolver.start();
      $.ajax(config)
        .done((d) => manager.resolver.resolve(d))
        .fail((...args) => manager.resolver.reject(args));
    }, parameters).start();
  }

  /**
   * Lance un appel ajax "GET"
   * @async
   * @param {string} url Url à atteindre
   * @param {Object} [options={}]
   * @param {(data:T) => Y} [options.success=(d)=>d]  Action si la requête réussie.
   * @param {(...args:any[]) => any[]} [options.failed] Action si la requête échoue.
   * @returns {BnumPromise<Y>}
   * @static
   * @template T
   * @template Y
   */
  static Get(url, { success = () => {}, failed = () => {} } = {}) {
    return this.Call(url, {
      type: this.EAjaxMethod.get,
      success,
      failed,
    });
  }

  /**
   * Lance un appel ajax "POST"
   * @async
   * @param {string} url Url à atteindre
   * @param {Object} [options={}]
   * @param {(data:T) => Y} [options.success=(d)=>d]  Action si la requête réussie.
   * @param {(...args:any[]) => any[]} [options.failed] Action si la requête échoue.
   * @param {Object<string, string | number | boolean> | string | null | undefined} [options.data=null] Données à envoyer, ne fonctionne pas avec "get"
   * @returns {BnumPromise<Y>}
   * @static
   * @template T
   * @template Y
   */
  static Post(
    url,
    { success = () => {}, failed = () => {}, data = null } = {},
  ) {
    return this.Call(url, {
      type: this.EAjaxMethod.post,
      success,
      failed,
      data,
    });
  }

  /**
   * Type de méthodes ajax disponibles
   * @type {typeof EAjaxMethod}
   * @readonly
   * @static
   */
  static get EAjaxMethod() {
    return EAjaxMethod;
  }
}

/**
 * @class
 * @classdesc Démarre immédiatement la promesse
 * @extends BnumPromise<T>
 * @template {Object} T
 */
class BnumStartedPromise extends BnumPromise {
  /**
   *
   * @param {PromiseCallback<T> | PromiseCallbackAsync<T>} callback
   * @param  {...any} args
   */
  constructor(callback, ...args) {
    super(callback, ...args);
    this.start();
  }
}

/**
 * @class
 * @classdesc Représente une promesse résolue
 * @extends BnumStartedPromise<void>
 */
class BnumResolvedPromise extends BnumStartedPromise {
  constructor() {
    super(() => {});
  }
}

/**
 * @class
 * @classdesc Permet de résoudre une fonction synchrone de manière asynchrone
 * @template {any} T
 * @template {any} E
 */
class ResolvingState {
  #_resolving = false;

  #_ok = null;
  #_nok = null;
  #_timeout = null;
  /**
   *
   * @param {(why:T) => unknown} ok Fonction qui permet de marquer la promesse comme résolue
   * @param {(why:E) => unknown} nok Fonction qui permet de marquer la promesse comme erreur
   * @param {number} timeout Id du timeout à arreter
   */
  constructor(ok, nok, timeout) {
    this.#_ok = ok;
    this.#_nok = nok;
    this.#_timeout = timeout;
  }

  /**
   * Indique que l'on attend une résolution asynchrone
   * @returns {ResolvingState<T, E>} Chaînage
   */
  start() {
    this.#_resolving = true;
    return this;
  }

  /**
   * Est-ce qu'on attend une résolution asynchrone ?
   * @type {boolean}
   * @readonly
   */
  get resolving() {
    return this.#_resolving;
  }

  /**
   * Indique la promesse comme résolue
   * @param {?T} [data=null] Donnée à envoyer
   * @return {?T}
   */
  resolve(data = null) {
    clearInterval(this.#_timeout);
    this.#_ok(data);
    return data;
  }

  /**
   * Indique la promesse comme rejetée
   * @param {?E} [why=null] Données à envoyer
   * @returns {?E}
   */
  reject(why = null) {
    clearInterval(this.#_timeout);
    this.#_nok(why);
    return why;
  }
}

/**
 * Liste des états d'une promesse. Utilisez {@link BnumPromise.PromiseStates} pour y accéder.
 * @enum {Symbol}
 * @property {Symbol} pending
 * @property {Symbol} rejected
 * @property {Symbol} resolved
 * @property {Symbol} cancelled
 * @package
 */
const EPromiseState = Object.freeze({
  pending: Symbol('pending'),
  rejected: Symbol('rejected'),
  resolved: Symbol('resolved'),
  cancelled: Symbol('canlcelled'),
});

/**
 * Liste des types d'appel ajax. Utilisez {@link BnumPromise.Ajax.EAjaxMethod} pour y accéder.
 * @enum {Symbol}
 * @property {Symbol} get
 * @property {Symbol} head
 * @property {Symbol} post
 * @property {Symbol} put
 * @property {Symbol} delete
 * @property {Symbol} connect
 * @property {Symbol} options
 * @property {Symbol} trace
 * @package
 */
const EAjaxMethod = Object.freeze({
  get: Symbol('get'),
  head: Symbol('head'),
  post: Symbol('post'),
  put: Symbol('put'),
  delete: Symbol('delete'),
  connect: Symbol('connect'),
  options: Symbol('options'),
  trace: Symbol('trace'),
});
