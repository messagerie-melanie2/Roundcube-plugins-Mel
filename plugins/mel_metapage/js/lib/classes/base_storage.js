export class BaseStorage {
    constructor() {
        let storage = {};

        this.add = (key, item) => {
            storage[key] = item;
            return this;
        };
        this.get = (key, default_value = null) => storage[key] ?? default_value;
        this.remove = (key) => {
            storage[key] = null;
            return this;
        };

        this.has = (key) => !!storage[key] || storage[key] === false || storage[key] === 0;

        this.clear = () => {
            storage = {};
            return this;
        }

    }
}