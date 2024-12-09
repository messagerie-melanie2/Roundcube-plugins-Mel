import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';

$(document).ready(()=> {

  rcmail.addEventListener('wsp.on.task.showed', () => {
    const wsp_id = MelObject.Empty().load('current_wsp') || null;

    let $view = $(`#rcmlitasklist${wsp_id} .actions a.quickview`);

    if (wsp_id && (top ?? parent ?? window).$('html').hasClass('mwsp') && ![true, 'true'].includes($view.attr('aria-checked'))) {
      $(`#rcmlitasklist${wsp_id} .actions a.quickview`).click();
    }
  });

  rcmail.triggerEvent('wsp.on.task.showed');
});