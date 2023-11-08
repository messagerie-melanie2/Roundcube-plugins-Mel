import { JsHtml } from "./JsHtml.js";
export { JsHtml }

JsHtml.extend('_ext_input_tag', function (name, attribs = {}) {
    return this.input(attribs).attr('type', name);
});

function create_input_alias(name) {
    JsHtml.create_alias(name, {
        online:true,
        generate_callback:(html, attribs = {}) => {
            return html._ext_input_tag(name.replace('input_', '').replaceAll('_', '-'), attribs);
        }

    })
}

create_input_alias('input_button');
create_input_alias('input_checkbox');
create_input_alias('input_color');
create_input_alias('input_date');
create_input_alias('input_datetime_local');
create_input_alias('input_email');
create_input_alias('input_file');
create_input_alias('input_hidden');
create_input_alias('input_image');
create_input_alias('input_month');
create_input_alias('input_number');
create_input_alias('input_password');
create_input_alias('input_radio');
create_input_alias('input_reset');
create_input_alias('input_search');
create_input_alias('input_submit');
create_input_alias('input_tel');
create_input_alias('input_text');
create_input_alias('input_time');
create_input_alias('input_url');
create_input_alias('input_week');
