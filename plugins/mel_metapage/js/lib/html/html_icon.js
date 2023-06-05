export {BaseIconHtml, MaterialSymbolHtml, MainIconHtml};
import { Icon, MaterialIcon } from "../icons";

class BaseIconHtml extends mel_html2 {
    constructor(icon_class, attribs = {}) {
        super('span', {attribs});
        this.icon = icon_class;
    }

    generate(additionnal_attribs = {}) {
        let $element = new Icon(this.icon, null).get(this.attribs).generate(additionnal_attribs);

        $element = this.bind_events($element);

        return this;
    }
}

class MaterialSymbolHtml extends mel_html2 {
    constructor(icon_class, attribs = {}, {fill_on_hover = false}) {
        super('span', {attribs});
        this.icon = icon_class;

        if (fill_on_hover) {
            this.attribs['fill-on-hover'] = true;
        }
    }

    generate(additionnal_attribs = {}) {

        if (!!this.attribs['fill-on-hover'] || !!additionnal_attribs['fill-on-hover']) {
            if (!this.hasClass('fill-on-hover')) this.addClass('fill-on-hover');
        }

        let $element = new MaterialIcon(this.icon, null).get(this.attribs).generate(additionnal_attribs);

        $element = this.bind_events($element);

        return this;
    }
}

const MainIconHtml = MaterialSymbolHtml;