export { Top };
class TopStorage {
    constructor() {
        this.datas = {};
    }

    add(key, datas) {
        this.datas[key] = datas;
        return this;
    }

    remove(key) {
        delete this.datas[key];
        return this;
    }

    has(key) {
        return !!this.datas[key] || this.datas[key] === false || this.datas[key] === 0;
    }
}

(top ?? window).TopStorage = (top ?? window)?.TopStorage ?? new TopStorage();

class Top{
    static _navigator() {
        return window !== top ? (top ?? window) : window;
    }

    static _TopStorage() {
        if (!this._navigator()?.TopStorage) this._navigator().TopStorage = new TopStorage();

        return this._navigator().TopStorage;
    }

    static add(key, datas) {
        this._TopStorage().add(key, datas);
        return this;
    }

    static remove(key) {
        this._TopStorage().remove(key);
        return this;
    }

    static has(key) {
        return this._TopStorage().has(key);
    }
}
