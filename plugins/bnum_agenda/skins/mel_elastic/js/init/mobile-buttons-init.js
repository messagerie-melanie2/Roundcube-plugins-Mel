import ABaseMelObject from '../../../../../mel_metapage/js/lib/base_mel_object.js';
import { BnumLog } from '../../../../../mel_metapage/js/lib/classes/bnum_log.js';

export class ModuleInitMobileButtons extends ABaseMelObject {
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
    return this.#_setupMobileButton('bnumelasticback', {
      howToAdd(element, targetParent) {
        targetParent.prepend(element);
      },
    }).#_setupMobileButton('bnumelasticother');
  }

  #_setupMobileButton(
    id,
    {
      targetSelector = '#calendar .fc-toolbar .fc-center',
      howToAdd = (element, targetParent) => targetParent.appendChild(element),
    } = {},
  ) {
    const node = document.getElementById(id);

    if (node) {
      const targetParent = document.querySelector(targetSelector);

      if (targetParent) {
        howToAdd(node, targetParent);

        requestAnimationFrame(() => {
          function updateChildren(current) {
            for (const children of current.children ?? []) {
              if (children && children.style && children.hasAttribute) {
                if (children.hasAttribute('data-block-after-init')) {
                  const attrValue = children.getAttribute(
                    'data-block-after-init',
                  );
                  children.style.display = attrValue;
                  children.classList.add(`force-${attrValue}`);
                  children.removeAttribute('data-block-after-init');
                } else children.style.display = null;
              }

              if (children.children) updateChildren(children);
            }
          }

          updateChildren(node);
        });
      } else
        BnumLog.error(
          'bnum_agenda/ModuleInitMobile',
          `Impossible de trouver ${targetSelector} !`,
          node,
          targetParent,
          this,
        );
    } else
      BnumLog.error(
        'bnum_agenda/ModuleInitMobile',
        `Impossible de trouver #${id} !`,
        node,
        this,
      );

    return this;
  }
}
