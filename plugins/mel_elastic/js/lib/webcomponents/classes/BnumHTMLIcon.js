import ABaseMelObject from "../../../../../mel_metapage/js/lib/base_mel_object";
import { EMPTY_STRING } from "../../../../../mel_metapage/js/lib/constants/constants";
import { BnumModules } from "../../../../../mel_metapage/js/lib/helpers/dynamic_load_modules.js";
import { BnumEvent } from "../../../../../mel_metapage/js/lib/mel_events.js";
import ABnumHTMLElement from "../abstract/ABnumHTMLElement.js";
import ElementChangedEvent from "../events/ElementChangedEvent.js";

/**
 * Classe qui permet d'afficher une icône
 * @default 'material-symbols-outlined'
 * @constant
 * @type {string}
 */
const ICON_CLASS = "material-symbols-outlined";

/**
 * Composant Web représentant une icône basée sur Material Symbols.
 * Permet d'afficher une icône personnalisée avec gestion du style et du cache.
 * @class
 * @extends ABnumHTMLElement
 */
export default class BnumHTMLIcon extends ABnumHTMLElement {
  #_firstRender = true;

  /**
   * Retourne la liste des attributs observés par le composant.
   * @returns {string[]} Liste des attributs observés.
   * @static
   * @protected
   */
  static _p_observedAttributes() {
    return ["data-icon", "class"];
  }

  /**
   * Constructeur du composant BnumHTMLIcon.
   * Initialise la classe CSS et les gestionnaires de changement d'attributs.
   *
   * ## Liste des événements disponibles sur ce composant :
   * - oniconchanged : déclenché lors du changement d'icône
   *
   * ## Les événements DOM suivants sont également dispatchés :
   * - custom:element-changed.icon (ElementChangedEvent)
   *
   * ## Attributs disponibles :
   * - data-icon : string — Nom de l'icône à afficher (par défaut)
   *
   * ## Slots disponibles :
   * - (default) : Symbol de l'icône par défaut si il existe
   */
  constructor() {
    super();
    this._p_on_attribute_changed.push((name, _, newVal) => {
      switch (name) {
        case "data-icon":
          this.icon = newVal;
          break;

        case "class":
          if (!this._p_isInsideShadowRoot) {
            if (!this.hasClass(BnumHTMLIcon.HTML_CLASS))
              this.addClass(BnumHTMLIcon.HTML_CLASS);
          }
          break;

        default:
          break;
      }
    });

    /**
     * Événement déclenché lors du changement d'icône.
     * @type {BnumEvent<(newIcon: string, oldIcon: string) => void>}
     */
    this.oniconchanged = new BnumEvent();

    this.oniconchanged.add("default", (newIcon, oldIcon) => {
      this.dispatchEvent(new ElementChangedEvent("icon", newIcon, oldIcon));
    });
  }

  /**
   * Récupère l'icône affichée.
   * @returns {string} Nom ou contenu de l'icône.
   */
  get icon() {
    const icon = this.innerHTML || this.data("icon");

    if (icon && this.data("icon") === null) this.data("icon", icon);

    if (this.hasAttribute("data-icon")) this.removeAttribute("data-icon");

    return icon;
  }

  /**
   * Définit l'icône à afficher.
   * @param {string} value Nom ou contenu de l'icône.
   */
  set icon(value) {
    if (value !== null) {
      if (typeof value === "string" && /^[\w-]+$/.test(value)) {
        const oldValue = this.icon;
        this.data("icon", { value });

        if (this.innerText !== EMPTY_STRING) this.innerText = EMPTY_STRING;

        if (!this.#_firstRender) this.render();

        this.oniconchanged.call(value, oldValue);
      } else throw new Error("Icon must be a valid string.");
    }
  }

  _p_preload() {
    if (this._p_isInsideShadowRoot && this.hasClass(BnumHTMLIcon.HTML_CLASS)) {
      this.removeClass(BnumHTMLIcon.HTML_CLASS);
    } else if (!this.hasClass(BnumHTMLIcon.HTML_CLASS))
      this.addClass(BnumHTMLIcon.HTML_CLASS);
  }

  /**
   * Effectue le rendu du composant.
   * @returns {string} HTML à afficher.
   * @protected
   */
  _p_render() {
    let returnString = EMPTY_STRING;
    if (!this._p_isInsideShadowRoot) {
      const icon = this.icon;
      returnString = this.innerHTML === icon ? "<slot></slot>" : icon;
    } else {
      returnString += this.#_loadStyle();
      returnString += `<span class="${ICON_CLASS}">${this.icon}</span>`;
    }

    this.#_firstRender = false;

    return returnString;
  }

  /**
   * Sauvegarde la feuille de style Material Symbols dans le cache local.
   * @returns {Promise<void>}
   * @private
   */
  async #_saveStyle() {
    if (BnumHTMLIcon._style_in_save) return;

    BnumHTMLIcon._style_in_save = true;
    await ABaseMelObject.Empty().http_call({
      url: `${window.location.origin + window.location.pathname}skins/mel_elastic/material-symbols.css?v=${BnumModules.VERSION}`,
      on_success: (loaded) => {
        ABaseMelObject.Empty().save(
          "shadow-icon-material-symbol-version",
          BnumModules.VERSION,
        );
        ABaseMelObject.Empty().save("shadow-icon-material-symbol", loaded);
      },
    });

    BnumHTMLIcon._style_in_save = false;
  }

  /**
   * Charge la feuille de style Material Symbols.
   * @returns {string} HTML du style à inclure.
   * @private
   */
  #_loadStyle() {
    /**
     * @type {HTMLElement}
     */
    let style;
    let loaded_style = ABaseMelObject.Empty().load(
      "shadow-icon-material-symbol",
    );

    if (!loaded_style) {
      this.#_saveStyle();
      style = document.createElement("link");
      style.rel = "stylesheet";
      style.href = `skins/mel_elastic/material-symbols.css?v=${BnumModules.VERSION}`;
    } else if (
      (ABaseMelObject.Empty().load("shadow-icon-material-symbol-version") ||
        true) &&
      ABaseMelObject.Empty().load("shadow-icon-material-symbol-version") !==
        BnumModules.VERSION
    ) {
      ABaseMelObject.Empty().save("shadow-icon-material-symbol", null);
      style = this.#_loadStyle();
    } else {
      style = document.createElement("style");
      style.appendChild(document.createTextNode(loaded_style));
    }

    return style.outerHTML;
  }

  /**
   * Crée une nouvelle instance de BnumHTMLIcon avec l'icône spécifiée.
   * @param {string} icon Nom ou contenu de l'icône.
   * @returns {BnumHTMLIcon} L'instance de l'icône créée.
   * @static
   */
  static Create(icon) {
    const element = document.createElement(BnumHTMLIcon.TAG);
    element.icon = icon;
    return element;
  }

  /**
   * Retourne le tag HTML utilisé pour ce composant.
   * @returns {string} Tag HTML du composant.
   * @static
   * @readonly
   */
  static get TAG() {
    return "bnum-icon";
  }

  /**
   * Retourne la classe CSS utilisée pour l'icône.
   * @returns {string} La classe CSS de l'icône.
   * @static
   * @readonly
   */
  static get HTML_CLASS() {
    return ICON_CLASS;
  }

  /**
   * Retourne une icône "home" (maison).
   * @returns {BnumHTMLIcon} Instance de l'icône "home".
   * @static
   */
  static get HOME() {
    return BnumHTMLIcon.Create("home");
  }

  /**
   * Retourne une icône "search" (loupe).
   * @returns {BnumHTMLIcon} Instance de l'icône "search".
   * @static
   */
  static get SEARCH() {
    return BnumHTMLIcon.Create("search");
  }

  /**
   * Retourne une icône "settings" (engrenage).
   * @returns {BnumHTMLIcon} Instance de l'icône "settings".
   * @static
   */
  static get SETTINGS() {
    return BnumHTMLIcon.Create("settings");
  }

  /**
   * Retourne une icône "person" (utilisateur).
   * @returns {BnumHTMLIcon} Instance de l'icône "person".
   * @static
   */
  static get USER() {
    return BnumHTMLIcon.Create("person");
  }

  /**
   * Retourne une icône "mail" (enveloppe).
   * @returns {BnumHTMLIcon} Instance de l'icône "mail".
   * @static
   */
  static get MAIL() {
    return BnumHTMLIcon.Create("mail");
  }

  /**
   * Retourne une icône "close" (croix/fermer).
   * @returns {BnumHTMLIcon} Instance de l'icône "close".
   * @static
   */
  static get CLOSE() {
    return BnumHTMLIcon.Create("close");
  }

  /**
   * Retourne une icône "check" (valider).
   * @returns {BnumHTMLIcon} Instance de l'icône "check".
   * @static
   */
  static get CHECK() {
    return BnumHTMLIcon.Create("check");
  }

  /**
   * Retourne une icône "warning" (avertissement).
   * @returns {BnumHTMLIcon} Instance de l'icône "warning".
   * @static
   */
  static get WARNING() {
    return BnumHTMLIcon.Create("warning");
  }

  /**
   * Retourne une icône "info" (information).
   * @returns {BnumHTMLIcon} Instance de l'icône "info".
   * @static
   */
  static get INFO() {
    return BnumHTMLIcon.Create("info");
  }

  /**
   * Retourne une icône "delete" (poubelle/supprimer).
   * @returns {BnumHTMLIcon} Instance de l'icône "delete".
   * @static
   */
  static get DELETE() {
    return BnumHTMLIcon.Create("delete");
  }

  /**
   * Retourne une icône "ajouter" (plus).
   * @returns {BnumHTMLIcon} Instance de l'icône "ajouter".
   * @static
   */
  static get ADD() {
    return BnumHTMLIcon.Create("add");
  }
}

BnumHTMLIcon.TryDefine();
