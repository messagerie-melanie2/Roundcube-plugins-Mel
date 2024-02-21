
import { RcmailDialog, RcmailDialogButton } from "../../../mel_metapage/js/lib/classes/modal.js";
import { MelHtml } from "../../../mel_metapage/js/lib/html/JsHtml/MelHtml.js";
import { MelObject } from "../../../mel_metapage/js/lib/mel_object.js";
import { MelLink, MelLinkVisualizer } from "./mel_link.js";


export class LinkManager extends MelObject {
  constructor () {
    super();
  }

  main() {
    super.main();

    this.displayLinks();

    this.bindActions();
  }

  /**
   * Créé la modale de création d'un nouveau lien
   */
  openLinkModal(id = null, title = null, url = null) {
    if (this.newLinkModal) {
      this.newLinkModal.show();
      this.getModalValue(id, title, url);

      this.bindModalActions();
    }
    else {
      const html = MelHtml.start
      .row({class: 'mx-2'})
        .span({ class: "text-danger" })
          .text('*')
        .end()
        .text(rcmail.gettext('required_fields', 'mel_useful_link'))
      .end()
      .input({id: "mulc-id", type: 'hidden', value: id})
      .row({class: 'mx-2'})
        .label({class: "span-mel t1 first", for:'mulc-title'})
          .span({ class: "text-danger" })
            .text('*')
          .end()
          .text(rcmail.gettext('link_name', 'mel_useful_link'))
        .end()
        .input({id: "mulc-title", class: 'form-control input-mel required', required:true, placeholder: rcmail.gettext('link_title','mel_useful_link'), value: title})
      .end()
      .row({class: 'mx-2'})
        .label({class: "span-mel t1 first", for:'mulc-url'})
          .span({ class: "text-danger" })
            .text('*')
          .end()
          .text(rcmail.gettext('link_url','mel_useful_link'))
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
        title: rcmail.gettext('create_new_link','mel_useful_link'), buttons: [
          new RcmailDialogButton( id ? rcmail.gettext('update','mel_useful_link') : rcmail.gettext('add','mel_useful_link'), { id: 'add-mel-link', classes: 'add-mel-link mel-button btn btn-secondary', click: () => { this.addMelLink(); } }),
        ]
      });
      if(url) {this.displayIcon(url);}
      this.bindModalActions();
    }
  }

  /**
   * Affiche les liens sur la page web
   */
  displayLinks() {
    let links_array = [];
    for (const links in rcmail.env.mul_items) {
      let link = rcmail.env.mul_items[links];
      link = JSON.parse(link);
      const linkVisualizer = new MelLinkVisualizer(link.configKey, link.title, link.link, this.fetchIcon(link.link));
      links_array.push(linkVisualizer);

      linkVisualizer.displayLink().appendTo(".links-items");
    }

    $('<li class="link-space-end"></li>').appendTo('.links-items');
    this.bindRightClickActions();
    rcmail.env.mul_items = links_array;
  }

  /**
   * Affiche un lien sur la page web
   */
  displayLink(link) {
    const linkVisualizer = new MelLinkVisualizer(link.id, link.title, link.link, this.fetchIcon(link.link));
    linkVisualizer.displayLink().appendTo(".links-items");

    this.bindRightClickActions(linkVisualizer.id);
    this.bindActions(linkVisualizer.id);
    rcmail.env.mul_items.push(linkVisualizer)
  }


  addMelLink() {
    let link = rcmail.env.mul_items.find(function(objet) {
      if ($(LinkManager.SELECTOR_MODAL_ID).val()) {
        return objet.id === $(LinkManager.SELECTOR_MODAL_ID).val();
      }
      else {
        return false;
      }
    });

    if (!$(LinkManager.SELECTOR_MODAL_ID).val()) {
      link = new MelLink($(LinkManager.SELECTOR_MODAL_ID).val(), $(LinkManager.SELECTOR_MODAL_TITLE).val(), $(LinkManager.SELECTOR_MODAL_URL).val());
    }
    else {
      link.title = $(LinkManager.SELECTOR_MODAL_TITLE).val();
      link.link = $(LinkManager.SELECTOR_MODAL_URL).val();
      link.icon =  this.fetchIcon($(LinkManager.SELECTOR_MODAL_URL).val());
    }
    // link.callUpdate();
    link.callUpdate().then((data) => {
      if(data !== link.id) {
        link.id = data;
        this.displayLink(link);
      }
      this.newLinkModal.hide();
    });
  }

  deleteMelLink(id) {
    const link = new MelLink(id, null, null);

    if (confirm(rcmail.gettext('confirm_delete_link_element', "mel_useful_link"))) {
      link.callDelete();
    }
  }
  
  /**
   * Bind des actions liés aux liens
   */
  bindActions(id = null) {
    let self = this;
    let _id = id ? `#link-block-${id} ` : '';

    if (!id) { 
      $(LinkManager.CREATE_BUTTON).on('click', function () {
        self.openLinkModal();
      });
    }

    $(_id + LinkManager.COPY_LINK).on('click', function (e) {
      mel_metapage.Functions.copy($(e.currentTarget).attr('data-link'));
    });

    $(_id + LinkManager.MODIFY_LINK).on('click', function (e) {
      self.openLinkModal($(e.currentTarget).attr('data-id'), $(e.currentTarget).attr('data-title'), $(e.currentTarget).attr('data-link'));
    });
    
    $(_id + LinkManager.DELETE_LINK).on('click', function (e) {
      self.deleteMelLink($(e.currentTarget).attr('data-id'));
    });


    
    document.addEventListener('dragenter', function(event) {
      if (event.target.classList.contains('link-space-between')) {
        event.target.classList.add('link-space-hovered');
      }
      if (event.target.closest('.link-block')) {
        event.target.closest('.link-block').classList.add('link-block-hovered');
      }
    });
    document.addEventListener('dragleave', function(event) {
      if (event.target.classList.contains('link-space-between')) {
        event.target.classList.remove('link-space-hovered');
      }
      if (event.target.closest('.link-block.link-block-hovered')) {
        event.target.closest('.link-block.link-block-hovered').classList.remove('link-block-hovered');
      }
    });
    document.addEventListener(
      "dragover",
      function (event) {
        // Empêche le comportement par défaut afin d'autoriser le drop
        event.preventDefault();
      },
      false,
    );

    document.addEventListener('drop', function(event) {
      let id = event.dataTransfer.getData("text/plain");
      let movedElement = $('#link-block-'+ id);
      let movedSpace = $(movedElement).prev('li');

      //On déplace l'élément 
      if (event.target.classList.contains('link-space-between')) {
        event.target.classList.remove('link-space-hovered');
        $(event.target).after(movedSpace);
        $(event.target).after(movedElement);

        self.updateList(id, $('li.link-block').index(movedElement));
      }
      else if (event.target.classList.contains('link-space-end')) {
        $(event.target).before(movedSpace);
        $(event.target).before(movedElement);

        self.updateList(id, $('li.link-block').index(movedElement));
      }
      //On créer un dossier 
      else {
        event.target.closest('.link-block.link-block-hovered').classList.remove('link-block-hovered');
      }
    });
  }

  updateList(id, newIndex) {
    const busy = rcmail.set_busy(true, "loading");
    rcmail.env.mul_items.find(function(object, index) {
      if (object.id == id) {
        //On met l'objet dans la bonne position après le déplacement
        rcmail.env.mul_items.splice(newIndex, 0, rcmail.env.mul_items.splice(index, 1)[0]);
        return mel_metapage.Functions.post(mel_metapage.Functions.url("useful_links", "update_list"),
        { _list: rcmail.env.mul_items },
        (datas) => {
          rcmail.set_busy(false, 'loading', busy);
        });
      }
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

  bindRightClickActions(id = null) {
    let _id = id ? `#link-block-${id}` : '';
    let contextMenuOpened = false;
    // Open the context menu on right-click
    $(_id + '.link-block').on('contextmenu', function (event) {
      event.preventDefault();

      const contextMenu = $('#context-menu-' + $(this).data('id'));

      if (contextMenuOpened) {
        contextMenuOpened.hide();
      }

      // Show the context menu
      contextMenu.show();
      contextMenuOpened = contextMenu;

      $(document).on('click', function () {
        if (!contextMenu.is(event.target) && contextMenu.has(event.target).length === 0) {
          contextMenu.hide();
          contextMenuOpened = false;
        }
      });
    });  
  }

  /**
   * Reset les informations précédentes de la modale
   */
  getModalValue(id = null, title = null, url = null) {
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

    if(id) {
      $('.add-mel-link').text(rcmail.gettext('update','mel_useful_link'));
    }
    else {
      $('.add-mel-link').text(rcmail.gettext('add','mel_useful_link'));
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