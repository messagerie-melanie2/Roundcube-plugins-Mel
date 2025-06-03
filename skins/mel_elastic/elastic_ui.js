import { EMPTY_STRING } from '../../plugins/mel_metapage/js/lib/constants/constants.js';
import {
  REG_MAIL_NAME_GLOBAL,
  REG_MAILTO,
} from '../../plugins/mel_metapage/js/lib/constants/regexp.js';

$(document).ready(() => {
  if (window.UI) {
    //Ajout de l'action des éléments custom
    window.UI._action_element_select = function _action_element_select(
      bound_contact,
      bound_mailto,
      tag,
      e,
    ) {
      const props = {
        tag,
        contact: bound_contact,
        mailto: bound_mailto,
        clickEvent: e,
        element: e.target,
      };
      //Soit on utilise une commande
      if (e.target.hasAttribute('data-command')) {
        rcmail.command(e.target.getAttribute('data-command', props));
      }
      //Soit on passe par un triggerevent
      else {
        rcmail.triggerEvent('ui.mailtomenu.click', props);
      }
    };

    //Etendre ui_mailtomenu pour prendre en compte les boutons custom
    const ui_mailtomenu = window.UI.mailtomenu;
    window.UI.mailtomenu = function (obj, button, event, onclick) {
      var contact, txt, element;
      var mailto = $(button).attr('href').replace(REG_MAILTO, EMPTY_STRING);

      if (mailto.indexOf('@') < 0) {
        return true; // let the browser handle this
      }

      contact = mailto;
      txt = $(button).filter('.rcmContactAddress').text();

      contact = contact
        .split('?')[0]
        .split(',')[0]
        .replace(REG_MAIL_NAME_GLOBAL, EMPTY_STRING);

      if (txt) {
        txt = txt.replace(`<${contact}>`, EMPTY_STRING);
        contact = `"${txt.trim()}" <${contact}>`;
      }

      for (element of $('[data-tag]', obj)) {
        element.onclick = this._action_element_select.bind(
          this,
          contact,
          mailto,
          element.getAttribute('data-tag'),
        );
      }

      return ui_mailtomenu.call(this, obj, button, event, onclick);
    };

    //Supprimer les anciens click event pour les remplacer par le notre
    if (rcmail.env.action === 'preview' || rcmail.env.action === 'show') {
      $('a')
        .filter('[href^="mailto:"]')
        .each(function () {
          var item = this;
          var onclick = item.onclick;
          item.onclick = null;
          $(item)
            .off('click')
            .on('click', function (e, menu) {
              return (
                menu ||
                window.UI.mailtomenu($('#mailto-menu'), item, e, onclick)
              );
            });
        });
    }
  }
});
