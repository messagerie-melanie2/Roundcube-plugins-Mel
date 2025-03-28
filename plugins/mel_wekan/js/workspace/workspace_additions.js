import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { WorkspaceObject } from '../../../mel_workspace/js/lib/program/WorkspaceObject.js';

/**
 * Classe qui gère les actions lié aux espaces de travail
 * @class
 * @extends MelObject
 */
export default class WorkspaceAdditions extends MelObject {
  constructor() {
    super();
    /**
     * Dernier style en mémoire pour prendre en compte le chargement de wekan
     * @type {?string}
     */
    this.style = null;
  }

  main() {
    super.main();

    //Ajoute un listener sur le chargement de la frame de wekan pour être sûr de pouvoir supprimer la barre de navigation
    document.querySelector('iframe').addEventListener('load', () => {
      const element = document
        .querySelector('iframe')
        .contentWindow.document.querySelector('#header-quick-access');

      if (element) element.style.display = this.style;
    });

    WorkspaceObject.TryObserveHtml((data) => {
      const { style } = data;

      let element = document
        .querySelector('iframe')
        .contentWindow.document.querySelector('#header-quick-access');

      if (element) element.style.display = style;
      this.style = style;
    });
  }

  static Start() {
    return new WorkspaceAdditions();
  }
}

WorkspaceAdditions.Start();
