import { MaterialIcon } from "../../../icons.js";
export {HtmlCustomTag, BnumHtmlIcon, BnumHtmlSrOnly, BnumHtmlSeparate, BnumHtmlFlexContainer, BnumHtmlCenteredFlexContainer};

/**
 * Conntient les webcomponents de base
 * @module WebComponents/Base
 * @local HtmlCustomTag
 * @local BnumHtmlIcon
 */

/**
 * @class
 * @classdesc Classe de base pour les éléments custom du bnum
 * @extends HTMLElement
 * @abstract
 */
class HtmlCustomTag extends HTMLElement {
    /**
     * A faire hériter
     */
    constructor() {
        super();
    }
}

/**
 * @class
 * @classdesc Gère la balise <bnum-icon>
 * @extends HtmlCustomTag
 */
class BnumHtmlIcon extends HtmlCustomTag {
    /**
     * Ajoute la classe `material-symbols-outlined` à la balise.
     * 
     * Gère l'icône via le texte à l'intérieur de la balise ou via le data `icon`.
     */
    constructor() {
        super();

        if (!this.getAttribute('class')) this.setAttribute('class', BnumHtmlIcon.HTML_CLASS);

        if (!this.classList.contains(BnumHtmlIcon.HTML_CLASS)) this.classList.add(BnumHtmlIcon.HTML_CLASS);

        if (!!this.dataset['icon']) this.appendChild(document.createTextNode(this.dataset['icon']));
    }
}

/**
 * @constant
 * @static
 * Classe qui sera ajouter à la balise <bnum-icon>
 * @default 'material-symbols-outlined'
 */
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