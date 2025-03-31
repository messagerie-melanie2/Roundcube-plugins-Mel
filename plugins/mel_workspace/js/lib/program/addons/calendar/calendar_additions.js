import { MelEnumerable } from '../../../../../../mel_metapage/js/lib/classes/enum.js';
import { WorkspaceObject } from '../../WorkspaceObject.js';

/**
 * Gère les actions lié aux espaces de travail dans l'agenda
 * @extends WorkspaceObject
 */
class CalendarAddition extends WorkspaceObject {
  constructor() {
    super();
  }

  /**
   * Actions principales
   */
  main() {
    super.main();

    //Ecoute l'évènement `calendar.create.category.before` pour ajouter la bonne catégorie à l'évènement si on est dans un espace de travail
    this.listen('calendar.create.category.before', (data) => {
      let { calendarEvent } = data;

      if (
        (top ?? parent ?? window).$('html').hasClass('mwsp') &&
        (!calendarEvent.categories || !calendarEvent.categories.length)
      ) {
        calendarEvent.categories = [`ws#${this.load('current_wsp')}`];
        calendarEvent.calendar_blocked = 'true';
      }

      return { calendarEvent };
    });

    //Si on passe par le bouton "créer" de l'espace de travail
    if (this.workspace.users && this.workspace.users.any()) {
      //Ecoute l'évènement `calendar.create.guests.before` pour ajouter les utilisateurs de l'espace de travail dans la liste des participants
      this.listen('calendar.create.guests.before', (data) => {
        let { calendarEvent, Guest } = data;
        if (
          (top ?? parent ?? window).$('html').hasClass('mwsp') &&
          this.workspace.users
        ) {
          calendarEvent.attendees ??= [];
          calendarEvent.attendees.push(
            ...MelEnumerable.from(this.workspace.users.generator()).select(
              (x) =>
                this.#_update(
                  new Guest(x.name, x.email).toAttendee(
                    x.email === this.get_env('current_user').email
                      ? 'ORGANIZER'
                      : 'REQ-PARTICIPANT',
                  ),
                ),
            ),
          );
        }

        return { calendarEvent };
      });
    } else {
      //Si on ne passe pas par le bouton "créer" de l'espace de travail, mais par l'agenda
      //Lorsque la vue de la création d'un évènement de l'agenda est chargé, on ajoute les utilisateurs de l'espace de travail dans la liste des participants
      this.listen('calendar.view.loaded', () => {
        this.rcmail().command('calendar-workspace-add-all');
      });
    }
  }

  /**
   *
   * @param {{name: string, email: string, role: string, internal?:?bool}} guest
   * @returns {name: string, email: string, role: string, internal?:?bool}
   * @private
   */
  #_update(guest) {
    if (guest.role === 'ORGANIZER') guest.internal = true;

    return guest;
  }

  static Start() {
    return new CalendarAddition();
  }
}

CalendarAddition.Start();
