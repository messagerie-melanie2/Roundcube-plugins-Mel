import ABaseMelObject from '../../../../mel_metapage/js/lib/base_mel_object.js';

export class VisioIndex extends ABaseMelObject {
  constructor() {
    super();

    this.#_registerListeners();
  }

  #_registerListeners() {
    this.listen('mel_metapage.create.actions', (args) => {
      const { actions } = args;

      if (!actions.visio) return args;

      actions.visio.text = this.getLocalization('a_visio', { plugin: 'visio' });

      args.actions = actions;
      return args;
    });
  }

  #_startVisio() {}
}

new VisioIndex();
