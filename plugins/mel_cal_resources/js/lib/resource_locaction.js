import { GuestsPart } from '../../../mel_metapage/js/lib/calendar/event/parts/guestspart.js';
import {
  AExternalLocationPart,
  LocationPartManager,
} from '../../../mel_metapage/js/lib/calendar/event/parts/location_part.js';
import { MelEnumerable } from '../../../mel_metapage/js/lib/classes/enum.js';
import { Tuple } from '../../../mel_metapage/js/lib/classes/tuple.js';
import { EMPTY_STRING } from '../../../mel_metapage/js/lib/constants/constants.js';
import { page } from '../../skins/mel_elastic/js_template/resource_location.js';

class ResourceLocation extends AExternalLocationPart {
  constructor(attendee, index) {
    super(EMPTY_STRING, index);

    this._attendee = attendee;
  }

  generate($parent) {
    super.generate($parent);

    page(null, this, this?.resource_type?.()).generate().appendTo($parent);

    return this;
  }

  /**
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

  static Has(event) {
    return (
      event.attendees &&
      event.attendees.length &&
      MelEnumerable.from(event.attendees).any(
        (a) => a.role === GuestsPart.ROLES.resource,
      )
    );
  }

  static Max() {
    return Number.POSITIVE_INFINITY;
  }

  static OptionValue() {
    return 'resource';
  }

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

if (rcmail.env.cal_resources.enable_all)
  LocationPartManager.AddExtraLocationType(ResourceLocation);

ResourceLocation.GerateUniqueResources();

window.mel_cal_resource_loaded = true;
