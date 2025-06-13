import { BaseStorage } from '../../../../../../mel_metapage/js/lib/classes/base_storage.js';
import { MelEnumerable } from '../../../../../../mel_metapage/js/lib/classes/enum.js';
import { EMPTY_STRING } from '../../../../../../mel_metapage/js/lib/constants/constants.js';
import { WorkspaceObject } from '../../WorkspaceObject.js';

/**
 * Gère les actions lié aux espaces de travail dans l'agenda
 * @extends WorkspaceObject
 */
class CalendarAddition extends WorkspaceObject {
  constructor() {
    super();
    /**
     * @type {BaseStorage<{hasAttendees: boolean, hasCategories: boolean}>}
     */
    this.data = new BaseStorage();
  }

  _add(eventId) {
    if (!this.data.has(eventId)) {
      this.data.add(eventId, {
        hasAttendees: false,
        hasCategories: false,
      });
    }

    return this;
  }

  getData(eventId) {
    if (!this.data.has(eventId)) {
      this._add(eventId);
    }

    return this.data.get(eventId);
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

        this.getData(calendarEvent.id).hasCategories = true;
        setTimeout(() => {
          if ($('#event-add-member').css('display') === 'none') {
            console.log('[EVENT]La catégorie na pas été chargé correctement !');
            $('#event-category-icon').parent().parent().css('display', '');
            $('#event-add-member').css('display', '');
          }
        }, 1000);
      } else if (
        (top ?? parent ?? window).$('html').hasClass('mwsp') &&
        calendarEvent.uid
      )
        this.editMode = true;

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

          if (calendarEvent.attendees.length > 1) {
            this.getData(calendarEvent.id).hasAttendees = true;
          }
        }

        return { calendarEvent };
      });
    } else {
      //Si on ne passe pas par le bouton "créer" de l'espace de travail, mais par l'agenda
      //Lorsque la vue de la création d'un évènement de l'agenda est chargé, on ajoute les utilisateurs de l'espace de travail dans la liste des participants
      this.listen('calendar.view.loaded', () => {
        if (this.editMode) {
          this.editMode = false;
          return;
        }

        if (this.isInWorkspace()) {
          this.elementLoaded = true;
          this.rcmail().command('calendar-workspace-add-all');
          this.getData(cal.selected_event.id).hasAttendees = true;
        }
      });

      this.listen('calendar-workspace-add-all-after', () => {
        if (this.editMode) {
          this.editMode = false;
          return;
        }

        if (this.isInWorkspace() && this.elementLoaded) {
          this.elementLoaded = false;
          document.getElementById('edit-title').focus();
        }
      });
    }

    this.listen('calendar.save_event.before_send', (args) => {
      const { calEvent: calendarEvent } = args;
      let { data } = args;

      let hasModifications = false;

      if (
        this.getData(calendarEvent.id).hasAttendees &&
        (!data.attendees || data.attendees.length === 0)
      ) {
        console.log(
          "[EVENT]Les participants n'ont pas été sauvegardés correctement !",
        );
        hasModifications = true;
        data.attendees ??= [];
        let waitingAttendee = {
          name: EMPTY_STRING,
          email: EMPTY_STRING,
          role: 'REQ-PARTICIPANT',
        };

        for (const attendee of $('.mel-attendee')) {
          waitingAttendee.email = attendee.getAttribute('data-email');
          waitingAttendee.name =
            attendee.getAttribute('data-name') || EMPTY_STRING;
          waitingAttendee.role =
            attendee.getAttribute('data-hiddenrole') || 'REQ-PARTICIPANT';

          data.attendees.push(waitingAttendee);
          waitingAttendee = {};
        }
      }

      if (
        this.getData(calendarEvent.id).hasCategories &&
        (!data.categories || data.categories === EMPTY_STRING)
      ) {
        console.log("[EVENT]La catégorie n'a pas été chargé correctement !");
        hasModifications = true;
        data.categories = `ws#${this.load('current_wsp')}`;
      }

      if (hasModifications) {
        args.data = data;
        return args;
      }
    });
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
