import { Look } from "../../classes/metrics.js";
import { AMetricsModule } from "../ametrics_module.js";

export class SecondaryNavMetrics extends AMetricsModule {
    constructor() {
        super();
    }

    selector() {
        return '#barup-wrapper-row button, #user-up-panel';
    }

    action() {
        return 'click';
    }

    send_callback() {
        return Look.SendTask;
    }

    args(event) {
        let name = 'top_button_';
        event = $(event.currentTarget);

        switch(event.attr('id')) {
            case 'button-create':
                name += 'create';
                break;
            case 'button-notes':
                name += 'notes';
                break;
            case 'button-chat':
                name += 'chat';
                break;
            case 'button-help':
                name += 'help';
                break;
            case 'button-settings':
                name += 'settings';
                break;
            case 'user-up-panel':
                name += 'profil';
                break; 
        }

        return [name];
    }
}