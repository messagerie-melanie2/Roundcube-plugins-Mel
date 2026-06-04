import { MelObject } from '../../../../plugins/mel_metapage/js/lib/mel_object.js';

/**
 * Classe abstraite représentant un pont (Bridge) pour le design system.
 * Permet d'écouter des événements et d'initialiser des comportements personnalisés.
 * À étendre pour créer des ponts spécifiques.
 * @extends MelObject
 */
export default class ABridge extends MelObject {
  /**
   * Constructeur de la classe ABridge.
   * Initialise les écouteurs d'événements pour 'init' et 'ready'.
   */
  constructor() {
    super();
  }

  /**
   * Initialise le cycle de vie du pont.
   * Écoute l'événement Roundcube 'init' pour déclencher {@link _p_onInit},
   * puis attend la disponibilité du DOM pour déclencher {@link _p_onReady}.
   * @returns {this}
   * @private
   */
  #_start() {
    this.listen('init', () => {
      this._p_onInit();
    });

    if (document.readyState !== 'loading') this._p_onReady();
    else document.addEventListener('DOMContentLoaded', () => this._p_onReady());

    return this;
  }

  /**
   * Méthode appelée lors de l'événement 'init'.
   * À surcharger dans les classes dérivées pour définir un comportement spécifique.
   * @protected
   */
  _p_onInit() {}

  /**
   * Méthode appelée lorsque le pont est prêt.
   * À surcharger dans les classes dérivées pour définir un comportement spécifique.
   * @protected
   */
  _p_onReady() {}

  /**
   * Démarre le pont en instanciant la classe.
   * @returns {ABridge} Instance du pont.
   */
  static Start() {
    return new this().#_start();
  }
}
