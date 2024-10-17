import { WorkspaceObject } from './WorkspaceObject.js';

export class WorkspacePage extends WorkspaceObject {
  get firstRow() {
    return this.#_get_row(1);
  }

  get secondRow() {
    return this.#_get_row(2);
  }

  get thirdRow() {
    return this.#_get_row(3);
  }

  get fourthRow() {
    return this.#_get_row(4);
  }

  get otherRow() {
    return this.#_get_row();
  }

  constructor() {
    super();
  }

  main() {
    super.main();

    $('#layout-content').css({ overflow: 'auto', height: '100%' });

    top.history.replaceState(
      {},
      document.title,
      this.url('workspace', {
        action: 'workspace',
        params: {
          _uid: this.workspace.uid,
          _force_bnum: 1,
        },
        removeIsFromIframe: true,
      }),
    );
  }

  #_get_row(number = 0) {
    switch (number) {
      case 1:
        number = 'first';
        break;

      case 2:
        number = 'second';
        break;

      case 3:
        number = 'third';
        break;

      case 4:
        number = 'fourth';
        break;

      default:
        number = 'other';
        break;
    }

    return this.select(`#${number}-row`);
  }
}
