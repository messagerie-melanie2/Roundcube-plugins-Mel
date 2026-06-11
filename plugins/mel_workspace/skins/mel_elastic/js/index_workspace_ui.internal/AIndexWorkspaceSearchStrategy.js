import { BnumLog } from '../../../../../mel_metapage/js/lib/classes/bnum_log.js';
import { MelObject } from '../../../../../mel_metapage/js/lib/mel_object.js';

/**
 * Classe abstraite définissant le contrat des stratégies de recherche
 * pour la page d'index des espaces de travail.
 *
 * Chaque stratégie concrète correspond à un type d'onglet et implémente
 * sa propre logique de recherche (locale ou distante).
 *
 * @abstract
 * @class
 * @extends MelObject
 * @see {@link IndexWorkspacePublicSearchStrategy} Implémentation pour les espaces publics
 *
 * @example
 * class MaStrategie extends AIndexWorkspaceSearchStrategy {
 *   async search(mainTabs, value) {
 *     // implémentation spécifique
 *   }
 * }
 */
export class AIndexWorkspaceSearchStrategy extends MelObject {
  /**
   * Effectue la recherche pour l'onglet courant.
   *
   * Cette méthode doit être surchargée par toutes les sous-classes.
   * Si elle ne l'est pas, elle logue une erreur et lève une exception.
   *
   * @remarks
   * La vérification du niveau de log est effectuée manuellement avant
   * l'appel à {@link BnumLog.error} afin d'éviter les allocations inutiles
   * lorsque le niveau de log actuel est inférieur à `error`.
   *
   * @param {HTMLTabsElement} mainTabs - Onglets principaux de la page d'index
   * @param {string} value - Valeur saisie dans le champ de recherche
   * @returns {Promise<void>}
   * @throws {Error} Systématiquement si la méthode n'est pas implémentée
   */
  async search(mainTabs, value) {
    const text = `${this.constructor.name} doit implémenter search()`;

    if (BnumLog.log_level >= BnumLog.LogLevels.error)
      BnumLog.error(this.constructor.name, text, mainTabs, value);

    throw new Error(text);
  }
}
