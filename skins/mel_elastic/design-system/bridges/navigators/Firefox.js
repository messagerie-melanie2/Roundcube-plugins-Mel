import { ANavigators } from './ANavigators.js';

/**
 * Implémentation de {@link ANavigators} pour Firefox.
 *
 * Sous Firefox, `setTimeout` continue de se déclencher normalement pendant
 * un drag HTML5 natif : la temporisation peut donc être implémentée
 * simplement avec `setTimeout` + `AbortController`, sans boucle de
 * `requestAnimationFrame` (contrairement à {@link OtherNavigators}, requise
 * pour les autres moteurs de navigateur).
 */
export class Firefox extends ANavigators {
  constructor() {
    super();
  }

  /**
   * Démarre un délai d'une seconde avant de basculer (`toggle()`) la cible
   * survolée. Chaque appel remplace le délai précédent : un nouvel
   * `AbortController` est créé et le délai précédent (s'il existait) est
   * annulé via {@link Firefox#stopDragTimeout}.
   *
   * @param {HTMLElement} target - Élément de dossier survolé (doit exposer `toggle()`)
   */
  initiateDragTimeout(target) {
    this.signal = new AbortController();
    this.signal.signal.addEventListener('abort', () => {
      this.stopDragTimeout();
    });
    this.timeout = setTimeout(() => {
      if (!this.signal || this.signal.signal.aborted) return;

      target.toggle();
      this.signal.abort();
    }, 1000);
  }

  /**
   * Annule la temporisation en cours.
   *
   * Un premier appel déclenche l'abandon du contrôleur (`abort()`), ce qui
   * réinvoque cette méthode via l'écouteur `abort` posé dans
   * {@link Firefox#initiateDragTimeout} : c'est ce second appel qui nettoie
   * réellement le timer et les références internes.
   */
  stopDragTimeout() {
    if (this.signal) {
      if (!this.signal.signal.aborted) this.signal.abort();
      else {
        if (this.timeout) clearTimeout(this.timeout);
        this.signal = null;
        this.timeout = null;
      }
    }
  }
}
