import { BnumException } from "./bnum_base_exceptions.js";

export class ServiceWorkerException extends BnumException{
    constructor(base_error, message = 'Erreur lors de l\'enregistrement du Service Worker : ') {
        super(base_error, message, navigator.serviceWorker);
    }
}