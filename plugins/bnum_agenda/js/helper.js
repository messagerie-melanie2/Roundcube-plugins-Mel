////////////////////////////////////////////////////////////////////////////////
////////////////// HELPER FUNCTIONS FOR BNUM AGENDA PLUGIN /////////////////////
////////////////////////////////////////////////////////////////////////////////
/* Liste de fonctions utilitaires en javascript sans modules. */
var bnum_modules = bnum_modules || {};
bnum_modules.agenda = bnum_modules.agenda || {};
bnum_modules.agenda.helper = bnum_modules.agenda.helper || {};

(() => {
  async function getMasterEvent(selected_event) {
    return await (
      await loadJsModule('bnum_agenda', 'lib/program/helper')
    ).AgendaHelper.Instance.getMasterEvent(selected_event);
  }

  bnum_modules.agenda.helper.getMasterEvent = getMasterEvent;
})();
