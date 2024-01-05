import { BnumNotification, BnumNotificationAction } from "../../../../../mel_notification/js/bnum_notifications.js";
import { BnumLog } from "../../classes/bnum_log.js";
import { ServiceWorkerException } from "../../exceptions/metapages_actions_exceptions.js";
import { module_bnum } from "./module_bnum.js";

export class ProgressiveWebApp extends module_bnum{
    constructor() {
        super();
    }

    main() {
        super.main();

        this.beforeInstallPrompt = null;

        return this;
    }

    exec() {
        super.exec();

        this.registerServiceWorker();
        window.addEventListener("beforeinstallprompt", this.beforeInstallPromptEventHandler.bind(this), this.beforeInstallPromptErrorHandler.bind(this));

        return this;
    }

    registerServiceWorker () {
        // enregistre le script sw avec les navigateurs qui le gèrent
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js', {scope: '/'}).then((registration) => {
                BnumLog.info('registerServiceWorker', 'Service Worker enregistré correctement, scope : ', registration.scope);
    
            }).catch(error => {
                new ServiceWorkerException(error).complete_logs('registerServiceWorker');
            });
        }
    }

    beforeInstallPromptEventHandler (event) {
        BnumLog.info('beforeInstallPromptEventHandler', 'beforeinstallprompt event captured !');
        this.beforeInstallPrompt = event;
    
        setTimeout(() => {
                const action = new BnumNotificationAction('install-pwa', "Installer l'application ?", "Installer l'application");
                BnumNotification.Notify(new BnumNotification('install-pwa', "Installer l'application ?", 'settings', {action}));
            }
            , 10000);
    }
    
    beforeInstallPromptErrorHandler (e) {
        BnumLog.error('beforeInstallPromptErrorHandler',"beforeinstallprompt event error !")
        BnumLog.error('beforeInstallPromptErrorHandler','error: ' + e);
    }

    installPromptTrigger () {
        BnumLog.info('installPromptTrigger', "beforeInstallPromptTrigger !")
        this.beforeInstallPrompt.prompt();
    }
}