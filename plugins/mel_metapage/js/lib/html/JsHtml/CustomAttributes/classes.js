import { MaterialIcon } from "../../../icons.js";
export {HtmlCustomTag, BnumHtmlIcon};

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