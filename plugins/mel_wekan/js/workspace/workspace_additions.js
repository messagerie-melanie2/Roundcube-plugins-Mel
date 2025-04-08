import { BnumPromise } from '../../../mel_metapage/js/lib/BnumPromise.js';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { WorkspaceObject } from '../../../mel_workspace/js/lib/program/WorkspaceObject.js';

/**
 * Classe qui gère les actions lié aux espaces de travail
 * @class
 * @extends MelObject
 */
export default class WorkspaceAdditions extends MelObject {
  constructor() {
    super();
    /**
     * Dernier style en mémoire pour prendre en compte le chargement de wekan
     * @type {?string}
     */
    this.style = null;
    /**
     * Interval pour vérifier si wekan est chargé
     * @type {?number}
     */
    this.interval = null;
    this.#_main();
  }

  /**
   * @type {HTMLElement | null}
   * @readonly
   */
  get wekanHeader() {
    return document
      .querySelector('iframe')
      .contentWindow.document.querySelector('#header-quick-access');
  }

  /**
   * @type {boolean}
   * @readonly
   */
  get isInWorkspace() {
    return document.querySelector('html').classList.contains('mwsp');
  }

  /**
   * Méthode principale de la classe
   * @private
   */
  #_main() {
    //Ajoute un listener sur le chargement de la frame de wekan pour être sûr de pouvoir supprimer la barre de navigation
    document
      .querySelector('iframe')
      .addEventListener('load', this.check_and_set_style.bind(this));

    WorkspaceObject.TryObserveHtml((data) => {
      const { style } = data;

      this.#_update_style({ style });
    });
  }

  /**
   * Met à jour le style de la barre de navigation de wekan
   * @param {Object} [param0={}]
   * @param {?string} [param0.style=null]
   * @returns {HTMLElement | null}
   */
  #_update_style({ style = null } = {}) {
    const wekanHeader = this.wekanHeader;

    if (wekanHeader)
      wekanHeader.style.display =
        style ?? (this.style || (this.isInWorkspace ? 'none' : null));

    return wekanHeader;
  }

  /**
   * Vérifie si l'en tête de wekan existe, et si c'est le cas, la cache ou l'affiche selon si mwsp existe ou non.
   * @returns {BnumPromise<boolean>}
   */
  check_and_set_style() {
    return BnumPromise.Start((manager) => {
      if (!this.#_update_style()) {
        if (this.interval) clearInterval(this.interval);

        /**
         * Sécurité pour kill l'interval au bout de 1 minutes
         * @type {number}
         * @package
         */
        let it = 0;
        this.interval = setInterval(() => {
          if (it++ > 60 || this.#_update_style()) {
            clearInterval(this.interval);
            this.interval = null;
            it = null;
            manager.resolver.resolve(!!this.wekanHeader);
          }
        }, 1000);
      }
    });
  }

  static Start() {
    return new WorkspaceAdditions();
  }
}

WorkspaceAdditions.Start();
