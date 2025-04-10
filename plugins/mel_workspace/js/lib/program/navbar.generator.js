// Importation des dépendances nécessaires
import { FramesManager } from '../../../../mel_metapage/js/lib/classes/frame_manager.js';
import { MainNav } from '../../../../mel_metapage/js/lib/classes/main_nav.js';
import { EMPTY_STRING } from '../../../../mel_metapage/js/lib/constants/constants.js';
import { MelObject } from '../../../../mel_metapage/js/lib/mel_object.js';
import { Mel_Promise } from '../../../../mel_metapage/js/lib/mel_promise.js';
import { WspNavBar } from '../WebComponents/navbar.js';
import { WorkspaceModuleBlock } from '../WebComponents/workspace_module_block.js';
import { WorkspaceObject } from './WorkspaceObject.js';

/**
 * @callback OnBeforeSwitchCallback
 * @param {Object} args - Arguments passés avant le changement de page.
 * @param {string} args.task - La tâche ou page cible.
 * @param {Event} args.event - L'événement déclencheur.
 * @returns {Object} config - Configuration pour le changement de page.
 */

/**
 * @callback OnAfterSwitchCallback
 * @param {Object} args - Arguments passés après le changement de page.
 * @param {string} args.task - La tâche ou page cible.
 * @param {Event} args.caller - L'événement déclencheur.
 * @returns {void}
 */

/**
 * @callback ListenerSetterBeforeFunction
 * @param {OnBeforeSwitchCallback} callback - Fonction appelée avant le changement de page.
 * @param {string} task - La tâche ou page cible.
 * @returns {ListenersSetter}
 */

/**
 * @callback ListenerSetterAfterFunction
 * @param {OnAfterSwitchCallback} callback - Fonction appelée après le changement de page.
 * @param {string} task - La tâche ou page cible.
 * @returns {ListenersSetter}
 */

/**
 * @typedef ListenersSetter
 * @property {ListenerSetterBeforeFunction} OnBeforeSwitch - Définit un écouteur avant le changement de page.
 * @property {ListenerSetterAfterFunction} OnAfterSwitch - Définit un écouteur après le changement de page.
 * @property {typeof NavBarManager} parent - Référence à la classe parente.
 */

/**
 * Classe NavBarManager
 * Gère la barre de navigation (navbar) pour les espaces de travail.
 */
export class NavBarManager {
  constructor() {}

  /**
   * Retourne la fenêtre de navigation principale.
   * Si la fenêtre actuelle est un iframe, remonte jusqu'à la fenêtre parent.
   * @returns {Window} La fenêtre de navigation principale.
   */
  static get nav() {
    let nav = window;

    {
      let secu = 0;

      // Remonte jusqu'à la fenêtre parent, avec une limite de sécurité de 6 niveaux.
      while (nav !== parent && ++secu <= 6) {
        nav = parent;
      }
    }

    return nav;
  }

  /**
   * Retourne l'élément de la barre de navigation actuelle.
   * @type {WspNavBar}
   */
  static get currentNavBar() {
    return this.nav.document.querySelector('bnum-wsp-nav');
  }

  /**
   * Change de frame pour aller à l'accueil d'un espace de travail.
   * @param {Object<string, any>} config - Configuration pour le changement de frame.
   * @param {{uid:string}} workspace - Informations sur l'espace de travail.
   * @returns {Promise<void>}
   * @static
   */
  static async GoToHome(config, workspace) {
    // Cache les paramètres de l'espace de travail et affiche le contenu principal.
    $('.wsp-params').css('display', 'none');
    $('#main-content').css('display', EMPTY_STRING);

    // Change de frame en utilisant FramesManager.
    await FramesManager.Instance.switch_frame('workspace', {
      args: config,
      actions: ['workspace'],
    });
  }

  /**
   * Génère une nouvelle barre de navigation pour un espace de travail donné.
   * @param {CurrentWorkspaceData} workspace - Données de l'espace de travail actuel.
   */
  static Generate(workspace) {
    let nav = this.nav;

    // Supprime la barre de navigation actuelle si elle existe.
    if (this.currentNavBar) this.currentNavBar.remove();

    // Vérifie si une barre de navigation avec l'ID correspondant existe déjà.
    if (!nav.document.querySelector(`#navbar-${workspace.uid}`)) {
      if (typeof rcmail.env.navbar === 'string')
        rcmail.env.navbar = JSON.parse(rcmail.env.navbar);

      /**
       * Crée un nouvel élément de barre de navigation.
       * @type {WspNavBar}
       */
      let navbar = WspNavBar.CreateElement({
        nav: nav.document,
        workspace: rcmail.env.navbar.workspace,
        css: rcmail.env.navbar.css,
        modules: rcmail.env.navbar.module,
        scripts: rcmail.env.navbar.scripts,
        settings: rcmail.env.navbar.settings,
        onuserchanged: () => WorkspaceObject.GetWorkspaceData().reloadUsers(),
        onuserrequested: () => WorkspaceObject.GetWorkspaceData().users,
      });

      // Configure les propriétés de la barre de navigation.
      navbar.startingStates = rcmail.env['workspace_modules_visibility'] ?? {};
      navbar.setAttribute('id', `navbar-${workspace.uid}`);
      navbar.style.marginTop = '60px';
      navbar.style.marginLeft = 'var(--navbar-margin-left, 60px)';
      navbar.style.marginRight = '5px';

      // Ajoute des gestionnaires d'événements pour les boutons de la barre de navigation.
      navbar.onquitbuttonclick.push(() => {
        MelObject.Empty().unload('current_wsp');
        NavBarManager.nav.$('html').removeClass('mwsp');

        // Supprime les classes ajoutées aux frames.
        let $html;
        for (const frame of FramesManager.Instance.get_window()) {
          if (frame) {
            $html = frame.$frame[0].contentWindow.$('html').removeClass('mwsp');

            if ($html.attr('data-added'))
              $html
                .removeClass($html.attr('data-added'))
                .removeAttr('data-added');
          }
        }

        $html = null;

        // Rafraîchit les événements du calendrier si le frame existe.
        if (FramesManager.Instance.has_frame('calendar')) {
          FramesManager.Instance.get_frame('calendar')[0]
            .contentWindow.$('#calendar')
            .fullCalendar('refetchEvents');
        }

        // Supprime la barre de navigation et recharge la page.
        this.Kill(workspace.uid);
        FramesManager.Instance.switch_frame('workspace', {
          args: { _action: 'index' },
        });
      });

      // Actions pour le changement de page lorsque l'on clique sur un bouton de la barre de navigation.
      navbar.onbuttonclicked.push((task, event) => {
        this.SwitchPage(task, { event, workspace });
      });

      // Ajoute la barre de navigation avant les frames de mise en page.
      nav.$('#layout-frames').before(navbar).css('margin-left', '5px');
      navbar = null;
    }

    return this;
  }

  /**
   * Met à jour l'historique de navigation avec une nouvelle URL.
   * @param {string} url - L'URL à définir dans l'historique.
   * @private
   * @static
   * @returns {NavBarManager} L'instance de la classe pour chaînage.
   */
  static #_UpdateHistory(url) {
    // Met à jour l'historique dans la fenêtre principale et locale.
    top.history.replaceState({}, document.title, url);
    history.replaceState({}, document.title, url);

    return this;
  }

  /**
   * Change la page affichée dans l'espace de travail.
   * @param {string} task - La tâche ou page cible.
   * @param {Object} [options={}] - Options pour le changement de page.
   * @param {Event} [options.event=null] - L'événement déclencheur.
   * @param {Object} [options.workspace=null] - Données de l'espace de travail.
   * @param {Object} [options.manualConfig=null] - Configuration manuelle pour le changement.
   * @returns {Promise<void>}
   * @static
   */
  static async SwitchPage(
    task,
    { event = null, workspace = null, manualConfig = null } = {},
  ) {
    // Réinitialise la taille des modules pour éviter les conflits d'affichage.
    for (const element of document.querySelectorAll(WorkspaceModuleBlock.Tag)) {
      element.classList.remove('hidden-because-other-in-fullscreen-mode');
    }

    // Déclenche un événement avant le changement de page et récupère la configuration.
    let raw_config =
      rcmail.triggerEvent('workspace.nav.beforeswitch', { task, event }) || {};

    // Gère les promesses ou tableaux de configurations retournés par l'événement.
    if (raw_config.then) raw_config = await raw_config;
    else if (Array.isArray(raw_config)) {
      let tempConf;
      for (tempConf of raw_config) {
        if (tempConf.then) tempConf = await tempConf;

        if (tempConf?.askedTask === task) {
          raw_config = tempConf;
          break;
        }
      }
    }

    // Utilise la configuration manuelle ou la première configuration disponible.
    const config =
      manualConfig || (Array.isArray(raw_config) ? raw_config[0] : raw_config);

    // Sélectionne la tâche dans la barre de navigation actuelle.
    this.currentNavBar.select(task, { background: true });

    // Récupère les données de l'espace de travail si elles ne sont pas fournies.
    workspace ??= WorkspaceObject.GetWorkspaceData();

    // Gère les différentes tâches possibles.
    switch (task) {
      case 'home':
        await this.GoToHome(config, workspace);
        break;

      case 'settings':
      case 'workspace_params':
        this.currentNavBar.onactionclicked.call('settings');
        await FramesManager.Instance.switch_frame('workspace', {
          args: config,
          actions: ['workspace'],
        });
        break;

      case 'more':
      case 'workspace_user':
        this.currentNavBar.onactionclicked.call('more');
        await FramesManager.Instance.switch_frame('workspace', {
          args: config,
          actions: ['workspace'],
        });
        break;

      default:
        // Quitte si la configuration indique explicitement un arrêt (_break).
        if (raw_config?._break === true) break;

        // Change de frame pour la tâche demandée.
        await FramesManager.Instance.switch_frame(task, {
          args: config,
          actions: ['workspace'],
        }).then(() => {
          // Déclenche un événement après le clic sur la barre de navigation.
          rcmail.triggerEvent('workspace.navbar.onclick', {
            task,
            caller: event,
          });

          // Rafraîchit les événements du calendrier si nécessaire.
          if (task === 'calendar') {
            FramesManager.Instance.get_frame('calendar')[0]
              .contentWindow.$('#calendar')
              .fullCalendar('rerenderEvents');
          }

          // Ajoute une classe spécifique à la tâche dans le HTML de la frame.
          FramesManager.Instance.get_frame(task, { jquery: false })
            .contentWindow.$('html')
            .addClass('mwsp');

          // Applique un thème spécifique si défini pour la tâche.
          const workspace_force = FramesManager.Instance.get_frame(
            'workspace',
            { jquery: false },
          ).contentWindow.rcmail.env.workspace_force_theme;

          if (workspace_force && workspace_force[task]) {
            FramesManager.Instance.get_frame(task, { jquery: false })
              .contentWindow.$('html')
              .addClass(workspace_force[task])
              .attr('data-added', workspace_force[task]);
          }

          // Sélectionne la tâche dans la navigation principale.
          MainNav.select('workspace', { context: this.nav });
        });
        break;
    }

    // Met à jour le titre du document avec le nom de l'espace de travail.
    const useTopContext = true;
    FramesManager.Helper.window_object.UpdateDocumentTitle(
      MelObject.Empty().getLocalization('page_title', {
        plugin: 'mel_workspace',
        variables: { name: workspace.title },
      }),
      useTopContext,
    );

    // Met à jour l'historique de navigation avec les paramètres actuels.
    this.#_UpdateHistory(
      MelObject.Empty().url('workspace', {
        action: 'workspace',
        params: {
          _uid: workspace.uid,
          _page: task,
          _force_bnum: 1,
        },
        removeIsFromIframe: true,
      }),
    );
  }

  /**
   * Supprime la barre de navigation pour un espace de travail donné.
   * @param {string} uid - L'identifiant unique de l'espace de travail.
   * @static
   */
  static Kill(uid) {
    let nav = this.nav;

    // Réinitialise la marge des frames de mise en page.
    nav.$('#layout-frames').css('margin-left', EMPTY_STRING);

    // Sélectionne la barre de navigation à supprimer.
    let navbar = nav.document.querySelector(`#navbar-${uid}`);

    // Supprime tous les gestionnaires d'événements associés à la barre de navigation.
    for (const key of Object.keys(
      rcmail._handlers_ex?.['workspace.nav.beforeswitch'] || {},
    )) {
      rcmail.remove_handler_ex('workspace.nav.beforeswitch', key);
    }

    for (const key of Object.keys(
      rcmail._handlers_ex?.['workspace.navbar.onclick'] || {},
    )) {
      rcmail.remove_handler_ex('workspace.navbar.onclick', key);
    }

    // Ajoute un gestionnaire d'événements vide pour éviter les erreurs.
    top.rcmail.add_event_listener_ex('switch_frame', 'workspace', () => {});

    // Supprime l'élément de la barre de navigation du DOM.
    if (navbar) {
      navbar.remove();
      navbar = null;
    }
  }

  /**
   * Ajoute des écouteurs d'événements pour les actions avant et après un changement de page.
   * @static
   * @returns {ListenersSetter} Un objet permettant de définir les écouteurs.
   */
  static AddEventListener() {
    return {
      /**
       * Définit un écouteur pour les actions avant un changement de page.
       * @param {OnBeforeSwitchCallback} callback - La fonction à exécuter avant le changement.
       * @param {string} task - La tâche ou page cible.
       * @returns {ListenersSetter} L'objet `ListenersSetter` pour chaînage.
       */
      OnBeforeSwitch(callback, task) {
        rcmail.add_event_listener_ex(
          'workspace.nav.beforeswitch',
          task,
          callback,
        );
        return this;
      },

      /**
       * Définit un écouteur pour les actions après un changement de page.
       * @param {OnAfterSwitchCallback} callback - La fonction à exécuter après le changement.
       * @param {string} task - La tâche ou page cible.
       * @returns {ListenersSetter} L'objet `ListenersSetter` pour chaînage.
       */
      OnAfterSwitch(callback, task) {
        rcmail.add_event_listener_ex(
          'workspace.navbar.onclick',
          task,
          callback,
        );
        return this;
      },

      // Référence à la classe parente pour un accès direct.
      parent: this,
    };
  }

  /**
   * Masque la barre de navigation actuelle.
   * @static
   * @returns {NavBarManager} L'instance de la classe pour chaînage.
   */
  static Hide() {
    this.currentNavBar.hide();
    return this;
  }

  /**
   * Affiche la barre de navigation actuelle.
   * @static
   * @returns {NavBarManager} L'instance de la classe pour chaînage.
   */
  static Show() {
    this.currentNavBar.show();
    return this;
  }

  /**
   * Attend que la barre de navigation soit complètement chargée.
   * @param {Object} [param0={}] - Paramètres optionnels.
   * @param {number} [param0.waiting_time=5] - Temps d'attente en secondes. Utilisez `Infinity` pour un temps d'attente infini.
   * @returns {Promise<boolean>} Indique si la barre de navigation est chargée ou non.
   * @async
   * @static
   */
  static async WaitLoading({ waiting_time = 5 } = {}) {
    // Attend que la barre de navigation soit disponible.
    if (!NavBarManager.currentNavBar)
      await Mel_Promise.wait(() => !!NavBarManager.currentNavBar, waiting_time);

    return !!NavBarManager.currentNavBar;
  }
}
