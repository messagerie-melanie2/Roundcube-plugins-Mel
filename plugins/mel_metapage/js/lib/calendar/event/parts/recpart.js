/**
 * @module EventView/Parts/Reccursivity
 *
 */
import { EventView } from '../event_view.js';
import { FakePart, Parts } from './parts.js';

/**
 * @class
 * @classdesc Gère la partie récursivité d'un événement.
 * @extends FakePart
 * @frommodule EventView/Parts
 */
export class RecPart extends FakePart {
  /**
   *
   * @param {external:jQuery} original Champ qui contiendra les données formattés du champs visuel. Sera utiliser pour la sauvegarde des données de l'évènement.
   * @param {external:jQuery} fake Champ qui contiendra les données visuels de la récursivité.
   */
  constructor(original, fake) {
    super(original, fake, Parts.MODE.change);

    this._$fakeField.tooltip({
      content: () =>
        this._$fakeField.attr('title') ||
        this._$fakeField.attr('data-original-title'),
    });

    this._$fakeField.removeAttr('disabled').removeClass('disabled');
  }

  /**
   * Intialise la partie.
   * @override
   * @param {*} event Evènement du plugin `Calendar`
   */
  init(event) {}

  /**
   * Met à jours le champ
   * @override
   * @param {string} val Nouvelle valeur du champ
   */
  onUpdate(val) {
    this._$field.val(val).change();
  }

  /**
   * Action qui sera appelé lorsque le champ changera de valeur.
   * @override
   * @param  {Event} e Données de l'évènement
   */
  onChange(e) {
    this.onUpdate(e.currentTarget.value);
    //récupère la première date
    let firstdate = EventView.INSTANCE.parts.date.date_start;
    //récupère la fréquence dayli, weekly, monthly, yearly
    let freq = e.currentTarget.value;
    let endprop;
    let end = true;
    //calcule
    switch (freq) {
      case RecPart.frequency.daily:
        endprop = firstdate.add(3, 'M');
        //destrucs
        break;
      case RecPart.frequency.weekly:
        //destrucs
        endprop = firstdate.add(6, 'M');
        break;
      case RecPart.frequency.monthly:
        //destrucs
        endprop = firstdate.add(1, 'y');
        break;
      case RecPart.frequency.yearly:
        end = false;
        //destrucs
        break;
      default:
        end = false;
        break;
    }
    if (end) {
      //propose le champ
      $('#edit-recurrence-enddate').val(endprop.format('DD/MM/YYYY'));
      // met date cochée par défault
      $('#edit-recurrence-repeat-until').prop('checked', true);
    } else {
      $('#edit-recurrence-enddate').val(null);
      $('#edit-recurrence-repeat-forever').prop('checked', true);
    }
  }

  /**
   * Libère les données qui doivent être libérés.
   */
  destroy() {
    this._$fakeField.tooltip('destroy');
  }
}
/**
 * @enum {string}
 */
RecPart.frequency = {
  daily: 'DAILY',
  weekly: 'WEEKLY',
  monthly: 'MONTHLY',
  yearly: 'YEARLY',
};
