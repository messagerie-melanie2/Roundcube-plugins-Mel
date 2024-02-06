import { BnumEvent } from "../../../mel_events.js";
import { FakePart, Parts } from "./parts.js";

class GuestButton extends Parts {
    constructor($button) {
        super($button, Parts.MODE.click);
        this.clicked = new BnumEvent();
        this._state = false;
    }

    onUpdate(){
        this._state = !this._state;

        if (this._state) this._$field.find('span').html('expand_less');
        else this._$field.find('span').html('expand_more');
    }

    onClick(...args) {
        this.clicked.call(!this._state);
        this.onUpdate();
    }
}

export class GuestsPart extends FakePart{
    constructor($addInput, $neededInput, $optionalInput, $animatorsInput, $switchButton){
        super($addInput, $neededInput, Parts.MODE.change);
        this._$optionnals = $optionalInput;
        this._$animators = $animatorsInput;
        //this._switchButton = new GuestButton($switchButton);
    }

    init(event){
        // if (0 === this._switchButton.clicked.count()) {
        //     this._switchButton.clicked.push(this._on_switch.bind(this));
        // }

        this._add_focus_if_not_exist(this._$fakeField)
        ._add_focus_if_not_exist(this._$optionnals)
        ._add_focus_if_not_exist(this._$animators);
    }  

    _add_focus_if_not_exist($field) {
        if (!$._data($field[0], 'events' )?.focus) $field.on('focus', (e) => {
            $(`[data-linked="${$(e.currentTarget).attr('id')}"]`).addClass('forced-focus');
        });

        if (!$._data($field[0], 'events' )?.focusout) $field.on('focusout', (e) => {
            $(`[data-linked="${$(e.currentTarget).attr('id')}"]`).removeClass('forced-focus');
        });
        return this;
    }

    _on_switch(state) {
        if (state) {
            this._$fakeField.
            this._$optionnals.css('display', '');
            this._$animators.css('display', '');
        }
        else {
            this._$optionnals.css('display', 'none');
            this._$animators.css('display', 'none');    
        }
    }
}