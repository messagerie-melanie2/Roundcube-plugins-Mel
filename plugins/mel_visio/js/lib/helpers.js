import { MelEnumerable } from '../../../mel_metapage/js/lib/classes/enum.js';
import { FramesManager } from '../../../mel_metapage/js/lib/classes/frame_manager.js';
import { EMPTY_STRING } from '../../../mel_metapage/js/lib/constants/constants.js';
import {
  REG_ALPHANUM,
  REG_NUMBER,
} from '../../../mel_metapage/js/lib/constants/regexp.js';

export class VisioFunctions {
  /**
   * Mélange un tableau
   * @private
   * @static
   * @param {Array} array
   * @returns {Array}
   */
  static _shuffle(array) {
    var currentIndex = array.length,
      temporaryValue,
      randomIndex;
    // While there remain elements to shuffle...
    while (currentIndex !== 0) {
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
    return array;
  }

  /**
   * Génère le nom d'une visioconférence
   * @static
   * @returns {string}
   */
  static generateWebconfRoomName() {
    var charArray = [
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'G',
      'H',
      'I',
      'J',
      'K',
      'L',
      'M',
      'N',
      'O',
      'P',
      'Q',
      'R',
      'S',
      'T',
      'U',
      'V',
      'W',
      'X',
      'Y',
      'Z',
    ];
    var digitArray = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    var roomName =
      this._shuffle(digitArray).join(EMPTY_STRING).substring(0, 3) +
      this._shuffle(charArray).join(EMPTY_STRING).substring(0, 7);
    return this._shuffle(roomName.split(EMPTY_STRING)).join(EMPTY_STRING);
  }

  /**
   * Vérifie si le nom de la room est valide
   * @static
   * @param {string} val Nom de la room
   * @returns {boolean}
   */
  static CheckKeyIsValid(val) {
    return (
      val.length >= 10 &&
      MelEnumerable.from(val)
        .where((x) => REG_NUMBER.test(x))
        .count() >= 3 &&
      REG_ALPHANUM.test(val)
    );
  }
}
