import { EMPTY_STRING } from '../../../../plugins/mel_metapage/js/lib/constants/constants';
import { HTMLBnumHeader } from '../../design-system/ds-module-bnum';
import { ABaseModule } from '../core/ABaseModule';

/**
 * Module UI transverse regroupant les ajustements globaux de la skin
 * `mel_elastic` : nettoyage de boutons Roundcube devenus inutiles, mise à
 * jour du titre du header au changement de frame, et réajustement des
 * marges du titre de header au redimensionnement de la fenêtre.
 *
 * @extends ABaseModule
 */
export class Global extends ABaseModule {
  /**
   * Verrou anti-rebond pour le gestionnaire de redimensionnement, afin de
   * ne recalculer les headers qu'une fois par frame d'animation.
   *
   * @type {boolean}
   */
  #_isResize = false;

  constructor() {
    super();
  }

  /**
   * Étape d'initialisation du cycle de vie : met en place les écouteurs puis
   * supprime les boutons Roundcube devenus inutiles.
   *
   * @override
   * @protected
   */
  _p_init() {
    this.#_addListeners().#_removeUselessRcButtons();
  }

  /**
   * Supprime les boutons que l'on n'utilise plus dans Roundcube.
   *
   * @returns {this} L'instance courante, pour chaînage.
   * @private
   */
  #_removeUselessRcButtons() {
    /**
     * @type {Array<string | {selector:string, removeParent: boolean}>}
     */
    const buttonsToRemove = [
      // Bouton créerun email, il pose problème en mode mobile et existe déjà de toute façon
      { selector: '#toolbar-menu a.compose', removeParent: true },
    ];

    /**
     * @type {HTMLElement}
     */
    let element;
    for (const item of buttonsToRemove) {
      element = document.querySelector(
        typeof item === 'string' ? item : item.selector,
      );

      if (!element) continue;

      if (item?.removeParent) element = element?.parentElement;

      element?.remove?.();
      element = null;
    }

    return this;
  }

  /**
   * Ajoute les écouteurs globaux du module.
   *
   * @returns {this} L'instance courante, pour chaînage.
   * @private
   */
  #_addListeners() {
    return this.#_onResize().#_onSwitchChange();
  }

  /**
   * Met à jour le titre du header en fonction de la frame (tâche) courante,
   * à chaque changement de frame.
   *
   * @returns {this} L'instance courante, pour chaînage.
   * @private
   */
  #_onSwitchChange() {
    return this.listen('switch_frame', (args) => {
      const { task } = args;

      const element = this.#_getCurrentTaskButton(task);

      if (element) {
        const header = this.#_getHeaderTopBar();

        if (header) {
          const currentTask = this.#_getCurrentTaskName(element);

          this.#_setPageHeader(header, currentTask);
        }
      }
    });
  }

  /**
   * Positionne le titre de page sur le header : utilise le `<h1>` existant
   * s'il y en a un, sinon délègue à `setPageTitle` du composant.
   *
   * @param {HTMLBnumHeader} header  Composant header sur lequel positionner le titre.
   * @param {string}         currentTask Nom de la tâche courante à afficher comme titre.
   * @private
   */
  #_setPageHeader(header, currentTask) {
    const h1 = header.querySelector('h1');

    if (h1) h1.innerText = currentTask;
    else header.setPageTitle(currentTask);
  }

  /**
   * Extrait le nom lisible de la tâche à partir du bouton du menu de tâches,
   * en ignorant la dernière ligne de texte (icône/retour à la ligne). Si le
   * texte extrait est vide, retente sur un éventuel élément interne `.inner`.
   *
   * @param {HTMLElement} element Élément du bouton de tâche dans le menu.
   * @returns {string} Le nom de la tâche courante.
   * @private
   */
  #_getCurrentTaskName(element) {
    const currentTask =
      element.innerText?.split?.('\n')?.slice?.(0, -1)?.join?.('') ||
      element.innerText;

    if (currentTask === EMPTY_STRING && element.querySelector('.inner'))
      return this.#_getCurrentTaskName(element.querySelector('.inner'));

    return currentTask;
  }

  /**
   * Récupère le bouton du menu de tâches correspondant à une tâche donnée.
   *
   * @param {Readonly<string>} task Nom de la tâche recherchée.
   * @returns {?HTMLElement} Le bouton correspondant, ou `null` si introuvable.
   * @private
   */
  #_getCurrentTaskButton(task) {
    return document.querySelector(`#taskmenu li a[data-task="${task}"]`);
  }

  /**
   * Récupère le composant header de la barre supérieure (`bnum-header.barup`).
   *
   * @returns {?HTMLBnumHeader} Le composant header, ou `null` si absent du DOM.
   * @private
   */
  #_getHeaderTopBar() {
    return document.querySelector(`${HTMLBnumHeader.TAG}.barup`);
  }

  /**
   * Écoute l'évènement `resize` de `window` et déclenche le recalcul des
   * headers au prochain `requestAnimationFrame`, en ignorant les
   * déclenchements successifs tant qu'un recalcul est déjà planifié.
   *
   * @returns {this} L'instance courante, pour chaînage.
   * @private
   */
  #_onResize() {
    window.addEventListener('resize', () => {
      if (this.#_isResize) return;
      this.#_isResize = true;
      requestAnimationFrame(() => {
        this.#_isResize = false;
        this.#_resizeHeaders();
      });
    });

    return this;
  }

  /**
   * Recalcule et applique les marges du titre de chaque header de layout
   * (`.header`), afin que celui-ci reste correctement centré compte tenu du
   * nombre et de la largeur des boutons présents de part et d'autre.
   *
   * @private
   */
  #_resizeHeaders() {
    const SELECTOR =
      '#layout > main > div > .header, #layout > main > bnum-column > .header';
    $(SELECTOR).each(function () {
      var title,
        right = 0,
        left = 0,
        padding = 0,
        sizes = { left: 0, right: 0 };

      $(this)
        .children(':visible:not(.position-absolute)')
        .each(function () {
          if (!title && $(this).is('.header-title')) {
            title = $(this);
            return;
          }

          sizes[title ? 'right' : 'left'] += this.offsetWidth;
        });

      if (padding + sizes.right >= sizes.left) {
        right = 0;
        left = sizes.right + padding - sizes.left;
      } else {
        left = 0;
        right = sizes.left - (padding + sizes.right);
      }

      $(title).css({
        'margin-right': right + 'px',
        'margin-left': left + 'px',
        'padding-right': padding + 'px',
      });
    });
  }

  /**
   * Ce module n'a pas de logique à exécuter pour les étapes `main` et
   * `after` du cycle de vie — toute l'initialisation se fait dans `_p_init`.
   *
   * @override
   * @returns {import('../core/ABaseModule').LifeCycle[]} Les cycles de vie à ignorer.
   * @protected
   */
  static _p_ignoreLifeCycles() {
    return ['main', 'after'];
  }
}
