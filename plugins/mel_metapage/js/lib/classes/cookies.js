export class Cookie {
    constructor(key, value = EMPTY_STRING) {
        let _key = key;
        let _value = value;
        Object.defineProperties(this, {
            key: {
                get: function() {
                    return _key;
                },
                configurable: true
            },
            value: {
                get: function() {
                    return _value;
                },
                set:(val) => {
                    this.update_value(val);
                },
                configurable: true
            },            
        });
    }

    update_value(new_value, expire = false) {
        rcmail.set_cookie(this.key, new_value, expire);
        return this;
    }

    remove() {
        this.update_value(EMPTY_STRING, moment());
        return new Cookie(key, null);
    }

    /**
     * Récupère l'objet qui représente l'expiration de la date
     * @param {moment | string | Date} item Représentation à convertir
     * @returns {Date}
     */
    static get_expire(item) {
        return moment(item).toDate();
    }

    static set_cookie(key, value, expire = false) {
        return new Cookie(key).update_value(value, expire);
    }

    static get_cookie(key) {
        return new Cookie(key, rcmail.get_cookie(key));
    }

    static remove_cookie(key) {
        return new Cookie(key).remove();
    }
}