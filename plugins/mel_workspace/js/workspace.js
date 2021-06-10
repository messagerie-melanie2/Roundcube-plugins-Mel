$(document).ready(async () => {
    WSPReady();
});

async function WSPReady()
{
    console.log("a");
    const uid = rcmail.env.current_workspace_uid;
    SetCalendarDate()
    console.log("b");
    //Récupération des données d'ariane
    let datas = mel_metapage.Storage.get(mel_metapage.Storage.ariane);
    const hasAriane = $(".wsp-ariane").length > 0;
    if (hasAriane)
    {
        console.log("c");
        let channel = $(".wsp-ariane")[0].id.replace("ariane-", "");
        //console.log("Init()", datas, channel, datas[channel]);
        UpdateAriane(channel, false,(datas[channel] === undefined ? 0 : datas[channel]));
    }
    console.log("d");
    //Récupération des données de l'agenda
    UpdateCalendar();
    parent.rcmail.addEventListener(mel_metapage.EventListeners.calendar_updated.after, UpdateCalendar);
    //Récupération des données des tâches
    console.log("e");
    UpdateTasks();
    parent.rcmail.addEventListener(mel_metapage.EventListeners.tasks_updated.after, UpdateTasks);
    console.log("f");
    if (hasAriane)
    {
        console.log("g");
        await wait(() => {
            console.log(window.ariane === undefined);
             return window.ariane === undefined
        });
        console.log("h");
        window.ariane.addEventListener("update", UpdateAriane);
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
    console.log("array", array);
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
	// const classes = {
	// 	organizer:"icofont-royal royal",
	// 	tick:"icofont-check lightgreen",
	// 	waiting:"icofont-hour-glass clear",
	// 	declined:"icofont-close danger"
	// }
	// const set_style = (event) => {
	// 	const now = {
	// 		now:_date,
	// 		start:moment(_date).startOf('day'),
	// 		end:moment(_date).endOf('day')
	// 	}
	// 	const date = {
	// 		start:moment(event.start),
	// 		end:moment(event.end)
	// 	}
	// 	if (date.start < now.start || date.end > now.end)
	// 		return {
	// 			start:date.start.format("DD/MM/YYYY HH:mm"),
	// 			end:date.end.format("DD/MM/YYYY HH:mm"),
	// 		}
	// 	else
	// 		return {
	// 			start:date.start.format("HH:mm"),
	// 			end:date.end.format("HH:mm"),
	// 		}
	// };
	// let html = ''
	// // datas.sort(function(a,b){
	// // 	return moment(a.start) - moment(b.start);
	// // });
	// let style;
	// let bool = false;
	// let icon;
    // for (let index = 0; index < datas.length; index++) {
    //     const element = datas[index];
    //     html += "<div class=row style=margin-bottom:15px;margin-right:15px;>";
	// 	if (element.allDay)
	// 		html += "<div class=col-md-8>" + rcmail.gettext("Journée entière") + "<br/><span style=font-size:smaller>" + element.title +"</span></div>";
	// 	else
	// 	{
	// 		const style_date = set_style(element);
    //     	html += "<div class=col-md-8>" + style_date.start + " - " + style_date.end + "<br/><span style=font-size:smaller>" + element.title +"</span></div>";
	// 	}
	// 	// bool = element.attendees !== undefined && 
	// 	// element.attendees.length > 0 && 
	// 	// Enumerable.from(element.attendees).any(x =>  rcmail.env.mel_metapage_user_emails.includes(x.email));
	// 	// if (bool)
	// 	// {
	// 	// 	icon = null;
	// 	// 	for (let it = 0; it < rcmail.env.mel_metapage_user_emails.length; it++) {
	// 	// 		const mail = rcmail.env.mel_metapage_user_emails[it];
	// 	// 		for (let j = 0; j < element.attendees.length; j++) {
	// 	// 			const attendee = element.attendees[j];
	// 	// 			if (attendee.email == mail)
	// 	// 			{
	// 	// 				if (attendee.role === "ORGANIZER")
	// 	// 					icon = classes.organizer;
	// 	// 				else if (attendee.status.toUpperCase() === 'CONFIRMED')
	// 	// 					icon = classes.tick;
	// 	// 				else if (attendee.status.toUpperCase() === 'DECLINED')
	// 	// 					icon = classes.declined;
	// 	// 				else 
	// 	// 					icon = classes.waiting;
	// 	// 				break;
	// 	// 			}
	// 	// 		}
	// 	// 		if (icon !== null)
	// 	// 			break;
	// 	// 	}
	// 	// }
    //     html += '<div class=col-md-2><a ' + (bool ? "" : 'style="display:none;') + ' class="roundbadge large ' + (icon !== null ? icon : "") + '"></a></div>';
	// 	if (element.location.includes("http://") || element.location.includes("https://") || (element.vurl !== null && vurl !== ""))
	// 		style = "";
	// 	else
	// 		style = "display:none;";
	// 	html += '<div class=col-md-2><a target="_blank" style="'+style+'" href="'+element.location+'" class="roundbadge link large dark icofont-network"></a></div>';
    //     html += "</div>";
    // }
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
    for (let index = 0; index < datas.length; index++) {
        const element = datas[index];
		date = moment(parseInt(element.created + "000"));
        html += "<div class=row style=margin-bottom:15px;margin-right:15px;>";
        if (date._isValid)
            html += "<div class=col-md-10>" + element.title + (element.created === undefined ? "" : "<br/>Créer le " + date.format("DD/MM/YYYY") + " à " + date.format("HH:mm") )+"</div>";
        else
            html += "<div class=col-md-10></div>";
        html += '<div class=col-md-2><a style=display:none; onclick="add_task_to_completed(`'+element.id+'`)" class="roundbadge large hover tick ' + (element.mel_metapage.order == 0 ? "icofont-warning warning" : "icofont-hour-glass clear") + '"></a></div>'
        html += "</div>";
    }
    html += ""
	querry.html(html);
    /*console.log("SetupTasks()", 
    $("#nb-" + id),
    $("#nb-" + id).find(".nb"),
    datas.length);*/
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
    // m_mp_CreateOrOpenFrame(`calendar`, 
    // () => {
    //     m_mp_CreateEvent();
    //     m_mp_CreateEvent(() => {
    //         m_mp_set_storage("calendar_category", "ws#" + id, false);
    //     })
    // }
    // , m_mp_CreateEvent_inpage)
}

function create_tasks(id, e)
{
    m_mp_set_storage('task_create');
    m_mp_set_storage('task_id', id);

    return mel_metapage.Functions.change_frame("tasklist", true, false, rcmail.env.current_workspace_tasklist_uid !== undefined && rcmail.env.current_workspace_tasklist_uid !== null ? {source:rcmail.env.current_workspace_tasklist_uid} : null);

    // m_mp_CreateOrOpenFrame('tasklist', () => {
    //     m_mp_set_storage('task_create');
    //     m_mp_set_storage('task_id', id);
    // }
    // , () => {
    //     //m_mp_action_from_storage('task_create', m_mp_OpenTask);
    //     let func = () => {

    //         if (rcmail._events["pamella.tasks.afterinit"] !== undefined)
    //             rcmail.triggerEvent("pamella.tasks.afterinit", undefined);

    //         // if (rcmail._events["pamella.editTask.after"] !== undefined)
    //         //     rcmail.triggerEvent("pamella.editTask.after", undefined);
    //     };
    //     mel_metapage.Functions.call(func, true);
    // })
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
    console.log(events, JSON.parse(datas));
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
        $(".unreads-ariane").find("iframe").css("display", "").parent().css("display", "");
    }
    else
    {
        arrow.removeClass(down).addClass(right).parent().attr("title", rcmail.gettext("open_ariane", "mel_workspace"));
        $(".unreads-ariane").find("iframe").css("display", "none").parent().css("display", "none");;
    }
}