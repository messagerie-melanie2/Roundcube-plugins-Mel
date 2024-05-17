import { DialogPage } from "../../../../mel_metapage/js/lib/classes/modal";
import { DATE_FORMAT, DATE_HOUR_FORMAT, DATE_TIME_FORMAT } from "../../../../mel_metapage/js/lib/constants/constants.dates.js";
import { FilterBase } from "../../../js/lib/filter_base";
import { ResourcesBase } from "../../../js/lib/resource_base.js";

/**
 * 
 * @param {DialogPage} page 
 * @param {FilterBase[]} filters 
 * @param {ResourcesBase} resource 
 * @returns {DialogPage}
 */
function get_page(page, filters, resource) {
    const date = (resource.start ?? moment().startOf('day'));
    const end_date = (resource.end ?? moment());

    page
    .start_update_content({ force_restart: true })
    .div({ style:'margin:10px' })
        .div({ class: 'rc-page-filters row' })
            .each((jhtml, filter) => {
                return jhtml.add_child(filter);
            }, ...filters)
        .end()
        .div({ class: 'rc-page-cal', fullcalendar: true }).css('height', '210px')
        .end()
        .div({ class: 'rc-page-params' })
            .row()
                .col_6().css('flex-wrap', 'unwrap').css('display', 'flex')
                    .div()
                        .icon('schedule').end()
                    .end()
                    .input_text({ datepicker: true, value:date.format(DATE_FORMAT) })
                    .input_time({ value:date.format(DATE_HOUR_FORMAT) })
                .end()
                .col_6()
                    .div({ class:'custom-control custom-switch' })
                        .input_checkbox({ id:'rc-allday', name: 'allday', value:'1', class:'pretty-checkbox before-margin-right form-check-input custom-control-input' }).removeClass('form-control')
                        .label({ for:'rc-allday', class:'custom-control-label' }).text('All day').end()
                    .end()
                .end()
            .end()
            .row()
                .col_6().css('flex-wrap', 'unwrap').css('display', 'flex')
                    .div()
                        .icon('schedule').css('opacity', 0).end()
                    .end()
                    .input_text({ datepicker: true, value:end_date.format(DATE_FORMAT) })
                    .input_time({ value:end_date.format(DATE_HOUR_FORMAT) })
                .end()
                .col_6()
                .end()
            .end()
        .end()
    .end();

    
    return page;
}

export const template_resource = {
    get_page
};