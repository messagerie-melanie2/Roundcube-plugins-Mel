import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';

export class WorkspacePage extends MelObject {
  get firstRow() {
    return this.#_get_row(1);
  }

  get secondRow() {
    return this.#_get_row(2);
  }

  get thirdRow() {
    return this.#_get_row(3);
  }

  get fourthRow() {
    return this.#_get_row(4);
  }

  get otherRow() {
    return this.#_get_row();
  }

  constructor() {
    super();
  }

  main() {
    super.main();
  }

  #_get_row(number = 0) {
    switch (number) {
      case 1:
        number = 'first';
        break;

      case 2:
        number = 'second';
        break;

      case 3:
        number = 'third';
        break;

      case 4:
        number = 'fourth';
        break;

      default:
        number = 'other';
        break;
    }

    return this.select(`#${number}-row`);
  }
}
