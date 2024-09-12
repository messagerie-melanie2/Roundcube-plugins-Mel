import { EMPTY_STRING } from '../constants/constants.js';

export class Random {
  static intRange(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return ~~(Math.random() * (max - min) + min);
  }

  static range(min, max) {
    return Math.random() * (max - min) + min;
  }

  static rbg_color() {
    return `rgb(${Random.intRange(0, 255)}, ${Random.intRange(0, 255)}, ${Random.intRange(0, 255)})`;
  }

  static random_string(size) {
    const ALPHA = 'abcdefghijklmnopqrstuvwxyz';

    let str = EMPTY_STRING;

    for (let index = 0; index < size; ++index) {
      str += ALPHA[this.intRange(0, ALPHA.length)];
    }

    return str;
  }
}
