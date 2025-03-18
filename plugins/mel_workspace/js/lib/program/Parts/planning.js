/* eslint-disable no-async-promise-executor */
import { BnumMessage } from '../../../../../mel_metapage/js/lib/classes/bnum_message.js';
import { EMPTY_STRING } from '../../../../../mel_metapage/js/lib/constants/constants.js';
import { WorkspaceObject } from '../WorkspaceObject.js';
import { NavBarManager } from '../navbar.generator.js';
import { Planning } from '../../WebComponents/planning.js';
import { PLANNING_USE_MODULE_BLOCK } from '../config.js';
import { BnumPromise } from '../../../../../mel_metapage/js/lib/BnumPromise.js';

const MODULE_NAME = 'planning';

class WorkspacePlanning extends WorkspaceObject {
  constructor() {
    super();
  }

  get moduleContainer() {
    return document.querySelector(`#module-${MODULE_NAME}`);
  }

  get visibilityButton() {
    return $(NavBarManager.currentNavBar.mainDiv).find(
      `[data-task="${MODULE_NAME}"] .visibility-icon`,
    );
  }

  main() {
    super.main();
    if (!this.loaded && !this.isDisabled(MODULE_NAME)) {
      this.moduleContainer.style.display = EMPTY_STRING;
      this._main();
    } else if (this.isDisabled(MODULE_NAME)) {
      this.hideBlock(this.moduleContainer);
    }

    // eslint-disable-next-line no-unused-vars
    new Promise(async (ok, nok) => {
      await BnumPromise.Wait(() => !!NavBarManager.currentNavBar);
      await this._p_set_full_screen_listener(
        MODULE_NAME,
        this.moduleContainer,
        this.visibilityButton,
        {
          onSetFullScreen(obj) {
            obj.module
              .querySelector('bnum-planning')
              .fullcalendar.option('height', 'auto');
          },
          onUnsetFullScreen(obj) {
            obj.module
              .querySelector('bnum-planning')
              .fullcalendar.option('height', 400);
          },
        },
      );

      NavBarManager.currentNavBar.onstatetoggle.push(async (...args) => {
        const [task, state, caller] = args;
        const loading = BnumMessage.DisplayMessage(
          this.gettext('loading'),
          'loading',
        );
        $(caller).addClass('disabled').attr('disabled', 'disabled');
        if (task === MODULE_NAME) {
          await this.switchState(task, state.newState, this.moduleContainer);

          if (!state.newState && !this.loaded) {
            this._main();
          }
        }
        $(caller).removeClass('disabled').removeAttr('disabled');
        rcmail.hide_message(loading);
      });

      ok();
    });
  }

  _main() {
    this.loadModule();
    let planning = Planning.CreateNode({
      useHeaderModule: PLANNING_USE_MODULE_BLOCK,
    });
    $('#module-planning .module-block-content')
      .css('max-height', '100%')
      .html(planning);

    if (window.planning_rendered && !this.rendered) {
      planning.render();
      this.rendered = true;
    }

    planning = null;
  }
}

new WorkspacePlanning();
