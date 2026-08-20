import { ANavigators } from './ANavigators.js';

/**
 * Implémentation de {@link ANavigators} pour les navigateurs autres que
 * Firefox (Chromium, Safari, etc.).
 *
 * Sur ces navigateurs, `setTimeout` ne se déclenche pas de façon fiable
 * pendant un drag HTML5 natif : la temporisation est donc recalculée à
 * chaque frame via `requestAnimationFrame`, en comparant `performance.now()`
 * à l'instant de début du survol (contrairement à {@link Firefox}, où un
 * simple `setTimeout` suffit).
 */
export class OtherNavigators extends ANavigators {
  constructor() {
    super();
  }

  /**
   * Boucle de vérification du seuil, ré-planifiée à chaque frame tant
   * que la cible survolée reste la même.
   * @private
   */
  #_tickTimeOutToggle() {
    if (!this.dragOverTarget) return; // annulé (changement de cible / fin de drag)

    if (performance.now() - this.dragOverStart >= 1000) {
      this.dragOverTarget.toggle();
      this.stopDragTimeout(); // on ne re-toggle pas en boucle
      return;
    }

    this.rafId = requestAnimationFrame(() => this.#_tickTimeOutToggle());
  }

  /**
   * Démarre le suivi du survol de la cible : mémorise l'instant de départ
   * et lance la boucle {@link OtherNavigators#_tickTimeOutToggle}. Ignoré
   * si un survol est déjà en cours (évite de redémarrer le décompte à
   * chaque `dragover` répété sur la même cible).
   *
   * @param {HTMLElement} target - Élément de dossier survolé (doit exposer `toggle()`)
   */
  initiateDragTimeout(target) {
    if (this.dragOverTarget) return;

    this.dragOverTarget = target;
    this.dragOverStart = performance.now();

    this.rafId = requestAnimationFrame(() => this.#_tickTimeOutToggle());
  }

  /**
   * Annule le suivi en cours, sauf si la cible passée correspond déjà à la
   * cible actuellement suivie — dans ce cas l'appel est ignoré car il
   * s'agit d'un `dragover` répété sur le même dossier, pas d'une fin de
   * survol (le décompte ne doit pas être redémarré).
   *
   * @param {HTMLElement} [target] - Cible à comparer à la cible actuellement suivie ; toute valeur différente (y compris `undefined`) provoque l'arrêt du suivi
   */
  stopDragTimeout(target) {
    if (target === this.dragOverTarget) return;

    if (this.rafId) cancelAnimationFrame(this.rafId);

    this.rafId = null;
    this.dragOverTarget = null;
    this.dragOverStart = null;
  }
}
