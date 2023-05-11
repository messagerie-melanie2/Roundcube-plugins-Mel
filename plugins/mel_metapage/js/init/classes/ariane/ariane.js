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
          click: function () {
            var message = document.getElementById('custom_status_input').value;
            var status = document.getElementById('custom_status_dropdown').value;
            ariane.set_update_status(status, message)
            $(this).dialog('destroy');
          }
        }]

        // Display the popup dialog
        rcmail.show_popup_dialog(html, rcmail.gettext('mel_metapage.change_status'), buttons, {resizable: false, draggable: false});

      }
}


(async () => {
    const delay = ms => new Promise(res => setTimeout(res, ms));
    const isAsync = myFunction => myFunction.constructor.name === "AsyncFunction";
    const wait = async function (func, waitTime = 500)
    {
        while ((isAsync(func) ? await func() : func()))
        {
            await delay(waitTime);
        }
    }
    await wait(() => window.mel_metapage === undefined);

    class Ariane
    {
        constructor(load, ariane = null)
        {
            this.listeners = {};
            this.init(ariane);
            if (load && ariane === null)
            {
                this.load();
            }
        }

        init(ariane = null)
        {
            this.unreads = (ariane === null ? {} : ariane.unreads);
            this._some_unreads = ariane === null ? undefined : ariane._some_unreads;
        }

        update_channel(event)
        {
            const datas = event.data.data;
            if (datas.unread != this.unreads[datas.name])
            {
                this.unreads[datas.name] = datas.unread;
                mel_metapage.Storage.set("ariane_datas", this);
            }

        }

        update_unread_change(event)
        {
            const datas = event.data.data;
            this._some_unreads = datas === "•";
            mel_metapage.Storage.set("ariane_datas",this);
        }

        have_unreads()
        {
            return this._some_unreads === true;
        }

        update_status(status)
        {
            let querry = $(".ariane-user-dispo");
            querry.removeClass("logout")
            .removeClass("ok")
            .removeClass("busy")
            .removeClass("nothere")

            switch (status) {
                case "online":
                    querry.addClass("ok");
                    break;
                case "away":
                    querry.addClass("nothere");
                    break;
                case "busy":
                    querry.addClass("busy");
                    break;
                case "offline":
                    querry.addClass("logout");
                    break;
                default:
                    break;
            }
        }

        update()
        {
            try {
                this.load(false);
                this.update_menu();
                side_notification.chat.wsp(null, rcmail.env.task === 'workspace' && (rcmail.env.action === '' || rcmail.env.action === 'index'));
            } catch (error) {
                // console.error('###[update]', error);
            }
        }

        getPersonalUnreads()
        {            
            let val = 0;

            if (this.unreads !== null && this.unreads !== undefined)
            {     
                for (const key in this.unreads) {
                    if (Object.hasOwnProperty.call(this.unreads, key)) {
                        const element = this.unreads[key];
                        val += element;
                    }
                }
            }

            return val;
        }

        getChannel(channel)
        {
            return (this.unreads !== null && this.unreads !== undefined ? (this.unreads[channel] ?? 0) : 0);
        }

        update_menu()
        {
            try {
                side_notification.chat.menu();
            } catch (error) {
                
            }
        }

        load(update = true)
        {
            this.lastRoom = mel_metapage.Storage.get("ariane.lastRoom");
            this.init(mel_metapage.Storage.get("ariane_datas"));
            if(update) this.update();
        }

        setLastRoom(event, save = true)
        {
            let lastRoom;

            if (event.name === undefined || event.name === null)
                lastRoom = {
                    name:"private_conv",
                    public:false,
                    isNull:true
                }
            else
            {

                lastRoom = {
                    name:event.name,
                    isNull:false
                };

                switch (event.t) {
                    case "c":
                        lastRoom.public = true;
                        break;
                    case "p":
                        lastRoom.public = false;
                        break;
                    default:
                        lastRoom.public = false;
                        lastRoom.isNull = true;
                        break;
                }
            }

            if (save)   
                mel_metapage.Storage.set("ariane.lastRoom", lastRoom);

            this.lastRoom = lastRoom;

            return lastRoom;
        }

        getLastRoom()
        {
            if (this.lastRoom === null || this.lastRoom === undefined)
                this.lastRoom = mel_metapage.Storage.get("ariane.lastRoom");

            return this.lastRoom;
        }

        goLastRoom(frame)
        {
            const lastRoom = this.getLastRoom();

            if (lastRoom !== null && lastRoom !== undefined && !lastRoom.isNull)
            {
                (frame.val !== undefined ? frame[0] : frame).contentWindow.postMessage({
                    externalCommand: 'go',
                    path: `/${(lastRoom.public ? "channel" : "group")}/${lastRoom.name}`
                  }, '*');
            }
        }

        async get_status() {
            let status_datas = {
                status:undefined,
                message:''
            }
            await mel_metapage.Functions.get(
                mel_metapage.Functions.url('discussion', 'get_status'),
                {},
                (datas) => {
                    if ("string" === typeof datas) datas = JSON.parse(datas);
                    console.log('datas', datas);
                    status_datas.status = datas.content.status;
                    status_datas.message = datas.content.message || '';
                }
            );
        
            return status_datas;
        }
        
        async set_status(status, message) {
            await mel_metapage.Functions.post(
                mel_metapage.Functions.url('discussion', 'set_status'),
                {
                    _st:status,
                    _msg:message
                },
                (datas) => {
                    if ("string" === typeof datas) datas = JSON.parse(datas);
                }
            );
        }

        async set_update_status(status, message) {
          await this.set_status(status, message);

          //Change le status dans le bnum
          this.update_status(status);
        }

        set_custom_status() {
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
            click: function () {
              var message = document.getElementById('custom_status_input').value;
              var status = document.getElementById('custom_status_dropdown').value;
              ariane.set_update_status(status, message)
              $(this).dialog('destroy');
            }
          }]

          // Display the popup dialog
          rcmail.show_popup_dialog(html, rcmail.gettext('mel_metapage.change_status'), buttons, {resizable: false, draggable: false});

        }
    }


    // window.ariane_reinit = () => {return new Ariane(true);};
    // window.new_ariane = (ariane) => new Ariane(false, ariane);
    // window.ariane = new Ariane(true);

})();
