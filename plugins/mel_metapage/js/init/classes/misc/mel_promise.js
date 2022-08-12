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

        let pending = true;
        let rejected = false;
        let resolved = false;
        let cancelled = false;

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
        this.onAbort = () => { };
        /**
         * Arrête la fonction
         * @returns {Mel_Promise}
         */
        this.abort = function () {
            cancelled = true;
            return this;
        };

        let datas = new Promise((res, rej) => {
            const isAbortablePromise = !!_callback.then && !!_callback.abort;
            //Stop la fonction si elle à besoin d'être stoppée
            let check_stop = setInterval(() => {
                if (cancelled === true) {
                    clearInterval(check_stop);

                    if (isAbortablePromise) _callback().abort();

                    new Promise((r, j) => {
                        this.onAbort();
                        r();
                    });
                    rej('Cancelled');
                }
            }, 100);
            try {
                if (isAbortablePromise) //Si c'est une promesse
                {
                    _callback().then((datas) => {
                        res(datas);
                    }, (error) => {
                        rej(error);
                    })
                }
                else { 
                    //Si la function est asynchrone
                    if (isAsync(_callback)) {
                        _callback(this, ...args).then((d) => {
                            clearInterval(check_stop);
                            res(d);
                        }, (e) => {
                            clearInterval(check_stop);
                            rej(e);
                        });
                    }
                    else { //Si c'est une fonction + classique
                        const val = _callback(...args);
                        res(val);
                    }

                }
            } catch (error) {
                rej(error);
            }
            clearInterval(check_stop);
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
        }
        this.success = (call) => this.then(call);
        this.fail = (call) => this.then(() => { }, call);
        this.always = (call) => this.then(call, call);
    }
}
