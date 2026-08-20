/**
 * Classe abstraite définissant la stratégie de temporisation utilisée pour
 * déclencer automatiquement l'ouverture (`toggle()`) d'un dossier replié
 * lorsqu'un mail est glissé (drag) au-dessus pendant une durée donnée.
 *
 * Le comportement de `setTimeout`/`requestAnimationFrame` pendant un drag
 * HTML5 natif diffère selon le moteur du navigateur : {@link Firefox} et
 * {@link OtherNavigators} implémentent chacune une stratégie adaptée, et
 * {@link BridgeNavigator} sélectionne l'implémentation active selon le
 * navigateur détecté.
 */
export class ANavigators {
  constructor() {}

  /**
   * Démarre la temporisation avant bascule (`toggle()`) de la cible
   * survolée pendant un drag. Méthode abstraite à implémenter dans les
   * classes filles.
   *
   * @param {HTMLElement} target - Élément de dossier survolé (doit exposer `toggle()`)
   * @throws {Error} Toujours - méthode abstraite, non implémentée ici
   */
  initiateDragTimeout(target) {
    throw new Error('Classe asbtraite !', target);
  }

  /**
   * Annule la temporisation en cours, typiquement en fin de drag ou lors
   * d'un changement de cible survolée. Méthode abstraite à implémenter
   * dans les classes filles.
   *
   * @param {HTMLElement} [target] - Cible concernée par l'annulation (usage dépendant de l'implémentation)
   * @throws {Error} Toujours - méthode abstraite, non implémentée ici
   */
  stopDragTimeout(target) {
    throw new Error('Classe asbtraite !', target);
  }
}
