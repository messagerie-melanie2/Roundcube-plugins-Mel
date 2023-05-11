export { MelPortal };
import { MelObject } from "../../../mel_metapage/js/lib/mel_object";
import { Mel_Promise } from "../../../mel_metapage/js/lib/mel_promise";
import { ModuleLoader } from "./module_loader";

const INTERVAL = 100;
class MelPortal extends MelObject {
    constructor() {
        super();
        this.loaded = false;
    }

    main() {
        super.main();
        ModuleLoader.load().then(() => this.loaded = true, () => this.loaded = true);
    }

    thenLoad() {
        return new Mel_Promise((promise) => {
            promise.start_resolving();
            let loaded = this.loaded;

            if (!loaded) {
                const id = setInterval(() => {
                    if (this.loaded) {
                        clearInterval(id);
                        promise.resolve(this);
                    }
                }, INTERVAL);
            } else promise.resolve(this);
        });
    }
}