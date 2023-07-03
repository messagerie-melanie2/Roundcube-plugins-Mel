class ChatHelper {
    static async _Module() {
        return await loadJsModule('mel_metapage', 'chatManager', '/js/lib/chat/');
    }

    static async Manager() {
        return (await this._Module()).ChatManager.Instance();
    }

    static async ManagerCallback() {
        return (await this._Module()).ChatCallback;
    }

    static async Chat() {
        return (await this.Manager()).chat();
    }

    static async Top() {
        return (await loadJsModule('mel_metapage', 'Top')).Top;
    }

    static OpenCustomStatusModal() {
        let html = '<div class="d-flex">'+
          '<input type="text" id="custom_status_input" placeholder="Que faites-vous en ce moment ?">'+
          '<select id="custom_status_dropdown">' +
          '<option value="online">Disponible</option>' +
          '<option value="away">Absent</option>' +
          '<option value="busy">Ne pas déranger</option>' +
          '<option value="offline">Hors ligne</option>' +
          '</select>'+
      '</div>';

        let buttons = [
        {
          text: 'Annuler',
          click: function () {
            $(this).dialog('destroy');
          }
        },
        {
          text: 'Enregistrer',
          class: 'btn btn-primary border-0 text-light',
          click: async function () {
            const manager = await ChatHelper.Manager();
            var message = document.getElementById('custom_status_input').value;
            var status = document.getElementById('custom_status_dropdown').value;
            manager.setStatus(status, message);
            $('.user-menu-info').text(message);
            $(this).dialog('destroy');
          }
        }]

        // Display the popup dialog
        rcmail.show_popup_dialog(html, rcmail.gettext('mel_metapage.change_status'), buttons, {resizable: false, draggable: false});

      }
}
