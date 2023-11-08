import { MaterialIcon } from "../../../icons.js";
export {HtmlCustomTag, BnumHtmlIcon, BnumHtmlSrOnly};

class HtmlCustomTag extends HTMLElement {
    constructor() {
        super();
    }
}

class BnumHtmlIcon extends HtmlCustomTag {
    constructor() {
        super();
        if (!this.classList.contains(MaterialIcon.html_class)) this.classList.add(MaterialIcon.html_class);

        if (!!this.dataset['icon']) this.appendChild(document.createTextNode(this.dataset['icon']));
    }
}

class BnumHtmlSrOnly extends HtmlCustomTag {
    constructor() {
        super();

        const sr_only = 'sr-only';

        if (!this.classList.contains(sr_only)) this.classList.add(sr_only);
    }
}