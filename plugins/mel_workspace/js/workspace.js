$(document).ready(async () => {
    const uid = rcmail.env.current_workspace_uid;
    //Récupération des données d'ariane
    let datas = mel_metapage.Storage.get(mel_metapage.Storage.ariane);
    let channel = $(".wsp-ariane")[0].id.replace("ariane-", "");
    console.log("Init()", datas, channel, datas[channel]);
    UpdateAriane(channel, false,(datas[channel] === undefined ? 0 : datas[channel]));
    UpdateCalendar();
    UpdateTasks();
    parent.rcmail.addEventListener(mel_metapage.EventListeners.calendar_updated.after, UpdateCalendar);
    parent.rcmail.addEventListener(mel_metapage.EventListeners.tasks_updated.after, UpdateTasks);
    //parent.rcmail.addEventListener(mel_metapage.EventListeners.tasks_updated.after, my_day_tasks);

    //Récupération des données de l'agenda
    //Récupération des données des tâches

    await wait(() => window.ariane === undefined);
    window.ariane.addEventListener("update", UpdateAriane);
});

var UpdateAriane = (channel, store, unread) => {
    let querry = $("#ariane-" + channel);
    if (querry.length === 0)
        return;
    else {
        if (querry.find(".ariane-notif").length === 0)
            querry.append(`<span `+(unread <= 0 ? "style=display:none" : "")+` class="ariane-notif notif roundbadge lightgreen">`+unread+`</span>`);
        else {
            querry = querry.find(".ariane-notif");
            if (unread <= 0)
                querry.css("display", "none");
            else {
                querry.html(unread).css("display", "");
            }
        }
    }
}

/**
 * Met à jours les différents données de la toolbar
 * @param {string} key 
 * @param {function} func 
 * @param {function} funcBefore 
 * @param {function} funcAfter 
 */
function Update(key, func, funcBefore = null, funcAfter = null, ...args)
{
    if (funcBefore != null)
        funcBefore(...args);
    let data = mel_metapage.Storage.get(key);
    if (func != null)
        func(data, ...args);
    if (funcAfter != null)
        funcAfter(data, ...args);
}

function UpdateSomething(data,_class, editor = null)
{
    console.log("UpdateSomething()", data, _class);
    if (editor !== null)
        data = editor(data);
    console.log("UpdateSomething()", data);
    let querry = $("." + _class);
    const unread = data === null ? 0 : data;
    if (querry.find(".roundbadge").length === 0)
        querry.append(`<span `+(unread <= 0 ? "style=display:none" : "")+` class="notif roundbadge lightgreen">`+unread+`</span>`);
    else
    {
        querry = querry.find(".roundbadge");
        if (unread === 0)
            querry.css("display", "none");
        else
            querry.html(unread).css("display", "");
    }
}

function UpdateCalendar()
{
    const uid = rcmail.env.current_workspace_uid;
    Update(mel_metapage.Storage.calendar, UpdateSomething, null, null, "wsp-agenda", (data) => {
        if (data === null || data === undefined)
        {
            parent.postMessage({
                message:"update_calendar"
            });
            return null;
        }
        const before = "ws#";
        const id = before + uid;
        console.log("UpdateCalendar("+uid+")",uid, before, id);
        let tmp = Enumerable.from(data).where(x => x.categories !== undefined && x.categories.length > 0 && x.categories.includes(id));
        if (tmp.any())
            return tmp.count();
        else
            return 0;
    });
}

function UpdateTasks()
{
    const uid = rcmail.env.current_workspace_tasklist_uid;
    Update(mel_metapage.Storage.other_tasks, UpdateSomething, null, null, "wsp-tasks", (data) => {
        if (data === null || data === undefined)
        {
            parent.postMessage({
                message:"update_tasks"
            });
            return null;
        }
        if (data[uid] === undefined)
            return 0;
        else
            return data[uid].length;
    });
}
