import { Unreads } from "../../../mel_metapage/js/lib/chat/chat";
import { MelObject } from "../../../mel_metapage/js/lib/mel_object";

export class IExt extends MelObject {
    constructor() {
        super();
    }

    main() {
        super.main();
    }

    /**
     * Ajoute une action qui sera efféctué lorsque le status sera changé.
     * @param {(status:string, classes_to_remove:string[]) => {}} callback status => nouveau status, classes_to_remove => classe à supprimer si besoin
     * @param {string} key Clé qui permet de mettre à jour si on refresh la page
     * @returns Chaîne
     */
    add_status_callback(callback, key) {
        if (!key) key = _on_status_updated._generateKey();

        _on_status_updated.add(key, callback);

        return this;
    }

    /**
     * Ajoute une action qui sera efféctué lorsqu'il y a eu des nouvelles mentions.
     * @param {(unread:Unreads) => {}} callback Prend en argument un objet de type Unreads
     * @param {string} key Clé qui permet de mettre à jour si on refresh la page
     * @returns Chaîne
     */
    add_unread_callback(callback, key) {
        if (!key) key = _on_unread_updated._generateKey();

        _on_unread_updated.add(key, callback);

        return key;
    }

    static call_status(status, classes_to_remove) {
        return _on_status_updated.call(status, classes_to_remove);
    }

    static call_unread(unread) {
        return _on_unread_updated.call(unread);
    }
}

let _on_status_updated = new MelEvent();
let _on_unread_updated = new MelEvent();