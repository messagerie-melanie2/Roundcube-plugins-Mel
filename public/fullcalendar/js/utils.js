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

function generateTimeGap(response) {
  calendar.getEvents().forEach((event) => {
    event.setStart(moment(event.start).subtract(response.time_before_select, 'minute').toDate());
    event.setEnd(moment(event.end).add(response.time_after_select, 'minute').toDate())
  })
  return true;
}