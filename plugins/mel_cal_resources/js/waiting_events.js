rcmail.register_command(
  'calendar-planify',
  async () => {
    window.start_planify = true;
    rcmail.command('addevent');
  },
  true,
);

$(document).ready(() => {
  try {
    const window_rcube_calendar_ui_edit = window.rcube_calendar_ui.edit;
    window.rcube_calendar_ui.edit = async function edit(...args) {
      if (!window.mel_cal_resource_loaded) {
        const busy = rcmail.set_busy(true, 'loading');
        await wait(() => window.mel_cal_resource_loaded !== true);
        rcmail.set_busy(false, 'loading', busy);
      }

      const data = await window_rcube_calendar_ui_edit.call(
        window.rcube_calendar_ui,
        ...args,
      );

      if (window.start_planify) {
        const busy = rcmail.set_busy(true, 'loading');
        let location;
        $('#eventedit').css('opacity', 0);
        data.view.parts.location.update_first_location('flex-office');
        window.start_planify = false;

        location =
          data.view.parts.location.locations[
            Object.keys(data.view.parts.location.locations)[0]
          ];
        location?.onclickafter.push(() => {
          $('#eventedit').css('opacity', 1);
          location.onclickafter.clear();
          rcmail.set_busy(false, 'loading', busy);
          $('#rtc-show-event').remove();
        });
        location?.force_click?.();
      }

      return data;
    };
  } catch (error) {
    console.error(error);
  }

  $('.button.create').after($('#mel-planify'));
});
