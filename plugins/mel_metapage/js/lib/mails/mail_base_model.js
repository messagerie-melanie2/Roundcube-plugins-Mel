export class MailBaseModel {
    constructor({
        subject, 
        date,
        from, 
        id, 
        uid
    }) {
        this._init();
        Object.defineProperties(this, {
            subject: {
                get: function() {
                    return subject;
                },
                configurable: true
            },
            date: {
                get: function() {
                    return moment(date);
                },
                configurable: true
            },            
            from: {
                get: function() {
                    return from;
                },
                configurable: true
            }, 
            id: {
                get: function() {
                    return id;
                },
                configurable: true
            },  
            uid: {
                get: function() {
                    return uid;
                },
                configurable: true
            },
        });
    }

    _init() {
        this.subject = EMPTY_STRING;
        this.date = moment().format();
        this.from = EMPTY_STRING;
        this.id = EMPTY_STRING;
        this.uid = EMPTY_STRING;
        return this;
    }

    static import(mail_base) {
        return new MailModel({
            subject:mail_base.subject,
            date:mail_base.date,
            from:mail_base.from,
            id:mail_base.id,
            uid:mail_base.uid
        });
    }

    static import_from_array(array) {
        return [...this.import_from_array_g(array)];
    }

    static *import_from_array_g(array) {
        for (let index = 0, len = array.length; index < len; ++index) {
            const element = array[index];
            yield this.import(element);
        }
    }
}