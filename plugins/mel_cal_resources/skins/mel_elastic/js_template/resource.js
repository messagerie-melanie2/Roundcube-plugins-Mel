import { DialogPage } from "../../../../mel_metapage/js/lib/classes/modal";
import { DATE_FORMAT, DATE_HOUR_FORMAT, DATE_TIME_FORMAT } from "../../../../mel_metapage/js/lib/constants/constants.dates.js";
import { EMPTY_STRING } from "../../../../mel_metapage/js/lib/constants/constants.js";
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
                    .input_text({ class:'input-date-start', datepicker: true, value:date.format(DATE_FORMAT) })
                    .input_time({ class:'input-time-start', value:date.format(DATE_HOUR_FORMAT) }).css('display', resource.all_day ? 'none' : EMPTY_STRING)
                .end()
                .col_6()
                    .div({ class:'custom-control custom-switch' })
                        .input_checkbox({ id:'rc-allday', name: 'allday', value:'1', class:'pretty-checkbox before-margin-right form-check-input custom-control-input' }).removeClass('form-control')
                            .attr('onclick', (e) => {
                                e = $(e.currentTarget);

                                if (e.prop('checked')) {
                                    $('.input-time-start').css('display', 'none');
                                    $('.input-time-end').css('display', 'none');
                                }
                                else {
                                    $('.input-time-start').css('display', EMPTY_STRING);
                                    $('.input-time-end').css('display', EMPTY_STRING);
                                }

                                if (resource._$calendar) resource._$calendar.fullCalendar('refetchEvents');
                            }).attr(resource.all_day ? 'checked' : 'notallday', resource.all_day)
                        .label({ for:'rc-allday', class:'custom-control-label' }).text('All day').end()
                    .end()
                .end()
            .end()
            .row()
                .col_6().css('flex-wrap', 'unwrap').css('display', 'flex')
                    .div()
                        .icon('schedule').css('opacity', 0).end()
                    .end()
                    .input_text({ class:'input-date-end', datepicker: true, value:end_date.format(DATE_FORMAT) })
                    .input_time({ class:'input-time-end', value:end_date.format(DATE_HOUR_FORMAT) }).css('display', resource.all_day ? 'none' : EMPTY_STRING)
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