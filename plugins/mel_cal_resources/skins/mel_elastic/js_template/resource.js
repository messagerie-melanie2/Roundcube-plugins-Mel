import { DATE_FORMAT, DATE_HOUR_FORMAT } from '../../../../mel_metapage/js/lib/constants/constants.dates.js';
import { EMPTY_STRING } from '../../../../mel_metapage/js/lib/constants/constants.js';

/**
 * Récupère la page d'une ressource
 * @param {DialogPage} page Page qui doit recevoir le JsHtml
 * @param {FilterBase[]} filters Filtres à afficher
 * @param {ResourcesBase} resource Ressource à afficher
 * @returns {DialogPage}
 * @frommodulereturn Modal
 * @frommoduleparam Modal page
 * @frommoduleparam Resources/Filters filters {@linkto FilterBase}
 * @frommoduleparam Resources resource
 * @memberof Plugins.MelCalResource.exports.template_resource
 */
function get_page(page, filters, resource) {
    const date = (resource.start ?? moment().startOf('day'));
    const end_date = (resource.end ?? moment());

    page
    .start_update_content({ force_restart: true })
    .div({ style:'margin:10px' }).attr('data-resourcetype', resource._name)
        .div({ class: 'rc-page-filters row' })
            .each((jhtml, filter) => {
                return jhtml.add_child(filter);
            }, ...filters)
        .end()
        .row()
            .col_4().end()
            .col_4().css('text-align', 'center').css({ display:'flex', 'justify-content':'center', 'align-items':'center' })
                .h5({class:'fo-date'}).end()
            .end()
            .col_4().css('text-align', 'right')
                .div({class:'btn-group', role:'group', 'aria-label':'Changement de date'}).css('margin-bottom', '5px')
                    .button({ type:'button', onclick:() => {resource._$calendar.fullCalendar('prev'); resource.refresh_calendar_date();}  }).icon('chevron_left').end().end()
                    .button({ type:'button', onclick:() => {resource._$calendar.fullCalendar('today'); resource.refresh_calendar_date();} }).text('mel_cal_resources.today').end()
                    .button({ type:'button', onclick:() => {resource._$calendar.fullCalendar('next'); resource.refresh_calendar_date();}  }).icon('chevron_right').end().end()
                .end()
            .end()
        .end()
        .div({ class: 'rc-page-cal', fullcalendar: true }).css('height', '210px')
        .end()
        .div({ class: 'rc-page-params' })
            .row().css('margin-bottom', '5px')
                .col_6().css('flex-wrap', 'unwrap').css('display', 'flex')
                    .div().css('margin-right', '5px')
                        .icon('schedule').end()
                    .end()
                    .input_text({ class:'input-date-start', datepicker: true, value:date.format(DATE_FORMAT), onchange:resource._functions.on_date_start_changed }).css('margin-right', '5px')
                    .input_time({ class:'input-time-start', value:date.format(DATE_HOUR_FORMAT), onchange:resource._functions.on_time_start_changed }).css('display', resource.all_day ? 'none' : EMPTY_STRING).css('margin-right', '5px')
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
                        .label({ for:'rc-allday', class:'custom-control-label' }).text('all-day').end()
                    .end()
                .end()
            .end()
            .row()
                .col_6().css('flex-wrap', 'unwrap').css('display', 'flex')
                    .div().css('margin-right', '5px')
                        .icon('schedule').css('opacity', 0).end()
                    .end()
                    .input_text({ class:'input-date-end', datepicker: true, value:end_date.format(DATE_FORMAT), onchange:resource._functions.on_date_end_changed }).css('margin-right', '5px')
                    .input_time({ class:'input-time-end', value:end_date.format(DATE_HOUR_FORMAT), onchange:resource._functions.on_time_end_changed }).css('display', resource.all_day ? 'none' : EMPTY_STRING).css('margin-right', '5px')
                .end()
                .col_6()
                .end()
            .end()
        .end()
    .end();

    
    return page;
}

/**
 * Contient la page de ressource
 * @namespace
 * @memberof Plugins.MelCalResource
 */
export const template_resource = {
    get_page
};