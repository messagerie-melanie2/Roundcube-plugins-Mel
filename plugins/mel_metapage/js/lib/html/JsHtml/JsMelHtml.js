import { JsHtml } from "./JsHtml.js";
export { JsHtml }

JsHtml.update('input', function (self, old, attribs = {}) {
    let html = old.call(self, attribs);
    html.childs[html.childs.length - 1].addClass('form-control').addClass('input-mel');
    return html;
});

JsHtml.update('select', function (self, old, attribs = {}) {
    let html = old.call(self, attribs);
    return html.addClass('form-control').addClass('input-mel');
});

JsHtml.update('textarea', function (self, old, attribs = {}) {
    let html = old.call(self, attribs);
    return html.addClass('form-control').addClass('input-mel');
});

JsHtml.update('button', function (self, old, attribs = {}) {
    let html = old.call(self, attribs);
    return html.addClass('mel-button').addClass('no-button-margin').addClass('no-margin-button');
});