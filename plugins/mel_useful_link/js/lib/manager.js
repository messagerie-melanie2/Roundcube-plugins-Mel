
import { RcmailDialog, RcmailDialogButton, RcmailDialogChoiceButton } from "../../../mel_metapage/js/lib/classes/modal.js";
import { MelObject } from "../../../mel_metapage/js/lib/mel_object.js";


export class LinkManager extends MelObject
{
  constructor() {
    super();
  }

  main() {
    super.main();

    this.bindActions();    
  }

  openNewLinkModal() {
    const html = MelHtml.start
        .row()
          .span({ class: "text-danger" })
            .text('*')
          .end()
          .text('Champs obligatoires')
        .end()
        .row()
          .label({class: "span-mel t1 first", for:'mulc-title'})
            .span({ class: "text-danger" })
              .text('*')
            .end()
            .text('Nom du lien')
          .end()
          .input({id: "mulc-title", class: 'form-control input-mel required', required:true, placeholder: 'Titre du lien'})
        .end()
        .row()
          .label({class: "span-mel t1 first", for:'mulc-url'})
            .span({ class: "text-danger" })
              .text('*')
            .end()
            .text('Adresse de la page')
          .end()
          .input({id: "mulc-url", class: 'form-control input-mel required', required:true, placeholder: 'URL'})
        .end()
        .generate();

    new RcmailDialog(html, {title: 'Création d\'un nouveau lien', buttons: [ new RcmailDialogButton('Ajouter',{classes: 'mel-button btn btn-secondary', click: 'addMelLink()'})]} );
  }

  addMelLink() {
    if (!$("#mulc-title")[0].reportValidity())
    return;
    if (!$("#mulc-url")[0].reportValidity())
        return;

    const link = new MelLink($("#mulc-id").val(), $("#mulc-title").val(), $("#mulc-url").val());
    const busy = rcmail.set_busy(true, 'loading');

    link.callUpdate(task, action, addonConfig).then((result) => {
      if (afterCreate !== null)
          afterCreate(result);
      else {

        if (result === true)
            window.location.reload();
        else
            this.setLinkEditor(link);
      }

      rcmail.set_busy(false, 'loading', busy);
    });
  }  

  bindActions() {
    $('#mulba').on('click', function() {
      const linkManager = new LinkManager();
      linkManager.openNewLinkModal();
    });
  }
}
