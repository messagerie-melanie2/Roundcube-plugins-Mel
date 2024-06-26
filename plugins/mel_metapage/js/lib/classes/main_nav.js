/**
 * Module qui contient les classes et fonctions qui permettent de gérer la navigation principale.
 * @module MainNav
 * @local Helper
 * @local Selector
 */

import { EMPTY_STRING } from "../constants/constants.js";

export {MainNav}

/**
 * @class
 * @classdesc Gère les actions sur la navigation principale.
 * @static
 * @abstract
 * @hideconstructor
 */
class MainNav {
    constructor() {
        throw 'This is a static class, you cannot instanciate it';
    }

    /**
     * Permet de créer un badge qui affichera un texte par dessus un élément.
     * 
     * Si le badge n'éxiste pas il sera créer. 
     * 
     * Pour modifier le badge il faudra utiliser la fonction {@link MainNav.update_badge}. 
     * @param {!string} selector Selecteur du bouton qui permettera de retrouver l'élément où ajouter le badge. 
     * @param {!string} idBadge Id du badge, cela permettre de le modifier plus tard.
     * @param {!string} default_text Texte par défaut. `'?'` par défaut
     * @returns {MainNav} Chaînage
     * @see {@link MainNav.update_badge}
     * @static
     * @frommodulelink MainNav {@linkto MainNav} {@membertype . }
     * @frommodulereturn MainNav {@membertype . }
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
     * Met à jours un badge.
     * 
     * Doit être appelé si le badge existe. Utilisez {@link MainNav.try_add_round} pour créer un badge.
     * @param {number} size Nombre à afficher sur le badge.
     * @param {string} idBadge Id du badge à modifier.
     * @returns {MainNav} Chaînage
     * @see {@link MainNav.try_add_round}
     * @static
     * @frommodulelink MainNav {@linkto MainNav} {@membertype . }
     * @frommodulereturn MainNav {@membertype . }
     */
    static update_badge_number(size, idBadge) {
        const helper = this.helper;
        let querry = helper.select(`#${idBadge}`);

        if (size == 0) querry.css("display", "none");
        else {
            if (size > 999) {
                size = "999+";
                querry.css("font-size", "6px");
            } else querry.css("font-size", EMPTY_STRING);

            querry.html(size);
            querry.css("display", EMPTY_STRING);
        }

        return this;
    }

    /**
     * Met à jours un badge.
     * 
     * Doit être appelé si le badge existe. Utilisez {@link MainNav.try_add_round} pour créer un badge.
     * @param {string} text Nombre à afficher sur le badge.
     * @param {string} idBadge Id du badge à modifier.
     * @returns {MainNav} Chaînage
     * @see {@link MainNav.try_add_round}
     * @static
     * @frommodulelink MainNav {@linkto MainNav} {@membertype . }
     * @frommodulereturn MainNav {@membertype . }
     */
    static update_badge_text(text, idBadge) {
        let $querry = this.helper.select(`#${idBadge}`).css('font-size', EMPTY_STRING);

        if (!!(text || false)) $querry.html(text).css('display', EMPTY_STRING);
        else $querry.css('display', 'none');

        return this;
    }

    /**
     * Met à jours un badge.
     * 
     * Doit être appelé si le badge existe. Utilisez {@link MainNav.try_add_round} pour créer un badge.
     * @param {string | number} data 
     * @param {string} idBadge 
     * @returns {MainNav} Chaînage
     * @frommodulelink MainNav {@linkto MainNav} {@membertype . }
     * @frommodulereturn MainNav {@membertype . }
     */
    static update_badge(data, idBadge) {
        data = data ?? 0;

        if (+data === data) this.update_badge_number(data, idBadge);
        else this.update_badge_text(data, idBadge);

        return this;
    }

}

/**
 * Retourne un élement jQuery.
 * 
 * Le contexte est toujours `top`.
 * @callback Selector
 * @param {string} selector
 * @return {external:Jquery}
 */

/**
 * Structure qui contient toutes les fonctions d'aide pour {@link MainNav}.
 * @typedef Helper
 * @property {Selector} select
 * @frommodulelink MainNav {@linkto MainNav} {@membertype . }
 */

/**
 * Donne plusieurs fonctions d'aide.
 * @type {Helper}
 * @static
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