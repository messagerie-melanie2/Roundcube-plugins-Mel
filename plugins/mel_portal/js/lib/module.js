export { BaseModule };
import { EMPTY_STRING } from '../../../mel_metapage/js/lib/constants/constants.js';
import { MainIcon } from '../../../mel_metapage/js/lib/icons.js';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { ModuleLoader } from './module_loader.js';

const Icon = MainIcon;
class BaseModule extends MelObject {
  constructor(load_module = true) {
    super(load_module);
  }

  main(...args) {
    super.main();
    const [load_module] = args;
    if (load_module) {
      ModuleLoader.addModule(() => {
        const module = this.constructor;
        const load_module = false;
        new module(load_module);
      });
    } else {
      this.start();
      this.end();
    }
  }

  start() {
    if (this.module_id()) this.set_icon();
  }
  end() {}

  select_module(module_id = null) {
    return this.select(`.module_${module_id ?? this.module_id()}`);
  }

  select_module_title(module_id = null) {
    return this.select_module(module_id).find('.melv2-card-title');
  }

  select_module_icon(module_id = null) {
    return this.select_module(module_id).find('.melv2-card-icon');
  }

  select_module_content(module_id = null) {
    return this.select_module(module_id).find('.melv2-card-contents');
  }

  set_icon() {
    let $icon = this.select_module_icon();
    if ($icon.length > 0) {
      $icon = new Icon($icon.data('melv2-icon'), $icon);
    }
  }

  set_title_action(frame) {
    const URL = this.url(frame, {}).replace('&_is_from=iframe', EMPTY_STRING);
    this.select_module_title()
      .attr('href', URL)
      .attr('data-spied', false)
      .click((e) => {
        e.preventDefault();
        this.switch_frame(frame);
        //this.change_frame(frame, { update: false, force_update: false });
      });
    return this;
  }

  module_id() {
    return null;
  }
}
