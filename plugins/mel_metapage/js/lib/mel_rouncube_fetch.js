export {MelRoundcubeFetch as MelRouncubeFetch};
import { Mel_Promise } from "./mel_promise";

let fetches = {};
class MelRoundcubeFetch {
    constructor(task, action, args) {
        this.task = task;
        this.action = action;
        this.args = args;
        this.promise = null;
    }

    run() {
        const action = this.action;
        if (!fetches[action]) {
            fetches[action] = true;
            rcmail.addEventListener(`responsebefore${action}`, () => {
                if (!!this.promise && this.promise.isPending()) this.promise?.resolve?.(true);
           });
        }

        let config = this.args;
        prop.action = action; 

        return new Mel_Promise((promise) => {
            promise.start_resolving();

            try {
                this.promise = promise;
                rcmail.http_post('calendar', config);
            } catch (error) {
                promise.reject(error);
            }
        });
    }

    async executor() {
        return await this.run();
    }
}
