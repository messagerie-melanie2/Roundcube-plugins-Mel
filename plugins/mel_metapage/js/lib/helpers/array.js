import { MelEnumerable } from "../classes/enum.js";
import { isArrayLike } from "../mel.js";
export { MelArray }

class MelArray extends Array {
    constructor(...args) {
        super(...args);
    }

    shuffle() {
        for (let i = this.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this[i], this[j]] = [this[j], this[i]];
        }
    }

    toEnumerable() {
        return new MelEnumerable(this);
    }

    static isArrayLike(item) {
        return isArrayLike(item);
    }

    static Alphabet() {
        const alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
        return new MelArray(...alphabet);
    }

    static * Numbers() {
        for (let index = 0; index <= 9; ++index) {
            yield index;
        }
    }
}