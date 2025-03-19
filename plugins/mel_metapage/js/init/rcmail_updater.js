if (rcmail) {
  (() => {
    class rcube_rcmail_updater {
      constructor() {
        this.funcs = {};
      }

      addUpdate(funcName, func) {
        rcmail[funcName + '_parent'] = rcmail[funcName];
        rcmail[funcName] = (...args) => {
          rcmail[funcName + '_parent'](...args);
          func(...args);
        };
      }
    }

    window.rcube_rcmail_updater = new rcube_rcmail_updater();
  })();
}

function rcube_rcmail_update(funcName, func) {
  if (rcmail && window.rcube_rcmail_updater) {
    $(document).ready(() => {
      rcmail.addEventListener('init', () => {
        window.rcube_rcmail_updater.addUpdate(funcName, func);
      });
    });
  }
}
