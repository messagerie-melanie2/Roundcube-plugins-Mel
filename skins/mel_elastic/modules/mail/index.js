import { EMPTY_STRING } from '../../../../plugins/mel_metapage/js/lib/constants/constants.js';
import { ABaseModuleWithSubModules } from '../core/ABaseModule.js';
import { Search } from './search/index.js';

const SUB_MODULES = [Search];

/**
 * Module de recherche mail pour ElasticUi.
 * Gère l'interaction avec le champ de recherche et les filtres associés.
 * @extends ABaseModuleWithSubModules
 */
export class ElasticUiMail extends ABaseModuleWithSubModules {
  /**
   * Module de recherche mail pour ElasticUi.
   * @extends ABaseModuleWithSubModules
   */
  constructor() {
    super(SUB_MODULES);
  }

  _p_init() {
    if (
      this.get_env('task') === 'mail' &&
      (this.get_env('action') === EMPTY_STRING ||
        this.get_env('action') === 'index')
    )
      this.loadSubModules();
  }

  static _p_ignoreLifeCycles() {
    return ['main', 'after'];
  }
}
