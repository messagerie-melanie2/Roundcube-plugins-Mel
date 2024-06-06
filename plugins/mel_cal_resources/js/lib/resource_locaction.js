import { EventView } from '../../../mel_metapage/js/lib/calendar/event/event_view.js';
import { GuestsPart } from '../../../mel_metapage/js/lib/calendar/event/parts/guestspart.js';
import {
  AExternalLocationPart,
  LocationPartManager,
} from '../../../mel_metapage/js/lib/calendar/event/parts/location_part.js';
import { BnumLog } from '../../../mel_metapage/js/lib/classes/bnum_log.js';
import {
  BnumMessage,
  eMessageType,
} from '../../../mel_metapage/js/lib/classes/bnum_message.js';
import { MelEnumerable } from '../../../mel_metapage/js/lib/classes/enum.js';
import { Tuple } from '../../../mel_metapage/js/lib/classes/tuple.js';
import { EMPTY_STRING } from '../../../mel_metapage/js/lib/constants/constants.js';
import { MelHtml } from '../../../mel_metapage/js/lib/html/JsHtml/MelHtml.js';
import { BnumEvent } from '../../../mel_metapage/js/lib/mel_events.js';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { Mel_Promise } from '../../../mel_metapage/js/lib/mel_promise.js';
import { ResourceDialogPage } from '../../skins/mel_elastic/js_template/resource_location.js';

export { ResourceLocation };

/**
 * @class
 * @classdesc Location d'un évènement pour une ressource.
 * @extends AExternalLocationPart
 * @frommodule EventView/Parts/Location
 */
class ResourceLocation extends AExternalLocationPart {
  /**
   * Constructeur de la classe
   * @param {*} attendee Participant du plugin `Calendar`
   * @param {number} index Id de la location
   */
  constructor(attendee, index) {
    super(EMPTY_STRING, index);

    this._attendee = attendee;
    this._$page = null;
    this._page = null;
    this.onclickafter = new BnumEvent();
  }

  /**
   * Génère la location et l'ajoute au parent
   * @override
   * @param {external:jQuery} $parent
   * @returns {ResourceLocation} Chaîne
   */
  generate($parent) {
    super.generate($parent);

    this.page = new ResourceDialogPage(
      this._attendee,
      this,
      this?.resource_type?.(),
    );
    this.page.onclickafter.push(this.onclickafter.call.bind(this.onclickafter));
    this._$page = this.page.get().generate().appendTo($parent);

    if (this._attendee) {
      this._update_old_attendees();
      this._load_attendee_data();
    }
    return this;
  }

  async _load_attendee_data() {
    BnumMessage.SetBusyLoading();

    await MelObject.Empty().http_internal_post({
      task: 'mel_cal_resources',
      action: 'load_custom',
      params: {
        _resources: [this._attendee.email],
      },
      on_success: (data) => {
        if (typeof data === 'string') data = JSON.parse(data);

        if (data && data.length && this._$page && this._$page.length) {
          const current_resource = data[0];
          this._$page
            .find('button')
            .html(
              $('<span>')
                .css('vertical-align', 'super')
                .text(
                  `${current_resource.name} - ${current_resource.street} ${current_resource.postalcode} ${current_resource.locality}`,
                ),
            )
            .prepend(
              MelHtml.start
                .icon('ads_click')
                .css('color', 'var(--mel-button-text-color)')
                .css('margin-right', '5px')
                .end()
                .generate(),
            )
            .attr('resource', current_resource.email)
            .removeAttr('disabled')
            .removeClass('disabled');

          if (!window.selected_resources) window.selected_resources = {};

          window.selected_resources[this.id] = current_resource;
        }
      },
    });

    BnumMessage.StopBusyLoading();
  }

  async _update_old_attendees() {
    await ResourceLocation.SetAttendeeMechanics(this._attendee.email);
  }

  static async SetAttendeeMechanics(email) {
    await Mel_Promise.wait(
      () => $(`.mel-attendee[data-email="${email}"]`).length,
    );
    $(`.mel-attendee[data-email="${email}"]`)
      .attr('draggable', false)
      .css('cursor', 'not-allowed')
      .find('.close-button')
      .css('display', 'none');
  }
  /**
   * Force le click sur le bouton générer par cette classe
   */
  force_click() {
    this._$page.find('button').first().click();
  }

  /**
   * Si la localisation est valide et correspond à ce que l'on attend
   *
   * Un emplacement est TOUJOURS valide.
   * @returns {boolean}
   * @override
   */
  is_valid() {
    return !!this._$page.find('button').attr('resource');
  }

  /**
   * Action à faire si la localisation n'est pas valide
   * @override
   */
  invalid_action() {
    BnumMessage.DisplayMessage(
      'Please select a resource for this event.',
      eMessageType.Error,
    );

    this._$page.find('button').focus();
  }

  /**
   * Libère les données en mémoire.
   * @override
   */
  destroy() {
    if (!EventView.INSTANCE.dialog_closed) {
      $(
        `.mel-attendee[data-email="${window.selected_resources[this.id].email}"] .close-button`,
      ).click();
    }

    if (window.selected_resources[this.id])
      delete window.selected_resources[this.id];

    if (this.page.dialog) {
      try {
        this.page.dialog.destroy();
      } catch (error) {
        BnumLog.warning('ResourceLocation/destory', 'Already deleted');
      }

      this.page.dialog = null;
    }

    if (this.page) this.page.onclickafter.clear();
  }

  /**
   * Génère les différentes localisations
   * @override
   * @static
   * @param {*} event Event du plugin calendar
   * @returns {Array<Tuple<typeof AExternalLocationPart, *>>}
   */
  static Instantiate(event) {
    if (event.attendees && event.attendees.length) {
      return MelEnumerable.from(event.attendees)
        .where((a) => a.cutype === GuestsPart.ROLES.resource)
        .select((x) => new Tuple(ResourceLocation, x))
        .toArray();
    } else return [];
  }

  /**
   * Vérifie si la localisation est de ce type
   * @static
   * @override
   * @param {*} event — Event du plugin calendar
   */
  static Has(event) {
    return (
      event.attendees &&
      event.attendees.length &&
      MelEnumerable.from(event.attendees).any(
        (a) => a.cutype === GuestsPart.ROLES.resource,
      )
    );
  }

  /**
   * Nombre maximum de cette classe qui peut être utilisé
   * @override
   * @returns {number} Nombre maximum de ressources
   * @default Number.POSITIVE_INFINITY
   * @static
   */
  static Max() {
    return Number.POSITIVE_INFINITY;
  }

  /**
   * Valeur de l'option qui désigne cette classe
   * @returns {string}
   * @default 'resource'
   * @static
   */
  static OptionValue() {
    return 'resource';
  }

  /**
   * Génère les ResourceLocations individuels.
   *
   * Elles sont de type `ResourceLocations<T>` ou `T` est le type de la ressource.
   * @static
   */
  static GerateUniqueResources() {
    var renameFunction = function (name, fn) {
      return eval(`
        (() => {
          ${(fn + EMPTY_STRING).replaceAll(fn.name, name)}

          return ${name};
        })();
      `);
    };

    const resources = rcmail.env.cal_resources;

    let tmp;
    for (const key in resources.resources) {
      if (Object.hasOwnProperty.call(resources.resources, key)) {
        const iterator = resources.resources[key];

        if (iterator.is_option) {
          tmp = renameFunction(
            `ResourceLocation_${key.replaceAll('-', '_').replaceAll(' ', '_')}`,
            ResourceLocation,
          );
          tmp.resource_type = key;
          tmp.OptionValue = function () {
            return this.resource_type;
          }.bind(tmp);
          tmp.Has = function (event) {
            return (
              ResourceLocation.Has(event) &&
              MelEnumerable.from(event.attendees).any(
                (x) =>
                  x.resource_type === `X-${this.resource_type.toUpperCase()}`,
              )
            );
          }.bind(tmp);
          tmp.Instantiate = function (event) {
            if (event.attendees && event.attendees.length) {
              return MelEnumerable.from(event.attendees)
                .where((a) => a.cutype === GuestsPart.ROLES.resource)
                .where(
                  (x) =>
                    x.resource_type === `X-${this.resource_type.toUpperCase()}`,
                )
                .select((x) => new Tuple(this, x))
                .toArray();
            } else return [];
          }.bind(tmp);
          tmp.Max = ResourceLocation.Max.bind(tmp);
          eval(`tmp.prototype.resource_type = () => '${key}'`);
          LocationPartManager.AddExtraLocationType(tmp);
        }
      }
    }
  }
}

if (!window.mel_cal_resource_loaded) {
  if (rcmail.env.cal_resources.enable_all)
    //Ajoute les resources au select
    LocationPartManager.AddExtraLocationType(ResourceLocation);

  ResourceLocation.GerateUniqueResources();

  //Signifie que les données de ce plugin sont chargés
  window.mel_cal_resource_loaded = true;
}
