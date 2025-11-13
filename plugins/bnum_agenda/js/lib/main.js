import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { AGENDA_MODIFIERS } from './program/modifiers.js';

/*
La logique est la suivante : 
- Quand on veut modifier une fonctionaliter, on l'ajoute dans le dossier modifier avec une classe 
qui hérite de AAgendaModifier, on l'ajoute ensuite dans modifiers.js
- Quand on veut ajouter, on créer une classe dans program puis on l'intialise ici.
*/

/**
 * Classe principale du module Agenda.
 *
 * Lance les modifiers ou des nouvelles fonctionalités.
 */
export class BnumAgenda extends MelObject {
  /**
   * Constructeur de la classe BnumAgenda.
   */
  constructor() {
    super();
    this.#_start();
  }

  /**
   * Démarre les modifiers ou nouvelles fonctionnalités du module Agenda.
   */
  #_start() {
    for (const Modifier of AGENDA_MODIFIERS) {
      new Modifier().start();
    }
  }
}

new BnumAgenda();
