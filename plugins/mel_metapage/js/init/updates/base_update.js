(() => {
  const rcmail_set_busy = rcmail.set_busy;
  rcmail.set_busy = function set_busy(...args) {
    const rtn = rcmail_set_busy.call(this, ...args);

    if (args[0])
      document.querySelectorAll('html, .can-be-busy').forEach((element) => {
        element.classList.add('app-busy');
      });
    else
      document.querySelectorAll('html, .can-be-busy').forEach((element) => {
        element.classList.remove('app-busy');
      });

    return rtn;
  };
})();
