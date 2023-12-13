import { Look } from "../classes/metrics.js";
import { MetapageModule } from "./metapage_module.js";

export class AMetricsModule extends MetapageModule {
    constructor() {
        super();
    }

    selector() {}

    action() {}

    before(event) {}

    send_callback() {
        return Look.Send;
    }

    args(event) { 
        return [event];
     }

    exec() {
        $(this.selector()).on(this.action(), (event) => {
            const before =  this.before(event);

            if (before !== AMetricsModule.BREAK) this.send_callback().call(Look, ...this.args(event));
        });

        return this;
    }
}

AMetricsModule.BREAK = Symbol('break');