import { BnumLog } from "../../classes/bnum_log.js";
import { Look, LookLabel } from "../../classes/metrics.js";
import { AMetricsModule } from "../ametrics_module.js";

const current_tasks_to_ignore = ['bnum'];
const tasks_action = ['bnum']
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
        let task = this._get_task_from_event(event);

        const function_called = this[`_task_replace_action_${task}`];
        if (!!function_called && tasks_action.includes(task)) task = function_called.call(this, event, task) ?? task;

        if (!(task || false) || task.includes('#')) return AMetricsModule.BREAK;
    }

    _task_replace_action_bnum(event, task) {
        return false;
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

         return this;
    }

    async _send_current_task() {
        const task = this.rc_data.task;

        if (!current_tasks_to_ignore.includes(task)){
            BnumLog.info('_send_current_task', 'send current task : ', task);
            await Look.SendTask(task);
        }
        else BnumLog.info('_send_current_task', 'current task : ', task, 'ignored !');
        await Look.SendTask('connected', new LookLabel({}));

        setTimeout(this._send_current_task.bind(this), ((+Look.SEND_INTERVAL) * 1000));
    }
}