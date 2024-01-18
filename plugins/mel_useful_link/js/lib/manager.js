
import { RcmailDialog, RcmailDialogButton } from "../../../mel_metapage/js/lib/classes/modal.js";
import { MelHtml } from "../../../mel_metapage/js/lib/html/JsHtml/MelHtml.js";
import { MelObject } from "../../../mel_metapage/js/lib/mel_object.js";
import { MelLink } from "./mel_link.js";


export class LinkManager extends MelObject {
  constructor () {
    super();
  }

  main() {
    super.main();

    this.bindActions();
  }

  /**
   * Créé la modale de création d'un nouveau lien
   */
  openLinkModal(id = null, title = null, url = null) {
    if (this.newLinkModal) {
      this.newLinkModal.show();
      this.resetModal(id, title, url);

      this.bindModalActions();
    }
    else {
      const html = MelHtml.start
      .row({class: 'mx-2'})
        .span({ class: "text-danger" })
          .text('*')
        .end()
        .text('Champs obligatoires')
      .end()
      .input({id: "mulc-id", type: 'hidden', value: id})
      .row({class: 'mx-2'})
        .label({class: "span-mel t1 first", for:'mulc-title'})
          .span({ class: "text-danger" })
            .text('*')
          .end()
          .text('Nom du lien')
        .end()
        .input({id: "mulc-title", class: 'form-control input-mel required', required:true, placeholder: 'Titre du lien', value: title})
      .end()
      .row({class: 'mx-2'})
        .label({class: "span-mel t1 first", for:'mulc-url'})
          .span({ class: "text-danger" })
            .text('*')
          .end()
          .text('Adresse de la page')
        .end()
        .input({id: "mulc-url", class: 'form-control input-mel required', required:true, placeholder: 'URL', value: url})
      .end()
      .row({class: 'mr-1 mt-3'})
        .div({class: 'link-block'})
          .div({class: 'link-icon-container'})
            .img({ id: 'icon-image', class: 'link-icon-image', src: '', onerror: "imgError(this.id, 'no-image')", style: "display:none"})
              .span({id: 'no-image', class: 'link-icon-no-image'})
              .end()
          .end()
        .end()  
      .end()
      .generate();

      this.newLinkModal = new RcmailDialog(html, {
        title: 'Création d\'un nouveau lien', buttons: [
          new RcmailDialogButton('Ajouter', { id: 'add-mel-link', classes: 'mel-button btn btn-secondary', click: () => { this.addMelLink(); } }),
        ]
      });
      if(url) {this.displayIcon(url);}
      this.bindModalActions();
    }
  }


  addMelLink() {
    if (!$(LinkManager.SELECTOR_MODAL_TITLE)[0].reportValidity())
      return;
    if (!$(LinkManager.SELECTOR_MODAL_URL)[0].reportValidity())
      return;

    const link = new MelLink($(LinkManager.SELECTOR_MODAL_ID).val(), $(LinkManager.SELECTOR_MODAL_TITLE).val(), $(LinkManager.SELECTOR_MODAL_URL).val());

    link.callUpdate();
    // window.location.reload();
  }

  deleteMelLink(id) {
    const link = new MelLink(id, null, null);

    link.callDelete();
  }

  

  /**
   * Bind des actions liés aux liens
   */
  bindActions() {
    let self = this;
    $(LinkManager.CREATE_BUTTON).on('click', function () {
      self.openLinkModal();
    });

    $(LinkManager.COPY_LINK).on('click', function () {
      mel_metapage.Functions.copy($(this).data('url'));
    });

    $(LinkManager.MODIFY_LINK).on('click', function () {
      self.openLinkModal($(this).data('id'), $(this).data('title'), $(this).data('url'));
    });
    
    $(LinkManager.DELETE_LINK).on('click', function () {
      self.deleteMelLink($(this).data('id'));
    });
  }

  /**
   * Bind des actions liés à la modale
   */
  bindModalActions() {
    let self = this;
    $(`${LinkManager.SELECTOR_MODAL_URL},${LinkManager.SELECTOR_MODAL_TITLE}`).on('change', function () {
      if($(LinkManager.SELECTOR_MODAL_URL).val()) self.displayIcon($(LinkManager.SELECTOR_MODAL_URL).val());
    });

    $(LinkManager.SELECTOR_MODAL_IMAGE).on('error', function () {
      self.imgError($(this).attr('id'), 'no-image', $(LinkManager.SELECTOR_MODAL_TITLE).val());
    });
  }

  /**
   * Reset les informations précédentes de la modale
   */
  resetModal(id = null, title = null, url = null) {
    $(LinkManager.SELECTOR_MODAL_ID).val(id);
    $(LinkManager.SELECTOR_MODAL_TITLE).val(title);
    $(LinkManager.SELECTOR_MODAL_URL).val(url);

    if (url) {
      this.displayIcon(url);
    }
    else {
      $(LinkManager.SELECTOR_MODAL_IMAGE).attr('src', '');
      $(LinkManager.SELECTOR_MODAL_IMAGE).css("display", "none");
    }
  }

  /**
   * Affiche l'icone du lien
   * @param {string} url Url du lien
   */
  displayIcon(url) {

    $(LinkManager.SELECTOR_MODAL_NO_IMAGE).css("display", "none");
    $(LinkManager.SELECTOR_MODAL_IMAGE).css("display", "flex");
    

    const validProtocol = /^https?:\/\//i;

    if (!validProtocol.test(url)) {
      // Si le protocole n'est pas présent, ajoute 'https://' avant l'URL
      url = 'https://' + url;
    }
    else if (url == "https://") {
      url = "";
    }

    $(LinkManager.SELECTOR_MODAL_URL).val(url);

    const apiUrl = this.fetchIcon(url);

    $(LinkManager.SELECTOR_MODAL_IMAGE).attr('src', apiUrl);
  }

  /**
   * Récupère le nom de domaine de l'url pour retourner l'url de l'icone
   * @param {string} url Url du lien
   * @returns Url de l'icone
   */
  fetchIcon(url) {
    let domain = "";
    try {
      domain = new URL(url).hostname;
    } catch (error) {
      console.error('Erreur :', error.message);
      return null;
    }

    return rcmail.env.external_icon_url + domain;
  }

  /**
   * Affiche la première lettre si l'image n'est pas trouvée
   * @param {string} iconId Id de l'image
   * @param {string} iconId Id de l'overlay si l'image n'est pas chargée
   * @param {string} title Titre du lien
   */
  imgError(iconId = null, noImageId = null, title) {
    let iconImage = $('#' + iconId);
    let noImage = $('#' + noImageId);

    const firstLetter = title ? title[0].toUpperCase() : ($(LinkManager.SELECTOR_MODAL_TITLE).val() ? $(LinkManager.SELECTOR_MODAL_TITLE).val()[0].toUpperCase() : null);

    iconImage.hide();
    noImage.html(firstLetter);
    noImage.css("display", "flex");
  }
}

LinkManager.SELECTOR_MODAL_ID = '#mulc-id';
LinkManager.SELECTOR_MODAL_TITLE = '#mulc-title';
LinkManager.SELECTOR_MODAL_URL = '#mulc-url';
LinkManager.SELECTOR_MODAL_IMAGE = '#icon-image';
LinkManager.SELECTOR_MODAL_NO_IMAGE = '#no-image';
LinkManager.CREATE_BUTTON = '#mulba';
LinkManager.COPY_LINK = '.copy-link';
LinkManager.MODIFY_LINK = '.modify-link';
LinkManager.DELETE_LINK = '.delete-link';