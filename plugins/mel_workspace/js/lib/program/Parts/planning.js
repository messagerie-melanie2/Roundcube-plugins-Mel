import { BnumMessage } from '../../../../../mel_metapage/js/lib/classes/bnum_message.js';
import { EMPTY_STRING } from '../../../../../mel_metapage/js/lib/constants/constants.js';
import { WorkspaceObject } from '../WorkspaceObject.js';
import { NavBarManager } from '../navbar.generator.js';
import { Planning } from '../../WebComponents/planning.js';
import { PLANNING_USE_MODULE_BLOCK } from '../config.js';
import { BnumPromise } from '../../../../../mel_metapage/js/lib/BnumPromise.js';

/**
 * Nom du module
 * @default 'planning'
 * @type {string}
 * @constant
 */
const MODULE_NAME = 'planning';

/**
 * Classe représentant le module de planification dans l'espace de travail.
 * @extends WorkspaceObject
 */
class WorkspacePlanning extends WorkspaceObject {
  /**
   * Constructeur de la classe WorkspacePlanning.
   */
  constructor() {
    super();
  }

  /**
   * Retourne l'élément DOM du conteneur du module.
   * @returns {HTMLElement} L'élément DOM du conteneur du module.
   */
  get moduleContainer() {
    return document.querySelector(`#module-${MODULE_NAME}`);
  }

  /**
   * Retourne le bouton de visibilité associé au module.
   * @returns {HTMLElement} Le bouton de visibilité sous forme d'élément DOM.
   */
  get visibilityButton() {
    return NavBarManager.currentNavBar.mainDiv.querySelector(
      `[data-task="${MODULE_NAME}"] .visibility-icon`,
    );
  }

  /**
   * Méthode principale appelée pour initialiser le module.
   */
  main() {
    super.main();

    // Vérifie si le module est chargé ou désactivé, et agit en conséquence
    if (!this.loaded && !this.isDisabled(MODULE_NAME)) {
      this.moduleContainer.style.display = EMPTY_STRING;
      this._main();
    } else if (this.isDisabled(MODULE_NAME)) {
      this.hideBlock(this.moduleContainer);
    }

    // Utilisation de BnumPromise pour gérer des tâches asynchrones liées à l'initialisation
    BnumPromise.Start(async () => {
      // Attendre que la barre de navigation soit complètement chargée
      await BnumPromise.Wait(() => !!NavBarManager.currentNavBar);

      // Ajout du fonctionnement plein écran/module
      await this._p_set_full_screen_listener(
        MODULE_NAME,
        this.moduleContainer,
        this.visibilityButton,
        {
          /**
           * Callback pour ajuster la hauteur du calendrier en mode plein écran.
           * @param {Object} obj - Objet contenant des informations sur le module.
           */
          onSetFullScreen(obj) {
            const planningEl = obj.module.querySelector('bnum-planning');

            const FC_GRID_SELECTORS = [
              '.fc-view-harness',
              '.fc-resourcetimeline-view',
              '.fc-view',
              '[class*="view-harness"]',
            ];
            
            const getGridTop = () => {
              // Cherche la grille FullCalendar (le corps, après tous les headers)
              for (const selector of FC_GRID_SELECTORS) {
                const el = planningEl.querySelector(selector);
                if (el) return el.getBoundingClientRect().top;
              }
              return planningEl.getBoundingClientRect().top + 160;
            };

            const updateHeight = () => {
              const availableHeight = window.innerHeight - getGridTop() - 20;
              planningEl.fullcalendar.option('height', availableHeight);
            };

            requestAnimationFrame(() => {
              updateHeight();
              //Nettoya de l'ancien listener avant le nouveau listener
              if(planningEl._resizeObserver){
                planningEl._resizeObserver.disconnect();
              }
              //nouveau listener
              planningEl._resizeObserver = new ResizeObserver(updateHeight);
              planningEl._resizeObserver.observe(obj.module);
            });
          },
          /**
           * Callback pour rétablir la hauteur par défaut du calendrier.
           * @param {Object} obj - Objet contenant des informations sur le module.
           */
          onUnsetFullScreen(obj) {
            obj.module
              .querySelector('bnum-planning')
              .fullcalendar.option('height', 400);
          },
        },
      );

      // Gestion de l'état du bouton "Oeil" pour afficher/masquer le module
      NavBarManager.currentNavBar.onstatetoggle.push(async (...args) => {
        const [task, state, caller] = args;

        // Affiche un message de chargement pendant le traitement
        const loading = BnumMessage.DisplayMessage(
          this.gettext('loading'),
          'loading',
        );

        // Désactive temporairement le bouton pour éviter des actions multiples
        caller.classList.add('disabled');
        caller.setAttribute('disabled', 'disabled');

        if (task === MODULE_NAME) {
          await this.switchState(task, state.newState, this.moduleContainer);

          // Charge le module si nécessaire
          if (!state.newState && !this.loaded) {
            this._main();
          }
        }

        // Réactive le bouton après le traitement
        caller.classList.remove('disabled');
        caller.removeAttribute('disabled');
        this.rcmail().hide_message(loading);
      });

      // Gestion des événements après le changement de tâche dans la barre de navigation
      NavBarManager.AddEventListener().OnAfterSwitch((args) => {
        const { task } = args;

        // Si la tâche est "home", redimensionne le module pour éviter des problèmes d'affichage
        if (task === 'home') {
          setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
          }, 100);
        }
      });
    });
  }

  /**
   * Méthode privée pour charger et initialiser le module de planification.
   * @private
   */
  _main() {
    // Charge les ressources nécessaires pour le module
    this.loadModule();

    // Crée un nœud de planification avec des options spécifiques
    let planning = Planning.CreateNode({
      useHeaderModule: PLANNING_USE_MODULE_BLOCK,
    });

    // Insère le contenu du module dans le DOM
    const moduleContent = document.querySelector(
      '#module-planning .module-block-content',
    );
    moduleContent.innerHTML = EMPTY_STRING;
    moduleContent.appendChild(planning);

    // Rendu du planning si nécessaire
    if (window.planning_rendered && !this.rendered) {
      planning.render();
      this.rendered = true;
    }

    // Libère la référence pour éviter les fuites de mémoire
    planning = null;
  }
}

// Instanciation de la classe WorkspacePlanning
new WorkspacePlanning();
