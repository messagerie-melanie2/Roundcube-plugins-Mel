import ABaseMelObject from '../../../../../mel_metapage/js/lib/base_mel_object';
import { BnumLog } from '../../../../../mel_metapage/js/lib/classes/bnum_log';

//SETTINGS
const CREATE_EVENT_BUTTON_ID = 'create-event-button';
const BUTTON_COMMAND = 'addevent';

export class ModuleInitNewEventButton extends ABaseMelObject {
  constructor() {
    super();
  }

  async onDocumentReady() {
    this.#_setup();
  }

  #_setup() {
    this.#_trySetupButtonAction();
    this.#_listenEnableCommand();
  }

  #_tryGetButton() {
    const node = document.getElementById(CREATE_EVENT_BUTTON_ID);

    if (!node) {
      const ERROR_TEXT = `Impossible de trouver #${CREATE_EVENT_BUTTON_ID}`;
      BnumLog.error(
        'ModuleInitNewEventButton/#_trySetupButtonAction',
        ERROR_TEXT,
      );
      throw new Error(ERROR_TEXT);
    }

    return node;
  }

  #_trySetupButtonAction() {
    this.#_tryGetButton().addEventListener(
      'click',
      this.execCommand.bind(this, BUTTON_COMMAND),
    );
  }

  #_listenEnableCommand() {
    const COMMAND_NAME = 'enable-command';
    this.listen(COMMAND_NAME, (args) => this.#_handleEnableCommand(args));
  }

  #_handleEnableCommand(args) {
    const { command, status } = args;

    if (command !== 'addevent') return;

    const node = this.#_tryGetButton();

    node.toggleAttribute('disabled', status !== true);
  }
}
