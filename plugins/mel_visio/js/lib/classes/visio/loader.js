export { VisioLoader };

class VisioLoader {
  constructor(selector) {
    this._init()._setup(selector);
  }

  _init() {
    this.loader = null;

    return this;
  }

  _setup(selector) {
    Object.defineProperty(this, 'loader', {
      get() {
        return $(selector);
      },
    });

    return this;
  }

  update_text(text) {
    this.loader.html(text);
    return this;
  }

  destroy() {
    let $to_destroy = this.loader.parent();

    if (!$to_destroy.hasClass('absolute-center')) $to_destroy = this.loader;

    $to_destroy.remove();

    $to_destroy = null;
  }
}
