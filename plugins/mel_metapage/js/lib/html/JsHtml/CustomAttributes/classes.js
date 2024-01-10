import { MaterialIcon } from "../../../icons.js";
export {HtmlCustomTag, BnumHtmlIcon, BnumHtmlSrOnly, BnumHtmlSeparate, BnumHtmlFlexContainer, BnumHtmlCenteredFlexContainer};

class HtmlCustomTag extends HTMLElement {
    constructor() {
        super();
    }
}

class BnumHtmlIcon extends HtmlCustomTag {
    constructor() {
        super();

        if (!this.getAttribute('class')) this.setAttribute('class', BnumHtmlIcon.HTML_CLASS);

        if (!this.classList.contains(BnumHtmlIcon.HTML_CLASS)) this.classList.add(BnumHtmlIcon.HTML_CLASS);

        if (!!this.dataset['icon']) this.appendChild(document.createTextNode(this.dataset['icon']));
    }
}

BnumHtmlIcon.HTML_CLASS = MaterialIcon.html_class;

class BnumHtmlSrOnly extends HtmlCustomTag {
    constructor() {
        super();

        const sr_only = 'sr-only';

        if (!this.classList.contains(sr_only)) this.classList.add(sr_only);
    }
}

class BnumHtmlSeparate extends HtmlCustomTag {
    constructor() {
        super();
    }
}

class BnumHtmlFlexContainer extends HtmlCustomTag {
    constructor() {
        super();

        this.style.display = 'flex';
    }
}

class BnumHtmlCenteredFlexContainer extends BnumHtmlFlexContainer {
    constructor() {
        super();

        this.style.justifyContent = 'center';
    }
}