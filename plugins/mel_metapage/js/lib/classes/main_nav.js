import { MelObject } from "../mel_object.js";

export class MainNav extends MelObject {
    constructor() {}

    /**
     * Ajoute un badge si la taille est supérieur à 0.
     * @param {string} selector Objet à ajouter le badge.
     * @param {string} idBadge Id du badge.
    */
    static try_add_round(selector, idBadge, default_text = '?') {
        const helper = this.helper;
        selector = helper.select(selector);

        if (0 === helper.select(`#${idBadge}`).length)
        {
            const span = new mel_html('span', {
                id:idBadge,
                class:'roundbadge menu lightgreen',
                style:'display:none'
            }, default_text);

            new mel_html2('sup', {
                contents:span
            }).create(selector);
        }

        return this;
    }

    /**
     * Met à jours le badge.
     * @param {number} size Nombre à afficher.
     * @param {string} idBadge Id du badge à modifier.
     */
    static update_badge(size, idBadge) {
        const helper = this.helper;
        let querry = helper.select(`#${idBadge}`);

        if (size == 0) querry.css("display", "none");
        else {
            if (size > 999) {
                size = "999+";
                querry.css("font-size", "6px");
            } else querry.css("font-size", "");

            querry.html(size);
            querry.css("display", "");
        }

        return this;
    }

}

/**
 * @type {MelObject}
 */
MainNav.helper = null;
Object.defineProperties(MainNav, {
    helper: {
        get: function() {
            return {
                select(selector) {
                    return top.$(selector);
                }
            }
        },
        configurable: true
    }
});