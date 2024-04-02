import { EMPTY_STRING } from '../../../mel_metapage/js/lib/constants/constants.js';

export class VisioFunctions {
	/**
	 * Mélange un tableau
	 * @private
	 * @param {Array} array
	 * @returns {Array}
	 */
	static _shuffle(array) {
		var currentIndex = array.length,
			temporaryValue,
			randomIndex;
		// While there remain elements to shuffle...
		while (0 !== currentIndex) {
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
}
