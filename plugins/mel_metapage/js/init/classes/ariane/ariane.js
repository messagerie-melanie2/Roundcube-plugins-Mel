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

        // addEventListener(key, listener)
        // {
        //     if (this.listeners[key] === undefined)
        //         this.listeners[key] = [listener];
        //     else
        //         this.listeners[key].push(listener);
        // }

        // triggerEvent(key, ...args)
        // {
        //     if (this.listeners[key] === null || this.listeners[key] === undefined)
        //         return;

        //     for (let index = 0; index < this.listeners[key].length; index++) {
        //         const element = this.listeners[key][index];
        //         element(...args);
        //     }
        // }

        // async post_message(datas)
        // {
        //     $("iframe.mm-frame").each((i,e) => {
        //         e.contentWindow.postMessage(datas);
        //     });
        // }

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
            let querry = $("#user-dispo");
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
    }


    window.ariane_reinit = () => {return new Ariane(true);};
    window.new_ariane = (ariane) => new Ariane(false, ariane);
    window.ariane = new Ariane(true);

})();
