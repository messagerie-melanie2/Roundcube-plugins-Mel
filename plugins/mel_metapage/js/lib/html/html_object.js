import { Classes } from "../mel.js";
import { MelObject } from "../mel_object.js";

export class mel_html_object extends Classes(mel_html2, MelObject) {
    constructor(tag, {attribs={}, contents=[], args=[]}) {
        super(tag, attribs, contents, args);

        this.main(tag, attribs, contents, args);
    }

    main(...args) {
        super.main(...args);

        const [tag, attribs, contents, otherArgs] = args;

        this.attribs = attribs;
        this._setup(contents);

        this._main(...otherArgs);
    }

    _main(...args) {}
}