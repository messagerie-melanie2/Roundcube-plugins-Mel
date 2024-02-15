

document.addEventListener('DOMContentLoaded', function() {
    if (!$("html").hasClass("framed")) $('#workspace-calendar').css("height", 'calc(100% - 60px)');
    else $('#workspace-calendar').css("height", '100%');
    var settings = $.extend(rcmail.env.calendar_settings, rcmail.env.libcal_settings);
    //console.log(settings);
    var fullcalendar_defaults = {
        theme: false,
        // //aspectRatio: 1,
        height:"auto",
        timezone: false,  // will treat the given date strings as in local (browser's) timezone
        monthNames: settings.months,
        monthNamesShort: settings.months_short,
        dayNames: settings.days,
        dayNamesShort: settings.days_short,
        weekNumbers: settings.show_weekno > 0,
        weekNumberTitle: rcmail.gettext('weekshort', 'calendar') + ' ',
        firstDay: settings.first_day,
        firstHour: settings.first_hour,
        slotDuration: {minutes: 60/settings.timeslots},
        businessHours: {
          start: settings.work_start + ':00',
          end: settings.work_end + ':00'
        },
        scrollTime: "0" + settings.work_start + ':00:00',
        views: {
          list: {
            titleFormat: settings.dates_long,
            listDayFormat: settings.date_long,
            visibleRange: function(currentDate) {
              return {
                start: currentDate.clone(),
                end: currentDate.clone().add(settings.agenda_range, 'days')
              }
            }
          },
          month: {
            columnFormat: 'ddd', // Mon
            titleFormat: 'MMMM YYYY',
            eventLimit: 4
          },
          monthWork: {
            columnFormat: 'ddd', // Mon
            titleFormat: 'MMMM YYYY',
            eventLimit: 4,
            hiddenDays: [0, 6]
          },
          agendaWork: {
            columnFormat: 'ddd ' + settings.date_short, // Mon 9/7
            titleFormat: settings.dates_long,
            hiddenDays: [0, 6]
          },
          week: {
            columnFormat: 'ddd ' + settings.date_short, // Mon 9/7
            titleFormat: settings.dates_long
          },
          day: {
            columnFormat: 'dddd ' + settings.date_short,  // Monday 9/7
            titleFormat: 'dddd ' + settings.date_long
          }
        },
        timeFormat: settings.time_format,
        slotLabelFormat: settings.time_format,
        defaultView: rcmail.env.view || settings.default_view,
        allDayText: rcmail.gettext('all-day', 'calendar'),
        buttonText: {
          today: settings['today'],
          day: rcmail.gettext('day', 'calendar'),
          week: rcmail.gettext('week', 'calendar'),
          agendaWork: rcmail.gettext('work', 'calendar'),
          month: rcmail.gettext('month', 'calendar'),
          monthWork: rcmail.gettext('monthWork', 'calendar'),
          list: rcmail.gettext('agenda', 'calendar')
        },
        buttonIcons: {
         prev: 'left-single-arrow',
         next: 'right-single-arrow'
        },
        nowIndicator: (settings.time_indicator === 1 ? true : false),
      };

    var calendarEl = $('#workspace-calendar');
    var calendar = new FullCalendar.Calendar(calendarEl, fullcalendar_defaults);
    calendar.render();
  });