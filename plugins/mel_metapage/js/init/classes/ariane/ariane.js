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
            this.init(ariane);
            if (load && ariane === null)
            {
                this.load();
            }
        }

        init(ariane = null)
        {
            this.unreads = (ariane === null ? {} : ariane.unreads);
        }

        update_channel(event)
        {
            const datas = event.data.data;
            if (datas.unread != this.unreads[datas.name])
            {
                this.unreads[datas.name] = datas.unread;
                this.update(datas.name);
            }

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

        update(channel, store = true)
        {
            let querry = $("#wsp-notifs-wsp-" + channel);
            if (querry.find(".ariane").length === 0)
                querry.append('<div class="col-3 centered"><span class=ariane><span class="ariane-notif roundbadge lightgreen">0</span><span class="icofont-chat ariane-icon"><span></span></div>')
            querry = querry.find(".ariane-notif");
            if (this.unreads[channel] === 0)
                querry.parent().parent().css("display", "none");
            else
                querry.html(this.unreads[channel] > 99 ? "99+" : this.unreads[channel]).parent().parent().css("display", "");
            if (store)
            {
                mel_metapage.Storage.set("ariane_datas",this);
                this.update_menu();
            }
        }

        menu()
        {
            return Enumerable.from(this.unreads).select(x => x.value).sum();
        }

        update_menu()
        {
            let querry = $("a.rocket");
            if (querry.find("sup").length === 0)
                querry.append(`<sup><span id="`+mel_metapage.Ids.menu.badge.ariane+`" class="roundbadge menu lightgreen" style="">?</span></sup>`);
            querry = $("#" + mel_metapage.Ids.menu.badge.ariane);
            const menu = this.menu();
            if (menu === 0)
                querry.css("display", "none");
            else
                querry.html(menu).css("display", ""); 
        }

        load()
        {
            this.init(mel_metapage.Storage.get("ariane_datas"));
            for (const key in this.unreads) {
                if (Object.hasOwnProperty.call(this.unreads, key)) {
                    this.update(key, false);
                }
            }
            this.update_menu();
        }
    }

    window.ariane = new Ariane(true);

})();
