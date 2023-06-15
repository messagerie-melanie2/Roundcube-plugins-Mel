export { Update };
import { AMain } from "./main.js";
import { Mel_Promise } from "./mel_promise.js";

class Update extends AMain {
    constructor() {
        super();
        this.locked = false;
    }

    async add(callback, ...args) {
        if (!this.locked) super.add(callback, ...args);
        else {
            await new Mel_Promise((promise) => {
                promise.start_resolving();
                const interval = setInterval(() => {
                    if (!this.locked) {
                        super.add(callback, ...args);
                        clearInterval(interval);
                        promise.resolve(true);
                    }
                })
            });
        }
    }

    async call() {
        if (!this.locked) {
            this.locked = true;
            this.main = super.call();
            this.locked = false;
        }
        else {
            await new Mel_Promise((promise) => {
                promise.start_resolving();
                const interval = setInterval(async () => {
                    if (!this.locked) {
                        await this.call();
                        clearInterval(interval);
                        promise.resolve(true);
                    }
                })
            });
        }

        return this.main;
    }
}