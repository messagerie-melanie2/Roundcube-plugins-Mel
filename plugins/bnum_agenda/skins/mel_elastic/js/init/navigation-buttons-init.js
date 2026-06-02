import ABaseMelObject from '../../../../../mel_metapage/js/lib/base_mel_object.js';
import { pipe } from '../../../../../mel_metapage/js/lib/helpers/pipe.js';
import {
  ButtonVariation,
  HTMLBnumSecondaryButton,
} from '../../../../../../skins/mel_elastic/design-system/ds-module-bnum.js';

export class ModuleInitNavigation extends ABaseMelObject {
  constructor() {
    super();
  }

  async onDocumentReady() {
    await this.wait_something(() =>
      document.querySelector('#calendar > .fc-toolbar > .fc-right'),
    );
    this.#_setup();
  }

  #_setup() {
    const group = document.createElement('div');
    group.setAttributeNS('bnum-agenda', 'id', 'ba-group');
    group.classList.add('group-button');

    const prev = this.#_createIconButton('.fc-prev-button', 'chevron_left');
    const today = this.#_createTextButton(
      '.fc-today-button',

      document.querySelector('.fc-today-button')?.textContent ??
        this.getLocalization('today', { plugin: 'calendar' }),
    );
    const next = this.#_createIconButton('.fc-next-button', 'chevron_right');

    group.append(prev, today, next);

    const r = document.querySelector('#calendar > .fc-toolbar > .fc-right');

    if (!r) throw new Error('Impossible de trouver le header !');

    r.appendChild(group);
  }

  #_createTextButton(originalSelector, text) {
    if (!text) throw new Error('Un text doit être défini !');

    const node = HTMLBnumSecondaryButton.Create({ text, rounded: false });

    return this.#_setupButtonComportment(originalSelector, node);
  }

  #_createIconButton(originalSelector, icon) {
    if (!icon) throw new Error('Un icône doit être définie !');

    const node = HTMLBnumSecondaryButton.CreateOnlyIcon(icon, {
      variation: ButtonVariation.SECONDARY,
      rounded: true,
    });

    return this.#_setupButtonComportment(originalSelector, node);
  }

  #_setupButtonComportment(originalSelector, node) {
    return pipe(node, this.#_setupButtonClass)
      .pipe((x) => this.#_setupButtonClickListener(x, originalSelector))
      .unpipe();
  }

  /**
   *
   * @param {HTMLBnumSecondaryButton} node
   * @returns {HTMLBnumSecondaryButton}
   */
  #_setupButtonClass(node) {
    return node.addClass('navigation-button');
  }

  /**
   *
   * @param {HTMLBnumSecondaryButton} node
   * @returns {HTMLBnumSecondaryButton}
   */
  #_setupButtonClickListener(node, originaleSelector) {
    node.addEventListener('click', () =>
      this.#_handleButtonClick(originaleSelector),
    );

    return node;
  }

  #_handleButtonClick(selector) {
    const node = document.querySelector(selector);
    if (node) node.click();
    else throw new Error(`Ìmpossible de clicker sur ${selector}`);
  }
}
