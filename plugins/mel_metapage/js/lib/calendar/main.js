import AGENDA_CONNECTORS from '../../../../bnum_agenda/js/lib/connectors.js';
import { BnumLog } from '../classes/bnum_log.js';
import { BnumConnector } from '../helpers/bnum_connections/bnum_connections.js';
import { MelObject } from '../mel_object.js';
import { WaitSomething } from '../mel_promise.js';

/**
 * Classe représentant le module calendrier Mel.
 * @extends MelObject
 */
export class MelCalendar extends MelObject {
  /**
   * Constructeur de MelCalendar.
   */
  constructor() {
    super();
  }

  /**
   * Point d'entrée principal du module calendrier.
   * Initialise les écouteurs et lance le rendu initial.
   */
  main() {
    super.main();
    BnumLog.info('MelCalendar/main', 'Starting calendar module');
    this._add_on_load();
    MelCalendar.rerender({ helper_object: this });

    this.rcmail().register_command(
      'mel_calendar/rerender',
      MelCalendar.rerender.bind(MelCalendar),
      true,
    );

    this.rcmail().register_command(
      'mel_calendar/update_categories',
      MelCalendar.UpdateCategories.bind(MelCalendar),
      true,
    );

    this.listen(
      'workspace.created',
      async () => {
        await MelCalendar.UpdateCategories();
      },
      { callbackKey: 'mel_calendar/update_categories', topRcmail: true },
    );
  }

  /**
   * Ajoute un écouteur d'événement pour recharger le calendrier
   * lors du changement de frame vers la tâche "calendar".
   * @returns {MelCalendar} this
   */
  _add_on_load() {
    // Ajoute un écouteur sur le changement de frame pour détecter l'affichage du calendrier
    this.rcmail(true).add_event_listener_ex(
      'switch_frame.after',
      'MelCalendar/_add_on_load/on_frame_loaded',
      (args) => {
        const { task, changepage } = args;

        // Si on change de page et que la tâche est "calendar", on relance le rendu
        if (changepage && task === 'calendar') {
          this._rerender_on_load();
        }
      },
    );
    return this;
  }

  /**
   * Méthode asynchrone pour relancer le rendu du calendrier lors du chargement.
   * @private
   * @returns {Promise<void>}
   */
  async _rerender_on_load() {
    await MelCalendar.rerender({ helper_object: this });
  }

  /**
   * Relance le rendu du calendrier en exécutant une liste d'actions sur l'élément #calendar.
   * @param {Object} params - Paramètres de la fonction.
   * @param {MelObject|null} params.helper_object - Objet utilitaire pour la sélection DOM.
   * @param {MelCalendarAction[]} params.action_list - Liste des actions à exécuter.
   * @returns {Promise<void>}
   */
  static async rerender({
    helper_object = null,
    action_list = MelCalendar.initial_actions(),
  }) {
    BnumLog.info('MelCalendar/rerender', 'Wainting #calendar....');
    const helper = helper_object ?? MelObject.Empty();
    // Attend que l'élément #calendar soit présent dans le DOM
    let resolved = (
      await new WaitSomething(() => helper.select('#calendar').length > 0)
    ).resolved;

    if (resolved) {
      BnumLog.info('MelCalendar/rerender', '#calendar found !');
      let $calendar = helper.select('#calendar');
      // Exécute chaque action sur le calendrier
      for (const iterator of action_list) {
        $calendar.fullCalendar(iterator.action, ...iterator.args);
      }
    } else {
      BnumLog.warning('MelCalendar/rerender', '#calendar not found !');
    }

    // Redimensionne la fenêtre pour s'assurer que le calendrier est correctement affiché
    window.dispatchEvent(new Event('resize'));

    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  }

  /**
   * Retourne la liste initiale des actions à exécuter lors du rendu du calendrier.
   * @returns {MelCalendarAction[]} Liste d'actions
   */
  static initial_actions() {
    return [
      new MelCalendarAction('rerenderEvents'),
      new MelCalendarAction('updateViewSize', true),
    ];
  }

  /**
   * Crée une nouvelle action pour le calendrier.
   * @param {string} action - Nom de l'action.
   * @param {...any} args - Arguments de l'action.
   * @returns {MelCalendarAction} L'action créée.
   */
  static create_action(action, ...args) {
    return new MelCalendarAction(action, ...args);
  }

  /**
   *
   * @returns {Promise<Object<string, string>>}
   */
  static async UpdateCategories() {
    const helper = MelObject.Empty();
    const data = await BnumConnector.connect(AGENDA_CONNECTORS.get_categories);
    helper.rcmail().env.calendar_categories = data.datas;
    helper.trigger('mel_calendar/update_categories.after', {
      categories: data.datas,
    });
    return data.datas;
  }

  /**
   * Retourne la classe MelCalendarAction.
   * @returns {typeof MelCalendarAction}
   * @static
   * @readonly
   */
  static get MelCalendarAction() {
    return MelCalendarAction;
  }
}

/**
 * Représente une action à exécuter sur le calendrier.
 */
class MelCalendarAction {
  /**
   * Constructeur de MelCalendarAction.
   * @param {string} action - Nom de l'action à exécuter.
   * @param {...any} args - Arguments à passer à l'action.
   */
  constructor(action, ...args) {
    // Définit les propriétés action et args en lecture seule via des getters
    Object.defineProperties(this, {
      /**
       * Nom de l'action à exécuter.
       * @memberof MelCalendarAction
       * @instance
       * @readonly
       */
      action: {
        get: () => action,
        configurable: true,
      },
      /**
       * Arguments à passer à l'action.
       * @memberof MelCalendarAction
       * @instance
       * @readonly
       */
      args: {
        get: () => args,
        configurable: true,
      },
    });
  }
}
