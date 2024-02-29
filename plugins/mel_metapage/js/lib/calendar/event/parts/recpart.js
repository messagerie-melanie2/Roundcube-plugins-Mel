import { FakePart, Parts } from "./parts.js";

/** $("#edit-recurrence-frequency").val(e.target.value);
  $("#edit-recurrence-frequency").change(); */

export class RecPart extends FakePart {
    constructor(original, fake) {
        super(original, fake, Parts.MODE.change);
    }

    init(event) {

    }

    onUpdate(val) {
        this._$field.val(val).change();
    }

    onChange(e) {
        this.onUpdate(e.currentTarget.value);
    }
}