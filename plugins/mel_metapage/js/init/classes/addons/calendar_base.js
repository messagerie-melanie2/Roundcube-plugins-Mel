$(document).ready(() => {

    const plugin_text = 'mel_metapage';
    const audio_url = rcmail.env.mel_metapage_audio_url;
    const newline = String.fromCharCode('8199');
    const reload = '{¤reload¤mel}';
    const visio_phone_start = ' (';
    const visio_phone_end = ')';
    const visio_phone_separator = ' | ';

    if (window.rcube_calendar_ui === undefined)
        window.rcube_calendar_ui = () => {};

    class AEventLocation extends MetapageObject{
        constructor(...args)
        {
            super(...args);
            this.init().setup(...args);
        }

        init()
        {
            return this;
        }

        setup(...args)
        {
            return this;
        }

        setValue(val) {
            return this;
        }

        async getValue(){
            return '';
        }

        check() {
            return false;
        }

        checkError()
        {
            if (this.check()) this._onValid();
            else this._onError();
            return this;
        }

        _onError() {}
        _onValid() {}
    }

    class PlaceEventLocation extends AEventLocation
    {
        constructor($place){
            super($place)
        }

        init()
        {
            super.init();
            this.$place = null;
            return this;
        }

        setup($place)
        {
            super.setup($place);
            this.$place = $place;
            return this;
        }

        async getValue()
        {
            let val = await super.getValue();
            
            return val + this.$place.val();
        }

        setValue(val)
        {
            super.setValue(val);
            this.$place.val(val);
            return this;
        }

        check() {
            return true;
        }
        

    }

    class AudioEventLocation extends AEventLocation
    {
        constructor(audioUrl, $audioPhone, $audioNumber){
            super(audioUrl, $audioPhone, $audioNumber)
        }

        init()
        {
            super.init();
            this.$phone = null;
            this.$number = null;
            this.url = '';
            return this;
        }

        setup(audioUrl, $audioPhone, $audioNumber)
        {
            super.setup(audioUrl, $audioPhone, $audioNumber);
            this.$phone = $audioPhone;
            this.$number = $audioNumber;
            this.url = audioUrl;
            return this;
        }

        async getValue()
        {
            let val = await super.getValue();
            
            return val + `${this.url} : ${this.$phone.val()} - ${this.$number.val()}`;
        }

        setValue(val)
        {
            super.setValue(val);
            val = val.split(':');
            switch (val[0]) {
                case 'url':
                    this.url = val[1];
                    break;

                case 'phone':
                    this.$phone.val(val[1]);
                    break;

                case 'number':
                    this.$number.val(val[1]);
                    break;
            
                default:
                    break;
            }
            return this;
        }

        setAudioUrl(url)
        {
            return this.setValue(`url:${url}`);
        }

        setAudioNumber(number)
        {
            return this.setValue(`number:${number}`);
        }

        setAudioPhone(number)
        {
            return this.setValue(`phone:${number}`);
        }

        check()
        {
            return this.$phone.val() !== '';
        }

        _onError() {
            super._onError();
            this.$phone.parent().append(`<span class="required-text" style="color:red;display:block">*Vous devez mettre une valeur !</span>`);
        }
        _onValid() {
            super._onValid();
            this.$phone.parent().find('.required-text').remove();
        }
    }

    class VisioPhoneLocation extends AEventLocation
    {

        constructor($enablePhone, $phoneNumber, $phonePin, $visioPhonesDatas, parent = null)
        {
            super($enablePhone, $phoneNumber, $phonePin, $visioPhonesDatas, parent);
        }

        /**
         * 
         * @param {VisioPhoneLocation} visioPhone 
         */
        static from(visioPhone, parent)
        {
            return new VisioPhoneLocation(visioPhone.$phoneEnabled, visioPhone.$phoneNumber, visioPhone.$phonePin, visioPhone.$phoneDatas, parent);
        }

        init()
        {
            super.init();
            this.$phoneEnabled = null;
            this.$phoneNumber = null;
            this.$phonePin = null;
            this.$phoneDatas = null;
            this.parentLocation = null;//new VisioEventLocation(null, null, null, null, null);
            this.lastRoomName = '';
            return this;
        }

        setup($enablePhone, $phoneNumber, $phonePin, $visioPhonesDatas, parent)
        {
            super.setup($enablePhone, $phoneNumber, $phonePin, $visioPhonesDatas, parent);
            this.$phoneEnabled = $enablePhone;
            this.$phoneNumber = $phoneNumber;
            this.$phonePin = $phonePin;
            this.$phoneDatas = $visioPhonesDatas;
            this.parentLocation = parent;
            return this;
        }

        update()
        {
            if (this.parentLocation.$type.val() === 'intregrated' && this.enabled())
            {
                let parentVal = this.parentLocation.$visioState.val();

                if (parentVal.includes(visio_phone_start))
                {
                    let tmp = parentVal.split(visio_phone_start)[1].split(visio_phone_separator);
                    const phone = tmp[0];
                    const pin = tmp[1].replace(visio_phone_end, '');

                    this.$phoneNumber.val(phone);
                    this.$phonePin.val(pin);

                    this.parentLocation.$visioState.val(parentVal.split(visio_phone_start)[0]);
                    parentVal = parentVal.split(visio_phone_start)[0];
                }
                
                if (this.$phoneNumber.val() !== '' && parentVal !== '')
                {
                    this.$phoneEnabled.parent().css('display', '');
                    this.$phoneDatas.css('display', '');
                }
                else {
                    this.$phoneEnabled.parent().css('display', 'none');
                    this.$phoneDatas.css('display', 'none');
                }
                
                this.lastRoomName = parentVal;
            }
            else 
            {
                this.$phoneEnabled.parent().css('display', 'none');
                this.$phoneDatas.css('display', 'none');
            }

            return this;
        }

        enabled()
        {
            return this.$phoneEnabled[0].checked && this.parentLocation.$type.val() === 'intregrated';
        }

        async getValue()
        {
            let val = await super.getValue();
            
            if (this.$phoneNumber.val() !== '' && this.parentLocation.$visioState.val() === this.lastRoomName)
            {
                val = this.formatValue(this.$phoneNumber.val(), this.$phonePin.val());// `${this.$phoneNumber.val()}${visio_phone_separator}${this.$phonePin.val()}`;
            }
            else if(this.enabled() && this.parentLocation.$visioState.val() !== '') {
                rcmail.set_busy(true, 'loading');
                let datas = await webconf_helper.phone.getAll(this.parentLocation.$visioState.val())
                this.$phoneNumber.val(datas.number);
                this.$phonePin.val(datas.pin);
                rcmail.set_busy(false);
                rcmail.clear_messages();
                this.update();
                val = this.formatValue(datas.number, datas.pin);// `${datas.number}${visio_phone_separator}${datas.pin}`;
            }

            return val;
        }

        formatValue(phone, pin)
        {
            return `${phone}${visio_phone_separator}${pin}`
        }

        setValue(val)
        {
            val = val.split(visio_phone_separator);
            const phone = val[0];
            const pin = val[1].replace(visio_phone_end, '');

            this.$phoneNumber.val(phone);
            this.$phonePin.val(pin);

            return this;
        }

    }

    class VisioEventLocation extends AEventLocation
    {
        constructor($visioType, $visioIntegrated, $visioCustom, $haveWsp, $wsp, visioPhone)
        {
            super($visioType, $visioIntegrated, $visioCustom, $haveWsp, $wsp, visioPhone);
        }

        init()
        {
            super.init();
            this.$type = null;
            this.$visioState = null;
            this.$visioCustom = null;
            this.$haveWorkspace = null;
            this.$workspace = null;
            this.visioPhone = null;
            return this;
        }

        setup($visioType, $visioState, $visioCustom, $haveWorkspace, $workspace, visioPhone)
        {
            super.setup($visioType, $visioState, $visioCustom);

            const hasPhone = !!visioPhone;

            this.$type = $visioType;
            this.$visioState = $visioState;
            this.$visioCustom = $visioCustom;

            if (hasPhone) this.visioPhone = VisioPhoneLocation.from(visioPhone, this);
            
            //lecture seul
            this.$haveWorkspace = $haveWorkspace;
            this.$workspace = $workspace;

            if (hasPhone) this.visioPhone.update();
            return this;
        }

        async getValue()
        {
            let visio_val = EMPTY_STRING;
            let val = await super.getValue();

            //if (!!this.visioPhone) this.visioPhone.update();
            
            switch (this.$type.val()) {
                case 'intregrated': //visio intégrée
                    visio_val = this.$visioState.val();
                    let config = {
                        _key:visio_val
                    };

                    {
                        const detected = mel_metapage.Functions.webconf_url(config._key.toLowerCase());
                        if ((detected || false) !== false)
                        {
                            config._key = detected;
                            this.$visioState.val(detected.toUpperCase());
                        }
                    }

                    if (this.$haveWorkspace[0].checked && this.$workspace.val() !== "#none")
                        config["_wsp"] = this.$workspace.val();

                    const tmp = !this.visioPhone.enabled() || !this.check() ? '' : (await this.visioPhone.getValue());

                    if (!!this.$visioState.data('pass')) config['_pass'] = this.$visioState.data('pass');

                    if (tmp === reload) val = tmp;
                    else val += mel_metapage.Functions.public_url('webconf', config) + (tmp === '' ? '' : `${visio_phone_start}${tmp}${visio_phone_end}`);

                    break;

                case 'custom':
                    visio_val = this.$visioCustom.val();
                    val += `@visio:${visio_val}`;
                    break;

                default:
                    break;
            }

            if (this.has_error() && this.check()) {
                this._onValid();
            }
            else if (0 !== visio_val.length && !this.check()) this._onError();

            return val;
        }

        setValue(val)
        {
            val = val.split(':');
            const key = val[0];
            const value = val[1];

            switch(key)
            {
                case 'type':
                    this.$type.val(value);
                    break;

                case 'key':
                    val = value;
                    if (val.includes('(')) 
                    {
                        val = val.split('(');
                        this.visioPhone.setValue(val[1]);
                        val = val[0];
                    }
                    this.$visioState.val(val);
                    break;

                case 'custom':
                    this.$visioCustom.val(value);
                    break;

                default:
                    break;
            }

            return this;
        }

        setType(val)
        {
            return this.setValue(`type:${val}`);
        }

        setIntegratedKey(key)
        {
            return this.setValue(`key:${key}`);
        }

        setCustomVisio(url)
        {
            return this.setValue(`custom:${url}`);
        }

        check()
        {
            switch (this.$type.val()) {
                case 'intregrated': //visio intégrée
                    {
                        const val = this.$visioState.val();
                        //Si l'url est invalide
                        if (val.length < 10 || Enumerable.from(val).where(x => /\d/.test(x)).count() < 3 || !/^[0-9a-zA-Z]+$/.test(val))
                        {      
                            return false;
                        }
                    }
                    break;

                case 'custom':
                    return this.$visioCustom.val() !== '';
            
                default:
                    break;
            }

            return true;
        }

        has_error() {
            return this.$visioState.parent().find('.required-text').length > 0 || this.$visioState.parent().find('.required-text').length > 0;
        }

        //<span class="required-text" style="color:red;display:block">*Vous devez mettre un titre !</span>
        _onError() {
            super._onError();
            switch (this.$type.val()) {
                case 'intregrated': //visio intégrée
                    {
                        let $parent = this.$visioState.parent();
                        let $required = $parent.find('.required-text');

                        if ($required.length > 0) $required.remove();
                        $required = null;

                        const val = this.$visioState.val();
                        const text = val.length < 10 ? rcmail.gettext('webconf_saloon_name_error_small', plugin_text) : /^[0-9a-zA-Z]+$/.test(val) ? rcmail.gettext('webconf_saloon_incorrect_format_number', plugin_text) : rcmail.gettext('webconf_saloon_incorrect_format', plugin_text);
                        this.$visioState.parent().append(`<span class="required-text" style="color:red;display:block">*${text}</span>`);

                        this.visioPhone.$phoneNumber.hide();
                        this.visioPhone.$phonePin.hide();
                        this.visioPhone.$phoneDatas.hide();
                    }
                    break;

                case 'custom':
                    this.$visioCustom.parent().append(`<span class="required-text" style="color:red;display:block">*Vous devez mettre une valeur !</span>`);
                    break;
            
                default:
                    break;
            }
        }
        _onValid() {
            super._onValid();
            this.$visioCustom.parent().find('.required-text').remove();
            this.$visioState.parent().find('.required-text').remove();

            this.visioPhone.$phoneNumber.show();
            this.visioPhone.$phonePin.show();
            this.visioPhone.$phoneDatas.show();
        }
    }

    class EventsLocation extends AEventLocation
    {
        constructor(id, placeEvent, audioEvent, visioEvent, $select)
        {
            super(id, placeEvent, audioEvent, visioEvent, $select);
        }

        init()
        {
            super.init();
            this.id = '';
            /**
             * @type {AEventLocation}
             */
            this.placeEvent = null;
                        /**
             * @type {AEventLocation}
             */
            this.audioEvent = null;
                        /**
             * @type {AEventLocation}
             */
            this.visioEvent = null;
            this.$selectEventType = null;
            return this;
        }

        setup(id, placeEvent, audioEvent, visioEvent, $select)
        {
            super.setup(id, placeEvent, audioEvent, visioEvent, $select);
            this.placeEvent = placeEvent;
            this.audioEvent = audioEvent;
            this.visioEvent = visioEvent;
            this.$selectEventType = $select;
            this.id = id;
            return this;
        }

        async getValue()
        {
            let val = await super.getValue();

            switch (this.$selectEventType.val()) {
                case 'default':
                    val += await this.placeEvent.getValue();
                    break;

                case 'visio':
                    val += await this.visioEvent.getValue();
                    break;

                case 'audio':
                val += await this.audioEvent.getValue();
                    break;
            
                default:
                    break;
            }

            return val;
        }

        check()
        {
            switch (this.$selectEventType.val()) {
                case 'default':
                    return this.placeEvent.check();

                case 'visio':
                    return this.visioEvent.check();

                case 'audio':
                    return this.audioEvent.check();
            
                default:
                    break;
            }

            return false;
        }

        isVisio()
        {
            return this.$selectEventType.val() === 'visio';
        }

        checkError()
        {
            switch (this.$selectEventType.val()) {
                case 'default':
                    return this.placeEvent.checkError();

                case 'visio':
                    return this.visioEvent.checkError();

                case 'audio':
                    return this.audioEvent.checkError();
            
                default:
                    break;
            }
           return this;
        }
    }

    class EventLocation extends AEventLocation
    {
        constructor($haveWorkspace, $workspace, ...events)
        {
            super($haveWorkspace, $workspace, ...events);
        }

        init()
        {
            super.init();
            /**
             * @type {Array<EventsLocation>}
             */
            this.locations = {};
            this.$haveWorkspace = null;
            this.$workspace = null;
            this._count = 0;
            return this;
        }

        setup($haveWorkspace, $workspaceSelect, ...events)
        {
            super.setup($haveWorkspace, $workspaceSelect, ...events);
            this.$haveWorkspace = $haveWorkspace;
            this.$workspace = $workspaceSelect;

            for (let index = 0; index < events.length; ++index) {
                const element = events[index];
                this.addEvent(element);
            }
        }

        addEvent(eventsLocation)
        {
            if ((eventsLocation ?? null) === null || this.locations[eventsLocation.id] !== undefined) return this;

            ++this._count;
            this.locations[eventsLocation.id] = eventsLocation;
            return this;
        }

        have(type)
        {
            return Enumerable.from(this.locations).any(x => x.value.$selectEventType.val() === type);
        }

        delete(id)
        {
            const tmp = this.locations[id];
            delete this.locations[id];
            --this._count;
            return tmp;
        }

        restart()
        {
            this.locations = {};
            this._count = 0;
            return this;
        }

        count()
        {
            return this._count;
        }

        async getValue()
        {
            let val = await super.getValue();

            for (const key in this.locations) {
                if (Object.hasOwnProperty.call(this.locations, key)) {
                    const element = this.locations[key];
                    const _val = await element.getValue();

                    if (_val === reload && element.isVisio()) 
                    {
                        return _val;
                    }

                    val += _val + newline;
                }
            }

            val = val.slice(0, val.length - newline.length);

            return val === newline ? '' : val;
        }

        check()
        {
            return !Enumerable.from(this.locations).any(x => !x.value.check());
        }

        each(func)
        {
            for (const key in this.locations) {
                if (Object.hasOwnProperty.call(this.locations, key)) {
                    const element = this.locations[key];
                    func(key, element);
                }
            }

            return this;
        }

        checkError()
        {
            return this.each((key, value) => {
                value.checkError();
            });
        }

        static async InitFromEvent(location, $mainDiv, init_function, $haveWsp, $wsp, update_location)
        {
            $mainDiv.html('');
            await update_location('restart');

            if ((location || false) !== false && location !== newline)
            {
                location = location.split(newline);

                for (let index = 0; index < location.length; index++) {
                    const currentString = location[index] || null;

                    if (currentString === null) continue;

                    //Si c'est un localisation audio
                    if (currentString.includes(`${audio_url} : `))
                    {
                        const audio = currentString.replace(`${audio_url} : `, "").split(" - ");
                        await init_function($haveWsp, $wsp, update_location, 0, {
                            audio:{
                                tel:audio[0],
                                num:audio[1]
                            },
                            type:'audio'
                        });
                    }
                    //Si c'est un localisation visio
                    else if (currentString.includes("#visio") || currentString.includes("@visio") || currentString.includes('public/webconf'))
                    {
                        const isRc = currentString.includes("#visio") || currentString.includes('public/webconf');

                        if (isRc) //Visio de l'état
                        {
                            const has_pass = currentString.includes('_pass');
                            await init_function($haveWsp, $wsp, update_location, 0, {
                                visio:{
                                    type:'integrated',
                                    val:currentString.split("_key=")[1].split("&")[0],
                                    pass:has_pass ? currentString.split("_pass=")[1].split("&")[0] : null
                                },
                                type:'visio'
                            });
                        }
                        else // Visio custom
                        {
                            await init_function($haveWsp, $wsp, update_location, 0, {
                                visio:{
                                    type:'custom',
                                    val:currentString.replace("@visio:", "")
                                },
                                type:'visio'
                            });
                        }
                    }
                    //Si c'est une visio de l'état
                    else if (currentString.includes(rcmail.env["webconf.base_url"]))
                    {
                        await init_function($haveWsp, $wsp, update_location, 0, {
                            visio:{
                                type:'integrated',
                                val:mel_metapage.Functions.webconf_url(currentString)
                            },
                            type:'visio'
                        });
                    }
                    //Si c'est un lieu
                    else {
                        await init_function($haveWsp, $wsp, update_location, 0, {
                            place:currentString,
                            type:'default'
                        });
                    }
                }
            }
            else {
                await init_function($haveWsp, $wsp, update_location);
            }

            await update_location(null);
        }
    }

    const EMPTY_STRING = '';
    const EMPTY_OBJECT = {};
    const ARRAY_JOIN = ',';
    const CONST_DATE_FORMAT = 'DD/MM/YYYY HH:mm';
    const CONST_DATE_FORMAT_DATE_ONLY = 'DD/MM/YYYY';
    const CONST_DATE_START_OF_DAY = 'day';
    const CONST_REC_COUNT = 'COUNT';
    const CONST_REC_INTERVAL = 'INTERVAL';
    const CONST_REC_UNTIL = 'UNTIL';
    const CONST_REC_BYDAY = 'BYDAY';
    const CONST_REC_BYMONTH = 'BYMONTH';
    const CONST_REC_BYMONTHDAY = 'BYMONTHDAY';
    const CONST_REC_WEEKLY = 'WEEKLY';
    const CONST_REC_MONTHLY = 'MONTHLY';
    const CONST_REC_YEARLY = 'YEARLY';
    /**
     * Gère l'affichage de la partie "Notification" de la création d'un évent
     */
    class EventUserNotified {
        /**
         * Constructeur de la classe
         * @param {*} event Evènement sélectionné 
         */
        constructor(event)
        {
            this.currentEvent = event;
            this.users = {};
            this.startDatas = {
                startdate:!!event.location ? moment(event.start).format(CONST_DATE_FORMAT) : null,
                enddate:!!event.location ? moment(event.end).format(CONST_DATE_FORMAT) : null, 
                local:event.location ?? null,
                req:!!event.location ? (JSON.parse(JSON.stringify(event.recurrence ?? EMPTY_STRING)) || EMPTY_OBJECT) : null
            };
            this.currentDatas = {
                startdate:$('#mel-metapage-added-input-mel-start-datetime'),
                enddate:$('#mel-metapage-added-input-mel-end-datetime'),
                local:$('#edit-location'),
                req:{
                    val: () => {
                        return this._getReccurence();
                    }
                }
            }

            //Mise en forme de la reccurence si il y en a une
            if (!!this.startDatas.req) {
                if (!!this.startDatas.req.UNTIL) this.startDatas.req.UNTIL = moment(this.startDatas.req.UNTIL).startOf(CONST_DATE_START_OF_DAY).format(CONST_DATE_FORMAT_DATE_ONLY);
                delete this.startDatas.req.EXDATE;
            }
        }

        /**
         * Réccupère les données de réccurence de l'évènement en cours
         * @returns {{} | {FREQ:string, COUNT:string|undefined, INTERVAL:string|undefined, UNTIL:string|undefined, BYDAY:string|undefined, BYMONTHDAY:string|undefined, BYMONTH:string|undefined}}
         */
        _getReccurence() {
            const event = $('#eventedit form').serializeJSON();
            if (!!event.frequency) {
                let config = {
                    FREQ:event.frequency,
                };

                //Données par défaut
                if (!!event.times) config[CONST_REC_COUNT] = event.times;
                if (!!event.interval) config[CONST_REC_INTERVAL] = event.interval;
                if (!!event.untildate) {
                    config[CONST_REC_UNTIL] = moment(event.untildate, CONST_DATE_FORMAT_DATE_ONLY).startOf(CONST_DATE_START_OF_DAY).format(CONST_DATE_FORMAT_DATE_ONLY);
                    
                    //Il n'y a pas de count si il y until
                    if (!!config[CONST_REC_COUNT]) delete config[CONST_REC_COUNT];
                } //Si pour toujour est activé, on supprime le count
                else if (event.repeat === EMPTY_STRING && !!config[CONST_REC_COUNT]) {
                    delete config[CONST_REC_COUNT];
                }

                //Actions à faire en fonction de la fréquence
                switch (config.FREQ) {
                    case CONST_REC_WEEKLY:
                        config[CONST_REC_BYDAY] = this._rec_each('.edit-recurrence-weekly-byday');
                        break;

                    case CONST_REC_MONTHLY:
                        if (event.repeatmode === CONST_REC_BYDAY){
                            config[CONST_REC_BYDAY] = `${$('#edit-recurrence-monthly-prefix').val()}${$('#edit-recurrence-monthly-byday').val()}`;
                        }
                        else {
                            config[CONST_REC_BYMONTHDAY] = this._rec_each('.edit-recurrence-monthly-bymonthday');
                        }
                        break;

                    case CONST_REC_YEARLY:
                        config[CONST_REC_BYMONTH] = this._rec_each('.edit-recurrence-yearly-bymonth');

                        const bd = `${$('#edit-recurrence-yearly-prefix').val()}${$('#edit-recurrence-yearly-byday').val()}`;
                        if (bd !== EMPTY_STRING) {
                            config[CONST_REC_BYDAY] = bd;
                        }
                        break;
                    default:
                        break;
                }

                return config;
            }
            else {
                return {};
            }
        }

        /**
         * Récupère les données des fréquences "Mensuel, annuel et hebdomadaire".
         * @param {string} selector Selecteur qui contient les données
         * @returns {string}
         */
        _rec_each(selector) {
            let array = [];
            $(selector).each((i, e) => {
                if (e.checked) array.push($(e).val())
            });

            return array.join(ARRAY_JOIN);
        }

        /**
         * Vérifie si 2 éléments sont identiques, en prenant en compte les tableaux
         * @param {string | Array} a 
         * @param {string | Array} b 
         * @returns {boolean}
         */
        _checkElements(a, b) {
            if (Array.isArray(a) && Array.isArray(b)) {
                if (a.length !== b.length) return false;
                else return Enumerable.from(a).where((x, i) => this._checkElements(x, b[i])).all();
            }

            return a === b;
        }

        /**
         * Vérifie si 2 reccurences sont égales
         * @param {{} | {FREQ:string, COUNT:string|undefined, INTERVAL:string|undefined, UNTIL:string|undefined, BYDAY:string|undefined, BYMONTHDAY:string|undefined, BYMONTH:string|undefined}} a 
         * @param {{} | {FREQ:string, COUNT:string|undefined, INTERVAL:string|undefined, UNTIL:string|undefined, BYDAY:string|undefined, BYMONTHDAY:string|undefined, BYMONTH:string|undefined}} b 
         * @returns {boolean}
         */
        _reqIsEqual(a, b) {
            for (const key in a) {
                if (Object.hasOwnProperty.call(a, key)) {
                    const element = a[key];
                    if (!this._checkElements(element, b[key])) return false;
                }
            }

            for (const key in b) {
                if (Object.hasOwnProperty.call(b, key)) {
                    const element = b[key];
                    if (!this._checkElements(element, a[key])) return false;
                }
            }

            return true;
        }

        /**
         * Vérifie si il s'agit d'un nouvel évènement
         * @returns {boolean}
         */
        _isNewEvent() {
            let allIsNull = true;

            for (const key in this.startDatas) {
                if (Object.hasOwnProperty.call(this.startDatas, key)) {
                    const element = this.startDatas[key];
                    if (element !== null) {
                        allIsNull = false;
                        break;
                    }
                }
            }

            return allIsNull;
        }

        /**
         * Vérifie si un utilisateur est en accepté ou en refusé
         * @param {*} user 
         * @returns {boolean}
         */
        _isAcceptedOrRefusedUser(user) {
            return user.status === 'ACCEPTED' || user.status === 'REFUSED';
        }

        /**
         * Vérifie si l'utilisateur est l'organisateur ou non
         * @param {*} user 
         * @returns {boolean}
         */
        _isNotOrga(user) {
            let hasNoEmail = true;
            for (const iterator of rcmail.env.mel_metapage_user_emails) {
                if (user.email === iterator) {
                    hasNoEmail = false;
                    break;
                }
            }
            return hasNoEmail;
        }

        /**
         * Vérifie si des données ont changés
         * @returns {boolean}
         */
        _datasChanged() {
            for (const key in this.startDatas) {
                if (Object.hasOwnProperty.call(this.startDatas, key)) {
                    const element = this.startDatas[key];
                    switch (key) {
                        case 'req':
                            if (!this._reqIsEqual(element, this.currentDatas[key].val())) return true;
                            break;
                    
                        default:
                            if (element !== this.currentDatas[key].val()) return true;
                            break;
                    }
                }
            }

            return false;
        }

        /**
         * Met à jours les données des utilisateurs
         * @returns Chaîne
         */
        updateUsers() {
            if (!!this.currentEvent.attendees) {
                let iminvited = false;
                const isNewEvent = this._isNewEvent();
                const datasChanged = this._datasChanged();
                for (let index = 0; index < this.currentEvent.attendees.length; ++index) {
                    const element = this.currentEvent.attendees[index];
                    if (element.role === 'ORGANIZER') {
                        if (this._isNotOrga(element)) iminvited = true;
                        this.users[element.email] = false;
                    }
                    else {
                        const isAcceptedOrRefused = this._isAcceptedOrRefusedUser(element);
                        this.users[element.email] = iminvited ? false : (isNewEvent || (isAcceptedOrRefused && datasChanged) || !isAcceptedOrRefused);
                    }
                }

                if (iminvited) {
                    for (const key in this.users) {
                        if (Object.hasOwnProperty.call(this.users, key)) {
                            this.users[key] = false;
                        }
                    }
                }
            }
            return this;
        }

        /**
         * Met à jour la table
         * @returns Chaîne
         */
        updateTable() {
            const PLUGIN = 'mel_metapage';
            const ICON_OK = 'icofont-check';
            const ICON_NOK = 'icofont-close';
            const NOTIFIED_CLASS = 'notified';
            const OPTIONS_CLASS = 'options';
            const CLASS_SELECTOR = '.';
            const NOTIFIED_SELECTOR = CLASS_SELECTOR + NOTIFIED_CLASS;
            const OPTIONS_SELECTOR = CLASS_SELECTOR + OPTIONS_CLASS;
            const TITLE_TEXT = rcmail.gettext('custom_calendar_notification_option', PLUGIN);
            const OK_DESC = rcmail.gettext('custom_calendar_notification_ok_desc', PLUGIN);
            const NOK_DESC = rcmail.gettext('custom_calendar_notification_nok_desc', PLUGIN);
            let title;
            let $notified;
            $('#edit-attendees-table tr').each((i, e) => {
                e = $(e);
                $notified = e.find(NOTIFIED_SELECTOR);
                switch (i) {
                    case 0:
                        if ($notified.length === 0) {
                            e.find(OPTIONS_SELECTOR).before( `<th class="${NOTIFIED_CLASS}">${TITLE_TEXT}</th>`);
                        }
                        break;
                
                    default:
                        if ($notified.length === 0) {
                            e.find(OPTIONS_SELECTOR).before(`<td class="${NOTIFIED_CLASS}" title="${OK_DESC}"><span class="${ICON_OK}"></td>`);
                            $notified = e.find(NOTIFIED_SELECTOR);
                        }

                        if (e.find('.role select.edit-attendee-role').val() === 'ORGANIZER') {
                            $notified.html(`<span class="${ICON_NOK}"></span>`).attr('title', NOK_DESC);
                        }
                        else {
                            title = e.find('.attendee-name').children().first().attr('title');
                            if (this.users[title] !== null && this.users[title] !== undefined) {
                                const isOK = this.users[title] === true;
                                $notified.html(`<span class="${isOK ? ICON_OK : ICON_NOK}"></span>`).attr('title', (isOK ? OK_DESC : NOK_DESC));
                            }
                        }
                        
                        break;
                }       
            });

            title = null;
            $notified = null;
            return this;
        }

        /**
         * Met à jours les données
         * @returns Chaîne
         */
        update() {
            return this.updateUsers().updateTable();
        }

        /**
         * Vide les données
         * @returns Chaîne
         */
        dispose() {
            this.users = null;
            this.currentDatas = null;
            this.currentEvent = null;
            this.startDatas = null;
            return this;
        }

        /**
         * 
         * @returns {EventUserNotified}
         */
        static CreateInstance(event) {
            if (!EventUserNotified._instance) EventUserNotified._instance = new EventUserNotified(event);
            else {
                EventUserNotified._instance.dispose();
                EventUserNotified._instance = null;
                return this.CreateInstance(event);
            }

            return EventUserNotified._instance;
        }
        /**
         * 
         * @returns {EventUserNotified | null}
         */
        static Instance() {
            return EventUserNotified._instance;
        }
        static Dispose(){
            if (!!this.Instance()) {
                this.Instance().dispose();
                EventUserNotified._instance = null;
            }
        }
    }

    /**
     * Sauvegarde l'évènement
     * @returns {boolean} Faux si il y a des champs invalides
     */
    rcube_calendar_ui.save = async function()
    {
        let canContinue = true;

        //Si l'évènement n'a pas de titre
        if ($("#edit-title").val() === "")
        {
            //On se met sur le bon onglet, on focus le champs, puis on affiche le texte d'erreur.
            $('li > a[href="#event-panel-summary"]').click();
            canContinue = false;
            $("#edit-title").focus();
            if ($("#edit-title").parent().find(".required-text").length > 0)
                $("#edit-title").parent().find(".required-text").css("display", "");
            else
                $("#edit-title").parent().append(`<span class="required-text" style="color:red;display:block">*${rcmail.gettext('title_needed', plugin_text)}</span>`);
        }
        //Sinon, ok
        else {
            //Suppression du message d'erreur
            if ($("#wsp-event-all-cal-mm").val() !== "#none" && $("#wsp-event-all-cal-mm").val() !== "")
                $(".have-workspace").css("display", "");
            else
                $(".have-workspace").css("display", "none");
        
            if ($("#edit-title").parent().find(".required-text").length > 0)
                $("#edit-title").parent().find(".required-text").remove();
        }

        /**
         * Données des dates
         */
        let date = {
            /**Date de début */
            start:{
                querry:$("#mel-metapage-added-input-mel-start-datetime"),
                val:null,
                text_id:"edit-start-error-text"
            },
            /**Date de fin */
            end:{
                querry:$("#mel-metapage-added-input-mel-end-datetime"),
                val:null,
                text_id:"edit-end-error-text"
            }
        }

        date.start.val = date.start.querry.val();
        date.end.val = date.end.querry.val();

        //Si la date de début n'est pas valide
        if (date.start.val === "" || !moment(date.start.val, "DD/MM/YYYY hh:mm")._isValid)
        {
            //On se met sur le bon onglet, on focus le champ, puis, on affiche le message d'erreur
            canContinue = false;
            $('li > a[href="#event-panel-summary"]').click();
            date.start.querry.focus();

            const text_id = date.start.text_id;
            let parent = date.start.querry.parent();

            if ($(`#${text_id}`).length > 0)
                $(`#${text_id}`).remove();

            const text = date.start.val === "" ? rcmail.gettext('startdate_needed', plugin_text) : rcmail.gettext('bad_format_date', plugin_text);
            parent.append(`<span id="${text_id}" class="required-text" style="color:red;display:block">*${text}</span>`);

        }
        //Suppression du message d'erreur
        else if ($(`#${date.start.text_id}`).length > 0) $(`#${date.start.text_id}`).remove();

        //Si la date de fin est invalide
        if (date.end.val === "" || !moment(date.end.val, "DD/MM/YYYY hh:mm")._isValid)
        {
            //On se met sur le bon onglet, on focus le champ, puis, on affiche le message d'erreur
            $('li > a[href="#event-panel-summary"]').click();
            canContinue = false;
            date.end.querry.focus();

            const text_id = date.end.text_id;
            let parent = date.end.querry.parent();
            if ($(`#${text_id}`).length > 0)
                $(`#${text_id}`).remove();

            const text = date.end.val === "" ? rcmail.gettext('enddate_needed', plugin_text) : rcmail.gettext('bad_format_date', plugin_text);
            parent.append(`<span id="${text_id}" class="required-text" style="color:red;display:block">*${text}</span>`);

        }
        //Suppression du message d'erreur
        else if ($(`#${date.end.text_id}`).length > 0) $(`#${date.end.text_id}`).remove();

        // //Si la visio de l'état est activée
        // if ($("#eb-mm-em-v")[0].checked && $("#eb-mm-wm-e")[0].checked)
        // {
        //     //On supprime le message d'erreur est on récupère les données.
        //     const text_id = "key-error-cal";
        //     let val = $("#key-visio-cal").val();

        //     $(`#${text_id}`).remove();

        //     //Si l'url est invalide
        //     if (val.length < 10 || Enumerable.from(val).where(x => /\d/.test(x)).count() < 3 || !/^[0-9a-zA-Z]+$/.test(val))
        //     {      
        //         //On se met sur le bon onglet, on focus le champ, puis, on affiche le message d'erreur   
        //         $('li > a[href="#event-panel-detail"]').click();

        //         const text = val.length < 10 ? rcmail.gettext('webconf_saloon_name_error_small', plugin_text) : /^[0-9a-zA-Z]+$/.test(val) ? rcmail.gettext('webconf_saloon_incorrect_format_number', plugin_text) : rcmail.gettext('webconf_saloon_incorrect_format', plugin_text);
                
        //         $("#key-visio-cal").focus().parent().append(`<span id="${text_id}" class="required-text" style="color:red;display:block">*${text}</span>`);
        //         canContinue = false;
        //     }
        // }
  
        if (!window.rcube_calendar_ui.edit._events.checkError().check())
        {
            $('li > a[href="#event-panel-detail"]').click();
            canContinue = false;
        }

        {
            const location_from_js = await window.rcube_calendar_ui.edit._events.getValue();
            if (canContinue && location_from_js !== $('#edit-location').val()) {
                $('#edit-location').val(location_from_js);
            }
        }

        if (canContinue && $('#edit-location').val() === reload)
        {
            const i = setInterval(() => {
                if ($('#edit-location').val() !== reload)
                {
                    clearInterval(i);
                    rcube_calendar_ui.save();
                }
            }, 10);
            canContinue = false;
        }
        else if (canContinue && $('#edit-location').val().includes( mel_metapage.Functions.public_url('webconf', '')))
        {
            const link = new IntegratedWebconfLink($('#edit-location').val());

            if (link.key === '')
            {
                let interval_link = null;
                const i = setInterval(() => {
                    interval_link = new IntegratedWebconfLink($('#edit-location').val());
                    if (interval_link.key !== '')
                    {
                        interval_link = null;
                        clearInterval(i);
                        rcube_calendar_ui.save();
                    }
                }, 10);
                canContinue = false;

            }
        }

        //Si il n'y a pas d'erreurs
        if (canContinue)
        {
            //On sauvegarde l'évènement
            let querry = $("#eventedit").parent().parent().find(".ui-dialog-buttonset").find(".save.mainaction");

            if (querry.length > 0)
                querry.click();
            else
            {
                rcmail.command('event-save');
                mel_metapage.Functions.call("update_cal", false, {
                    _integrated:true,
                    eval:"always",
                    args:{
                        refresh:true,
                        child:true,
                        goToTop:true
                    }
                });
            }

            EventUserNotified.Dispose();

            return true;
        }
        //Si erreur(s)
        else return false;
        
    }

    window.rcube_calendar_ui._beforeSave = (event) => {

        if (event._notify === undefined || event._notify === null)
        {
            let checked = false;
            $("#edit-attendees-table").find('input.edit-attendee-reply').each((i,e) => {
                if (!checked && e.checked === true) checked = true; 
            });

            if (checked) event._notify = 1;

        }

        return event;
    };

    /**
     * Mélange un texte
     * @param {Array<any>} array 
     * @returns {string}
     */
    window.rcube_calendar_ui.shuffle = function (array) {
        return mel_metapage.Functions._shuffle(array);
    };

    /**
     * Génère le nom de la room d'une visio
     * @returns {string} Nom de la room
     */
    window.rcube_calendar_ui.generateRoomName = function() {
        return mel_metapage.Functions.generateWebconfRoomName();
    };

    /**
     * Affiche la modale d'édition d'un évènement
     * @param {JSON} event Event plugin calendar
     */
    window.rcube_calendar_ui.edit = function(event)
    {
        EventUserNotified.CreateInstance(event);
        //Récupération de l'évènement mis en mémoire si l'évènement passé en paramètre est vide.
        if (event === "" && rcmail.env.event_prop !== undefined)
        {
            event = rcmail.env.event_prop;
            if (typeof event.start === "string")
                event.start = moment(event.start);
            else if (event.start === undefined)
                event.start = moment();
            if (typeof event.end === "string")
                event.end = moment(event.end);
            else if (event.end === undefined)
                event.end = moment().add(30, "m");
        }

        //Initialisation des fonctions
        const shuffle = window.rcube_calendar_ui.shuffle;
        const generateRoomName = rcube_calendar_ui.generateRoomName;
        /**
         * Récupère une date "string" sous forme de "moment"
         * @param {string} string Date 
         * @returns {moment} Date
         */
        const getDate = function(string)
        {
            string = string.split(" ");
            const date = string[0].split("/");
            const time = string.length > 1 ? string[1].split(":") : ['00','00'];

            return new moment(`${date[2]}-${date[1]}-${date[0]}T${time[0]}:${time[1]}:00`);
        };
        
        /**
         * 
         * @param {EventsLocation} events 
         */
        const update_location = async function (events)
        {
            if (window.rcube_calendar_ui.edit._events === undefined) window.rcube_calendar_ui.edit._events = new EventLocation($('#edit-wsp'), $("#wsp-event-all-cal-mm"));

            if (typeof events === 'string' ) {
                if (!!window.rcube_calendar_ui.edit._events)
                {
                    if (events.includes('remove'))
                    {
                        window.rcube_calendar_ui.edit._events.delete(events.split(':')[1]);
                    }
                    else if (events.includes('restart')){
                        window.rcube_calendar_ui.edit._events.restart();
                    }
                    else if (events.includes('get'))
                    {
                        return window.rcube_calendar_ui.edit._events;
                    }
                }
                events = null;
            }
            
            /**
             * @type {EventLocation}
             */
            const current_location = window.rcube_calendar_ui.edit._events.addEvent(events);
            const val = await current_location.getValue();
            $("#edit-location").val(val);
            //EventUserNotified.Instance().update();
        }
        
        /**Met à jour le champs date */
        const update_date = () => {
            let val = $(".input-mel-datetime .input-mel.start").val().split(" ");
            $("#edit-startdate").val(val[0]);
            $("#edit-starttime").val(val[1]);
            val = $(".input-mel-datetime .input-mel.end").val().split(" ");
            $("#edit-enddate").val(val[0]);
            $("#edit-endtime").val(val[1]);
            //EventUserNotified.Instance().update();
        };
        /**
         * Actions à faire lors du changement de date
         * @param {*} date 
         * @param {boolean} isEndDate 
         * @param {boolean} doShow 
         */
        let onChangeDateTime = (date, isEndDate = false, doShow = false) => {
            //Empêche les erreurs d'affichages
            if (onChangeDateTime.from_start_do_show !== undefined)
            {
                doShow = onChangeDateTime.from_start_do_show;
                onChangeDateTime.from_start_do_show = undefined;
            }

            //Initialisatoins des variables
            let bool;
            let querry = $(".input-mel-datetime .input-mel.end");
            const end_val = isEndDate ? moment(date) : getDate(querry.val());
            const start_val_raw = $(".input-mel-datetime .input-mel.start").val();
            const start_val = getDate(start_val_raw);

            const min_date = start_val_raw.split(' ')[0];

            //L'heure de fin est changée lorsque la date de fin est identique à la date de début.

            if (onChangeDateTime.minDate !== min_date)
            {
                querry.datetimepicker('setOptions', {minDate:min_date, formatDate:'d/m/Y'});
                onChangeDateTime.minDate = min_date;
            }

            if (end_val === "" || end_val === undefined || end_val === null || end_val <= start_val)
            {
                onChangeDateTime.from_start_do_show = doShow;
                const allday = $("#edit-allday")[0].checked;
                const dif = window.rcube_calendar_ui.difTime === undefined || allday || isEndDate ? 3600 : window.rcube_calendar_ui.difTime;
                querry.val(getDate($(".input-mel-datetime .input-mel.start").val()).add(dif,"s").format(allday ? format.split(' ')[0] : format) );
                update_date();
                bool = start_val.format('DD/MM/YYYY') === getDate($(".input-mel-datetime .input-mel.start").val()).format('DD/MM/YYYY');
            }
            else {
                bool = start_val.format('DD/MM/YYYY') === end_val.format('DD/MM/YYYY');
            }

            let min_time;
            if (start_val_raw.includes(' ') && bool) min_time = moment(start_val).add(1, 'm').format('HH:mm');
            else min_time = false;

            if (onChangeDateTime.minTime !== min_time)
            {
                querry.datetimepicker('setOptions', {minTime:min_time});
                if (doShow && onChangeDateTime.minTime !== undefined) querry.datetimepicker('hide').datetimepicker('show');
                onChangeDateTime.minTime = min_time;
            }
        };

        const onAlertChange = function onalertChange(){
            let $edit_alarms = $('#edit-alarms');
            if ($('#edit-alarm-item').val() === EMPTY_STRING) {
                $edit_alarms.removeClass('have-options');
            }
            else $edit_alarms.addClass('have-options');
        }

        const format = "DD/MM/YYYY HH:mm";
        const have_created_callback = $("#eventedit").data("callbacks") === "ok";
        //Création des actions
        if (!have_created_callback)
        {
            //Initialisation des champs dates
            $(".input-mel-datetime .input-mel.start").datetimepicker({
                format: 'd/m/Y H:i',
                lang:"fr",
                step:15,
                dayOfWeekStart:1,
                onChangeDateTime:(date) => {
                    onChangeDateTime(date, false, false);
                }
            });
            $(".input-mel-datetime .input-mel.end").datetimepicker({
                format: 'd/m/Y H:i',
                lang:"fr",
                step:15,
                dayOfWeekStart:1,
                onChangeDateTime:(date) => {
                    onChangeDateTime(date, true, true);
                }
            });
            $(".input-mel-datetime .input-mel.start").on("change", () => {
                const val = $(".input-mel-datetime .input-mel.start").val().split(" ");
                $("#edit-startdate").val(val[0]);
                if (val.length > 1) $("#edit-starttime").val(val[1]);
                else $("#edit-starttime").val('00:00');
            });
            $(".input-mel-datetime .input-mel.end").on("change", () => {
                const val = $(".input-mel-datetime .input-mel.end").val().split(" ");
                $("#edit-enddate").val(val[0]);
                if (val.length > 1) $("#edit-endtime").val(val[1]);
                else $("#edit-endtime").val('00:00');
            });

            //Initalisation du bouton "Toute la journée"
            $("#edit-allday").on("click", (e) => {
                e = e.target;

                if (e.checked)
                {
                    $(".input-mel-datetime .input-mel.start").datetimepicker('setOptions', {format: 'd/m/Y', timepicker:false});
                    $(".input-mel-datetime .input-mel.end").datetimepicker('setOptions', {format: 'd/m/Y', timepicker:false});

                    $(".input-mel-datetime .input-mel.start").val($(".input-mel-datetime .input-mel.start").val().split(' ')[0]);
                    $(".input-mel-datetime .input-mel.end").val($(".input-mel-datetime .input-mel.end").val().split(' ')[0]);
                }
                else {
                    $(".input-mel-datetime .input-mel.start").datetimepicker('setOptions', {format: 'd/m/Y H:i', timepicker:true});
                    $(".input-mel-datetime .input-mel.end").datetimepicker('setOptions', {format: 'd/m/Y H:i', timepicker:true});

                    $(".input-mel-datetime .input-mel.start").val($(".input-mel-datetime .input-mel.start").val() + ' 00:00');
                    $(".input-mel-datetime .input-mel.end").val($(".input-mel-datetime .input-mel.end").val() + ' 00:00');
                    onChangeDateTime(null, false, false);
                }
            })

            //Initialisation des localisations
            // rcube_calendar_ui._init_location($('#edit-wsp'), $("#wsp-event-all-cal-mm"), update_location);
            //Actions à faire lors de l'appuie d'un bouton radio
            $(".form-check-input.event-mode").on("click", (e) => {
                e = e.target;
                $(".content.event-mode").css("display", "none");
                $(`.${e.id}`).css("display", "");
                //update_location();
            });
            //Action à faire lors de l'écriture du lieu
            $("#edit-location").on("change", () => {
                //update_location();
            });
            //Actions à faire lors de l'appuie d'un bouton radio pour la séléction d'une webconf
            $("#eb-mm-wm-e").on("change", () => {
                //update_location();

                if (!$("#eb-mm-wm-e")[0].checked) //Visio custom
                {
                    $("#url-visio-cal").removeClass("hidden");
                    $("#row-for-key-visio-cal").addClass("hidden");
                }
                else //Visio de l'état
                {
                    $("#url-visio-cal").addClass("hidden");
                    $("#row-for-key-visio-cal").removeClass("hidden");
                }
            });
            $("#eb-mm-wm-a").on("change", () => {
                //update_location();

                if (!$("#eb-mm-wm-e")[0].checked) //Visio custom
                {
                    $("#url-visio-cal").removeClass("hidden");
                    $("#row-for-key-visio-cal").addClass("hidden");
                }
                else //Visio de l'état
                {
                    $("#url-visio-cal").addClass("hidden");
                    $("#row-for-key-visio-cal").removeClass("hidden");
                }
            });
            //Maj de l'url d'un visio custom
            $("#url-visio-cal").on("change", () => {
                //update_location();
            });
            //Maj de la localisation
            $("#presential-cal-location").on("change", () => {
                //update_location();
            });
            //Maj du tel
            $("#tel-input-cal-location").on("change", () => {
                //update_location();
            });
            $("#num-audio-input-cal-location").on("change", () => {
               // update_location();
            });
            //Maj de l'url de la visio de l'état
            $("#key-visio-cal").on("input", () => {
                let val = $("#key-visio-cal").val().toUpperCase();
                if (val.includes(rcmail.env["webconf.base_url"].toUpperCase()))
                {
                    val = val.split("/");
                    val = val[val.length-1];
                    $("#key-visio-cal").val(val.toUpperCase());
                    //querry.val()
                }
            });

            $("#key-visio-cal").on("change", () => {
               // update_location();
            });

            //Check wsp ou catégorie
            $("#edit-wsp").on("click", (e) => {
                e = e.target;
                if (e.checked)
                {
                    $("#div-events-wsp").css("display", "");
                    $("#div-events-category").css("display", "none");
                    if ($("#wsp-event-all-cal-mm").val() === "#none")
                        $(".have-workspace").css("display", "none");
                    else
                        $(".have-workspace").css("display", "");
                    
                    $("#wsp-event-all-cal-mm").change();
                }
                else {
                    $("#div-events-wsp").css("display", "none");
                    $("#div-events-category").css("display", "");
                    $(".have-workspace").css("display", "none");

                    $('#categories-event-all-cal-mm').change();
                }
            });
            $("#wsp-event-all-cal-mm").on("change", () => {
                const val = $("#wsp-event-all-cal-mm").val();
                if (val !== "#none")
                {
                    $(".have-workspace").css("display", "");
                    $("#edit-categories").val(`ws#${val}`)
                }
                else
                {
                    $(".have-workspace").css("display", "none");
                    $("#edit-categories").val("");
                }
                update_location(null);
            });
            $("#categories-event-all-cal-mm").on("change", () => {
                const val = $("#categories-event-all-cal-mm").val();
                if (val !== "#none")
                    $("#edit-categories").val(val)
                else
                    $("#edit-categories").val("");
                $("#wsp-event-all-cal-mm").val("#none");
                update_location(null);
            });
            $("#fake-event-rec").on("change", (e) => {
                $("#edit-recurrence-frequency").val(e.target.value);
                $("#edit-recurrence-frequency").change();
            });
            //Update visu
            $("#edit-recurrence-frequency").addClass("input-mel");
            $("#edit-alarm-item").addClass("input-mel").on('change', () => onAlertChange());
            $("#eventedit .form-check-input.custom-control-input").removeClass("custom-control-input");
            $("#edit-attendee-add").addClass("mel-button").css("margin", "0 5px");
            $("#edit-attendee-schedule").addClass("mel-button").css("margin", "0 5px");
            
            $("#edit-attendee-add").attr("title", rcmail.gettext('add_user_button_title', plugin_text)).before($('#showcontacts_edit-attendee-name'))
            .click(() => {
                EventUserNotified.Instance().update();
            });

            let lockedInterval = false;
            $("#edit-attendee-name").attr("placeholder", `${rcmail.gettext('add_user_to_event', plugin_text)}...`).attr("title", rcmail.gettext('add_user_to_event_title', plugin_text))
            .css('border-bottom-right-radius', 0)
            .css('border-top-right-radius', 0).on('change', () => {
                if (!lockedInterval) {
                    lockedInterval = true;
                    let nbTry = 0;
                    const rowNumber =  $('#edit-attendees-table tr').length;
                    const interval = setInterval(() => {
                            if ($('#edit-attendees-table tr').length !== rowNumber || nbTry++ >= 10) {
                                EventUserNotified.Instance().update();

                                if (nbTry >= 10) {
                                    console.warn('/!\\[setInterval]Impossible de trouver l\'état du participant.');
                                }

                                clearInterval(interval);
                                nbTry = null;
                                lockedInterval = false;
                            }
                    }, 50);
                }
            });

            $("#mel-calendar-has-phone-datas").addClass('custom-control-input')
            .click(() => {
                if ($("#mel-calendar-has-phone-datas")[0].checked)
                    $('.visio-phone-datas').css('display', '');
                else
                    $('.visio-phone-datas').css('display', 'none');

                update_location(null);
            });

            $('#edit-sensitivity option[value="confidential"]').remove();

            $('#edit-recurrence-enddate').on('mousedown',() => {
                $('#edit-recurrence-repeat-until')[0].checked = true;
            });

            $("#eventedit .nav a.nav-link.attendees").click(() => {
                EventUserNotified.Instance().update();
            });

            $('#edit-attendees-donotify').click((e) => {
                if (e.currentTarget.checked) {
                    $('.notified').css('display', '');
                }
                else {
                    $('.notified').css('display', 'none');
                }
            });

            //ok
            $("#eventedit").data("callbacks", "ok");

        }
        
        setTimeout(async () => {
            $("#wsp-event-all-cal-mm").removeClass("disabled").removeAttr("disabled");
            $("#edit-wsp").removeClass("disabled").removeAttr("disabled");   

            if (event === "") //nouvel event
            {
                

                $(".input-mel-datetime .input-mel.start").val(getDate(`${$("#edit-startdate").val()} ${$("#edit-starttime").val()}`).format(format));
                $(".input-mel-datetime .input-mel.end").val(getDate(`${$("#edit-startdate").val()} ${$("#edit-endtime").val()}`).format(format));
                update_date();
                
                if ($("#edit-wsp")[0].checked)
                {
                    $("#div-events-wsp").css("display", "");
                    $("#div-events-category").css("display", "none");
                    if ($("#wsp-event-all-cal-mm").val() === "#none")
                        $(".have-workspace").css("display", "none");
                    else
                        $(".have-workspace").css("display", "");
                }
                else {
                    $("#div-events-wsp").css("display", "none");
                    $("#div-events-category").css("display", "");
                    $(".have-workspace").css("display", "none");
                }

                $("#fake-event-rec").val("")

                if ($("#edit-allday")[0].checked) $("#edit-allday").click().click();
                else {
                    $(".input-mel-datetime .input-mel.start").datetimepicker('setOptions', {format: 'd/m/Y H:i', timepicker:true});
                    $(".input-mel-datetime .input-mel.end").datetimepicker('setOptions', {format: 'd/m/Y H:i', timepicker:true});
                }
                // else
                // {
                //     $(".input-mel-datetime .input-mel.start").removeClass("disabled").removeAttr("disabled"); 
                //     $(".input-mel-datetime .input-mel.end").removeClass("disabled").removeAttr("disabled"); 
                // }

                //Si des données sont déjà présentes
                if ($("#edit-categories").val() !== "")
                {
                    const val = $("#edit-categories").val();
                    
                    if (val.includes("ws#"))
                    {
                        $("#categories-event-all-cal-mm").parent().css("display", "none");
                        $("#wsp-event-all-cal-mm").val(val.replace("ws#", "")).parent().css("display", "");
                        $("#edit-wsp")[0].checked = true;
                    }
                    else
                    {
                        $("#wsp-event-all-cal-mm").parent().css("display", "none");
                        $("#categories-event-all-cal-mm").val(val).parent().css("display", "");
                        $("#edit-wsp")[0].checked = false;
                    }
                }

                await EventLocation.InitFromEvent($("#edit-location").val(), $('#em-locations'), window.rcube_calendar_ui._init_location, $('#edit-wsp'), $("#wsp-event-all-cal-mm"), update_location);

                $("#fake-event-rec").val($("#edit-recurrence-frequency").val());

                $("#key-visio-cal").val(generateRoomName());
                window.rcube_calendar_ui.difTime = undefined;

            }
            else{ //ancien event
                // Gestion des dates - 0007033: Modification d'un évenement récurrent
                if ($('input.edit-recurring-savemode:checked').val() == 'all' && event.master_start) {
                    $(".input-mel-datetime .input-mel.start").val(moment(event.master_start).format(format));
                    $(".input-mel-datetime .input-mel.end").val(moment(event.master_end).format(format));
                }
                else {
                    $(".input-mel-datetime .input-mel.start").val(moment(event.start).format(format));
                    $(".input-mel-datetime .input-mel.end").val(moment(event.end).format(format));
                }
                update_date();

                window.rcube_calendar_ui.difTime = (moment(event.end) - moment(event.start))/1000.0;
                if (window.rcube_calendar_ui.difTime === 0)
                    window.rcube_calendar_ui.difTime = undefined;

                if ($("#edit-allday")[0].checked) $("#edit-allday").click().click();
                else {
                    $(".input-mel-datetime .input-mel.start").datetimepicker('setOptions', {format: 'd/m/Y H:i', timepicker:true});
                    $(".input-mel-datetime .input-mel.end").datetimepicker('setOptions', {format: 'd/m/Y H:i', timepicker:true});
                    onChangeDateTime(null, false, false);
                }

                //Gestion de la récurence
                const req = event.recurrence;
                if (req !== undefined && req !== null)
                {
                    $("#fake-event-rec").val(req.FREQ);
                }

                //Gestion de la localisation
                const description = event.location;
                await EventLocation.InitFromEvent(description, $('#em-locations'), window.rcube_calendar_ui._init_location, $('#edit-wsp'), $("#wsp-event-all-cal-mm"), update_location);

                //Gestion des alarmes
                if (event.alarms !== undefined && event.alarms !== null)
                {

                    try
                    {
                        const alarm = new Alarm(event.alarms);

                        switch (alarm.mode) {
                            case Alarm.enums.mode.display:

                                let time;
                                let value;

                                switch (alarm.timeMode) {
                                    case Alarm.enums.time_type.day:
                                        time = alarm.time / 24 / 60;
                                        value = "D"
                                        break;
                                    case Alarm.enums.time_type.hour:
                                        time = alarm.time / 60;
                                        value = "H"
                                        break;
                                    default:
                                        time = alarm.time;
                                        value = "M"
                                        break;
                                }

                                if (alarm.type === Alarm.enums.type.before)
                                    value = `-${value}`;
                                else
                                    value = `+${value}`;

                                $("#edit-alarm-item").val("DISPLAY");
                                $(".edit-alarm-values").css("display", "");
                                $(".edit-alarm-value").val(time);
                                $(".edit-alarm-offset").val(value);
                                break;
                        
                            default:
                                $("#edit-alarm-item").val("");
                                break;
                        }
                    }
                    catch(error)
                    {}
                }

                //Gestion des catégories
                if (parent.$(".wsp-toolbar.wsp-toolbar-edited.melw-wsp").length > 0  && parent.$(".wsp-toolbar.wsp-toolbar-edited.melw-wsp").css("display") !== "none")
                {
                    if (event._id === undefined) event.categories = [`ws#${mel_metapage.Storage.get("current_wsp")}`];
                    event.calendar_blocked = "true";
                }

                if (event.categories !== undefined && event.categories.length > 0)
                {
                    if (event.categories[0].includes("ws#"))
                    {
                        $("#edit-wsp")[0].checked = true;
                        $("#div-events-wsp").css("display", "");
                        $("#div-events-category").css("display", "none");
                        $("#wsp-event-all-cal-mm").val(event.categories[0].replace("ws#", ""));
                        if (event.calendar_blocked === "true")
                        {
                            $("#wsp-event-all-cal-mm").addClass("disabled").attr("disabled", "disabled");
                            $("#edit-wsp").addClass("disabled").attr("disabled", "disabled");
                        }
                    }
                    else
                    {
                        if ($("#edit-wsp")[0].checked)
                        {
                            $("#edit-wsp").click();
                            if ($("#wsp-event-all-cal-mm").val() === "#none")
                                $(".have-workspace").css("display", "none");
                            else
                                $(".have-workspace").css("display", "");
                        }
                        else {
                            $("#div-events-wsp").css("display", "none");
                            $("#div-events-category").css("display", "");
                            $(".have-workspace").css("display", "none");
                        }
                        $("#categories-event-all-cal-mm").val(event.categories[0]);
                    }

                    $("#edit-categories").val(event.categories[0]);

                }
                else {
                    $(".have-workspace").css("display", "none");
                }

                $("#edit-attendees-donotify").addClass("custom-control-input");
            }
            $('li > a[href="#event-panel-attendees"]').parent().css("display", "");
            //$('#edit-attendees-notify').css('display', 'none');
            update_location();
            onAlertChange();
        }, 10);

        //Suppression text
        $("#eventedit").find(".create_poll_link").css("display", "none");
        $("#edit-recurrence-frequency").parent().parent().find("label").css("display", "none");

        //maj des boutons
        let button_toolbar = $("#eventedit").parent().parent().find(".ui-dialog-buttonset");
        if (rcmail.env.task !== "calendar")
        {
            if (button_toolbar.length > 0)
            {
                button_toolbar.find(".btn").css("display", "none");
            }
        }
        else {
            button_toolbar.append(button_toolbar.find(".save").clone()
            .removeClass("save")
            .removeClass("btn-primary")
            .addClass("btn-secondary mel-button")
            .attr("id", "falseeventsave")
            .append(`<span class="plus icon-mel-arrow-right"></span>`)
            .click(() => {
                rcube_calendar_ui.save();
            }));

            button_toolbar.find(".cancel")
            .addClass("mel-button")
            .addClass("btn-danger")
            .addClass("mel-before-remover")
            .removeClass("btn-secondary")
            .append(`<span class="plus icon-mel-close"></span>`);
            

            button_toolbar.find(".save").css("display", "none");
        }

        //Maj des onglets
        $('li > a[href="#event-panel-summary"]').html("Résumé");
        $('li > a[href="#event-panel-detail"]').html("Détails");
    }

    window.rcube_calendar_ui._init_location = async function($haveWorkspace, $workspaceSelect, update_location, baseId = 0, _default = null)
    {
        const mainDivId = `em-locations-base-id-${baseId}`;

        if ($(`#${mainDivId}`).length > 0) return await rcube_calendar_ui._init_location($haveWorkspace, $workspaceSelect, update_location, ++baseId, _default);

        let locationTypeOptions = {
            default_selected:'En présentiel',
            visio:'Par visioconférence',
            audio:'Par audio'
        };

        const visioTypeOptions = {
            intregrated_selected:rcmail.gettext('mel_metapage.state_tool_conf'),
            custom:rcmail.gettext('mel_metapage.other_tool_conf'),
        };

        let $parentDiv = $('#em-locations').append(`<div id="${mainDivId}" class="row locations"></div>`);
        let $mainDiv = $parentDiv.find(`#${mainDivId}`);
        
        let $leftCol = $( `<div class="col-6"> <label for="presential-cal-location" class="span-mel t1 margin ${baseId === 0 ? '' : 'hidden'}" style="margin-bottom:10px"><span class="">${rcmail.gettext('mel_metapage.event_mode')}</span></label></div>`).appendTo($mainDiv);
        let $rightCol = $('<div class="col-6"></div>').appendTo($mainDiv);

        let $audioDiv = $(`
        <div class="audio-${mainDivId}">
        <span class="span-mel t2 margin red-star-after ${baseId === 0 ? '' : 'hidden'}">Choix de l'option</span>
            <center><div class="abutton"></div></center>
            <div class="rrow">
                <div class="rcol-md-6 aphone">
                <label>Téléphone de l'audio</label>
                </div>
                <div class="rcol-md-6 anum">
                <label>Numéro de l'audio</label>
                </div>
            </div>
        </div>
        `).appendTo($rightCol);
        let $audioButton = $(`<button type="button" style="margin-top:0" class="mel-button mel-before-remover invite-button create btn btn-secondary">
        <span>Réserver</span>
        <span class="icofont-hand-right  plus" style="vertical-align: top;margin-left: 15px;"></span>
    </button>`).click(() => window.open('https://audio.mtes.fr/', '_blank').focus())
    .appendTo($audioDiv.find('.abutton'));
        let $audioCode = $('<input type="text" class="form-control input-mel">').attr('title', 'Numéro de l’audio - Mode d’événement par audio').attr('aria-labelledby', 'mel-event-audio-num-sr-only').appendTo($audioDiv.find('.anum'));
        let $audioPhone = $('<input type="tel" class="form-control input-mel" />').attr('title', 'Téléphone de l’audio - Mode d’événement par audio').attr('aria-labelledby', 'mel-event-audio-phone-sr-only').appendTo($audioDiv.find('.aphone'));
        let $visioDiv = $(`<div class="visio-${mainDivId}">
        <span class="span-mel t2 red-star-after margin ${baseId === 0 ? '' : 'hidden'}">Choix de l'option</span>
            <div class="">
                <div class="rcol-6 vselect">
                </div>
                <div class="rcol-6 vinput">
                    <div class="vintegrated">
                        <div class="input-group viinput">
                        <!--TODO : input group -->
                            <div class="vbutton input-group-prepend"></div>
                            <!-- <div class="viinput"></div> -->
                        </div>
                    </div>
                    <div class="vcustom">
                    </div>
                </div>
            </div>
        </div>`).appendTo($rightCol);
        let $visioSelect = $('<select class="form-control input-mel"></select>').appendTo($visioDiv.find('.vselect'));
        let $visioButton = $('<button type="button" style="margin-top:0" title="Générer le nom du salon au hasard" class="mel-button create mel-before-remover btn btn-secondary"><span class="icofont-refresh"></span></button>').click(() => {
            $visioWebconfInput.val(mel_metapage.Functions.generateWebconfRoomName());
        }).appendTo($visioDiv.find('.vinput .vintegrated .vbutton'));
        let visioButtonLock = new mel_html2('button', {
            attribs:{
                class:'mel-button lock mel-before-remover btn btn-secondary no-button-margin fill-on-hover',
                type:'button'
            },
            contents:new mel_html('span', {class:'material-symbols-outlined'}, 'lock_open')
        });

        visioButtonLock.onclick.push(() => {
            $visioDiv.find('.delete-lock').remove();
            let $material = $visioDiv.find('.material-symbols-outlined').first();

            if ($material.text() !== 'done') {
                $material.text('done');

                const room = $visioWebconfInput.val();
                $visioWebconfInput.css('border-top-left-radius', '60px')
                                  .css('border-bottom-left-radius', '60px')
                                  .attr('placeholder', 'Saisir le mot de passe de la visio')
                                  .data('room', room)
                                  .val($visioWebconfInput.data('pass') ?? EMPTY_STRING);
                $visioButton.parent().css('display', 'none');
            }
            else {
                const pass = $visioWebconfInput.val();
                const room = $visioWebconfInput.data('room');
                $visioWebconfInput.css('border-top-left-radius', '')
                                  .css('border-bottom-left-radius', '')
                                  .attr('placeholder', 'Saisir le nom du salon')
                                  .data('pass', pass)
                                  .removeData('room')
                                  .val(room);

                if (pass.length > 0) {
                    $material.text('lock');

                    let delete_lock = new mel_html2('button', {
                        attribs:{
                            class:'mel-button delete-lock mel-before-remover btn btn-secondary no-button-margin fill-on-hover',
                            type:'button'
                        },
                        contents:new mel_html('span', {class:'material-symbols-outlined'}, 'no_encryption')
                    });

                    delete_lock.onclick.push(() => {
                        $material.text('lock_open');
                        $visioWebconfInput.removeData('pass');
                        $visioDiv.find('.delete-lock').remove();
                    });

                    delete_lock.create($visioDiv.find('.vinput .vintegrated .viinput .vabutton'));
                }
                else {
                    $visioWebconfInput.removeData('pass');
                    $material.text('lock_open');
                }

                $visioWebconfInput.change();

                $visioButton.parent().css('display', '');
            }

        });

        let $visioPhoneDatas = $(`
        <div class='input-group visio-phone-datas'>
            <div class="input-group-prepend" style="max-width:50%">
                <div class='input-group pn'>
                    <div class="input-group-prepend">
                        <span class="input-group-text mel icon-mel-phone"></span>
                    </div>
                </div>
            </div>
        </div>`).css('display', 'none');
        let $visioPhoneNumber = $(`<input type='text' disabled class="form-control input-mel" />`).appendTo($visioPhoneDatas.find('.input-group-prepend .pn'));
        let $visioPhonePin = $(`<input type='text' disabled class="form-control input-mel" />`).appendTo($visioPhoneDatas);
        let $visioWebconfInput = $(`<input type="text" pattern="^(?=(?:[a-zA-Z0-9]*[a-zA-Z]))(?=(?:[a-zA-Z0-9]*[0-9]){3})[a-zA-Z0-9]{10,}$" class="form-control input-mel" title="Le nom de la conférence doit contenir un minimum de 10 caractères dont au moins 3 chiffres. Ces caractères sont exclusivement des lettres de l’alphabet et des chiffres, la casse (Min/Maj) n’a pas d’importance." placeholder="Saisir le nom du salon" />`).appendTo($visioDiv.find('.vinput .vintegrated .viinput'));
        let $visioCustomInput = $(`                        <input type="text" id="url-visio-cal" class="form-control input-mel" placeholder="Saisir l'url de visioconférence" />`)
        .appendTo($visioDiv.find('.vinput .vcustom'));
        let $placeInput = $(`<div class="place-${mainDivId}"><label for="presential-cal-location-${mainDivId}" class="${baseId === 0 ? '' : 'hidden'} span-mel t2 margin">Choix de l'option</label>
        <input type="text" id="presential-cal-location-${mainDivId}" class="form-control input-mel" placeholder="Nom du lieu" /></div>`).appendTo($rightCol);
        
        let $divSelect = $('<div class="input-group">  <div class="input-group-prepend"></div></div>').appendTo($leftCol);
        let $optionSelect = $('<select class="custom-calendar-option-select form-control input-mel custom-select pretty-select"></select>').appendTo($divSelect);

        new mel_html2('div', {attribs:{class:'vabutton input-group-append'}, contents:visioButtonLock}).create($visioDiv.find('.vinput .vintegrated .viinput'));

        if (baseId !== 0)
        {
            $(`<button type="button" style="margin-top:0" class="mel-button btn btn-secondary"><span class="icon-mel-trash"></span></button>`)
            .appendTo($divSelect.find('.input-group-prepend'))
            .click(() => {
                update_location(`remove:${mainDivId}`).then(() => {
                $mainDiv.remove();});
            });
        }
        else {
            $(`<button type="button" style="margin-top:0" class="mel-button btn btn-secondary"><span class="icon-mel-plus"></span></button>`).appendTo($divSelect.find('.input-group-prepend'))
            .click(async () => {
                await window.rcube_calendar_ui._init_location($haveWorkspace, $workspaceSelect, update_location, ++baseId);
                $('.custom-calendar-option-select').each((i,e) => {
                    if (e.value === 'visio') $(e).change();
                })
            });
        }

        for (const key in locationTypeOptions) {
            if (Object.hasOwnProperty.call(locationTypeOptions, key)) {
                const element = locationTypeOptions[key];
                $optionSelect.append(`<option value=${key.replace('_selected', '')} ${(key.includes('_selected') ? 'selected' : '')}>${element}</option>`)
            }
        }

        for (const key in visioTypeOptions) {
            if (Object.hasOwnProperty.call(visioTypeOptions, key)) {
                const element = visioTypeOptions[key];
                $visioSelect.append(`<option value=${key.replace('_selected', '')} ${(key.includes('_selected') ? 'selected' : '')}>${element}</option>`)
            }
        }

        $visioPhoneDatas.appendTo($leftCol);

        if (_default !== null)
        {
            for (const key in _default) {
                if (Object.hasOwnProperty.call(_default, key)) {
                    const element = _default[key];
                    switch (key) {
                        case 'place':
                            $placeInput.find('input').val(element);
                            break;

                        case 'visio':
                            switch (element.type) {
                                case 'integrated':
                                    $visioSelect.val('intregrated');
                                    $visioWebconfInput.val(element.val);

                                    if (!!element.pass) {
                                        const pass = element.pass.includes(' (') ? element.pass.split(' (')[0] : element.pass;
                                        $visioWebconfInput.data('pass', pass);
                                        $visioDiv.find('.material-symbols-outlined').text('lock');

                                        let delete_lock = new mel_html2('button', {
                                            attribs:{
                                                class:'mel-button delete-lock mel-before-remover btn btn-secondary no-button-margin fill-on-hover',
                                                type:'button'
                                            },
                                            contents:new mel_html('span', {class:'material-symbols-outlined'}, 'no_encryption')
                                        });
                    
                                        delete_lock.onclick.push(() => {
                                            let $material = $visioDiv.find('.material-symbols-outlined').first();
                                            $material.text('lock_open');
                                            $visioWebconfInput.removeData('pass');
                                            $visioDiv.find('.delete-lock').remove();
                                        });
                    
                                        delete_lock.create($visioDiv.find('.vinput .vintegrated .viinput .vabutton'));
                                    }

                                    break;

                                case 'custom':
                                    $visioSelect.val('custom');
                                    $visioCustomInput.val(element.val);
                                    break;
                            
                                default:
                                    break;
                            }
                            break;

                        case 'audio':
                            $audioPhone.val(element.tel);
                            $audioCode.val(element.num);
                            break;

                        case 'type':
                            $optionSelect.val(element);
                            break;
                    
                        default:
                            break;
                    }
                }
            }
        }

        let placeLocation = new PlaceEventLocation($placeInput.find('input'));
        let audioLocation = new AudioEventLocation(audio_url, $audioPhone, $audioCode);
        let visioPhoneLocation = new VisioPhoneLocation($("#mel-calendar-has-phone-datas"), $visioPhoneNumber, $visioPhonePin, $visioPhoneDatas);
        let visioLocation = new VisioEventLocation($visioSelect, $visioWebconfInput, $visioCustomInput, $haveWorkspace, $workspaceSelect, visioPhoneLocation);

        [$audioCode, $audioPhone, $visioSelect, $visioWebconfInput, $visioCustomInput, $placeInput, $optionSelect].forEach(item => {
            item.on('change', () => {
                if (!item.data('room')) update_location(new EventsLocation(mainDivId, placeLocation, audioLocation, visioLocation, $optionSelect));
            });
        });

        $visioButton.click(() => {
            update_location(new EventsLocation(mainDivId, placeLocation, audioLocation, visioLocation, $optionSelect));
        });

        $optionSelect.on('change', async (e) => {
            let $showPhone = $("#mel-calendar-has-phone-datas").parent().css('display', 'none'); 

            e = $(e.currentTarget);

            $visioDiv.css('display', 'none');
            $placeInput.css('display', 'none');
            $audioDiv.css('display', 'none');

            const haveVisio = (await update_location('get')).have('visio');

            if (haveVisio || (!haveVisio && e.val() === 'visio')) 
            {
                $('.custom-calendar-option-select').each((i, e) => {
                    e = $(e);

                    if (e.val() !== 'visio')
                    {
                        e.find('option[value="visio"]').css('display', 'none');
                    }
                });
            }
            else $('.custom-calendar-option-select option[value="visio"]').css('display', '');

            $visioPhoneDatas.css('display', 'none');

            switch (e.val()) {
                case 'default':
                    $placeInput.css('display', '');
                    break;

                case 'visio':
                    $visioDiv.css('display', '');
                    $showPhone.css('display', '');
                    visioLocation.visioPhone.update();
                    break;

                case 'audio':
                    $audioDiv.css('display', '');
                    break;
            
                default:
                    break;
            }
        });

        $visioSelect.on('change', (e) => {
            let $integrated = $visioDiv.find('.vinput .vintegrated').css('display', 'none');
            let $custom = $visioDiv.find('.vinput .vcustom').css('display', 'none');

            switch ($(e.currentTarget).val()) {
                case 'intregrated':
                    $integrated.css('display', '');
                    break;

                case 'custom':
                    $custom.css('display', '');
                    break;

            
                default:
                    break;
            }
        })

        $optionSelect.change();
        $visioSelect.change();

        return $mainDiv;
    };

        rcmail.addEventListener("edit-event", (event) =>{
            window.rcube_calendar_ui.edit(event);
        });   

        rcmail.addEventListener("dialog-attendees-save", (datetimes) => {
            const getDate = function(string)
            {
                string = string.split(" ");
                const date = string[0].split("/");
                const time = string[1].split(":");
    
                return new moment(`${date[2]}-${date[1]}-${date[0]}T${time[0]}:${time[1]}:00`);
            };
            const format = "DD/MM/YYYY HH:mm";
            $(".input-mel-datetime .input-mel.start").val(getDate(`${datetimes.start.date} ${datetimes.start.time}`).format(format));
            $(".input-mel-datetime .input-mel.end").val(getDate(`${datetimes.end.date} ${datetimes.end.time}`).format(format));
        });

        rcmail.addEventListener("init", () => {
            window?.m_mp_action_from_storage?.('calendar_redirect', SearchResultCalendar.after_loading, true, "¤avoid");
            rcmail.register_command('calendar-workspace-add-all', () => {
                mel_metapage.Functions.busy();
                mel_metapage.Functions.post(mel_metapage.Functions.url("workspace", "get_email_from_ws"), {
                    _uid:$("#wsp-event-all-cal-mm").val()
                }, (datas) => {
                    datas = JSON.parse(datas);
                    for (let index = 0; index < datas.length; ++index) {
                        const element = datas[index];
                        $("#edit-attendee-name").val(element);
                        $("#edit-attendee-add").click();
                    }
                }).always(() => {
                    mel_metapage.Functions.busy(false);
                });

            }, true);

            try {            
                $(".task-calendar #layout #layout-content > .header #calendartoolbar a.button").each((i,e) => {

                    if ($(e).data("hidden") == "small")
                        return;

                    let li = $("<li></li>");
                    $(e).clone().appendTo(li)
                    li.appendTo($("#toolbar-menu-mel ul"));
                    //console.log("e", $(e).css("display"),e);
                });
                
            } catch (error) {
                
            }

            $("#mel-button-small-search").click(() => {
                let querry = $("#mel-small-search");
                
                if (querry.css("display") === "none")
                    querry.css("display", "");
                else
                    querry.css("display", "none");
            });

            $("#mel-small-search input").on("change", () => {
                $("#searchform").val($("#mel-small-search input").val())
                .parent().submit();
            });
            
            $("#mel-small-search button").click(() => {
                $('.toolbar-calendar .button.reset').click();
                $("#mel-small-search input").val("");
                $("#mel-button-small-search").click();
            });

            $("#searchform").parent().on("submit", () => {
                $("#calendarOptionSelect").val("ootd");
            });
        })

        // return;
        // new Promise(async (a,b) => {
        //     await wait(() => {
        //         console.log("para", rcube_calendar_ui.prototype.calendar_edit_dialog, window.calendar_edit_dialog);
        //         return rcube_calendar_ui.prototype.calendar_edit_dialog === undefined;
        //     });
        //     console.log("here", rcube_calendar_ui.prototype.calendar_edit_dialog);
        //     rcube_calendar_ui.prototype._calendar_edit_dialog = rcube_calendar_ui.prototype.calendar_edit_dialog;
        //     rcube_calendar_ui.prototype.calendar_edit_dialog = function(calendar)
        //     {
        //         console.log("parasite", calendar);
        //         this._calendar_edit_dialog(calendar);
        //         $(".input-mel-datetime").datetimepicker({
        //             format: 'd/m/Y H:i',
        //         });
    
        //     }
        // });


    rcube_calendar.prototype.create_event_from_somewhere = async function(event = null)
    {
        let isFromGlobalModal = false;

        if (event === null)
        {
            event = rcmail.local_storage_get_item("tmp_calendar_event");

            if (!!event) isFromGlobalModal = true;
        }

        if (window.create_event !== true)
            window.create_event = true;
        else
        {
            $('#mel-have-something-minified-main-create').remove();
            window.event_reduced = false;
            window.kolab_event_dialog_element.show()
            return;
        }

        var url = {
            _category: event === null || event.categories === undefined || event.categories === null || event.categories.length === 0 ? null : event.categories[0], 
            _framed: true,
            _calendar_blocked: event != null && event.calendar_blocked === true,
            _startDate: event == null || event.start === undefined ? null : moment(event.start).format("YYYY-MM-DDTHH:mm"),
            _endDate: event == null || event.end === undefined ? null : moment(event.end).format("YYYY-MM-DDTHH:mm"),
        };

        if (event.mail_datas)
        {
            url["_mbox"] = event.mail_datas.mbox;
            url["_uid"] = event.mail_datas.uid;
        }


            var buttons = {},
            button_classes = ['mainaction save', 'cancel'],
            title = rcmail.gettext('mel_metapage.new_event'),
            dialog = $('<iframe>').attr({
                id: 'kolabcalendarinlinegui',
                name: 'kolabcalendardialog',
                src: rcmail.url('mel_metapage/dialog-ui', url)
            }).css("width", "100%").css("height", "100%");

        // // dialog buttons
        // buttons[rcmail.gettext('save')] = function() {
        //     var frame = rcmail.get_frame_window('kolabcalendarinlinegui');
        //     frame.rcmail.command('event-save');
        //     parent.postMessage({
        //         message:"update_calendar"
        //     });

        // };

        // buttons[rcmail.gettext('cancel')] = function() {
        //     dialog.dialog('destroy');
        // };

        // open jquery UI dialog
        // window.kolab_event_dialog_element = dialog = rcmail.show_popup_dialog(dialog, title, buttons, {
        //     button_classes: button_classes,
        //     minWidth: 500,
        //     width: 600,
        //     height: 600
        // });
        rcmail.lock_frame(dialog);

        if ($("#globalModal .modal-close-footer").length == 0)
            await GlobalModal.resetModal();

        const config = new GlobalModalConfig(rcmail.gettext('create_event', plugin_text), "default", dialog, null);
        window.kolab_event_dialog_element = dialog = new GlobalModal("globalModal", config, true);

        kolab_event_dialog_element.footer.buttons.save.click(() => {
            window.event_saved = true;
            if (kolab_event_dialog_element.modal.find("iframe")[0].contentWindow.rcube_calendar_ui.save())
            {

            }
        }).removeClass("btn-primary")
        .addClass("btn-secondary mel-button");

        kolab_event_dialog_element.footer.buttons.exit.click(() => {
            window.event_saved = true;
        });
        //.append(`<span class="plus icon-mel-arrow-right"></span>`);

        if (kolab_event_dialog_element.footer.buttons.save.find(".plus").length === 0)
            kolab_event_dialog_element.footer.buttons.save.append(`<span class="plus icon-mel-arrow-right"></span>`);

         kolab_event_dialog_element.footer.buttons.exit.addClass("mel-button")
         .addClass("btn-danger")
         .addClass("mel-before-remover")
         .removeClass("btn-secondary");
         //.append(`<span class="plus icon-mel-close"></span>`);
         if (kolab_event_dialog_element.footer.buttons.exit.find(".plus").length === 0)
            kolab_event_dialog_element.footer.buttons.exit.append(`<span class="plus icon-mel-close"></span>`);

        // ${event.from === "barup" ? '' : ""}
        if (event.from === "barup")
        {
            $('#mel-have-something-minified-main-create').remove();
            const func_minifier = () => {
                if ($('#mel-have-something-minified-main-create').length === 0 && $("#globallist").length === 0)
                {
                    let $qu = $('#button-create').append(`
                    <span id="mel-have-something-minified-main-create" class="badge badge-pill badge-primary" style="position: absolute;
                    top: -5px;
                    right: -5px;">•</span>
                    `);
    
                    if ($qu.css('position') !== 'relative') $qu.css('position', 'relative');
                }
            };
            // create_popUp.close();
            window.event_reduced = true;
            window.kolab_event_dialog_element.setBeforeTitle(`<a href=# title="${rcmail.gettext('back')}" class="icon-mel-undo mel-return mel-focus focus-text mel-not-link" onclick="delete window.event_saved;delete window.create_event;m_mp_reinitialize_popup(() => {$('iframe#kolabcalendarinlinegui').remove();window.kolab_event_dialog_element.removeBeforeTitle();})"><span class=sr-only>${rcmail.gettext('create_modal_back', plugin_text)}</span></a>`);
            window.kolab_event_dialog_element.haveReduced().on_click_minified = () => {
                window.event_reduced = true;
                window.kolab_event_dialog_element.close();
                func_minifier();
                if (isFromGlobalModal) $('#button-create').focus();
            };
            window.kolab_event_dialog_element.on_click_exit = () => {
                window.kolab_event_dialog_element.close();
                window.event_saved = false;
                window.create_event = false;
                window.event_reduced = false;
                window.kolab_event_dialog_element = null;

                if (isFromGlobalModal) $('#button-create').focus();
            };
            window.kolab_event_dialog_element.onClose(() => {
                if (window.event_reduced === false)
                {
                    window.event_saved = false;
                    window.create_event = false;
                    window.kolab_event_dialog_element = null;
                    $('#mel-have-something-minified-main-create').remove();
                }
                else {
                    window.event_reduced = true;
                    func_minifier();
                }

                if (isFromGlobalModal) $('#button-create').focus();
            });
        }
        else 
        window.kolab_event_dialog_element.onClose(() => {
            if (window.event_saved === true)
            {
                delete window.event_saved;
                delete window.create_event;
            }
        });
        

        window.kolab_event_dialog_element.autoHeight();
        window.kolab_event_dialog_element.onDestroy((globalModal) => {
            globalModal.contents.find("iframe").remove();  
        });



    // var sheet = window.document.styleSheets[0];
    // sheet.insertRule('.ui-datepicker .ui-state-default, .ui-datepicker.ui-widget-content .ui-state-default { color: black!important; }', sheet.cssRules.length);
     };
    
     if (window.cal)
     {
         cal.create_event_from_somewhere = rcube_calendar.prototype.create_event_from_somewhere;
     }

     rcube_calendar.change_calendar_date = async function (jquery_element, add, where = null)
     {
         if (rcmail.busy)
            return;

         const config = {
            add_day_navigation:false,
            add_create:false,
            add_see_all:false
        };

         rcmail.set_busy(true, "loading");
         let date = moment(jquery_element.data("current-date"));

         if (date === null || date === undefined || date === "")
            date = moment();

         date = date.add(add, "d").startOf("day");
         rcube_calendar.mel_metapage_misc.SetCalendarDate(jquery_element, date);

         //const storage = mel_metapage.Storage.get(mel_metapage.Storage.calendar_by_days);

         const array = await rcube_calendar.block_change_date(jquery_element, add, where, date);



         if (array !== false)
         {
            const html = await html_helper.Calendars({datas:array,config:config, _date:date, get_only_body:true});
            rcube_calendar.mel_metapage_misc.GetAgenda(jquery_element).html(html);
            jquery_element.data("current-date", date.format());

            if (!!html_helper.Calendars.$jquery_array) {
                const $jquery_array = html_helper.Calendars.$jquery_array;

                html_helper.Calendars.$jquery_array = undefined;

                let $ul = rcube_calendar.mel_metapage_misc.GetAgenda(jquery_element).find('ul');

                if ($ul.length === 0) $ul = rcube_calendar.mel_metapage_misc.GetAgenda(jquery_element);

                $ul.html($jquery_array);
            }
         }

         rcmail.set_busy(false);
         rcmail.clear_messages();

     }

     rcube_calendar.block_change_date = async function (jquery_element, add, where = null, _date = null)
     {
        //const SetCalendarDate = rcube_calendar.mel_metapage_misc.SetCalendarDate;
        const GetAgenda = rcube_calendar.mel_metapage_misc.GetAgenda;
        const check = (x, item) => {x.uid === item.uid};
        //  const before = "ws#";
        //  const uid = rcmail.env.current_workspace_uid;
        //  const id = before + uid;
         const date = _date === null ? moment(jquery_element.data("current-date")).add(add, "d").startOf("day") : _date;
         //SetCalendarDate(jquery_element, date);
         if (jquery_element !== null)
            var querry = GetAgenda(jquery_element).html('<center><span class="spinner-border"></span></center>');

         const datas = await mel_metapage.Functions.update_calendar(date, moment(date).endOf("day"));

         let events = where === null || where === undefined ? JSON.parse(datas) : Enumerable.from(JSON.parse(datas)).where(where).toArray();
         //console.log("change_calendar_date",events, JSON.parse(datas));
         if (events !== null || events.length !== 0)
         {
             let element;
             let tmp;
             let array = [];
             let elementsToDelete = [];

             const parse = cal && cal.parseISO8601 ? cal.parseISO8601 : (item) => item;

             for (let index = 0; index < events.length; index++) {
                 element = events[index];
                 if (element.allDay)
                     element.order = 0;
                 else
                     element.order = 1;
                 tmp = mel_metapage.Functions.check_if_calendar_valid(element, events, false);
                 if (tmp === true)
                 {
                     const s = moment(element.start);
                     const e = moment(element.end);
                     const tmp_bool = (element.recurrence !== undefined || element.recurrence !== null) &&
                     s < date && e < date && element._instance === undefined;

                     if (tmp_bool)
                        tmp = element;
                     else if (e < date || s.startOf("day") > date.startOf("day"))
                        tmp = element;
                    else if (element.allDay)
                    {
                        element.end = moment(parse(element.end)).startOf("day");
                        if (element.end.format("YYYY-MM-DD HH:mm:ss") == date.format("YYYY-MM-DD HH:mm:ss") && moment(element.start).startOf("day").format("YYYY-MM-DD HH:mm:ss") != element.end.format("YYYY-MM-DD HH:mm:ss"))
                            tmp = element;
                        else
                            element.end = element.end.format();
                    }
                 }

                 if (tmp === true)
                     array = Array.AddIfExist(array, check, element);
                 else if (tmp !== false)
                     elementsToDelete.push(tmp);

             }
             //console.log(array);
             events = Enumerable.from(array).where(x => !elementsToDelete.includes(x)).orderBy(x => x.order).thenBy(x => moment(x.start)).toArray();
             //setup_calendar(array, querry, date);
         }


         if (events === null || events.length === 0)
         {
            let _html;
            if (date === moment().startOf("day"))
                _html = rcmail.gettext('no_events_today', plugin_text);
            else
                _html = rcmail.gettext('no_events_this_day', plugin_text);
            if (jquery_element !== null)
            {
                querry.html(_html);
                return false;
            }
            else
                return _html;
         }
         else
            return events;
     }

     rcube_calendar.mel_metapage_misc = {
        SetCalendarDate: function (jquery_element,date = null)
        {
            const now = date === null ? moment() : date;
            jquery_element.html(rcube_calendar.mel_metapage_misc.GetDate(now)).data("current-date", now);
        },
        GetParent: function(jquery_element)
        {
            return rcube_calendar.mel_metapage_misc.GetAgenda(jquery_element).parent();
        },
        GetAgenda : function (jquery_element)
        {
            return  jquery_element.parent().parent().parent().find(".block-body");
        },
        GetDate: function (momentObject)
        {
            return rcube_calendar.mel_metapage_misc.GetDateFr(momentObject.format("dddd DD MMMM"));
        },
        GetDateFr:function (date)
        {
            const capitalize = (s) => {
                if (typeof s !== 'string') return ''
                s = s.toLowerCase();
                return s.charAt(0).toUpperCase() + s.slice(1)
            }
            const arrayTransform = {
                "MONDAY":"LUNDI",
                "TUESDAY":"MARDI",
                "WEDNESDAY":"MERCREDI",
                "THURSDAY":"JEUDI",
                "FRIDAY":"VENDREDI",
                "SATURDAY":"SAMEDI",
                "SUNDAY":"DIMANCHE",
                "JANUARY":"JANVIER",
                "FEBRUARY":"FÉVRIER",
                "MARCH":"MARS",
                "APRIL":"AVRIL",
                "MAY":"MAI",
                "JUNE":"JUIN",
                "JULY":"JUILLET",
                "AUGUST":"AOÛT",
                "SEPTEMBER":"SEPTEMBRE",
                "OCTOBER":"OCTOBRE",
                "NOVEMBER":"NOVEMBRE",
                "DECEMBER":"DECEMBRE"
            }
            date = date.toUpperCase();
            for (const key in arrayTransform) {
                if (Object.hasOwnProperty.call(arrayTransform, key)) {
                    const element = arrayTransform[key];
                    if (date.includes(key))
                        date = date.replace(key, element);
                }
            }
            return capitalize(date);
        },
        CapitalizeMonth: function (date, monthIndex = 1)
        {
            const capitalize = (s) => {
                if (typeof s !== 'string') return ''
                s = s.toLowerCase();
                return s.charAt(0).toUpperCase() + s.slice(1)
            }
            return Enumerable.from(date.split(" ")).select((x, i) => i === monthIndex ? capitalize(x) : x).toArray().join(" ");
        }

     }

    /**
     * Ouvre la fenêtre qui permet de créer un évènement.
     */
    rcube_calendar.mel_create_event = function()
    {
        const format = "DD/MM/YYYY HH:mm";
        const getDate = function(string)
        {
            string = string.split(" ");
            const date = string[0].split("/");
            const time = string[1].split(":");

            return new moment(`${date[2]}-${date[1]}-${date[0]}T${time[0]}:${time[1]}:00`);
        }

        var create_popUp = new GlobalModal();

        create_popUp = window.create_popUp;

            if (create_popUp === undefined)
                create_popUp = new GlobalModal();

        create_popUp.editTitle("Créer une réunion (étape 1/2)");
        create_popUp.editBody("<center><span class=spinner-border></span></center>");
        mel_metapage.Functions.get(mel_metapage.Functions.url("mel_metapage", "get_event_html"), mel_metapage.Symbols.null, (datas) => {
            create_popUp.editBody(datas);
            create_popUp.contents.find(".input-mel-datetime").datetimepicker({
                format: 'd/m/Y H:i',//'Y/m/d H:i',
                onChangeDateTime:() => {
                    let querry = $(".input-mel-datetime.end");
                    const end_val = getDate(querry.val());
                    const start_val = getDate($(".input-mel-datetime.start").val());
                    if (end_val === "" || end_val === undefined || end_val === null || end_val <= start_val)
                    querry.val(getDate($(".input-mel-datetime.start").val()).add(1,"h").format(format) );
                }
                    });
            create_popUp.contents.find(".input-mel-datetime.start").val(moment().format(format));
            create_popUp.contents.find(".input-mel-datetime.end").val(moment().add(1,"h").format(format));
            create_popUp.contents.find(".input-mel-datetime.audio").val(moment().add(30,"m").format(format));
            create_popUp.contents.find(".form-check-input.event-mode").on("click", (e) => {
                e = e.target;
                create_popUp.contents.find(".content.event-mode").css("display", "none");
                create_popUp.contents.find(`.${e.id}`).css("display", "");
            });
            create_popUp.contents.find("#eb-mm-all-day").on("click", (e) => {
                e = e.target;
                if (e.checked)
                {
                    create_popUp.contents.find(".input-mel-datetime.start").addClass("disabled").attr("disabled", "disabled"); 
                    create_popUp.contents.find(".input-mel-datetime.end").addClass("disabled").attr("disabled", "disabled"); 
                    create_popUp.contents.find(".input-mel-datetime.start").val(moment().startOf("day").format(format));
                    create_popUp.contents.find(".input-mel-datetime.end").val(moment().endOf("day").format(format));
                }
                else
                {
                    create_popUp.contents.find(".input-mel-datetime.start").removeClass("disabled").removeAttr("disabled"); 
                    create_popUp.contents.find(".input-mel-datetime.end").removeClass("disabled").removeAttr("disabled"); 
                }
            })
            create_popUp.footer.querry.html(`
            <div style="margin-top:0" class="mel-button invite-button create" onclick="">
                <span>Continuer</span>
                <span class="icofont-arrow-right  plus" style="margin-left: 15px;"></span>
            </div>
            `)
            create_popUp.show();
        });
    }

    rcube_calendar.is_desc_webconf = function(text)
    {
    return text.includes('@visio') || rcube_calendar.is_desc_bnum_webconf(text) || rcube_calendar.is_desc_frame_webconf(text);
    };

    rcube_calendar.is_desc_bnum_webconf = function(text)
    {
    return text.includes('#visio') || text.includes('public/webconf');
    };

    rcube_calendar.is_desc_frame_webconf = function(text)
    {
        return text.includes(rcmail.env["webconf.base_url"])
    };

    rcube_calendar.is_valid_for_bnum_webconf = function(text)
    {
        return rcube_calendar.is_desc_frame_webconf(text) || rcube_calendar.is_desc_bnum_webconf(text);
    }

    Object.defineProperty(rcube_calendar, 'newline_key', {
        enumerable: false,
        configurable: false,
        writable: false,
        value:newline
    });

    Object.defineProperty(rcube_calendar, 'old_newline_key', {
        enumerable: false,
        configurable: false,
        writable: false,
        value:'{mel.newline}'
    });

    rcube_calendar.number_waiting_events = function (events = [], get_number = true)
    {
        const user = (top ?? window).rcmail.env.email?.toUpperCase?.();
        let numbers = (get_number ? 0 : []);

        for (const key in events) {
            if (Object.hasOwnProperty.call(events, key)) {
                const element = events[key];

                if (Array.isArray(element)) 
                {
                    if (get_number) numbers += rcube_calendar.number_waiting_events(element, get_number);
                    else numbers = numbers.concat(rcube_calendar.number_waiting_events(element, get_number));
                }
                else if (!!element?.attendees && element.attendees.length > 0)
                {
                    if (Enumerable.from(element.attendees).any(x => x.email.toUpperCase() === user && x.status === 'NEEDS-ACTION'))
                    {
                        if (get_number) ++numbers;
                        else numbers.push(element);
                    }
                }
            }
        }

        return numbers;
    }

    rcube_calendar.get_number_waiting_events = function(get_number = true) {
        const events_key = mel_metapage.Storage.calendar_by_days;

        if (get_number)
        {
            const key = mel_metapage.Storage.calendars_number_wainting;

            let number = mel_metapage.Storage.get(key);

            if (!mel_metapage.Storage.exists(number))
            {
                const events = mel_metapage.Storage.get(events_key);
                number = rcube_calendar.number_waiting_events(mel_metapage.Storage.exists(events) ? events : []);
                mel_metapage.Storage.set(number);
            }

            return number;
        }
        else 
        {
            const events = mel_metapage.Storage.get(events_key);
            return rcube_calendar.number_waiting_events(mel_metapage.Storage.exists(events) ? events : [], get_number);
        } 
    };

});




