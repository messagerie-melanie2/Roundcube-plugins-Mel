import { FakePart, Parts } from "./parts.js";

/** $("#edit-recurrence-frequency").val(e.target.value);
  $("#edit-recurrence-frequency").change(); */

export class RecPart extends FakePart {
    constructor(original, fake) {
        super(original, fake, Parts.MODE.change);

        this._$fakeField.tooltip({
            content:() => this._$fakeField.attr('title') || this._$fakeField.attr('data-original-title')
        });
    }

    init(event) {
    }

    onUpdate(val) {
        this._$field.val(val).change();
    }

    onChange(e) {
        this.onUpdate(e.currentTarget.value);
    }

    destroy() {
        this._$fakeField.tooltip('destroy');
    }
}