(() => {
  const original_show_popup = rcmail.show_popup_dialog;
  rcmail.show_popup_dialog = function show_popup_dialog(...args) {
    const is_framed = rcmail.is_framed;
    rcmail.is_framed = () => false;
    const rt = original_show_popup.call(this, ...args);
    rcmail.is_framed = is_framed.bind(this);

    return rt;
  };
  rcmail.addEventListener('on.calendar-event.before', (args) => {
    const lastmain = args.eventView.prototype._main;
    args.eventView.prototype._main = async function _main(event) {
      await wait(() => !window.mel_cal_resource_loaded);

      lastmain.call(this, event);
    };

    return args;
  });
})();
