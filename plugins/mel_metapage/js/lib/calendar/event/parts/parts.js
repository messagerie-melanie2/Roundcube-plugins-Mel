export class Parts {
    constructor($field, ...modes) {
        this._$field = $field;
        this._p_initField(modes);
    }

    onUpdate(new_value)  {
        throw "Abstract !";
    }

    onChange(...args)  {
        throw "Abstract !";
    }

    onClick(...args)  {
        throw "Abstract !";
    }

    onInput(...args)  {
        throw "Abstract !";
    }

    _p_get_field() {
        return this._$field;
    }

    _p_initField(modes) {
        let $field = this._p_get_field();

        if (!!$field) {
            for (const mode of modes) {
                switch (mode) {
                    case Parts.MODE.click:
                        if (!$._data($field[0], 'events' )?.click) $field.click(this.onClick.bind(this))
                        break;
    
                    case Parts.MODE.change:
                        if (!$._data($field[0], 'events' )?.change) $field.on('change', this.onChange.bind(this));
                        break;
    
                    case Parts.MODE.input:
                        if (!$._data($field[0], 'events' )?.input) $field.on('input', this.onInput.bind(this));
                        break;
                
                    default:
                        break;
                }
            }
        }

    }

}

export class FakePart extends Parts {
    constructor($fields, $fakeField, ...modes) {
        super($fields, ...modes);
        this._$fakeField = $fakeField;
        this._p_initField(modes);
    }

    init(event) {
        throw "Abstract !";
    }

    _p_get_field() {
        return this._$fakeField;
    }
}

Parts.MODE = {
    change:Symbol(),
    click:Symbol(),
    input:Symbol()
};