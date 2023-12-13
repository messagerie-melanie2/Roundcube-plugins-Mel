import { BnumLog } from "../../classes/bnum_log.js";
import { Look } from "../../classes/metrics.js";
import { AMetricsModule } from "../ametrics_module.js";

export class MainNavMetrics extends AMetricsModule {
    constructor() {
        super();
    }

    selector() {
        return '#taskmenu li a';
    }

    action() {
        return 'click';
    }

    before(event) {
        const task = this._get_task_from_event(event);

        if (!(task || false) || task.includes('#')) return AMetricsModule.BREAK;
    }

    send_callback() {
        return Look.SendTask;
    }

    args(event) {
        return [this._get_task_from_event(event)];
    }

     _get_url(event) {
        return $(event.currentTarget).attr('href');
    }

    _get_task(url) {
        return url.split('?_task=')[1].split('&')[0];
    }

    _get_task_from_event(event) {
        return this._get_task(this._get_url(event));
    }

    exec() {
        super.exec();

         this._send_current_task();
    }

    async _send_current_task() {
        const task = this.rc_data.task;

        BnumLog.info('_send_current_task', 'send current task : ', task);

        await Look.SendTask(task);

        setTimeout(() => {
            this._send_current_task();
        }, ((+Look.SEND_INTERVAL) * 1000));
    }
}