import ABaseMelObject from '../../../../mel_metapage/js/lib/base_mel_object';

export class BnumModuleInitEventCleaner extends ABaseMelObject {
  constructor() {
    super();
    this.#_setup();
  }

  async #_setup() {
    await new Promise((resolve) => {
      setTimeout(() => resolve(this.#_removeTemplateEnvs()), 1);
    });
  }

  #_getRcEnvs() {
    return this.rcmail()?.env ?? {};
  }

  #_removeTemplateEnvs() {
    const envs = this.#_getRcEnvs();

    for (const key of Object.keys(envs)) {
      if (key.includes('_template_')) delete envs[key];
    }
  }
}
