let url = new URL(window.location.href);
let params = url.searchParams;
let appointment_duration = 0;
let owner_name = window.atob(params.get('_name'));
let response = null;
let calendar = null;
let event_not_loaded = true;

document.addEventListener('DOMContentLoaded', function () {

  display_name();
  run();
});

function display_name() {
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
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url.href.replace('fullcalendar/', 'fullcalendar/fullcalendar.php/'), true);

  xhr.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      response = JSON.parse(this.response);

      if (response.error) {
        $('#error_message').text(response.error);
        $('#error_message').show();
        $('#show-calendar').hide();
        return;

      }
      get_appointment_duration(response);

      document.getElementById('appointment_time').textContent = appointment_duration ? appointment_duration + ' min' : 'Libre';

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
        // contentHeight: '65vh',
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
              generateTimeGap(response)
            }, 500);
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
        // headerToolbar: {
        //   left: "prev,next today",
        //   center: "title",
        //   right: "timeGridWeek,timeGridDay",
        // },
        businessHours: generateBusinessHours(response),
      });
      calendar.render();



      $(".fc-scroller").first().css("overflow", "hidden");
    }
  }
  xhr.send();
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
      let split_range = range[1].split(':');
      let max_hour = parseInt(range[1]);
      //On ajoute une heure si il y a des minutes (18h15 -> on affiche 19h)
      if (split_range[1] != "00") {
        max_hour++;
      }
      max_ranges.push(max_hour)
    }
  })
  return Math.max(...max_ranges) + ':00';
}

function showModal(start, end) {
  let allowTimes = generateAllowTimes(start);

  $("#eventModal").modal('show');
  $('#event-time-start').datetimepicker({
    datepicker: start ? false : true,
    step: 15,
    value: start ? start : roundTimeQuarterHour(new Date()),
    allowTimes,
    onChangeDateTime: function (date) {
      this.setOptions({
        allowTimes: generateAllowTimes(date)
      })
    }
  });
  $('#event-time-end').datetimepicker({
    datepicker: start ? false : true,
    step: 15,
    value: end ? end : roundTimeQuarterHour(new Date()).addMinutes(appointment_duration),
    allowTimes,
    onChangeDateTime: function (date) {
      this.setOptions({
        allowTimes: generateAllowTimes(date)
      })
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

Date.prototype.addMinutes = function (m) {
  var copiedDate = new Date(this.getTime());
  copiedDate.setMinutes(copiedDate.getMinutes() + m);
  return copiedDate;
}

function roundTimeQuarterHour(time) {
  var timeToReturn = new Date(time);

  timeToReturn.setMilliseconds(Math.round(timeToReturn.getMilliseconds() / 1000) * 1000);
  timeToReturn.setSeconds(Math.round(timeToReturn.getSeconds() / 60) * 60);
  timeToReturn.setMinutes(Math.round(timeToReturn.getMinutes() / 15) * 15);
  return timeToReturn;
}

function get_appointment_duration(response) {
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

}

function getMinDiff(startDate, endDate) {
  const msInMinute = 60 * 1000;

  return Math.round(
    Math.abs(endDate - startDate) / msInMinute
  );
}

function check_time_select() {
  let start = $('#event-time-start').datetimepicker('getValue');
  let end = $('#event-time-end').datetimepicker('getValue');
  if (start > end) {
    $('#event-time-end').datetimepicker({ value: start })
  }
  if (appointment_duration) {
    $('#duration_warning').hide();
    let minDiff = getMinDiff(start, end);
    if (minDiff != appointment_duration) {
      $('#event-time-end').datetimepicker({ value: start.addMinutes(appointment_duration) })
    }
  }
}

function custom_input_trigger() {
  if ($('#event-object').val() == 'custom') {
    $('#event-description-input').show();
  }
  else {
    $('#event-description-input').hide();
  }
}

function event_form_submit(e) {
  e.preventDefault();
  $("#eventModal").modal('hide');
  $("#userModal").modal('show');
}

function user_form_submit(e) {
  e.preventDefault();
  let event = {};
  event.user = {};
  event.time_start = $('#event-time-start').val();
  event.time_end = $('#event-time-end').val();
  event.object = $('#event-object').val();
  event.description = $('#event-description').val();
  event.user.name = $('#user-name').val();
  event.user.firstname = $('#user-firstname').val();
  event.user.email = $('#user-email').val();
  $('#waitingToast').toast('show');


  $.post(url.href.replace('fullcalendar/', 'fullcalendar/add_event.php/'), event)
    .done(function () {
      $('#waitingToast').toast('hide');
      display_confirm_modal(event)
    });
}

function display_confirm_modal(event) {
  $('.modal').modal('hide');
  $("#confirmModal").modal('show');
  document.getElementById('organiser').textContent = owner_name[0];

  if (event.object && event.object != "custom") {
    document.getElementById('motif').textContent = event.object;
  }
  else {
    $('#motif_row').hide();
  }
  moment.locale('fr');
  document.getElementById('date').textContent = moment(event.time_start).format('HH:mm') + ' - ' + moment(event.time_end).format('HH:mm') + ', ' + moment(event.time_start).format('dddd D MMMM YYYY');

}

function generateTimeGap(response) {
  calendar.getEvents().forEach((value) => {
    calendar.addEvent({
      start: moment(value.start).subtract(response.time_before_select, 'minute').toDate(),
      end: moment(value.end).add(response.time_after_select, 'minute').toDate(),
      display: 'background'
    });
  })
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

  calendar.getEvents().forEach((value) => {
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