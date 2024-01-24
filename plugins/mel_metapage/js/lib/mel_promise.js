export { Mel_Promise, Mel_Ajax, WaitSomething }
/**
 * Ajoute des fonctionnalités aux promesses déjà existantes.
 * Pour que les fonctions asynchrones soient complètement compatible, le premier argument doit être la promesse elle même.
 * Ca sera utile pour arrêter la fonction si la fonction 'Abort' est appelé.
 */
class Mel_Promise {
    /**
     * 
     * @param {Function} callback Fonction qui sera appelé 
     * @param  {...any} args Arguments de la fonction
     */
    constructor(callback, ...args) {
        //Init
        let _callback = callback;
        let _childs = [];

        let pending = true;
        let rejected = false;
        let resolved = false;
        let cancelled = false;
        let cancel_complete = false;
        let resolving = null;

        let res_func;
        let rej_func;
        let timeout_id;

        /**
         * Vrai si la fonction est en cours d'éxécution
         * @returns {boolean}
         */
        this.isPending = () => pending;
        /**
         * Vrai si la fonction est résolue
         * @returns {boolean}
         */
        this.isResolved = () => resolved;
        /**
         * Vrai si la fonction à une erreur
         * @returns {boolean}
         */
        this.isRejected = () => rejected;
        /**
         * Vrai si la fonction est stoppée
         * @returns {boolean}
         */
        this.isCancelled = () => cancelled;
        /**
         * Fonction appelée lorsque l'on stope la fonction.
         */
        this.onAbort = new MelEvent();
        /**
         * Arrête la fonction
         * @returns {Mel_Promise}
         */
        this.abort = function () {
            cancelled = true;
            return new Mel_Promise(async () => {
                await new Promise((r, j) => {
                    let it = 0;
                    const interval = setInterval(() => {
                        if (cancel_complete) {
                            clearInterval(interval);
                            r(it);
                        }
                        else if (it++ > 100) {
                            clearInterval(interval);
                            j(new Error('Wainting infinite'));
                        }
                    }, 100);
                });
            });
        };

        const _create_promises = (promise_creator, {onAbort = () => {}}) => {
            let deleted = false;
            let tmp = promise_creator();
            tmp.onAbort.push(onAbort);
            const index = _childs.push(tmp) - 1;
            const key = this.onAbort.push(async () => {
                console.log('ABORT !', tmp);
                await tmp.abort();
                if (!!this.onAbort.events[key]) this.onAbort.remove(key);

                if (!deleted) {
                    deleted = true;
                    _childs = _childs.filter((x, i) => i !== index);
                }
            });

            tmp.always(() => {
                if (!deleted) {
                    deleted = true;
                    _childs = _childs.filter((x, i) => i !== index);
                }
            });

            return tmp;
        };

        this.create_promise = ({callback, onAbort = () => {}}, ...args) => {
            const promiseCreator = () => {
                return new Mel_Promise(callback, ...args);
            };
            return _create_promises(promiseCreator, {callback, onAbort}, ...args);
        };

        this.create_ajax_request = ({type, url, success, failed, onAbort = () => {}, datas = null}) => {
            const promiseCreator = () => {
                return new Mel_Ajax({type, url, success, failed, datas});
            };
            return _create_promises(promiseCreator, {callback, onAbort});
        };

        this.create_ajax_post_request = ({url, success, failed, onAbort = () => {}, datas = null}) => {
            return this.create_ajax_request({
                type:"POST",
                url, 
                success,
                failed,
                onAbort,
                datas
            });
        };

        this.create_ajax_get_request = ({url, success, failed, onAbort = () => {}}) => {
            return this.create_ajax_request({
                type:"GET",
                url, 
                success,
                failed,
                onAbort
            });
        };

        this.await_all_childs = () => {
            return new Mel_Promise(Promise.allSettled, ..._childs);
        }

        this.all_child_generator = function *await_all_child_generator() {
            yield *_childs;
        }; 

        this.start_resolving = () => {
            resolving = true;
        };

        this.resolve = (why) => {
            if (!resolving) throw new Error("start_resolving is not started !");

            clearTimeout(timeout_id);
            resolving = null;
            res_func(why);
        };

        this.reject = (why) => {
            if (!resolving) throw new Error("start_resolving is not started !");

            clearTimeout(timeout_id);
            resolving = null;
            rej_func(why);
        }

        let datas = new Promise((res, rej) => {
            let waiting_promise;
            const isAbortablePromise = !!_callback.then && !!_callback.abort;
            //Stop la fonction si elle à besoin d'être stoppée
            const check_stop = setInterval(() => {
                if (cancelled === true) {
                    console.log('cancelled !', waiting_promise, _callback);
                    clearInterval(check_stop);

                    if (isAbortablePromise) _callback().abort();
                    if (!!waiting_promise?.abort) waiting_promise.abort();

                    new Promise((r, j) => {
                        try {
                            this.onAbort.call();
                            r();
                        } catch (error) {
                            j(error);
                        }
                    });
                    cancel_complete = true;
                    rej('Cancelled');
                }
            }, 100);
            try {
                if (isAbortablePromise) //Si c'est une promesse
                {
                    waiting_promise = _callback;
                }
                else { 
                    //Si la function est asynchrone
                    if (isAsync(_callback)) {
                        waiting_promise = this.build_call_back(_callback, this, ...args);
                    }
                    else { //Si c'est une fonction + classique
                        res_func = res;
                        rej_func = rej;
                        const val = this.build_call_back(_callback, this, ...args);
                        if (!!val?.then) waiting_promise = val;
                        else {
                            if (resolving) 
                            {
                                timeout_id = check_stop;
                            }
                            else {
                                clearInterval(check_stop);
                                res(val);
                            }
                        }
                    }

                }

                if (!!waiting_promise) {
                    waiting_promise.then((datas) => {
                        clearInterval(check_stop);
                        res(datas);
                    }, (error) => {
                        clearInterval(check_stop);
                        rej(error);
                    });
                }
            } catch (error) {
                console.error('[mel_promise]', error);
                rej(error);
            }
        }).then((d) => {
            //Passage en résolu
            resolved = true;
            pending = false;
            return d;
        }, (r) => {
            //Passage en échec
            pending = false;
            rejected = true;
            return r;
        });

        //Async functions
        this.executor = async () => {
            return await datas;
        }

        this.then = function () {
            const promise = this.executor()
            const value = promise.then.apply(promise, arguments)
            return new Mel_Promise(() => value);
        };

        this.catch = function () {
            const promise = this.executor()
            return promise.catch.apply(promise, arguments)
        };
        this.success = (call) => this.then(call);
        this.fail = (call) => this.then(() => { }, call);
        this.always = (call) => this.then(call, call);
    }

    *[Symbol.iterator]() {
        yield this;
        yield* this.all_child_generator();
    }

    build_call_back(callback, current, ...args) {
        return callback(current, ...args);
    }

    static wait(whatIWait, timeout = 5){
        return new WaitSomething(whatIWait, timeout);
    }

    static Complete() {
        return new Mel_Promise(() => {});
    }
}

class Mel_Ajax extends Mel_Promise{
    constructor({type, url, success, failed, datas = null}) {
        let parameters = {type, url, success, failed};

        if (!!datas) parameters['data'] = datas;

        super($.ajax, parameters);
    }

    build_call_back(callback, current, ...args) {
        return callback(...args, current);
    }
}

class WaitSomething extends Mel_Promise {
    constructor(whatIWait, timeout = 5) {
        let promise = new Mel_Promise((current) => {
            current.start_resolving();
            let it = 0;
            const interval = setInterval(() => {
                if (whatIWait()) {
                    it = null;
                    clearInterval(interval);
                    current.resolve({resolved:true});
                }
                else if (it >= timeout * 10) {
                    it = null;
                    clearInterval(interval);
                    current.resolve({resolved:false, msg:`timeout : ${timeout * 10}ms`});
                }

                ++it;
            }, 100);
        });

        super(promise);
    }
}