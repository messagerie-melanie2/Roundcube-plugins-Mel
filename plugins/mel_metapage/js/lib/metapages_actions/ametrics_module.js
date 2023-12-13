import { Look } from "../classes/metrics.js";
import { module_bnum } from "./bnum/module_bnum.js";

export class AMetricsModule extends module_bnum {
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