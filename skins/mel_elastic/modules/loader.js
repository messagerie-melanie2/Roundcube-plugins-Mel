import { ABaseLoader } from './core/ABaseLoader.js';
import { Global } from './global/index.js';
import { ElasticUiMail } from './mail/index.js';
import { SecondaryNav } from './secondary-nav/index.js';

const MODULES = [ElasticUiMail, Global, SecondaryNav];

/**
 * ModuleLoader est responsable de charger les modules de l'interface utilisateur de Mel Elastic en appelant leurs méthodes init, go et after dans cet ordre. Il utilise une approche de singleton pour garantir qu'il n'y a qu'une seule instance du chargeur de modules tout au long de l'application.
 * @extends ABaseLoader<import('./core/ABaseModule.js').ABaseModule>
 */
export class ModuleLoader extends ABaseLoader {
  constructor() {
    super(MODULES);
  }

  /**
   * Singleton pour accéder à l'instance du ModuleLoader.
   * @returns {ModuleLoader}
   * @readonly
   */
  static get Instance() {
    return (ModuleLoader._instance ??= new ModuleLoader());
  }
}
