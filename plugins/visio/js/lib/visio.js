import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { VisioRooms } from './program/visio_rooms.js';

export class VisioByDinum extends MelObject {
  #_rooms;

  constructor() {
    super();
    this.#_rooms = new VisioRooms();
  }

  /**
   * Accès à la classe de gestion des salles de visioconférence.
   * @returns {VisioRooms}
   */
  get rooms() {
    return this.#_rooms;
  }
}

new VisioByDinum();
