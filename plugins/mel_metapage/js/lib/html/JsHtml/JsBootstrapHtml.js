import { JsHtml } from "./JsHtml.js";
export { JsHtml }

JsHtml.create_alias('row', {
    after_callback(html) {
        return html.addClass('row');
    }
});

JsHtml.create_alias('column', {
    after_callback(html, md, ...args) {
        if (typeof md === 'number') html = html.addClass(`col-${md}`);
        else if (args.length > 0) html = html.addClass(`col-${args[0]}`);

        return html
    }
});

function create_col(number) {
    JsHtml.create_alias(`col_${number}`, {
        generate_callback(html, ...args) {
            const [attribs, md] = args;
            return html.column(attribs, number);
        }
    });
}

for (let index = 1; index <= 12; ++index) {
    create_col(index);    
}