(() => {
  if (window.rcmail) {
    rcmail.mailto_handler_uri = function () {
      return location.href.split('?')[0] + '?_task=mail&_action=compose&_to=%s&_extwin=1';
    };
  }
})();