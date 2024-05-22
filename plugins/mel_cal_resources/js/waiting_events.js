$(document).ready(() => {
  try {
    const window_rcube_calendar_ui_edit = window.rcube_calendar_ui.edit;
    window.rcube_calendar_ui.edit = async function edit(...args) {
      if (!window.mel_cal_resource_loaded) {
        const busy = rcmail.set_busy(true, 'loading');
        await wait(() => window.mel_cal_resource_loaded !== true);
        rcmail.set_busy(false, 'loading', busy);
      }

      return await window_rcube_calendar_ui_edit.call(
        window.rcube_calendar_ui,
        ...args,
      );
    };
  } catch (error) {
    console.error(error);
  }
});
