let url = new URL(window.location.href);
let params = url.searchParams;
let appointment_duration = 0;
let owner_name = params.get('_name') ? window.atob(params.get('_name')) : '';
let response = null;
let calendar = null;
let current_datetimepicker_month = null;
let datetimepicker_fullcalendar = null;
let disabled_days = [];
let event_not_loaded = true;
moment.locale('fr');
$.datetimepicker.setLocale('fr');

document.addEventListener('DOMContentLoaded', function () {
  display_calendar_name();
  run();
  setInterval(() => {
    run_refresh();
  }, 600000);
});

function display_calendar_name() {
  document.title = 'Calendrier de ' + owner_name;
  if (owner_name.includes('-')) {
    owner_name = owner_name.split('-')
    
    document.getElementById('owner_calendar').textContent = owner_name[0];
    document.getElementById('owner_role').textContent = owner_name[1];
  }
  else {
    document.getElementById('owner_calendar').textContent = owner_name;
  }
}

function run() {
  const options = { method: 'GET', headers: { Accept: 'application/json' } };

  fetch(url.href.replace('fullcalendar/', 'fullcalendar/calendar.php/', options))
    .then(response => response.json())
    .then(data => {
      response = data;

      if (response.error) {
        $('#error_message').text(response.error);
        $('#error_message').show();
        $('#show-calendar').hide();
        return;
      }

      // Nom du calendrier
      if (response.calendar_name) {
        owner_name = response.calendar_name;
        display_calendar_name();
      }

      get_disabled_days(response);

      show_appointment_duration(response);

      add_appointment_place(response);

      add_appointment_reason(response)

      display_calendar(response);

      display_datetime_fullcalendar(response);
    })
    .catch(err => console.error(err))
}

function run_refresh() {
  const options = { method: 'GET', headers: { Accept: 'application/json' } };

  fetch(url.href.replace('fullcalendar/', 'fullcalendar/calendar.php/', options))
    .then(response => response.json())
    .then(data => {
      response = data;

      if (response.error) {
        $('#error_message').text(response.error);
        $('#error_message').show();
        $('#show-calendar').hide();
        return;
      }

      get_disabled_days(response);

      show_appointment_duration(response);

      add_appointment_place(response);

      add_appointment_reason(response);

      refresh_calendars();
    })
    .catch(err => console.error(err))
}

function get_disabled_days(response) {
  let empty = response.range.map(f =>
    Object.keys(f).filter(k => !("" + f[k]).trim()))
    .map((f, i) => ({ id: i, f: f.join(',') }))
    .filter(f => f.f)

  empty.forEach(element => {
    disabled_days.push(element.id)
  });
}

function show_appointment_duration(response) {
  if (response.time_select) {
    if (response.custom_time_select == 'h') {
      response.time_select = response.time_select * 60;
    }
    $('#appointment_duration').text(response.time_select)
    appointment_duration = parseInt(response.time_select);
  }
  else {
    appointment_duration = null;
  }
  document.getElementById('appointment_time').textContent = appointment_duration ? appointment_duration + ' min' : 'Libre';
}

function add_appointment_place(response) {
  if (response.place) {
    $('#place_fields').show();
    response.place.forEach(element => {
      $('#place_select').append(`<option value='${element.type}'>${element.text}</option>`)
    });
  }
}

function add_appointment_reason(response) {
  if (response.reason != "") {
    $('#event-reason').show();
    $('#event-reason-label').show();
    response.reason.forEach(reason => {
      $('#event-object').append(`<option value="${reason}">${reason}</option>`);
    });
    if (response.custom_reason == "true") {
      $('#event-object').append(`<option value="custom">Autre</option>`);
    }
  } else {
    if (response.custom_reason == "true") {
      $('#event-reason-label').show();
      $('#event-description-input').show();
    }
  }
}

function refresh_calendars() {
  calendar.refetchEvents();
  datetimepicker_fullcalendar.refetchEvents();
}

function display_calendar(response) {
  var calendarEl = document.getElementById('calendar');
  calendar = new FullCalendar.Calendar(calendarEl, {
    themeSystem: 'bootstrap5',
    locale: 'fr',
    firstDay: 1,
    initialView: "timeGridWeek",
    allDaySlot: false,
    selectable: true,
    slotDuration: "00:15",
    slotMinTime: getMinBusinessHour(response),
    slotMaxTime: getMaxBusinessHour(response),
    selectMirror: true,
    forceEventDuration: true,
    weekends: (response.range[0] != "" || response.range[6] != "") ? true : false,
    selectConstraint: "businessHours",
    selectOverlap: false,
    events: {
      url: url.href.replace('fullcalendar', 'freebusy'),
      format: 'ics',
      display: 'background'
    },
    loading: function (loading) {
      if (!loading) {
        $('#loader').hide();
        $('#loaded-calendar').css("visibility", "visible");
        setTimeout(() => {
          generateTimeGap(response, calendar)
        }, 10);
      }
    },
    select: function (info) {
      if (appointment_duration) {
        info.end = info.start.addMinutes(appointment_duration);

        if (getMinDiff(info.start, info.end) > appointment_duration) {
          $('#duration_warning').show();
        }
        else {
          $('#duration_warning').hide();
        }

      }
      showModal(info.start, info.end)
    },
    businessHours: generateBusinessHours(response),
  });
  calendar.render();  
}


function display_datetime_fullcalendar(response) {
  var datetime_calendar = document.getElementById('datetimepicker_calendar');
  datetimepicker_fullcalendar = new FullCalendar.Calendar(datetime_calendar, {
    locale: 'fr',
    initialView: "dayGridMonth",
    allDaySlot: false,
    lazyFetching: false,
    selectable: true,
    selectMirror: true,
    forceEventDuration: true,
    selectOverlap: false,
    events: {
      url: url.href.replace('fullcalendar', 'freebusy'),
      format: 'ics',
      display: 'background'
    },
    loading: function (loading) {
      if (!loading) {
        $('#loader').hide();
        $('#loaded-calendar').css("visibility", "visible");
        setTimeout(() => {
          generateTimeGap(response, datetimepicker_fullcalendar)
        }, 10);
      }
    },
    businessHours: generateBusinessHours(response),
  });
  datetimepicker_fullcalendar.render();
}

// BusinessHours
function generateBusinessHours(response) {
  let businessHours = [];
  response.range.forEach((value, index) => {
    if (value[0] != "") {
      for (let i = 0; i < value.length; i += 2) {
        businessHours.push({
          daysOfWeek: [index],
          startTime: value[i],
          endTime: value[i + 1],
        })
      }
    }
  });
  return businessHours;
}

function getMinBusinessHour(response) {
  let min_ranges = [];
  response.range.forEach((range) => {
    if (range != "") {
      min_ranges.push(parseInt(range[0]))
    }
  })
  return Math.min(...min_ranges) + ':00';
}

function getMaxBusinessHour(response) {
  let max_ranges = [];
  response.range.forEach((range, index) => {
    if (range != "") {
      range.forEach((val) => {        
        let split_range = val.split(':');
        let max_hour = parseInt(split_range[0]);
        //On ajoute une heure si il y a des minutes (18h15 -> on affiche 19h)
        if (split_range[1] != "00") {
          max_hour++;
        }
        max_ranges.push(max_hour)
      })
    }
  })
  return Math.max(...max_ranges) + ':00';
}

function showModal(start, end) {
  let selectedValue = checkToday(roundTimeQuarterHour(new Date()));
  let allowTimes = generateAllowTimes(start ? start : selectedValue);
  $("#eventModal").modal('show');
  $('#event-time-start').datetimepicker({
    datepicker: start ? false : true,
    step: 15,
    value: start ? start : selectedValue,
    allowTimes,
    disabledWeekDays: disabled_days,
    disabledDates: allDayEvents,
    // formatDate:'d/m/Y',
    closeOnDateSelect: false,
    todayButton: false,
    onChangeDateTime: function (date) {
      this.setOptions({
        allowTimes: generateAllowTimes(date)
      })
    },
    onSelectDate: function (date) {
      let [hour, minute] = generateAllowTimes(date)[0].split(':');
      let first_hour = moment(date).hours(parseInt(hour)).minutes(parseInt(minute));
      this.setOptions({
        value: first_hour.toDate(),
      })
    },
    onChangeMonth: function (date) {
      onChangeDateTimeMonth(date)
    },
    onShow: function (date) {
      datetimepicker_fullcalendar.gotoDate(date);
    }
  });
  $('#event-time-end').datetimepicker({
    datepicker: start ? false : true,
    step: 15,
    value: end ? end : selectedValue.addMinutes(appointment_duration),
    allowTimes,
    disabledWeekDays: disabled_days,
    disabledDates: allDayEvents,
    // format:'d/m/Y h:m',
    closeOnDateSelect: false,
    todayButton: false,
    onChangeDateTime: function (date) {
      this.setOptions({
        allowTimes: generateAllowTimes(date)
      })
    },
    onSelectDate: function (date) {
      let [hour, minute] = generateAllowTimes(date)[0].split(':');
      let first_hour = moment(date).hours(parseInt(hour)).minutes(parseInt(minute));
      this.setOptions({
        value: first_hour.toDate(),
      })
    },
    onChangeMonth: function (date) {
      onChangeDateTimeMonth(date)
    },
    onShow: function (date) {
      datetimepicker_fullcalendar.gotoDate(date);
    }
  });

  //On désactive l'input si la durée d'un rdv à été défini
  if (response.check_user_select_time == "true") {
    $('#event-time-end').prop("disabled", false);
  }
  else {
    $('#event-time-end').prop("disabled", true);
  }
}

function checkToday(selectedValue) {
  if (allDayEvents.includes(moment(new Date).format('DD.MM.y')) || disabled_days.includes(parseInt(moment(selectedValue).format('d')))) {
    selectedValue = moment(selectedValue).add(1, 'day').toDate();

    if (allDayEvents.includes(moment(selectedValue).format('DD.MM.y')) || disabled_days.includes(parseInt(moment(selectedValue).format('d')))) {
      selectedValue = checkToday(selectedValue);
    }
  }
  return selectedValue;
}

/*
* Change la date du fullcalendar caché lorsque la valeur change dans le datetimepicker
*/
function onChangeDateTimeMonth(date) {
  if (!current_datetimepicker_month) current_datetimepicker_month = moment(new Date());
  let new_date = moment(date);

  if (current_datetimepicker_month.isBefore(new_date)) datetimepicker_fullcalendar.next();
  else  datetimepicker_fullcalendar.prev();

    current_datetimepicker_month = new_date;
}

function generateAllowTimes(start = new Date()) {
  let businessHours = [];

  if (response.range[start.getDay()] == "") {
    return;
  }

  for (let i = 0; i < response.range[start.getDay()].length; i += 2) {
    let date = moment(start).startOf('day');
    //On enlève la durée d'un rdv au businessHours
    date.add(response.range[start.getDay()][i + 1].split(':')[0], 'hour').add(response.range[start.getDay()][i + 1].split(':')[1], 'minute').subtract(appointment_duration, 'minute');
    businessHours.push({
      start: response.range[start.getDay()][i],
      end: date.format('HH:mm').toString(),
    })
  }

  var quarterHours = ["00", "15", "30", "45"];
  var times = [];


  businessHours.forEach((value) => {
    for (var i = value.start.split(':')[0]; i <= value.end.split(':')[0]; i++) {
      for (var j = 0; j < 4; j++) {
        if (i == value.end.split(':')[0]) {
          if (quarterHours[j] > value.end.split(':')[1]) {
            break;
          }
        }
        times.push(i + ":" + quarterHours[j]);
      }
    }
  })

  datetimepicker_fullcalendar.getEvents().forEach((value) => {
    //On vérifie si un rendez-vous existe aujourd'hui
    if (moment(value.start).startOf('day').toString() == moment(start).startOf('day').toString()) {
      //On enlève les plages horaires qui déborderait sur un rendez-vous déjà existant (temps - durée rdv)
      let start_hour = moment(value.start).subtract(appointment_duration, 'minute').format('HH:mm')

      times.forEach((hour) => {
        if (hour > start_hour && hour < moment(value.end).format('HH:mm')) {
          times = times.filter(function (item) {
            return item !== hour
          })
        }
      })
    }
  })

  return times;
}

function getSelectedDayOccupiedTimeSlot(date) {
  let occupiedTimeSlot = [];
  datetimepicker_fullcalendar.getEvents().forEach((value) => {    
    if (moment(value.start).startOf('day').toString() == moment(date).startOf('day').toString()) {
      let start = moment(value.start).subtract(appointment_duration, 'minute').format('HH:mm')
      let end = moment(value.end).format('HH:mm')
      occupiedTimeSlot.push([start, end]);
    }
  });
  return occupiedTimeSlot;
}

function isEventInRange(start, end, ranges) {
  return ranges.some(([rangeStart, rangeEnd]) => {
    const rangeStartTime = moment(start.format("YYYY/MM/DD") + " " + rangeStart, "YYYY/MM/DD HH:mm");
    const rangeEndTime = moment(end.format("YYYY/MM/DD") + " " + rangeEnd, "YYYY/MM/DD HH:mm");      

      return start.isBetween(rangeStartTime, rangeEndTime, null, '[)') ||
             end.isBetween(rangeStartTime, rangeEndTime, null, '(]') ||
             (start.isSameOrBefore(rangeStartTime) && end.isSameOrAfter(rangeEndTime));
  });
};

function event_form_submit(e) {
  e.preventDefault();

  let occupiedTimeSlot = getSelectedDayOccupiedTimeSlot($('#event-time-start').val());
  
  let start = moment($('#event-time-start').val(), "YYYY/MM/DD HH:mm");
  let end = moment($('#event-time-end').val(), "YYYY/MM/DD HH:mm");

  const isOccupied = isEventInRange(start, end, occupiedTimeSlot);

  if (isOccupied) {
    $('#error-message').show(0).delay(5000).hide(0);
    return;
  }

  $("#eventModal").modal('hide');

  $('#phone_field').hide();
  $('#user-phone').prop('required', false);

  if ($("#place_select").val() == "organizer_call") {
    $('#phone_field').show();
    $('#user-phone').prop('required', true);
  }
  
  $("#userModal").modal('show');
}

function user_form_submit(e) {
  e.preventDefault();
  let event = {};
  event.attendee = {};
  event.appointment = {};
  event.appointment.time_start = $('#event-time-start').val();
  event.appointment.time_end = $('#event-time-end').val();
  event.appointment.date_day = moment(event.appointment.time_start).format('dddd D MMMM YYYY').charAt(0).toUpperCase() + moment(event.appointment.time_start).format('dddd D MMMM YYYY').slice(1);
  event.appointment.date_time = moment(event.appointment.time_start).format('HH:mm');
  event.appointment.date = moment(event.appointment.time_start).format('HH:mm') + ' - ' + moment(event.appointment.time_end).format('HH:mm') + ', ' + moment(event.appointment.time_start).format('dddd D MMMM YYYY');

  event.appointment.object = $('#event-object').val();
  event.appointment.description = $('#event-description').val();

  if (response.place) {
    const place = response.place.find(element => element.type == $('#place_select').val());
    event.appointment.type = place.type
    event.appointment.location = place.value;
    if (place.type == "organizer_call") {
      event.appointment.location = $('#user-phone').val();
    }
    else if (place.type == "attendee_call") {
      event.appointment.location = place.value;
    }
    else if (place.type == "webconf") {
      event.appointment.location = window.location.origin + `/public/webconf?_key=${place.value}`;
      event.appointment.phone = place.phone;
      event.appointment.pin = place.pin;
    }
  }
  event.attendee.name = $('#user-name').val();
  event.attendee.firstname = $('#user-firstname').val();
  event.attendee.email = $('#user-email').val();
  $('#waitingToast').toast('show');


  var formData = new FormData();
  formData.append('appointment', JSON.stringify(event.appointment));
  formData.append('attendee', JSON.stringify(event.attendee));

  const options = { method: 'POST', headers: { Accept: 'application/json' }, body: formData };
  fetch(url.href.replace('fullcalendar/', 'fullcalendar/add_event.php/'), options)
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        $('#waitingToast').toast('hide');
        $('#failToast').toast('show')
        return;
      }
      $('#waitingToast').toast('hide');
      $('#successToast').toast('show');
      display_confirm_modal(event)
      refresh_calendars();
    })
    .catch(err => {
      console.log(err);
      $('#failToast').toast('show')
    });
}

function display_confirm_modal(event) {
  $('.modal').modal('hide');
  $("#confirmModal").modal('show');
  document.getElementById('organizer').textContent = owner_name[0];

  if (event.appointment.object && event.appointment.object != "custom") {
    document.getElementById('motif').textContent = event.appointment.object;
  }
  else {
    $('#motif_row').hide();
  }
  document.getElementById('date').textContent = moment(event.appointment.time_start).format('HH:mm') + ' - ' + moment(event.appointment.time_end).format('HH:mm') + ', ' + moment(event.appointment.time_start).format('dddd D MMMM YYYY');

  if (response.place) {
    const place = response.place.find(element => element.type == $('#place_select').val())
    $('#confirm_place_icon').empty();
    $('#confirm_place').text("");
    switch (place.type) {
      case "address":
        $('#confirm_place_icon').append('<i class="bi bi-geo-alt"></i>');
        $('#confirm_place').text(place.value);
        break;
      case "organizer_call":
        $('#confirm_place_icon').append('<i class="bi bi-telephone"></i>');
        $('#confirm_place').text("Appel téléphonique");
        break;
      case "attendee_call":
        $('#confirm_place_icon').append('<i class="bi bi-telephone"></i>');
        $('#confirm_place').text(place.value);
        break;
      case "webconf":
        $('#confirm_place_icon').append('<i class="bi bi-camera-video"></i>');
        $('#confirm_place').text("Informations sur la conférence en ligne à suivre.");
        break;
      default:
        break;
    }
  }
}




