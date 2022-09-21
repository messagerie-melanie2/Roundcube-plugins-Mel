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
      url: 'https://roundcube.ida.melanie2.i2/public/feed/?_cal=YXJuYXVkLmdvdWJpZXIuaTphcm5hdWRfLVAtX2dvdWJpZXJfLVAtX2k%3D.ics&_key=YXJuYXVkXy1QLV9nb3ViaWVyXy1QLV9pX2NhbGhhc2hrZXlfNjI0ZGI5Njk2NDRiNQ%3D%3D',
      format: 'ics'
    },
  });
  calendar.render();
});