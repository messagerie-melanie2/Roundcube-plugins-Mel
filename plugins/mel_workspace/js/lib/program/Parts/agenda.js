/* eslint-disable no-async-promise-executor */
import { BnumMessage } from '../../../../../mel_metapage/js/lib/classes/bnum_message.js';
import { EMPTY_STRING } from '../../../../../mel_metapage/js/lib/constants/constants.js';
import { WorkspaceObject } from '../WorkspaceObject.js';
import { NavBarManager } from '../navbar.generator.js';
import { Planning } from '../../WebComponents/planning.js';
import { PLANNING_USE_MODULE_BLOCK } from '../config.js';
import { BnumPromise } from '../../../../../mel_metapage/js/lib/BnumPromise.js';
import { WorkspaceModuleBlock } from '../../WebComponents/workspace_module_block.js';

class WorkspaceAgenda extends WorkspaceObject {
  constructor() {
    super();
  }

  get moduleContainer() {
    return document.querySelector('#module-agenda');
  }

  get visibilityButton() {
    return $(NavBarManager.currentNavBar.mainDiv).find(
      '[data-task="planning"] .visibility-icon',
    );
  }

  main() {
    super.main();
    if (!this.loaded && !this.isDisabled('planning')) {
      this.moduleContainer.style.display = EMPTY_STRING;
      this._main();
    } else if (this.isDisabled('planning')) {
      this.hideBlock(this.moduleContainer);
    }

    // eslint-disable-next-line no-unused-vars
    new Promise(async (ok, nok) => {
      await BnumPromise.Wait(() => !!NavBarManager.currentNavBar);
      await this._p_set_full_screen_listener(
        'planning',
        document.getElementById('module-agenda'),
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
        if (task === 'planning') {
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
    let planning = Planning.CreateNode({
      useHeaderModule: PLANNING_USE_MODULE_BLOCK,
    });
    $('#module-agenda .module-block-content')
      .css('max-height', '100%')
      .html(planning);

    if (window.planning_rendered && !this.rendered) {
      planning.render();
      this.rendered = true;
    }

    planning = null;
  }
}

new WorkspaceAgenda();
