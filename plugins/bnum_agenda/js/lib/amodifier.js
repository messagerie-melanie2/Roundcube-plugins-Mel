import { BnumPromise } from '../../../mel_metapage/js/lib/BnumPromise.js';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';

/**
 * Classe abstraite pour les modificateurs d'agenda.
 * Fournit des méthodes utilitaires pour l'intégration avec Roundcube et la gestion asynchrone.
 * @abstract
 * @extends {MelObject}
 */
export class AAgendaModifier extends MelObject {
  /**
   * Constructeur de la classe AAgendaModifier.
   */
  constructor() {
    super();
  }

  /**
   * Méthode à surcharger pour démarrer le modificateur.
   */
  start() {}

  /**
   * Ajoute une commande à Roundcube.
   * @param {string} command_name - Le nom de la commande à enregistrer.
   * @param {Function} callback - La fonction de rappel associée à la commande.
   * @returns {AAgendaModifier} L'instance courante pour chaînage.
   */
  _p_addCommand(command_name, callback) {
    this.rcmail().register_command(command_name, callback, true);
    return this;
  }

  /**
   * Attend que l'objet global 'cal' soit disponible.
   * @returns {BnumPromise<{resolved: boolean,msg: (string | undefined),}} Une promesse résolue lorsque 'cal' est défini.
   */
  _p_await_cal() {
    return BnumPromise.Wait(() => !!window.cal);
  }
}
