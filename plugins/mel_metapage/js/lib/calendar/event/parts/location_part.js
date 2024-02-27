import { MelEnumerable } from "../../../classes/enum.js";
import { EMPTY_STRING } from "../../../constants/constants.js";
import { REG_URL } from "../../../constants/regexp.js";
import { MelHtml } from "../../../html/JsHtml/MelHtml.js";
import { BnumEvent } from "../../../mel_events.js";
import { Mel_Promise } from "../../../mel_promise.js";
import { CategoryPart } from "./categoryparts.js";

MelHtml.start.constructor.prototype.foreach = function() {
    return MelHtml.start;
};

MelHtml.extend('foreach', function(callback, ...items) {
    let self = this;
    for (const item of items) {
        self = callback(self, item);
    }

    return self;
});

/*
=> Location
=> Audio
=> Visio
==> Phone
 */
const LOCATION_SEPARATOR = String.fromCharCode('8199');

class IDestroyable {
    constructor() {}

    destroy() {}
}

class ALocationPart extends IDestroyable {
    constructor(location, index) {
        super()
        this.id;

        this.onchange = new BnumEvent();
        Object.defineProperty(this, 'id', {
            value: index,
            writable:false,
            configurable:false
        });

        this._init(location);
    }

    _init(location) {
        this.location = location;
    }

    option_value() {
        return this.constructor.OptionValue();
    }

    generate($parent) {
        return this;
    }

    static Has(location) {
        return false;
    }

    static OptionValue() {}

    static Max() {
        return 0;
    }
}

class VisioManager extends ALocationPart {
    /**
     * 
     * @param {*} location 
     * @param {*} index 
     * @param {CategoryPart} categoryPart 
     */
    constructor(location, index, categoryPart) {
        super(location, index);

        if ('' === location || IntegratedVisio.Has(location)) this._current = new IntegratedVisio(location, index, categoryPart);
        else this._current = new ExternalVisio(location, index);

        this._current.onchange.push(this._on_change_action.bind(this));
        this._on_change_action();

        this.categoryPart = categoryPart;

    }

    _init(location) {
        super._init(location);

        this._current = null;
        this._cached = {};

        Object.defineProperty(this, 'location', {
            get() { return this._current?.location ?? ''; }
        });
    }

    generate($parent) {
        super.generate($parent);

        let $tmp = MelHtml.start
        .div({class: 'location-mode', 'data-locationmode': this.option_value()})
            .select({id: `visio-${this.id}`, onchange: this._on_select_change.bind(this)})
                .option({value: IntegratedVisio.OptionValue()}).text(`event-${IntegratedVisio.OptionValue()}`).end()
                .option({value: ExternalVisio.OptionValue()}).text(`event-${ExternalVisio.OptionValue()}`).end()
            .end()
            .div({id: `visio-${this.id}-container`, class:'visio-container mt-2'})
            .end()
        .end().generate().appendTo($parent);

        $tmp.find('select').val(this._current.option_value());

        this._current.generate($tmp.find('.visio-container'));

        return this;
    }

    async wait() {
        if (!!this._current.wait) await this._current.wait()
    }

    _on_select_change(event) {
        const val = $(event.currentTarget).val();

        $('.visio-mode').css('display', 'none');

        this._cached[this._current.option_value()] = this._current;

        if (!!this._cached[val]) {
            this._current = this._cached[val];
            this._cached[val] = null;
        }
        else 
        {
            this._current = new ([IntegratedVisio, ExternalVisio].find(x => x.OptionValue() === val))('', this.id, this.categoryPart).generate($(`#visio-${this.id}-container`));
            this._current.onchange.push(this._on_change_action.bind(this));
        }

        this._on_change_action();
    }

    _on_change_action() {
        this.onchange.call();
    }

    destroy() {
        this._current = this._current.destroy();

        for (const iterator of Object.keys(this._cached)) {
            this._cached[iterator]?.destroy?.();
        }

        this._cached = null;
        this.categoryPart = null;
    }

    static Has(location) {
        return IntegratedVisio.Has(location) || ExternalVisio.Has(location)
    }

    static OptionValue() {
        return 'visio';
    }

    static Max() {
        return 1;
    }
}

class AVisio extends ALocationPart {
    constructor(location, index) {
        super(location, index, null);
    }
}

class IntegratedVisio extends AVisio {
    /**
     * 
     * @param {*} location 
     * @param {*} index 
     * @param {CategoryPart} categoryPart 
     */
    constructor(location, index, categoryPart) {
        super(location, index);

        this._room;

        Object.defineProperty(this, 'location', {
            get:() => { 
                let config = {
                    _key:location
                };

                if (categoryPart._$fakeField.val().includes('ws#')) {
                    config['_wsp'] = categoryPart._$fakeField.val().replace('ws#', '');
                }

                if (!!(this._pass || false)) config['_pass'] = this._pass;

                return `${mel_metapage.Functions.public_url('webconf', config)} ${this.get_phone()}`; 
            },
            set:(value) => location = value 
        });

        Object.defineProperty(this, '_room', {
            get() { 
                return location;
            },
        });

        const link = WebconfLink.create({location});
        this.location = link.key;
        this._pass = link.pass ?? '';

        if (this._pass.includes(' ('))
        {
            let split = this._pass.split(' (');
            this._pass = split[0];
            split = split[1].split(' | ');
            this._phone = split[0];
            this._pin = split[1].replace(')', '');
        }
    }

    _init(location) {
        super._init(location);
        this._last_room = '';
        this._pass = '';
        this._phone = '';
        this._pin = '';
        this._$div = null;
        this._current_promise = Mel_Promise.Resolved();
    }

    generate($parent) {
        super.generate($parent);

        this._$div = MelHtml.start
        .div({class: 'visio-mode', 'data-locationmode': this.option_value()})
            .row()
                .col_6({class:'d-flex pr-1'}).css('position:relative')
                    .icon('match_case', {class:'align-self-center'}).end()
                    .input_text({id: `integrated-${this.id}`, value:(this._room || mel_metapage.Functions.generateWebconfRoomName()), onchange: this._on_room_updated.bind(this)})
                    .icon('edit', {class:'event-mel-icon-absolute'}).end()
                .end()
                .col_6({class:'d-flex pl-1'})
                    .icon('lock', {class:'align-self-center'}).end()
                    .input_text({id: `integrated-pass-${this.id}`, value: this._pass, onchange:this._on_pass_updated.bind(this)})
                    .icon('add', {class:'event-mel-icon-absolute'}).end()
                .end()
            .end()
            .row({class:'mt-2'})
                .col_6({class:'d-flex pr-1'})
                    .icon('call', {class:'align-self-center'}).end()
                    .input_text({id: `integrated-phone-${this.id}`, value: this._phone}).disable()
                .end()
                .col_6({class:'d-flex pl-1'})
                    .icon('key', {class:'align-self-center'}).end()
                    .input_text({id: `integrated-key-${this.id}`, value: this._pin}).disable()
                .end()
            .end()
        .end().generate().appendTo($parent);

        this._on_room_updated({currentTarget: this._$div.find(`#integrated-${this.id}`)});
        this.onchange.call();
        return this;
    }

    async _on_room_updated(event) {
        event = $(event.currentTarget);

        this._last_room = this._room;
        this.location = event.val();

        if ('' !== this._room) {
            this.get_phone();
            await this.wait();
    
            this._$div.find(`#integrated-phone-${this.id}`).val(this._phone);
            this._$div.find(`#integrated-key-${this.id}`).val(this._pin);
        }
        else {
            const charCode = String.fromCharCode('9940');
            this._$div.find(`#integrated-phone-${this.id}`).val(charCode);
            this._$div.find(`#integrated-key-${this.id}`).val(charCode);
        }

        this.onchange.call();
    }

    _on_pass_updated(event) {
        event = $(event.currentTarget);

        this._pass = event.val();
        this.onchange.call();
    } 

    get_phone() {
        if (this._last_room !== this._room) 
        {
            this._last_room = this._room;
            const busy = rcmail.set_busy(true, 'loading');
            this._current_promise = new Mel_Promise(async (room) => {
                try {
                    const data = await webconf_helper.phone.get(room);
                    const {number, pin} = data;

                    this._phone = number;
                    this._pin = pin;
    
                    rcmail.set_busy(false, 'loading', busy);
                } catch (error) {
                    this._phone = 'XX-XX-XX-XX-XX';
                    this._pin = '0123456789';
                    rcmail.set_busy(false, 'loading', busy);
                }

                window.disable_x_roundcube = false;
            }, this._room);
        }

        if (this._current_promise.isPending()) return 'loading....';
        else return `(${this._phone} | ${this._pin})`;
    }

    destroy() {
        this._$div = null;
        this._current_promise = null;
    }

    async wait() {
        await this._current_promise;
    }

    static OptionValue() {
        return 'visio-internal';
    }

    static Has(location) {
        return !!(WebconfLink.create({location}).key || false)
    }
}

class ExternalVisio extends ALocationPart {
    constructor(location, index) {
        super(location, index);
    }

    _init(location) {
        super._init(location);

        Object.defineProperty(this, 'location', {
            get() { return location; },
            set:(value) => location = value 
        });
    }

    generate($parent) {
        super.generate($parent);

        MelHtml.start
        .div({class: 'visio-mode d-flex', 'data-locationmode': this.option_value()}).css('position', 'relative')
            .icon('link', {class:'align-self-center'}).end()
            .input_text({id: `external-${this.id}`, value: this.location, onchange: this._on_update.bind(this)})
            .icon('edit', {class:'event-mel-icon-absolute'}).end()
        .end().generate().appendTo($parent);
    

        return this;
    }

    _on_update(event) {
        event = $(event.currentTarget);
        const val = event.val();

        this.location = val;

        this.onchange.call();
    }

    static OptionValue() {
        return 'visio-external';
    }

    static Has(location) {
        return !IntegratedVisio.Has(location) && (location.includes('@visio') || location.match(new RegExp(REG_URL))); 
    }
}

class Phone extends ALocationPart {
    constructor(location, index) {
        super(location, index);

        if (location.includes(Phone.Url())) {
            let data = location.split(' : ')[1];
            const [phone, pin] = data.split(' - ');
            this._phone = phone;
            this._pin = pin || '';
        }
    }

    _init(location) {
        super._init(location);

        this._phone = '';
        this._pin = '';

        Object.defineProperty(this, 'location', {
            get:() => `${Phone.Url()} : ${this._phone} - ${this._pin}`
        });
    }

    generate($parent) {
        super.generate($parent);

        MelHtml.start
        .div({class: 'location-mode', 'data-locationmode': this.option_value()})
            .row()
                .a({class:'mel-button no-button-margin col-md-6', href: Phone.Url(), target: '_blank'}).css({display:'flex', 'align-items':'center', 'justify-content':'space-between'})
                    .text('Réserver une audio-conférence')
                    .icon('open_in_new').css('font-size', '21px').end()
                .end()
            .end()
            .row({class:'mt-2'})
                .div({class: 'col-md-6 d-flex pl-0 pr-1'})
                    .icon('call', {class:'align-self-center'}).end()
                    .input_text({id: `phone-${this.id}`, class:'field-phone', value: this._phone, onchange: this._on_update.bind(this)})
                .end()
                .div({class: 'col-md-6 d-flex pl-1 pr-0'})
                .icon('pin', {class:'align-self-center'}).end()
                    .input_text({id: `phone-pin-${this.id}`, class:'field-pin', value: this._pin, onchange: this._on_update.bind(this)})
                .end()
            .end('row')
        .end().generate().appendTo($parent);
    

        return this;
    }

    _on_update(event) {
        event = $(event.currentTarget);
        const val = event.val();

        if (event.hasClass('field-phone')) this._phone = val;
        else this._pin = val;

        this.onchange.call();
    }

    static Has(location) {
        return location.includes(this.Url());
    }

    static OptionValue() {
        return 'audio';
    }

    static Max() {
        return 1;
    }

    static Url() {
        return rcmail.env.mel_metapage_audio_url;
    }
}

class Location extends ALocationPart {
    constructor(location, index) {
        super(location, index);
        this._$field = $(`#location-text-${index}`);
    }

    _init(location) {
        super._init(location);
    }

    generate($parent) {
        super.generate($parent);

        if (0 === this._$field.length) {
            this._$field = MelHtml.start
            .div({class: 'location-mode d-flex', 'data-locationmode': this.option_value()})
                .icon('location_on', {class:'align-self-center'}).end()
                .input({type: 'text', id: `location-text-${this.id}`, value: this.location, onchange: this._on_update.bind(this)})
            .end().generate().appendTo($parent);
        }

        return this;
    }

    _on_update(event) {
        const val = $(event.currentTarget).val();

        this.location = val;

        this.onchange.call();
    }

    static Has(location) {
        return !Phone.Has(location) && !VisioManager.Has(location);
    }

    static OptionValue() {
        return 'location';
    }

    static Max() {
        return Number.POSITIVE_INFINITY;
    }
}

export class LocationPartManager  {
    constructor($locations, $field, categoryPart) {
        this.locations = {};
        this._cached = {};

        this._$field = $field;
        this._$locations = $locations;
        this._category = categoryPart;
    }

    init(event) {
        let no_location = true;
        this._$locations.html('');

        if (!!(event.location || false)) {
            let location = event.location.split(LOCATION_SEPARATOR);

            for (const location_type of location) {
                for (const part of LocationPartManager.PARTS) {
                    if (part.Has(location_type)) {
                        if (no_location) no_location = false;

                        this.add(part, location_type);
                        break;
                    }
                }
            }
        }

        if (no_location) {
            this.add(Location, '');
        }
        else this._update_all_selects();
    }

    _generateIndex() {
        let index;
        let length = MelEnumerable.from(this.locations).count();
        do {
            index = !index ? length + 1 : index + 1;
        } while (!!this.locations[index]);

        return index;
    }

    /**
     * 
     * @param {ALocationPart} part 
     * @param {string} location 
     */
    add(part, location) {
        const id = this._generateIndex();
        //Generate_select
        let $generated = this._generate_select(id, part.OptionValue());
        //generate_part
        this.locations[id] = new part(location, id, this._category).generate($generated.find('.location-container'));
        this.locations[id].onchange.push(this._on_change_action.bind(this));
        //Link select link
        $generated.find('select').on('change', this._on_select_changed.bind(this));

        $generated = null;
    }

    remove(id) {
        $(`#location-${id}`).parent().parent().remove();
        this.locations[id].destroy();
        delete this.locations[id];

        for (const iterator of Object.keys(this._cached)) {
            this._cached[iterator]?.destroy?.();
            
        }
        delete this._cached[id];

        this._update_selects(id);
    }

    _on_select_changed(event) {
        const VISIBLE = '';

        let $select = $(event.target);
        let need_generate = false;
        const id = $select.data('id');
        const val = $select.val() || '';

        //On cache toutes les locations
        $(`#location-${id}-container .location-mode`).css('display', 'none').each((i, e) => {
            e = $(e);

            if (e.hasClass('d-flex')) e.removeClass('d-flex').addClass('has-d-flex');
        });

        //On affiche si celle qui est séléctionné si elle existe sinon on la génère
        if ($(`#location-${id}-container [data-locationmode="${val}"]`).length > 0) {
            let $querry = $(`#location-${id}-container [data-locationmode="${val}"]`).css('display', VISIBLE);

            if ($querry.hasClass('has-d-flex')) $querry.removeClass('has-d-flex').addClass('d-flex');

            $querry = null;
        }
        else need_generate = true;

        //On gère le cache. Tout les modes qui éxistent sont garder en mémoire.
        if (!this._cached[id]) this._cached[id] = {};
        this._cached[id][this.locations[id].option_value()] = this.locations[id]

        if (!!this._cached[id]?.[val]) {
            this.locations[id] = this._cached[id][val];
            this._cached[id][val] = null;
        }
        else {
            this.locations[id] = new (LocationPartManager.PARTS.find(x => x.OptionValue() === val))('', id, this._category).generate($(`#location-${id}-container`));
            this.locations[id].onchange.push(this._on_change_action.bind(this));
        }
        this._update_selects(id);
        this._on_change_action();
    }

    _update_selects(id){
        let $select;
        let $tmp;
        for (const iterator of $('.event-location-select')) {
            $select = $(iterator);

            for (const part of LocationPartManager.PARTS) {
                $tmp = $select.find(`option[value="${part.OptionValue()}"]`);
                if (MelEnumerable.from(this.locations).where(x => x.value.option_value() === part.OptionValue()).count() >= part.Max()) 
                {
                    $tmp.addClass('disabled').attr('disabled', 'disabled');
                }
                else $tmp.removeClass('disabled').removeAttr('disabled'); //$select.append($('<option>').val(part.OptionValue()).text(part.OptionValue()));
            }
            $select.removeClass('disabled').removeAttr('disabled'); 
            if ($select.data('id') !== id) {    
                const nb_infinity = MelEnumerable.from(LocationPartManager.PARTS).where(x => Number.POSITIVE_INFINITY === x.Max()).count();  
                const val = $select[0].value;

                if (1 === nb_infinity && 
                    nb_infinity === ($select.children().length - $select.find('.disabled').length) &&
                    MelEnumerable.from(LocationPartManager.PARTS).where(x => x.OptionValue() === val).first().Max() === Number.POSITIVE_INFINITY) 
                {
                    $select.addClass('disabled').attr('disabled', 'disabled');
                }
                else $select.removeClass('disabled').removeAttr('disabled'); 
            }
        }

        $select = null;
        $tmp = null;
    }

    _update_all_selects() {
        for (const iterator of Object.keys(this.locations)) {
            this._update_selects(iterator);
        }
    }

    _generate_select(id, selected) {
        const has_locations = MelEnumerable.from(this.locations).count() >= 1; 
        let html = MelHtml.start
        .div({class:(has_locations ? 'mt-2' : 'mel-placeholder-div')})
            .div({class: 'd-flex'})
                .select({id: `location-${id}`, class:'event-location-select', 'data-id': id})
                    .foreach((html, item) => {
                        let is_selected = false;
                        let is_disabled = true;
                        if (MelEnumerable.from(this.locations).where(x => x.value.option_value() === item.OptionValue()).count() < item.Max()) {
                            is_selected = item.OptionValue() === selected;
                            is_disabled = false;
                        }

                        html = html.option({value: item.OptionValue()}).attr((is_selected ? 'selected' : 'not_selected'), (is_selected ? 'selected' : 'not_selected')).text(rcmail.gettext(`event-location-${item.OptionValue()}`, 'mel_metapage'));

                        if (is_disabled) html = html.attr('disabled', 'disabled').addClass('disabled');

                        return html.end();
                    }, ...LocationPartManager.PARTS)
                .end()
                .button({type:'button', class:'no-background'}).removeClass('mel-button').removeClass('no-margin-button').removeClass('no-button-margin')
                    .attr('onclick', (e) => {
                        if ('delete' === $(e.currentTarget).children().first().html()) this.remove($(e.currentTarget).parent().find('select').data('id'));
                        else this.add(Location, '');
                    })
                    .icon(has_locations ? 'delete' : 'forms_add_on').css('vertical-align', 'middle').end()
                .end()
            .end()
            .div({id: `location-${id}-container`, class:'location-container mt-2'})
            .end()
        .end();

        return html.generate().appendTo(this._$locations);
    }

    async _on_change_action() {
        await this.waitComplete();
        let str = EMPTY_STRING;

        for (const id of Object.keys(this.locations)) {
            str += this.locations[id].location + LOCATION_SEPARATOR;
        }

        this._$field.val(str.slice(0, str.length - 1)).change();
    }

    async waitComplete() {
        await Promise.allSettled(MelEnumerable.from(this.locations).where(x => !!x.value.wait).select(x => x.value.wait()));
    }

}

LocationPartManager.PARTS = [
    Location,
    Phone,
    VisioManager,
]