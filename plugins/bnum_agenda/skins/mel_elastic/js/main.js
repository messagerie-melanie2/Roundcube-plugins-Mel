import ABaseMelObject from '../../../../mel_metapage/js/lib/base_mel_object.js';
import { ModuleInitAgendaColor } from './init/agenda-color-init.js';
import { ModuleInitMobileButtons } from './init/mobile-buttons-init.js';
import { ModuleInitNavigation } from './init/navigation-buttons-init.js';
import { ModuleInitNewEventButton } from './init/new-event-button-init.js';
import { ModuleInitSelect } from './init/select-init.js';
import { ModuleSearch } from './search.js';

const MODULES = [
  ModuleInitAgendaColor,
  ModuleInitNewEventButton,
  ModuleInitSelect,
  ModuleInitNavigation,
  ModuleInitMobileButtons,
  ModuleSearch,
];
class AgendaMelElasticMain extends ABaseMelObject {
  #_onReadyCallbacks = [];

  constructor() {
    super();
    if (this.get_env('task') === 'calendar') this.#_load();
  }

  #_load() {
    for (const Module of MODULES) {
      const instance = new Module();
      if (typeof instance.onDocumentReady === 'function') {
        this.#_onReadyCallbacks.push(instance.onDocumentReady.bind(instance));
      }
    }
  }

  callForDocumentReady() {
    for (const fn of this.#_onReadyCallbacks) fn();
  }
}

const main = new AgendaMelElasticMain();

document.addEventListener(
  'DOMContentLoaded',
  main.callForDocumentReady.bind(main),
);
