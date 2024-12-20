/* eslint-disable no-async-promise-executor */
import { BnumMessage } from '../../../../mel_metapage/js/lib/classes/bnum_message.js';
import { EMPTY_STRING } from '../../../../mel_metapage/js/lib/constants/constants.js';
import { Mel_Promise } from '../../../../mel_metapage/js/lib/mel_promise.js';
import { NavBarManager } from '../navbar.generator.js';
import { Planning } from '../WebComponents/planning.js';
import { WorkspaceObject } from '../WorkspaceObject.js';

class WorkspaceAgenda extends WorkspaceObject {
  constructor() {
    super();
  }

  get moduleContainer() {
    return document.querySelector('#module-agenda');
  }

  main() {
    super.main();
    if (!this.loaded && !this.isDisabled('calendar')) {
      this.moduleContainer.style.display = EMPTY_STRING;
      this._main();
    } else if (this.isDisabled('calendar')) {
      this.moduleContainer.style.display = 'none';
    }

    // eslint-disable-next-line no-unused-vars
    new Promise(async (ok, nok) => {
      await Mel_Promise.wait(() => !!NavBarManager.currentNavBar);
      NavBarManager.currentNavBar.onstatetoggle.push(async (...args) => {
        const [task, state, caller] = args;
        const loading = BnumMessage.DisplayMessage(
          this.gettext('loading'),
          'loading',
        );
        $(caller).addClass('disabled').attr('disabled', 'disabled');
        if (task === 'calendar') {
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
    console.log('workspace', this.workspace);
    let planning = Planning.CreateNode();
    $('#module-agenda .module-block-content').html(planning);

    if (window.planning_rendered && !this.rendered) {
      planning.render();
      this.rendered = true;
    }

    planning = null;
  }
}

new WorkspaceAgenda();
