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

      get_appointment_duration(response);

      document.getElementById('appointment_time').textContent = appointment_duration ? appointment_duration + ' min' : 'Libre';
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
      var calendarEl = document.getElementById('calendar');
      calendar = new FullCalendar.Calendar(calendarEl, {
        themeSystem: 'bootstrap5',
        locale: 'fr',
        firstDay: 1,
        initialView: "timeGridWeek",
        allDaySlot: false,
        selectable: true,
        slotMinTime: "07:00",
        slotMaxTime: "18:00",
        height: 'auto',
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
        loading: function (info) {
          if (!info) {
            $('#loader').hide(); 
            $('#loaded-calendar').css("visibility", "visible");;
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
          showModal(info.start, info.end, response.check_user_select_time, calendar)
        },
        // headerToolbar: {
        //   left: "prev,next today",
        //   center: "title",
        //   right: "timeGridWeek,timeGridDay",
        // },
        businessHours,
      });
      calendar.render();



      $(".fc-scroller").first().css("overflow", "hidden");
    }
  }
  xhr.send();
}


function showModal(start, end, enable_end) {
console.log(event_not_loaded);
  let allowTimes = generateAllowTimes(start);

  $("#eventModal").modal('show');
  $('#event-time-start').datetimepicker({
    datepicker: start ? false : true,
    step: 15,
    value: start ? start : roundTimeQuarterHour(new Date()),
    allowTimes
  });
  $('#event-time-end').datetimepicker({
    datepicker: start ? false : true,
    step: 15,
    value: end ? end : roundTimeQuarterHour(new Date()).addMinutes(appointment_duration),
    allowTimes
  });

  //On désactive l'input si la durée d'un rdv à été défini
  if (enable_end == "true") {
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
  let eventForm = document.find('#add_event_form');
  event.title = eventForm.find('#event-title').val();
  console.log(event);
  $("#userModal").modal('hide');
}


function generateAllowTimes(start = new Date()) {
  let businessHours = [];

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