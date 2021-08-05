$(document).ready(async () => {
    initCloud();
    WSPReady();
});

async function WSPReady()
{
    rcmail.addEventListener("mail_wsp_updated", wsp_mail_updated);
    try {
        if (rcmail.env.current_workspace_services.mail)
            parent.rcmail.mel_metapage_fn.mail_wsp_updated();
    } catch (error) {
        
    }

    //console.log("a");
    const uid = rcmail.env.current_workspace_uid;
    SetCalendarDate()
    //console.log("b");
    //Récupération des données d'ariane
    let datas = mel_metapage.Storage.get(mel_metapage.Storage.ariane);
    const hasAriane = $(".wsp-ariane").length > 0;
    if (hasAriane)
    {
        //console.log("c");
        let channel = $(".wsp-ariane")[0].id.replace("ariane-", "");
        //console.log("Init()", datas, channel, datas[channel]);
        UpdateAriane(channel, false,(datas[channel] === undefined ? 0 : datas[channel]));
    }
    //console.log("d");
    //Récupération des données de l'agenda
    UpdateCalendar();
    parent.rcmail.addEventListener(mel_metapage.EventListeners.calendar_updated.after, UpdateCalendar);
    //Récupération des données des tâches
    //console.log("e");
    UpdateTasks();
    parent.rcmail.addEventListener(mel_metapage.EventListeners.tasks_updated.after, UpdateTasks);
    //console.log("f");
    if (hasAriane)
    {
        //console.log("g");
        await wait(() => {
            //console.log(window.ariane === undefined);
             return window.ariane === undefined
        });
        //console.log("h");
        window.ariane.addEventListener("update", UpdateAriane);
    }

    if (rcmail.env.current_workspace_page !== undefined && rcmail.env.current_workspace_page !== null)
    {
        if (rcmail.env.current_workspace_page !== "home")
        {
            const val = wsp_contract(rcmail.env.current_workspace_page);
            if (val === "ariane")
                setTimeout(async () => {
                    await wait(() => parent.rcmail.busy);
                    $(`.wsp-ariane`).click();
                }, 100);
            else
                click_on_menu(rcmail.env.current_workspace_page);
                //ChangeToolbar(rcmail.env.current_workspace_page, $(`.wsp-${val}`));
            delete rcmail.env.current_workspace_page;
        }
        else if (rcmail.env.current_workspace_page)
            delete rcmail.env.current_workspace_page;

    }
    else if (rcmail.env.current_workspace_page)
        delete rcmail.env.current_workspace_page;


    wsp_mail_updated();
}

function wsp_contract(_class)
{
    switch (_class) {
        case "calendar":
            return "agenda"
        case "tasklist":
            return "tasks";
        case "params":
            return "item-params";
        case "rocket":
            return "ariane";
    
        default:
            break;
    }
}

var UpdateAriane = (channel, store, unread) => {
    $(".ariane-count").html(unread > 99 ? "+99" : unread).css("display", (unread === 0 ? "none" : ""));
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

function click_on_menu(page)
{
    setTimeout(async () => {
        await wait(() => parent.rcmail.busy);
        $(`.wsp-${wsp_contract(page)}`).click();
    }, 100);
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
    //console.log("UpdateSomething()", data, _class);
    if (editor !== null)
        data = editor(data);
    //console.log("UpdateSomething()", data);
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
    let array;
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
        let tmp = Enumerable.from(data).where(x => x.categories !== undefined && x.categories.length > 0 && x.categories.includes(id));
        array = tmp.toArray();
        if (tmp.any())
            return tmp.count();
        else
            return 0;
    });
    //console.log("array", array);
    {
        const agenda = rcmail.env.current_workspace_constantes.agenda;
        const id = "wsp-block-" + agenda;
        let querry = $("#" + id).find(".block-body");
        if (array.length === 0)
            querry.html("Pas de réunion aujourd'hui !");
        else
        {
            setup_calendar(array, querry);
            UpdateSomething(array.length, "wsp-agenda-icon");
            $(".wsp-agenda-icon").find(".roundbadge").addClass("edited");
        }
    }
}

/**
 * Affiche les évènements.
 * @param {array} datas Données des évènements.
 */
function setup_calendar(datas, querry, _date = moment())
{
    let html = html_helper.Calendars({
        datas:datas,
        _date:_date,
        get_only_body:true
    });
	querry.html(html);

		
}

function UpdateTasks()
{
    const uid = rcmail.env.current_workspace_tasklist_uid;
    let datas;
    Update(mel_metapage.Storage.other_tasks, UpdateSomething, null, null, "wsp-tasks", (data) => {
        if (data === null || data === undefined)
        {
            parent.postMessage({
                message:"update_tasks"
            });
            return null;
        }
        datas = data[uid];
        if (data[uid] === undefined)
            return 0;
        else
            return data[uid].length;
    });
    SetupTasks(datas, "waiting-task");

}

function SetupTasks(datas, id, where = null)
{
    if (datas === undefined)
        datas = [];
    if (datas.length > 0 && where !== null)
        datas = Enumerable.from(datas).where(where).toArray();
    let querry = $("#" + id);

	let html = ''
	datas = Enumerable.from(datas).orderBy((x) => x.order).thenBy((x) => (x._hasdate === 1 ? x.datetime : Number.MAX_VALUE )).toArray();
	let date;
    html += `<ul class="ignore-bullet">`;
    for (let index = 0; index < datas.length; index++) {
        const element = datas[index];
		date = moment(parseInt(element.created + "000"));
        html += "<li>";
        html += "<div class=row style=margin-bottom:15px;margin-right:15px;>";
        if (date._isValid)
            html += `<div class=col-md-10><a href=# class="element-block mel-not-link mel-focus" onclick="open_task('${element.id}', {source:'${rcmail.env.current_workspace_tasklist_uid}'})"><span class="element-title element-block">${element.title} ${(element.created === undefined ? "" : '</span><span class="element-desc element-block">Créée le ' + date.format("DD/MM/YYYY") + " à " + date.format("HH:mm") )}</span></a></div>`;
        else
            html += "<div class=col-md-10></div>";
        html += '<div class=col-md-2><a style=display:none; onclick="add_task_to_completed(`'+element.id+'`)" class="roundbadge large hover tick ' + (element.mel_metapage.order == 0 ? "icofont-warning warning" : "icofont-hour-glass clear") + '"></a></div>'
        html += "</div>";
        html += "</li>";
    }
    html += "</ul>";
	querry.html(html);
    $("#nb-" + id).find(".nb").html(datas.length);

}

function GetDate(momentObject)
{
    return GetDateFr(momentObject.format("dddd DD MMMM"));
}

function GetDateFr(date)
{
    const capitalize = (s) => {
        if (typeof s !== 'string') return ''
        s = s.toLowerCase();
        return s.charAt(0).toUpperCase() + s.slice(1)
      }
    const arrayTransform = {
        "MONDAY":"LUNDI",
        "TUESDAY":"MARDI",
        "WEDNESDAY":"MERCREDI",
        "THURSDAY":"JEUDI",
        "FRIDAY":"VENDREDI",
        "SATURDAY":"SAMEDI",
        "SUNDAY":"DIMANCHE",
        "JANUARY":"JANVIER",
        "FEBRUARY":"FÉVRIER",
        "MARCH":"MARS",
        "APRIL":"AVRIL",
        "MAY":"MAI",
        "JUNE":"JUIN",
        "JULY":"JUILLET",
        "AUGUST":"AOÛT",
        "SEPTEMBER":"SEPTEMBRE",
        "OCTOBER":"OCTOBRE",
        "NOVEMBER":"NOVEMBRE",
        "DECEMBER":"DECEMBRE"
    }
    date = date.toUpperCase();
    for (const key in arrayTransform) {
        if (Object.hasOwnProperty.call(arrayTransform, key)) {
            const element = arrayTransform[key];
            if (date.includes(key))
                date = date.replace(key, element);
        }
    }
    return capitalize(date);
}

function create_calendar(id, e)
{
    let event = {
        categories:["ws#" + id],
        calendar_blocked:true,
        start:moment(),
        end:moment().add(1, "h")
    }
    rcmail.local_storage_set_item("tmp_calendar_event", event);
    return rcmail.commands['add-event-from-shortcut'] ? rcmail.command('add-event-from-shortcut', '', e.target, e) : rcmail.command('addevent', '', e.target, e);
}

function create_tasks(id, e)
{
    m_mp_set_storage('task_create');
    m_mp_set_storage('task_id', id);

    return mel_metapage.Functions.change_frame("tasklist", true, false, rcmail.env.current_workspace_tasklist_uid !== undefined && rcmail.env.current_workspace_tasklist_uid !== null ? {source:rcmail.env.current_workspace_tasklist_uid} : null);
}

function SetCalendarDate(date = null)
{
    const now = date === null ? moment() : date;
    $(".swp-agenda-date").html(GetDate(now)).data("current-date", now);
}

function GetAgenda()
{
    const agenda = rcmail.env.current_workspace_constantes.agenda;
    const id = "wsp-block-" + agenda;
    return  $("#" + id).find(".block-body");
}

function GetTasks()
{
    const tasks = rcmail.env.current_workspace_constantes.tasks;
    const id = "wsp-block-" + tasks;
    return  $("#" + id).find(".block-body");
}

async function change_date(add)
{
    const check = (x, item) => {x.uid === item.uid};
    const before = "ws#";
    const uid = rcmail.env.current_workspace_uid;
    const id = before + uid;
    const date = moment($(".swp-agenda-date").data("current-date")).add(add, "d").startOf("day");
    SetCalendarDate(date);
    let querry = GetAgenda().html('<center><span class="spinner-border"></span></center>');
    const datas = await mel_metapage.Functions.update_calendar(date, moment(date).endOf("day"));
    const events = Enumerable.from(JSON.parse(datas)).where(x => x.categories !== undefined && x.categories.length > 0 && x.categories.includes(id)).toArray();
    //console.log(events, JSON.parse(datas));
    if (events === null || events.length === 0)
    { 
        if (date === moment().startOf("day"))
            querry.html("Pas de réunion aujourd'hui !");
        else
            querry.html("Pas de réunion à cette date !");
    }
    else
    {
        let element;
        let tmp;
        let array = [];
        let elementsToDelete = [];
        for (let index = 0; index < events.length; index++) {
            element = events[index];
            if (element.allDay)
                element.order = 0;
            else
                element.order = 1;
            tmp = mel_metapage.Functions.check_if_calendar_valid(element, events);
            
            if (tmp === true)
            {
                tmp = mel_metapage.Functions.check_if_date_is_okay(element.start, element.end, date);
                if (tmp === true)
                    array = Array.AddIfExist(array,check, element);
                else
                    elementsToDelete.push(element);
            }
            else if (tmp !== false)
                elementsToDelete.push(tmp);
        }
        // console.log(array);
        array = Enumerable.from(array).where(x => !elementsToDelete.includes(x)).orderBy(x => x.order).thenBy(x => moment(x.start)).toArray();
        if (array.length === 0)
        {
            if (date === moment().startOf("day"))
                querry.html("Pas de réunion aujourd'hui !");
            else
                querry.html("Pas de réunion à cette date !");
        }
        else
            setup_calendar(array, querry, date);
    }
}

function OpenAriane(id, src)
{
    $(".wsp-object").css("display", "none");
    $(".wsp-toolbar-item").removeClass("active");
    $(".wsp-ariane").addClass("active");
    let querry = $("#" + id);
    if (querry.length === 0)
    {
        const frame = "<iframe class=wsp-object id="+id+" src="+src+"></iframe>";
        $("#layout-content").find(".body").append(frame);
        querry = $("#" + id);
        querry.css("width", "100%")
        .css("height", "500px")
        .css("margin-top", "30px");
    }
    querry.css("display", "");
}



function UpdateFrameAriane()
{
    const down = "icon-mel-chevron-down";
    const right = "icon-mel-chevron-right";

    let arrow = $(".wsp-ariane-header").find(".arrow");

    if (arrow.hasClass(right))
    {
        arrow.removeClass(right).addClass(down).parent().attr("title", rcmail.gettext("close_ariane", "mel_workspace"));
        $(".ariane-frame").attr("aria-expanded", "true").find("iframe").css("display", "").parent().css("display", "");
    }
    else
    {
        arrow.removeClass(down).addClass(right).parent().attr("title", rcmail.gettext("open_ariane", "mel_workspace"));
        $(".ariane-frame").attr("aria-expanded", "false").find("iframe").css("display", "none").parent().css("display", "none");;
    }
}

async function initCloud()
{
    const folder = `/dossiers-${rcmail.env.current_workspace_uid}`;

    let spinner = $("#spinner-grow-center");
    let frame = $("#cloud-frame");

    rcmail.env.wsp_roundrive_show = new RoundriveShow(folder, frame, {
        afterInit:() => {
            spinner.remove();
            frame.css("display", "");
        },
        updatedFunc:async (bool)=>{
            if (bool && $(".wsp-documents").find(".notif").length === 0)
                $(".wsp-documents").append(`<span style="" class="notif roundbadge lightgreen">•</span>`);
            else if (!bool && $(".wsp-documents").find(".notif").length > 0)
                $(".wsp-documents").find(".notif").remove();
        },
        classes:{
            folder:"wsp-rd-row",
            file:"wsp-rd-row last"
        },
        wsp:rcmail.env.current_workspace_uid
    });
}

function showMail($id)
{
    try {
        event.preventDefault();
    } catch (error) {
        
    }
    //?_task=mail&_action=show&_uid=363&_mbox=INBOX

    let config = {
        _uid:$id
    };

    if ($("iframe.mail-frame").length > 0)
    {
        config[rcmail.env.mel_metapage_const.key] = rcmail.env.mel_metapage_const.key.value;
        workspaces.sync.PostToParent({
            exec:"select_mail",
            _integrated:true,
            child:false,
            args:[$id, true]
        });
        mel_metapage.Functions.change_frame("mail");
    }
    else if ($(".mail-frame").length > 0)
        window.location.href = mel_metapage.Functions.url("mail", "show", config);
    else {
        config["_action"] = "show";
        mel_metapage.Functions.change_frame("mail", true, false, config);
    }
}

function wsp_mail_updated()
{

    let datas = mel_metapage.Storage.get(mel_metapage.Storage.wsp_mail);

    let html = "";

    if (datas === undefined || datas === null || datas[rcmail.env.current_workspace_uid] === undefined || datas[rcmail.env.current_workspace_uid] === null)
    {    
        html = "Aucun mail non lu.";
        $(".wsp-mail").find(".notif").remove();
    }
    else {
        for (const key in datas[rcmail.env.current_workspace_uid]) {
            if (Object.hasOwnProperty.call(datas[rcmail.env.current_workspace_uid], key)) {
                const element = datas[rcmail.env.current_workspace_uid][key];
                html += `<a href="#" class="row wsp-email-row mel-not-link mel-focus" onclick="showMail('${element.uid}')">`;
                html += `<div class="col-md-3 wsp-email-from"><p class="sr-only">De : </p>${element.from}</div>`;
                html += `<div class="col-md-6 wsp-email-subject"><p class="sr-only"> Objet : </p>${element.subject}</div>`;
                html += `<div class="col-md-3 wsp-email-date"><p class="sr-only"> Reçu le : </p>${element.date}</div>`;
                html += "</a>";
            }
        }

        $(".wsp-mail").append(`<span style="" class="notif roundbadge lightgreen">${datas[rcmail.env.current_workspace_uid].length}</span>`)

    }

    $(".unreads-emails").html(html);
}