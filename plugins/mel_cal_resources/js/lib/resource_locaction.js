import { GuestsPart } from '../../../mel_metapage/js/lib/calendar/event/parts/guestspart.js';
import {
  AExternalLocationPart,
  LocationPartManager,
} from '../../../mel_metapage/js/lib/calendar/event/parts/location_part.js';
import { MelEnumerable } from '../../../mel_metapage/js/lib/classes/enum.js';
import { Tuple } from '../../../mel_metapage/js/lib/classes/tuple.js';
import { EMPTY_STRING } from '../../../mel_metapage/js/lib/constants/constants.js';
import { BnumEvent } from '../../../mel_metapage/js/lib/mel_events.js';
import { page } from '../../skins/mel_elastic/js_template/resource_location.js';

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

    page.onclickafter.push(this.onclickafter.call.bind(this.onclickafter));
    this._$page = page(null, this, this?.resource_type?.())
      .generate()
      .appendTo($parent);

    return this;
  }

  /**
   * Force le click sur le bouton générer par cette classe
   */
  force_click() {
    this._$page.find('button').first().click();
  }

  /**
   * Libère les données en mémoire.
   * @override
   */
  destroy() {
    page.dialog.destroy();
    page.dialog = null;
    page.onclickafter.clear();
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
        .where((a) => a.role === GuestsPart.ROLES.resource)
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
        (a) => a.role === GuestsPart.ROLES.resource,
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
                (x) => x.resource_type === this.resource_type,
              )
            );
          }.bind(tmp);
          tmp.Instantiate = function (event) {
            return MelEnumerable.from(ResourceLocation.Instantiate(event))
              .where((x) => x.item2.resource_type === this.resource_type)
              .toArray();
          }.bind(tmp);
          tmp.Max = ResourceLocation.Max.bind(tmp);
          eval(`tmp.prototype.resource_type = () => '${key}'`);
          LocationPartManager.AddExtraLocationType(tmp);
        }
      }
    }
  }
}

//Ajoute les resources au select
if (rcmail.env.cal_resources.enable_all)
  LocationPartManager.AddExtraLocationType(ResourceLocation);

ResourceLocation.GerateUniqueResources();

//Signifie que les données de ce plugin sont chargés
window.mel_cal_resource_loaded = true;
