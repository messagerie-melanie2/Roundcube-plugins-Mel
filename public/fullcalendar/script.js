let url = new URL(window.location.href);
let params = url.searchParams;

document.getElementById('owner_calendar').textContent = window.atob(params.get('_name'));
document.title = 'Calendrier de ' + window.atob(params.get('_name'));

if (url.href.includes('_key')) {
  url = url.href.replace('fullcalendar', 'feed')
  console.log(url);
}
else {
  url = url.href.replace('fullcalendar', 'freebusy')
}

document.addEventListener('DOMContentLoaded', function () {
  var calendarEl = document.getElementById('calendar');
  var calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "timeGridWeek",
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay",
    },
    events: {
      url,
      format: 'ics'
    },
  });
  calendar.render();
});