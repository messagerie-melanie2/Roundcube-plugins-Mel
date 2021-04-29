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
                //console.log("update", id, value);
                if (value === 0)
                    e.parent().parent().css("display", "none");
                else
                {
                    e.html(value);
                    e.parent().parent().css("display", "");
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
    }

    async update()
    {
        let item = mel_metapage.Storage.get(this.key);
        if (item === null || this.check_date())
            item = await this.update_value();
        this.notif.update(item, this.count);
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
        mel_metapage.Storage.remove(this.key);
        window.workspaces.sync.PostToParent({
            exec:this.post
        });
        await wait(() => mel_metapage.Storage.get(this.key) === null);
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
    return new WSPNotification("calendar-notif", "all_events", "rcmail.mel_metapage_fn.calendar_updated()", "icon-mel-calendar", (cal, id) => {
        //console.log("update-func",cal, id, Enumerable.from(cal));
        id = "ws#" + id;
        return  Enumerable.from(cal).where(x => x.categories !== undefined && x.categories.length > 0 && x.categories.includes(id)).count();
    }, mel_metapage.Storage.last_calendar_update, mel_metapage.EventListeners.calendar_updated.after);
}