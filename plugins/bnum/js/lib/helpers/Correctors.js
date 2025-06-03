import { BnumPromise } from '../../../../mel_metapage/js/lib/BnumPromise.js';
import { FramesManager } from '../../../../mel_metapage/js/lib/classes/frame_manager.js';
import { InternetNavigator } from '../../../../mel_metapage/js/lib/helpers/InternetNavigator.js';

/**
 * @class
 * @classdesc Une classe statique qui contient des méthodes de corrections pour différents bugs graphiques.
 * @static
 * @hideconstructor
 */
export default class Correctors {
  constructor() {
    throw new Error('This is a static class and cannot be instantiated.');
  }

  /**
   * Sur Chromium, corrige les bugs de défilement de la page en remettant les frames à la bonne position.
   * @returns {BnumPromise<void>} Une promesse qui se résout lorsque la correction du défilement est terminé.
   * @chromium
   * @static
   */
  static ScrollCorrector() {
    if (InternetNavigator.IsChromium()) {
      return BnumPromise.Start((manager) => {
        setTimeout(() => {
          let html;
          let context = window;
          do {
            // Récupère l'élément <html> du document courant pour corriger le défilement.
            html = context.document.querySelector('html');

            // Si le défilement vertical n'est pas à 0, le réinitialiser.
            if (html.scrollTop !== 0) html.scrollTop = 0;

            // Passe au contexte parent pour appliquer la correction à tous les cadres.
            html = null;
            context = context.parent;
          } while (context && context !== context.parent && context.document);

          // Récupère le cadre principal via FramesManager.
          const $frame = FramesManager.Instance.get_frame();
          const base = $frame.css('height'); // Sauvegarde la hauteur actuelle du cadre.

          // Change temporairement la hauteur du cadre pour forcer un recalcul graphique.
          $frame.css('height', '99%');

          setTimeout(() => {
            // Restaure la hauteur initiale du cadre après le recalcul.
            $frame.css('height', base);
            manager.resolver.resolve(); // Résout la promesse une fois la correction terminée.
          }, 10);
        }, 10);
      });
    } else return BnumPromise.Resolved(); // Retourne une promesse résolue si le navigateur n'est pas Chromium.
  }
}
