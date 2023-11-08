import { BnumHtmlIcon, BnumHtmlSrOnly, HtmlCustomTag } from "./CustomAttributes/classes.js";
import { JsHtml } from "./JsHtml.js";
export { JsHtml };


JsHtml.create_custom_tag =  function (name, {
    already_existing_class = null,
    one_line = false,
    generate_callback = null,
    extend = null
}) {
    const tag = `bnum-${name}`;
    if (!customElements.get(tag)) {
        let config = {};

        if (!!extend) config.extends = extend;

        customElements.define(tag, already_existing_class ?? HtmlCustomTag, config);

        JsHtml.create_alias(name.replaceAll('-', '_'), {
            tag,
            generate_callback,
            online:one_line,
        });

        return true;
    }

    return false;
};

JsHtml.create_custom_tag('icon', {
    already_existing_class:BnumHtmlIcon,
});

JsHtml.update('icon', function(self, old, icon, attribs = {}) {

    if (typeof icon !== 'string') {
        attribs = icon;
        icon = null;
    }

    let html =  old.call(self, attribs);//.attr('data-icon', icon);

    if (!!icon) {
        html = html.attr('data-icon', icon);
    }

    return html;
});

JsHtml.create_custom_tag('screen-reader', {
    already_existing_class:BnumHtmlSrOnly
});

JsHtml.extend('sr', function (attribs = {}) {
    return this.screen_reader(attribs);
});