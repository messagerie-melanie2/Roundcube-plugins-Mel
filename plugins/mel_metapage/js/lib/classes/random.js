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

  static random_string(
    size,
    { includeNumbers = false, includeUpperCase = false } = {},
  ) {
    const ALPHA = 'abcdefghijklmnopqrstuvwxyz';

    let str = EMPTY_STRING;

    for (let index = 0, char; index < size; ++index) {
      switch (!includeNumbers && !includeUpperCase ? 3 : this.intRange(0, 3)) {
        case 0:
          char = ALPHA[this.intRange(0, ALPHA.length)];
          if (includeUpperCase) char = char.toUpperCase();

          str += char;
          break;

        case 1:
          if (includeNumbers) str += this.intRange(0, 10).toString();
          else str += ALPHA[this.intRange(0, ALPHA.length)];
          break;

        default:
          str += ALPHA[this.intRange(0, ALPHA.length)];
          break;
      }
    }

    return str;
  }
}
