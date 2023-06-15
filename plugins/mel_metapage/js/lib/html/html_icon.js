export {BaseIconHtml, MaterialSymbolHtml, MainIconHtml};
import { Icon, MaterialIcon } from "../icons.js";

class BaseIconHtml extends mel_html2 {
    constructor(icon_class, attribs = {}) {
        super('span', {attribs});
        this.icon = icon_class;
    }

    generate(additionnal_attribs = {}) {
        let $element = new Icon(this.icon, null).get(this.attribs).generate(additionnal_attribs);

        $element = this.bind_events($element);

        return $element;
    }
}

class MaterialSymbolHtml extends mel_html2 {
    constructor(icon_class, attribs = {}, {fill_on_hover = false}) {
        super('span', {attribs});
        this.icon = icon_class;

        if (fill_on_hover) {
            this.attribs[MaterialSymbolHtml.get_attrib_fill_on_hover()] = true;
        }
    }

    generate(additionnal_attribs = {}) {
        const class_fill_on_hover = MaterialSymbolHtml.get_class_fill_on_hover();
        const attrib_class_fill_on_hover = MaterialSymbolHtml.get_attrib_fill_on_hover();

        if (!!this.attribs[attrib_class_fill_on_hover] || !!additionnal_attribs[attrib_class_fill_on_hover]) {
            if (!this.hasClass(class_fill_on_hover)) this.addClass(class_fill_on_hover);
        }

        let $element = new MaterialIcon(this.icon, null).get(this.attribs).generate(additionnal_attribs);

        $element = this.bind_events($element);

        return $element;
    }

    static get_attrib_fill_on_hover() {
        return this.get_class_fill_on_hover();
    }

    static get_class_fill_on_hover() {
        return 'fill-on-hover';
    }
}

const MainIconHtml = MaterialSymbolHtml;