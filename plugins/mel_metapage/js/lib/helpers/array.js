import { MelEnumerable } from "../classes/enum.js";
import { isArrayLike } from "../mel.js";
import { BnumEvent } from "../mel_events.js";
export { MelArray, SpyiedMelArray }

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

class SpyiedMelArray extends MelArray {
    constructor(...args) {
        super(...args);
        this.on_update = new BnumEvent();
        this.on_push_update = new BnumEvent();
        this.on_pop_update = new BnumEvent();
    }

    push(...items) {
        const returned = super.push(...items);

        this.on_push_update.call(this);
        this.on_update.call(this, 'push');

        return returned;
    }

    pop() {
        const returned = super.pop();

        this.on_pop_update.call(this);
        this.on_update.call(this, 'pop');

        return returned;
    }

    
}