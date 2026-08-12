import { ANavigators } from './ANavigators.js';

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

  initiateDragTimeout(target) {
    if (this.dragOverTarget) return;

    this.dragOverTarget = target;
    this.dragOverStart = performance.now();

    this.rafId = requestAnimationFrame(() => this.#_tickTimeOutToggle());
  }

  stopDragTimeout(target) {
    if (target === this.dragOverTarget) return;

    if (this.rafId) cancelAnimationFrame(this.rafId);

    this.rafId = null;
    this.dragOverTarget = null;
    this.dragOverStart = null;
  }
}
