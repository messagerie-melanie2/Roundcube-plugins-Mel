(() => {
  function rcmail_add_event_listener_ex(main_key, callback_key, callback) {
    if (!this._handlers_ex) this._handlers_ex = {};

    if (!this._handlers_ex[main_key]) this._handlers_ex[main_key] = {};

    this._handlers_ex[main_key][callback_key] = callback;
  }

  function rcmail_trigger_event_ex(main_key, ...args) {
    let return_data = [];

    if (this._handlers_ex && this._handlers_ex[main_key]) {
      const keys = Object.keys(this._handlers_ex[main_key]);
      for (
        let index = 0,
          len = keys.length,
          key = keys[index],
          callback = this._handlers_ex[main_key][key];
        index < len;
        ++index
      ) {
        return_data.push(callback(...args));
        key = keys[index];
        callback = this._handlers_ex[main_key][key];
      }
    }

    if (return_data.length === 1) return_data = return_data[0];
    else if (return_data.length === 0) return_data = null;

    return return_data;
  }

  function rcmail_remove_handler_ex(main_key, callback_key) {
    if (
      this._handlers_ex &&
      this._handlers_ex[main_key] &&
      this._handlers_ex[main_key][callback_key]
    ) {
      const call = this._handlers_ex[main_key][callback_key];

      delete this._handlers_ex[main_key][callback_key];

      return call;
    }

    return null;
  }

  const old = rcube_webmail.prototype.triggerEvent;
  function rcmail_trigger_event_new(evt, e) {
    let ret = old.call(this, evt, e);
    ret ??= this.trigger_event_ex(evt, e) ?? ret;

    return ret;
  }

  if (rcmail) {
    rcmail.add_event_listener_ex = rcmail_add_event_listener_ex.bind(rcmail);
    rcmail.trigger_event_ex = rcmail_trigger_event_ex.bind(rcmail);
    rcmail.remove_handler_ex = rcmail_remove_handler_ex.bind(rcmail);
    rcmail.triggerEvent = rcmail_trigger_event_new.bind(rcmail);
  }

  if (rcube_webmail) {
    rcube_webmail.prototype.add_event_listener_ex =
      rcmail_add_event_listener_ex;

    rcube_webmail.prototype.trigger_event_ex = rcmail_trigger_event_ex;

    rcube_webmail.prototype.remove_handler_ex = rcmail_remove_handler_ex;
    rcube_webmail.prototype.triggerEvent = rcmail_trigger_event_new;
  }
})();
