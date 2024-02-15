class WSPNotification
{
    constructor(notifClass, key, post, classToReplace,funcCount, date_key = null, eventListener = null)
    {
        this.notif = $("." + notifClass);//.addClass("");
        //console.log('update', this.notif, notifClass,  $("." + notifClass), "." + notifClass);
        this.notif.update = function (item, func)
        {
            //console.log("update", this, item, func);
            this.each((i,e) => {
                e = $(e);
                const id = e.parent().parent().parent()[0].id.replace("wsp-notifs-wsp-", "").replace("-epingle", "");
                const value = func(item, id);
                if (value === 0)
                    e.css("display", "none").parent().parent().css("display", "none");
                else
                {
                    e.html(value);
                    e.css("display", "").parent().parent().css("display", "");
                }
            });
            return this;
        };
        // this.icon = notif.parent();
        // this.parent = icon.parent();
        this.key = key;
        this.post = post;
        this.date_key = date_key;
        this.count = funcCount;
        this.notif.parent().find(".replacedClass").removeClass("replacedClass").addClass(classToReplace).addClass("ariane-icon");
        const listener = "WSPNotification.Update." + notifClass;
        rcmail.addEventListener(listener, () => {
            //console.log(listener, this);
            this.update();
        });
        WSPNotification.add_to_refresh((eventListener === null ? "WSPNotification." + notifClass : eventListener), 
        "() => WSPNotification.update_notifications(`"+listener+"`)");

        this.falseKey = null;
    }

    async update(force = false)
    {
        let valueChecked = false;
        try {
            let item = mel_metapage.Storage.get(this.key);
            if (item === null || this.check_date() ||force)
            {
                valueChecked = true;
                item = await this.update_value();
            }
            //console.log("UPDATE 2", item, this.check_date(), force, this.key);
            this.notif.update(item, this.count);
        } catch (error) {
            console.error("update", error);
        }

        return valueChecked;
        // if(item === 0)
        //     this.parent.css("display", "none");
        // else
        // {
        //     this.parent.css("display", "");
        //     this.notif.html(item);
        // }
    }

    check_date()
    {
        if (this.date_key !== null)
            return moment().startOf("day").format() !== moment(mel_metapage.Storage.get(this.date_key)).startOf("day").format();
        else
            return false;
    }

    async update_value()
    {

        mel_metapage.Storage.remove(this.falseKey === null ? this.key : this.falseKey);
        window.workspaces.sync.PostToParent({
            exec:this.post
        });
        await wait(() => mel_metapage.Storage.get(this.falseKey === null ? this.key : this.falseKey) === null);
        
        if (this.falseKey !== null)
            mel_metapage.Storage.remove(this.falseKey);

        return mel_metapage.Storage.get(this.key);
        
    }
}

WSPNotification.add_to_refresh = function(listener, func)
{
    window.workspaces.sync.PostToParent({
        exec:"WSPNotification.AddEventListener('"+listener+"', "+func+");",
        child:false,
    });
}

WSPNotification.AddEventListener = function(listener, func)
{
    //console.log("WSPNotification.AddEventListener", listener, func, rcmail._events[listener], Enumerable.from(rcmail._events[listener]).where(x => "" + x.func === "" + func).count());
    if (!Enumerable.from(rcmail._events[listener]).where(x => "" + x.func === "" + func).any())
        rcmail.addEventListener(listener, func);
}

WSPNotification.update_notifications = function (trigger)
{
    //console.log("update_notifications", "rcmail.triggerEvent(`trigger`);");
    window.workspaces.sync.PostToParent({
        exec:'rcmail.triggerEvent(`'+trigger+'`);',
        eval:"always"
    });
}

WSPNotification.tasks = function ()
{
    return new WSPNotification("tasks-notif", mel_metapage.Storage.other_tasks, "rcmail.mel_metapage_fn.tasks_updated()", "icofont-tasks", (tasks, id) => {
        if (tasks[id] === undefined)
            return 0;
        else
            return tasks[id].length;
    }, mel_metapage.Storage.last_task_update, mel_metapage.EventListeners.tasks_updated.after);
}

WSPNotification.agenda = function ()
{
    return new WSPNotification("calendar-notif", mel_metapage.Storage.calendar_all_events, "rcmail.mel_metapage_fn.calendar_updated()", "icon-mel-calendar", (cal, id) => {
        // console.log("update-func",cal, id, Enumerable.from(cal),  Enumerable.from(cal).where(x => x.categories !== undefined && x.categories.length > 0 && x.categories[0].includes(id)));
        id = "ws#" + id;
        return  Enumerable.from(cal).where(x => x.categories !== undefined && x.categories.length > 0 && x.categories[0].includes(id) && x.free_busy !== "free" && x.free_busy !== "telework").count();
    }, mel_metapage.Storage.last_calendar_update, mel_metapage.EventListeners.calendar_updated.after);
}

WSPNotification.mails = function ()
{
    return new WSPNotification("mail-notif", "mel_metapage.wsp.mails", "rcmail.mel_metapage_fn.mail_updated()", "icon-mel-mail", (mel, id) => {
        //console.log("update-func",mel, id);
        //id = "ws#" + id;
        return mel[id] === undefined ? 0 : mel[id].length;//Enumerable.from(cal).where(x => x.categories !== undefined && x.categories.length > 0 && x.categories.includes(id)).count();
    }, mel_metapage.Storage.last_calendar_update, "mail_wsp_updated");
}

WSPNotification.documents = function()
{
    let txt = "(async () => {";
    Enumerable.from($(".doc-notif").parent().parent().parent()).select(x => x.id.replace("wsp-notifs-wsp-", "").replace("-epingle", "")).forEach(x=>{
        txt += `await new RoundriveShow('dossiers-${x}', null, {
            wsp:'${x}',
            ignoreInit:true,
            updatedFunc: (bool) => {
                const id = \`wsp_have_news_${rcmail.env.username}\`;
                let datas = mel_metapage.Storage.get(id);
                if (datas === undefined || datas === null)
                    datas = {};
    
                datas['${x}'] = bool;
                
                mel_metapage.Storage.set(id, datas);
            }
        }).checkNews(true);`;
    }); //dossiers-${x}
    txt += `mel_metapage.Storage.set('wsp_doc_parent${rcmail.env.username}', true);})()`;
    txt = new WSPNotification("doc-notif", `wsp_have_news_${rcmail.env.username}`, txt, "icon-mel-folder", (item, id) => {
        
        console.log("LOG",item, id, item[id]);
        if (item !== undefined && item !== null && item[id])
            return "•";

        return 0;
    }, null, mel_metapage.EventListeners.wsp_stockage_updated.after);
    txt.falseKey = "wsp_doc_parent"+ rcmail.env.username;
    return txt;
} 