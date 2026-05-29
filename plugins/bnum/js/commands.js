import { BnumLog } from '../../mel_metapage/js/lib/classes/bnum_log.js';
import { MelObject } from '../../mel_metapage/js/lib/mel_object.js';

//#region Types

/**
 * @typedef {Object} OncePerDayData
 * @property {boolean} valid - Indique si la réponse PHP est valide
 * @property {?Record<string, any>} error - Détails de l'erreur éventuelle
 */

//#endregion Types

//#region Class principale

/**
 * Gère l'enregistrement et le déclenchement de commandes/triggers applicatifs.
 *
 * À l'instanciation, cette classe :
 * - écoute l'événement `plugin.local_once_per_day` pour déclencher `once_per_day`
 * - lance automatiquement la séquence post-login "once per day" si le contexte
 *   est `bnum` et que le cookie correspondant est absent.
 *
 * @extends MelObject
 */
export class Commands extends MelObject {
  //#region Public
  constructor() {
    super();

    this.listen('plugin.local_once_per_day', () => {
      this.#_oncePerDay();
    });

    if (this.#_shouldFireOncePerDay()) this.#_startAfterLoginOncePerDay();
  }
  //#endregion Public

  //#region Private

  /**
   * Détermine si la séquence "once per day" doit être déclenchée.
   *
   * Les deux conditions requises sont :
   * 1. La tâche courante est `bnum` (contexte principal).
   * 2. Le cookie `once_per_day` est absent (action non encore exécutée aujourd'hui).
   *
   * @returns {boolean} `true` si la séquence doit s'exécuter, `false` sinon.
   */
  #_shouldFireOncePerDay() {
    const isBnumTopContext = this.get_env('task') === 'bnum';
    const cookieAbsent = !this.cookie_get('once_per_day')?.value;
    return isBnumTopContext && cookieAbsent;
  }

  /**
   * Déclenche l'événement Roundcube `once_per_day`.
   *
   * @returns {void}
   */
  #_oncePerDay() {
    this.trigger('once_per_day');
  }

  /**
   * Envoie la requête HTTP POST `plugin.bnum_after` après le login,
   * puis traite la réponse ou logue l'erreur.
   *
   * @returns {Promise<void>}
   */
  async #_startAfterLoginOncePerDay() {
    try {
      await this.rcmail().http_post('plugin.bnum_after');

      const rawData = this.get_env('action_after.once_per_day_data');
      this.#_handleOncePerDayResponse(rawData);
      this.rcmail().env['action_after.once_per_day_data'] = null;
    } catch (err) {
      BnumLog.error(
        'PHP/plugin.bnum_after',
        'Erreur lors de la requête post-login once_per_day.',
        err,
      );
    }
  }

  /**
   * Traite la réponse de la séquence post-login "once per day".
   *
   * Si `data.valid` est différent de `true`, l'erreur est loguée via {@link BnumLog}.
   *
   * @param {string | OncePerDayData} data - Données brutes (chaîne JSON ou objet).
   * @returns {void}
   */
  #_handleOncePerDayResponse(data) {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;

    if (parsed.valid !== true) {
      BnumLog.error(
        'PHP/plugin.bnum_after',
        'Une erreur est survenue !',
        parsed,
      );
    }
  }
  //#endregion Private
}

//#endregion Classe principale
