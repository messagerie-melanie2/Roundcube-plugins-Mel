import { AAgendaModifier } from '../../amodifier.js';
import { AgendaCommands } from '../commands';
import { AgendaHelper } from '../helper.js';

/**
 * Modificateur d'agenda permettant la copie d'événements.
 * Cette classe ajoute la commande de copie d'événement et gère la duplication,
 * en tenant compte des événements récurrents via AgendaHelper.
 */
export class EventCopyModifer extends AAgendaModifier {
  /**
   * Constructeur du modificateur de copie d'événement.
   */
  constructor() {
    super();
  }

  /**
   * Initialise le modificateur :
   * - Ajoute la commande 'event-self-copy'
   * - Applique le hack pour la duplication d'événement
   */
  start() {
    super.start();

    this._p_addCommand(
      'event-self-copy',
      AgendaCommands.Instance.command_self_copy.bind(AgendaCommands.Instance),
    );

    this.#_hack_duplicate_event();
  }

  /**
   * Hack pour surcharger la fonction de copie d'événement.
   * Si l'événement est récurrent, il est modifié avant la copie.
   * @private
   */
  async #_hack_duplicate_event() {
    await this._p_await_cal();

    const original_copy_event = cal.event_copy;
    cal.event_copy = async function (event) {
      event = await AgendaHelper.Instance.modifieEventCopyIfRecurrent(event);

      original_copy_event.call(this, event);
    };
  }
}
