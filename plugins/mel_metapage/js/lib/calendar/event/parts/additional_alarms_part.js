/**
 * @module EventView/Parts/AdditionalAlarms
 */

import ABaseMelObject from '../../../base_mel_object.js';
import { Alarm } from '../../alarms.js';
import { AlarmData, AlarmPart } from './alarmpart.js';

/**
 * Gère les rappels supplémentaires d'un évènement (MANTIS 0008412).
 *
 * Le premier rappel reste géré par {@link AlarmPart}. Cette partie ajoute
 * jusqu'à {@link AdditionalAlarmsPart.MAX_EXTRA} rappels sous le champ principal
 * et construit la liste complète des valarms à la sauvegarde.
 * @class
 */
export class AdditionalAlarmsPart {
  /**
   * Helper pour récupérer toutes les fonctions utiles
   * @readonly
   * @returns {ABaseMelObject}
   */
  get helper() {
    return ABaseMelObject.Empty();
  }

  /**
   * @param {external:jQuery} $mainFakeField Select visuel du premier rappel
   */
  constructor($mainFakeField) {
    this._$main = $mainFakeField;
    this._$container = null;
    this._$list = null;
    this._$add = null;
  }

  /**
   * Initialise la partie à partir de l'évènement
   * @param {*} event Evènement du plugin `calendar`
   * @returns {AdditionalAlarmsPart} Chaînage
   */
  init(event) {
    this.destroy();

    this._$container = $('<div class="mel-additional-alarms"></div>');
    this._$list = $('<div class="mel-additional-alarms-list"></div>').appendTo(
      this._$container,
    );
    this._$add = $(
      '<button type="button" class="mel-button btn btn-secondary mt-1"></button>',
    )
      .text(`+ ${this._getText('add_alarm')}`)
      .on('click', () => this.addRow())
      .appendTo(this._$container);

    this._$main.parent().after(this._$container);

    // Rappels existants : le premier est géré par AlarmPart
    Alarm.listFromEvent(event)
      .slice(1)
      .map((a) => a.time)
      .filter((m) => m > 0)
      .slice(0, AdditionalAlarmsPart.MAX_EXTRA)
      .forEach((m) => this.addRow(m));

    this._refreshAddButton();
    return this;
  }

  /**
   * Ajoute une ligne de rappel
   * @param {number} minutes Valeur initiale en minutes
   * @returns {AdditionalAlarmsPart} Chaînage
   */
  addRow(minutes = AdditionalAlarmsPart.DEFAULT_MINUTES) {
    if (this.count() >= AdditionalAlarmsPart.MAX_EXTRA) return this;

    const $row = $(
      '<div class="mel-extra-alarm-row d-flex align-items-center mt-1"></div>',
    );
    const $select = $(
      '<select class="form-control input-mel mel-extra-alarm"></select>',
    ).attr('aria-label', this._getText('additional_alarm'));

    for (const opt of AdditionalAlarmsPart.options(minutes)) {
      $('<option>').attr('value', opt.value).text(opt.label).appendTo($select);
    }
    $select.val(minutes);

    const removeLabel = this._getText('remove_alarm');
    const $remove = $(
      '<button type="button" class="mel-button btn btn-secondary ml-1"><span class="material-symbols-outlined" aria-hidden="true">close</span></button>',
    )
      .attr({ title: removeLabel, 'aria-label': removeLabel })
      .on('click', () => {
        $row.remove();
        this._refreshAddButton();
      });

    $row.append($select, $remove).appendTo(this._$list);
    this._refreshAddButton();

    return this;
  }

  /**
   * @returns {number} Nombre de rappels supplémentaires affichés
   */
  count() {
    return this._$list?.children().length ?? 0;
  }

  /**
   * @returns {number[]} Valeurs en minutes des rappels supplémentaires
   */
  values() {
    if (!this._$list) return [];

    return this._$list
      .find('select.mel-extra-alarm')
      .toArray()
      .map((x) => +x.value)
      .filter((x) => x > 0);
  }

  /**
   * Construit la liste complète des valarms (premier rappel + supplémentaires, sans doublon)
   * @param {string|number} firstMinutes Valeur du select principal
   * @returns {Array<{action:string, trigger:string}>}
   */
  buildValarms(firstMinutes) {
    const minutes = [+firstMinutes, ...this.values()].filter((m) => m > 0);

    return [...new Set(minutes)].map((m) => ({
      action: 'DISPLAY',
      trigger: `-${m}M`,
    }));
  }

  /**
   * Retire les éléments générés du DOM
   */
  destroy() {
    this._$container?.remove();
    this._$container = null;
    this._$list = null;
    this._$add = null;
  }

  /**
   * Récupère un libellé localisé du plugin mel_metapage
   * @private
   * @param {string} key Clé de localisation
   * @returns {string}
   */
  _getText(key) {
    return this.helper.getLocalization(key, {
      plugin: AdditionalAlarmsPart.TEXT_PLUGIN,
    });
  }

  /**
   * Cache le bouton d'ajout quand le maximum est atteint
   * @private
   */
  _refreshAddButton() {
    this._$add?.toggle(this.count() < AdditionalAlarmsPart.MAX_EXTRA);
  }

  /**
   * Options disponibles : rappels prédéfinis positifs et valeur existante non prédéfinie
   * @param {number} current Valeur actuelle en minutes
   * @returns {Array<{label:string, value:number}>}
   */
  static options(current) {
    const options = AlarmPart.PREDEFINED.filter((x) => x.value > 0);

    if (current > 0 && !options.some((x) => x.value === current)) {
      options.push({ value: current, label: new AlarmData(current).toString() });
      options.sort((a, b) => a.value - b.value);
    }

    return options;
  }
}

/** 3 rappels au total : le principal + 2 supplémentaires */
AdditionalAlarmsPart.MAX_EXTRA = 2;
AdditionalAlarmsPart.DEFAULT_MINUTES = 15;
/** Plugin qui porte les clés de localisation */
AdditionalAlarmsPart.TEXT_PLUGIN = 'mel_metapage';