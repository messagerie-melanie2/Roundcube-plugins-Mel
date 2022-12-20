$(document).ready(
  function () {

    function calendar_waiting_number() {
      if (!window.rcube_calendar || !rcube_calendar.get_number_waiting_events) return;

      const number = rcube_calendar.get_number_waiting_events() || 0;
      let $querry = $("#layout-sidebar .waiting-events-number");

      if (number === 0) $querry.addClass('hidden');
      else $querry.removeClass('hidden').children().html(number)
    }

    if (parent.rcmail.env.calendars !== rcmail.env.calendars) parent.rcmail.env.calendars = rcmail.env.calendars;
    CalendarPageInit();
    rcmail.addEventListener("init", () => {
      rcmail.addEventListener('responsebefore', function (props) {
        const action = "update_cal";

        if (props.response && props.response.action == 'event') {
          mel_metapage.Functions.call(action, false, {
            _integrated: true,
            eval: "always",
            args: {
              child: true,
              goToTop: true
            }
          });

        }
        else if (props.response && (props.response.action === "mailimportitip" || props.response.action === "itip-delegate" || props.response.action === "itip-remove")) {
          let config = {
            _integrated: true,
            eval: "always",
            args: {
              refresh: true,
              child: true,
              goToTop: true
            }
          };

          if (window.mel_metapage !== undefined)
            mel_metapage.Functions.call(action, false, config);
          else {
            config["exec"] = action;
            config["child"] = false;
            parent.postMessage(config);
          }

        }

      });

      if (!!window.mel_metapage) {
        top.rcmail.triggerEvent(mel_metapage.EventListeners.workspaces_updated.get);
        top.rcmail.addEventListener(mel_metapage.EventListeners.calendar_updated.after, () => {
          calendar_waiting_number();
        });
      }

      calendar_waiting_number();

      $("#datepicker-onoff").remove();
      $("#datepicker").addClass("showed").css("margin-bottom", "");
      $("#datepicker").prepend(
        $(`<button class="btn btn-block" title="Cacher l'agenda" id=datepicker-onoff><span class="icon-mel-chevron-down"></span></button>`)
          .click(() => {
            try {
              const size = $("#datepicker .ui-datepicker")[0].getClientRects()[0].height;
              if ($("#datepicker").hasClass("showed")) //est affiché
              {
                mel_metapage.Storage.set("datepicker_state", false);
                $("#datepicker").css("margin-bottom", `-${size}px`).removeClass("showed");
                $("#datepicker-onoff .icon-mel-chevron-down").removeClass("icon-mel-chevron-down").addClass("icon-mel-chevron-up")
                $("#datepicker-onoff").prop('title', "Afficher l'agenda");
              }
              else {
                mel_metapage.Storage.set("datepicker_state", true);
                $("#datepicker").css("margin-bottom", ``).addClass("showed");
                $("#datepicker-onoff .icon-mel-chevron-up").removeClass("icon-mel-chevron-up").addClass("icon-mel-chevron-down")
                $("#datepicker-onoff").prop('title', "Cacher l'agenda");
              }
            } catch (error) {

            }
          })
      );

      setTimeout(() => {
        if ($("#datepicker").hasClass("showed") && mel_metapage.Storage.get("datepicker_state") === false)
          $("#datepicker-onoff").click();
      }, 1);

      parent.metapage_frames.addEvent("open.after", async (eClass, changepage, isAriane, querry, id, actions) => {

        if (eClass === "calendar") {
          querry = $(`iframe#${id}`);
          if (querry.length > 0) {
            try {
              querry[0].contentWindow.$('#calendar').fullCalendar('rerenderEvents');
            } catch (error) {

            }
          }
          else {
            try {
              $('#calendar').fullCalendar('rerenderEvents');
            } catch (error) {

            }
          }
        }

      });

    });



  }
);

function CalendarPageInit() {
  DatePickerInit().then(() => {
    $(".ui-datepicker-inline.ui-datepicker.ui-widget.ui-widget-content.ui-helper-clearfix.ui-corner-all").on("keyup", (event) => {
      if ($.inArray(event.keyCode, [13, 33, 34, 35, 36, 37, 38, 39, 40]) != -1)
        DatePickerInit();
    });

    rcmail.addEventListener("calendar.datepicker.onChangeMonthYear", (a) => {
      DatePickerInit();
    });

    rcmail.addEventListener("calendar.datepicker.onSelect", (a) => {
      DatePickerInit();
    });

    rcmail.addEventListener("calendar.datepicker.beforeShowDay", (a) => {
      DatePickerInit();
    });


    const isSelected = (value) => {
      return $("body.task-calendar .fc-toolbar.fc-header-toolbar .fc-left .active").html() === value ? "selected" : "";
    };

    let select = '<select id="calendarOptionSelect" class="form-control mel-input calendar input-mel custom-select">';
    let selectGroupDay = '<optgroup label="' + rcmail.get_label('calendar.views-day') + '">';
    let selectGroupWeek = '<optgroup label="' + rcmail.get_label('calendar.views-week') + '">';
    let selectGroupMonth = '<optgroup label="' + rcmail.get_label('calendar.views-month') + '">';
    let selectGroupList = '<optgroup label="' + rcmail.get_label('calendar.views-list') + '">';
    $("body.task-calendar .fc-toolbar.fc-header-toolbar .fc-left .fc-button-group .fc-button").each(function () {
      const value = '<option value="' + $(this).attr('class').split(/\s+/)[0] + '" ' + isSelected($(this).text()) + '>' + $(this).text() + '</option>';
      if ($(this).attr('class').indexOf('Day') !== -1) {
        selectGroupDay += value;
      }
      else if ($(this).attr('class').indexOf('agenda') !== -1 || $(this).attr('class').indexOf('Week') !== -1) {
        selectGroupWeek += value;
      }
      else if ($(this).attr('class').indexOf('month') !== -1) {
        selectGroupMonth += value;
      }
      else {
        selectGroupList += value;
      }
    });
    selectGroupDay += '</optgroup>';
    selectGroupWeek += '</optgroup>';
    selectGroupMonth += '</optgroup>';
    selectGroupList += '</optgroup>';
    select += selectGroupDay;
    select += selectGroupWeek;
    select += selectGroupMonth;
    select += selectGroupList;
    select += '</select>';
    $(select)
      .on("change", () => {
        const val = $("#calendarOptionSelect").val();

        $("body.task-calendar .fc-toolbar.fc-header-toolbar .fc-left .fc-button-group ." + val).click();
      })
      .appendTo($("body.task-calendar .fc-toolbar.fc-header-toolbar .fc-left"));
  });

  switch (rcmail.env.mel_metapage_calendar_configs["mel-calendar-space"]) {
    case rcmail.gettext("smaller", "mel_metapage"):
      $("body").addClass("cal-space-smaller");
      break;

    case rcmail.gettext("larger", "mel_metapage"):
      $("body").addClass("cal-space-larger");
      break;

    case rcmail.gettext("without_spaces", "mel_metapage"):
      $("body").addClass("cal-space-old");
      break;

    default:
      break;
  }


  //$(".body.task-calendar .fc-toolbar.fc-header-toolbar .fc-left").append()

}

function ForceSelectClick(element) {
  var event;
  event = document.createEvent('MouseEvents');
  event.initMouseEvent('mousedown', true, true, window);
  element.addClass("calendar-force-show")[0].dispatchEvent(event);
}

async function DatePickerInit() {
  if (rcmail.env.task !== "calendar")
    return;

  await wait(() => {
    return $("#datepicker-dp-title").length === 0;
  });

  const idMonth = "mel-calendar-date-month";
  const idYear = "mel-calendar-date-year";

  if ($(`#${idMonth}`).length > 0)
    return;

  let querry = $("#datepicker-dp-title");
  querry.append(`<span role=button tabIndex=0 style="cursor:pointer;font-weight:normal;" class="mel-focus mel-hover" id=${idMonth}>${$(`#datepicker-dp-title .ui-datepicker-month option[value=${$("#datepicker-dp-title .ui-datepicker-month").val()}]`).html()}</span>
    <span role=button tabIndex=0 style="cursor:pointer;font-weight:normal;" class="mel-focus mel-hover" id=${idYear}>${$(`#datepicker-dp-title .ui-datepicker-year option[value=${$("#datepicker-dp-title .ui-datepicker-year").val()}]`).html()}</span>`);

  //console.log("month", $(`#datepicker-dp-title .ui-datepicker-month option[value=${$("#datepicker-dp-title .ui-datepicker-month").val()}]`));

  querry.find(`#${idMonth}`).click((e) => {
    ForceSelectClick($("#datepicker-dp-title .ui-datepicker-month"));
  })
    .on("keydown", (event) => {
      if (event.keyCode === 32 || event.keyCode === 13)
        ForceSelectClick($("#datepicker-dp-title .ui-datepicker-month"));
    })
    .parent()
    .find(`#${idYear}`)
    .click(() => {
      ForceSelectClick($("#datepicker-dp-title .ui-datepicker-year"));
    })
    .on("keydown", (event) => {
      if (event.keyCode === 32 || event.keyCode === 13)
        ForceSelectClick($("#datepicker-dp-title .ui-datepicker-year"));
    });

  $("#datepicker-dp-title .ui-datepicker-month").on("focusout", () => {
    $("#datepicker-dp-title .ui-datepicker-month").removeClass("calendar-force-show");
  })
    .on("change", () => {
      DatePickerInit();
    });


  $("#datepicker-dp-title .ui-datepicker-year").on("focusout", () => {
    $("#datepicker-dp-title .ui-datepicker-year").removeClass("calendar-force-show");
  })
    .on("change", () => {
      DatePickerInit();
    });

  $('#datepicker-dp-title .ui-datepicker-next').click(() => {
    DatePickerInit();
  })

  $('#datepicker-dp-title .ui-datepicker-prev').click(() => {
    DatePickerInit();
  })
}

function search_action(searchValue) {
  const timeoutValue = 111;
  setTimeout(async () => {
    await wait(() => rcmail.busy);
    $("#searchform").val(searchValue).parent().submit();
  }, timeoutValue);
}

function copy_calendar_url(input_id) {
  var copyText = $('.ui-dialog #' + input_id);

  copyText.select();

  navigator.clipboard.writeText(copyText.val());

  if (copyText.val()) {

    $(".ui-dialog :button").each(function () {
      $(".ui-dialog #" + $(this).attr('id')).val(rcmail.labels['calendar.copied_url_default']);
    });

    $('.ui-dialog #button_' + input_id).val(rcmail.labels['calendar.copied_url']);
  }
}

function open_external_calendar(id) {
  let url = new URL($('.ui-dialog #' + id).val());
  url.searchParams.append('_name', window.btoa(rcmail.env.current_user.full))

  if (url) {
    switch (id) {
      case 'calpublicfeedurl':
        window.open(url.href.replace('feed', 'fullcalendar'), '_blank');
        break;

      case 'calfreebusyurl':
        window.open(url.href.replace('freebusy', 'fullcalendar'), '_blank');
        break;

      default:
        break;
    }
  }
}

function collapse_url_block(id) {
  $('.ui-dialog .block').each(function () {
    if ($(this).attr('id') != 'block-' + id) {
      $(this).hide();
    }
  });

  $('.ui-dialog #block-' + id).toggle();

  if ($('.ui-dialog #icon-' + id).attr('class') === 'icon_url icon-mel-chevron-up') {
    $('.ui-dialog #icon-' + id).attr('class', 'icon_url icon-mel-chevron-down')
  }
  else {
    $('.ui-dialog #icon-' + id).attr('class', 'icon_url icon-mel-chevron-up')
  }

  $('.ui-dialog .icon_url').each(function () {
    if ($(this).attr('id') != 'icon-' + id) {
      $(this).attr('class', 'icon_url icon-mel-chevron-down')
    }
  });
}
