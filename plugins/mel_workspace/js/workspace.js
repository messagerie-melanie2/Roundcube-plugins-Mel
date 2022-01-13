$(document).ready(async () => {
    initCloud();
    WSPReady();
});

/**
 * @async Fonction appelé lorsque la page de l'espace à fini son chargement.
 */
async function WSPReady()
{
    const uid = rcmail.env.current_workspace_uid;
    const hasAriane = $(".wsp-ariane").length > 0;

    let datas = mel_metapage.Storage.get(mel_metapage.Storage.ariane);
    let end = End(uid, hasAriane, datas);
    Start(uid, hasAriane, datas);
    Middle(uid, hasAriane, datas);
    return end;
}

/**
 * Appelé par WSPReady, il s'agit de la première action, on fait ici les actions légères.
 * @param {string} uid Id de l'espace de travail
 * @param {boolean} hasAriane Si l'espace possède une discussion ou non.
 * @param {*} datas Diverses données
 */
function Start(uid, hasAriane, datas) {

    //Gérer la barre de navigation
    const style = rcmail.env.current_bar_colors;
    let $html = $("html");

    if (true || !$html.hasClass("framed"))
        $html = $("#layout-content");

    if (!$html.hasClass("mwsp")) $html.addClass("mwsp");

    //Afficher/cacher la barre de navigation
    $(".wsp-toolbar-melw-wsp-hider").click(() => {
        const down = 'icon-mel-chevron-down';
        const up = 'icon-mel-chevron-up';
        let $children = $(".wsp-toolbar-melw-wsp-hider").children();

        if ($children.hasClass(down))
        {
            let $parent = $(".wsp-toolbar-melw-wsp-hider")
            .css("right", "0")
            .css("width", '100%')
            .attr("title", "Afficher la barre d'accès rapide")
            .parent();
            $parent.css('bottom', `-${$parent[0].clientHeight}px`);
            $children.removeClass(down)
            .addClass(up);
            $html.addClass("moved");
        }
        else {
            let $parent = $(".wsp-toolbar-melw-wsp-hider")
            .css("right", "")
            .css("width", '')
            .attr("title", "Cacher la barre d'accès rapide")
            .parent();
            $parent.css('bottom', '');
            $children.removeClass(up)
            .addClass(down);
            $html.removeClass("moved");
        }
    });

    if (!parent.$("body").hasClass("task-workspace")) parent.$(".mwsp-style").remove();
    
    if (style !== undefined && style !== null && style !== '') if (!parent.$("body").hasClass("task-workspace")) parent.$("body").prepend(`<div class="mwsp-style">${style}</div>`);

    //Gérer la barre de navigation avec ariane
    if (parent.wsp_cf_d !== true)
    {
        try {
            parent.metapage_frames.addEvent("changepage.after", (eClass, changepage, isAriane, querry, id, actions)=> {
                if (changepage)
                {
                    if (eClass === "workspace")
                    {
                        let bool = querry[0].nodeName === 'IFRAME' ? querry[0].contentWindow.rcmail.env.action === 'workspace' : rcmail.env.action === 'workspace';

                        if (bool) $(".ariane-card").addClass("amwsp");
                        
                    }
                    else {
                        $(".ariane-card").removeClass("amwsp");
                    }

                }
            });

            parent.$(".tiny-rocket-chat").click(async () => {
                //ariane-card
                let $ariane = $(".ariane-card");

                if ($ariane.length === 0) await wait(() => $(".ariane-card").length === 0);

                if (rcmail.env.current_frame_name === undefined) rcmail.env.current_frame_name = rcmail.env.task;

                if (rcmail.env.current_frame_name === "workspace")  $(".ariane-card").addClass("amwsp");
                else $(".ariane-card").removeClass("amwsp");

            });

        } catch (error) {
            console.error(error);
        }
        parent.wsp_cf_d = true;
    }

    setup_end_date();
    rcmail.addEventListener("mail_wsp_updated", wsp_mail_updated);
    rcmail.env.nextcloudCopy = mel_metapage.Functions.url("workspace", "workspace", {
        _uid:uid
    }).replace(`&${rcmail.env.mel_metapage_const.key}=${rcmail.env.mel_metapage_const.value}`, '');
    //A faire si webconf
    if (parent.webconf_master_bar !== undefined)
    {
        parent.webconf_master_bar.minify_toolbar();

        if (!$("html").hasClass("framed"))
            $(".wsp-toolbar.melw-wsp").addClass('webconfstarted');

    }
        
    //Stockage local
    mel_metapage.Storage.set("current_wsp", rcmail.env.current_workspace_uid)
    mel_metapage.Storage.set("current_wsp_mail", rcmail.env.current_workspace_email)

    rcmail.triggerEvent("mel_workspace.start", {
        uid,
        hasAriane, 
        datas
    });
}

/**
 * Appelé par WSPReady, on fait les actions après le Start, les actions sont légère ou moyenement légères.
 * @param {string} uid Id de l'espace de travail
 * @param {boolean} hasAriane Si l'espace possède une discussion ou non.
 * @param {*} datas Diverses données
 */
function Middle(uid, hasAriane, datas) {

    SetCalendarDate();

    try {
        if (rcmail.env.current_workspace_services.mail)
            parent.rcmail.mel_metapage_fn.mail_wsp_updated();

    } catch (error) {
        
    }

    if (hasAriane)
    {
        //console.log("c");
        let channel = $(".wsp-ariane")[0].id.replace("ariane-", "");
        //console.log("Init()", datas, channel, datas[channel]);
        UpdateAriane(channel, false,(datas[channel] === undefined ? 0 : datas[channel]));
    }

    UpdateCalendar();
    parent.rcmail.addEventListener(mel_metapage.EventListeners.calendar_updated.after, UpdateCalendar);

    UpdateTasks();
    parent.rcmail.addEventListener(mel_metapage.EventListeners.tasks_updated.after, UpdateTasks);

    if (rcmail.env.current_workspace_file === undefined && rcmail.env.current_workspace_page !== undefined && rcmail.env.current_workspace_page !== null)
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
    setup_params();

    if ($("#createthings").length > 0)
        $("#createthings").removeClass("active");

    rcmail.triggerEvent("mel_workspace.middle", {
        uid,
        hasAriane, 
        datas
    });
}

/**
 * Appelé par WSPReady, actions que l'on fait en dernier, ce sont des actions plutôt lourdes ou asynchônes
 * @param {string} uid Id de l'espace de travail
 * @param {boolean} hasAriane Si l'espace possède une discussion ou non.
 * @param {*} datas Diverses données
 */
async function End(uid, hasAriane, datas) {

    let promises = [
        InitLinks()
    ];

    if (rcmail.env.current_workspace_services.wekan && !wekan.isLogged())
        promises.push(wekan.login());

    if (hasAriane)
    {
        promises.push(wait(() => {
                return window.ariane === undefined
            })
            .then(() => {window.ariane.addEventListener("update", UpdateAriane);})
        );
    }

    if (rcmail.env.current_workspace_file !== undefined && rcmail.env.current_workspace_services.doc)
    {
        let it = 0;
        if (parent.$(".stockage-frame").length == 0)
            promises.push(wait(() => rcmail.busy).then(() => mel_metapage.Functions.change_frame("stockage", false, true).then(() => {
                rcmail.set_busy(false);
                rcmail.clear_messages();

                if (rcmail.env.current_workspace_file !== undefined)
                {
                    return wait(() => {
                        if (++it >= 5)
                            return false;
                        
                        return rcmail.env.wsp_roundrive_show === undefined;
                    }).then(() =>{
                         setTimeout(() => {
                            rcmail.env.current_workspace_file.dirname = rcmail.env.current_workspace_file.path;
                            return rcmail.env.wsp_roundrive_show.clickFile(null, rcmail.env.current_workspace_file);
                        }, 500)
                    }
                         );
                }
            })));
    }

    await wait(() => rcmail.busy);

    return Promise.all(promises);

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
        case "doc":
            return "documents";
    
        default:
            return _class;
    }
}

var UpdateAriane = (channel, store, unread) => {
    let querry = $("#ariane-" + channel);

    $(".ariane-count").html(unread > 99 ? "+99" : unread).css("display", (unread === 0 ? "none" : ""));

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
{;
    if (editor !== null)
        data = editor(data);

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
        tmp = tmp.where(x => x.free_busy !== "free");
        if (tmp.any())
            return tmp.count();
        else
            return 0;
    });

    {
        const agenda = rcmail.env.current_workspace_constantes.agenda;
        const id = "wsp-block-" + agenda;
        let querry = $("#" + id).find(".block-body");
        if (array.length === 0)
            querry.html("Pas de réunion aujourd'hui !");
        else
        {
            const count = Enumerable.from(array).where(x => x.free_busy !== "free").count();
            setup_calendar(array, querry);
            UpdateSomething(count, "wsp-agenda-icon");
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

    let date;
    let querry = $("#" + id);
	let html = ''

	datas = Enumerable.from(datas).orderBy((x) => x.order).thenBy((x) => (x._hasdate === 1 ? x.datetime : Number.MAX_VALUE )).toArray();
    html += `<ul class="ignore-bullet">`;

    for (let index = 0; index < datas.length; index++) {
        const element = datas[index];
		date = moment(parseInt(element.created + "000"));
        html += "<li>";
        html += "<div class=row style=margin-bottom:15px;margin-right:15px;>";

        if (date._isValid)
            html += `<div class=col-md-10><a href=# class="element-block mel-not-link mel-focus" onclick="open_task('${element.id}', {source:'${rcmail.env.current_workspace_tasklist_uid}'})"><span class="element-title default-text bold element-block">${element.title} ${(element.created === undefined ? "" : '</span><span class="element-desc element-block">Créée le ' + date.format("DD/MM/YYYY") + " à " + date.format("HH:mm") )}</span></a></div>`;
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
        setTimeout(() => {
            rcmail.triggerEvent("init_ariane", "wsp-disc-id");
        }, 100);
    }
    else
    {
        arrow.removeClass(down).addClass(right).parent().attr("title", rcmail.gettext("open_ariane", "mel_workspace"));
        $(".ariane-frame").attr("aria-expanded", "false").find("iframe").css("display", "none").parent().css("display", "none");;
    }
}

async function initCloud()
{
    if (rcmail.env.current_workspace_services.doc !== true || rcmail.env.is_stockage_active !== true)
        return;

    if(rcmail.env.checknews_action_on_error === undefined)
        rcmail.env.checknews_action_on_error = [];

    if(rcmail.env.checknews_action_on_success === undefined)
        rcmail.env.checknews_action_on_success = [];

    rcmail.env.checknews_action_on_error.push(() => {
        //rcmail.display_message("Si vous venez de créer un espace de travail, attendez quelques minutes que l'espace se créé.", "error");
        //console.log("ncupdated", rcmail.env.current_nextcloud_updated);
        if (rcmail.env.current_nextcloud_updated === null || rcmail.env.current_nextcloud_updated === false)
        {
            rcmail.env.current_nextcloud_updated = moment();
            mel_metapage.Functions.post(mel_metapage.Functions.url("workspace", "get_date_stockage_user_updated"), {
                _uid:rcmail.env.current_workspace_uid,
                _date:moment().format(),
                _user:true
            });
        }
        else if (rcmail.env.current_nextcloud_updated === 0)
        {
            rcmail.env.current_nextcloud_updated = moment();
            mel_metapage.Functions.post(mel_metapage.Functions.url("workspace", "get_date_stockage_user_updated"), {
                _uid:rcmail.env.current_workspace_uid,
                _date:moment().format()
            }); 
        }

        const finished = moment(rcmail.env.current_nextcloud_updated).add(rcmail.env.wsp_waiting_nextcloud_minutes, "m");
        if (moment() < finished) //(personnal data)
        {
            $("button.wsp-documents").css("display", "none");
            $("#cloud-frame").html(`
            <center><div class="spinner-grow"></div><div>Création en cours...</div></center>
            <!--<div class="progress">
                <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width: 0%" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">Création en cours...</div>
            </div>-->
            `);
            
            let createdTimeOut = setInterval(() => {
                const val = Math.round((1 - ((finished - moment())/(rcmail.env.wsp_waiting_nextcloud_minutes*60*1000)))*100);
                //$("#cloud-frame .progress-bar").css("width", `${val}%`);
                rcmail.triggerEvent("workspace.roundrive.createStockage.wait", val);
                if (val >= 100)
                {
                    $("button.wsp-documents").css("display", "");
                    clearInterval(createdTimeOut);
                    initCloud();
                    //Envoi au serveur que rcmail.env.current_workspace_document_ten vaut vrai
                }
            }, 1000);
        }  
        else {
            $("button.wsp-documents").css("display", "none");
            rcmail.display_message("Impossible d'accéder au dossier !", "error");
            if (moment(rcmail.env.current_nextcloud_updated).add(rcmail.env.wsp_waiting_nextcloud_minutes*2, "m") > moment())
                rcmail.display_message("Si vous venez de créer un espace de travail, attendez quelques minutes que l'espace se créé.", "error");
        }

    });

    rcmail.env.checknews_action_on_success.push(() => {
        if (rcmail.env.current_nextcloud_updated !== 1)
        {
            mel_metapage.Functions.post(mel_metapage.Functions.url("workspace", "get_date_stockage_user_updated"), {
                _uid:rcmail.env.current_workspace_uid,
                _set:true
            });
        }
    });

    const folder = `/dossiers-${rcmail.env.current_workspace_uid}`;

    let spinner = $("#spinner-grow-center");
    let frame = $("#cloud-frame");

    rcmail.env.wsp_roundrive_show = new RoundriveShow(folder, frame, {
        afterInit() {
            spinner.remove();
            frame.css("display", "");
        },

        async updatedFunc(bool) {

            if (bool && $(".wsp-documents").find(".notif").length === 0)
                $(".wsp-documents").append(`<span style="" class="notif roundbadge lightgreen">•</span>`);
            else if (!bool && $(".wsp-documents").find(".notif").length > 0)
                $(".wsp-documents").find(".notif").remove();

            const id = `wsp_have_news_${rcmail.env.username}`;
            let datas = mel_metapage.Storage.get(id);

            if (datas === undefined || datas === null)
                datas = {};

            datas[rcmail.env.current_workspace_uid] = bool;
            
            mel_metapage.Storage.set(id, datas);

            mel_metapage.Functions.call(`trigger.${mel_metapage.EventListeners.wsp_stockage_updated.after}`, true, {
                always:true,
                _integrated:true
            });
        },
        classes:{
            folder:"wsp-rd-row",
            file:"wsp-rd-row last"
        },
        wsp:rcmail.env.current_workspace_uid,
        show_errors:false
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

    if (parent.$("iframe.mail-frame").length > 0)
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
    else if (parent.$(".mail-frame").length > 0)
    {
        rcmail.set_busy(true, "loading");
        parent.location.href = mel_metapage.Functions.url("mail", "show", config).replaceAll(`&${rcmail.env.mel_metapage_const.key}=${rcmail.env.mel_metapage_const.value}`, "");
    }
    else {
        config["_action"] = "show";
        mel_metapage.Functions.change_frame("mail", true, false, config);
    }
}

function wsp_mail_updated()
{

    const tmpDatas = mel_metapage.Storage.get(mel_metapage.Storage.wsp_mail);

    let datas = [];

    for (const key in tmpDatas) {
        if (Object.hasOwnProperty.call(tmpDatas, key)) {
            const element = tmpDatas[key];
            datas[key.split("@")[0].replace("edt.", "")] = element;
        }
    }

    let html = "";

    //const bool1 = datas === undefined || datas === null || datas[rcmail.env.current_workspace_uid] === undefined || datas[rcmail.env.current_workspace_uid] === null;

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

async function InitLinks()
{
    if (rcmail.env.current_workspace_services["useful-links"]) //Si le service est activé
    {

        rcmail.addEventListener("mel_metapage_refresh", () => {
            refreshUsefulLinks();
        });

        if (!rcmail.env.current_workspace_services.doc || !rcmail.env.is_stockage_active) //Si nextcloud n'est pas activé
        {
            $("#ressources-links").parent().parent().find(".wsp-block.wsp-left.wsp-resources").css("background-color", "transparent")
        }

        $(".tab-ressources.mel-tab.mel-tabheader").each((i, e) => {
            if (e.id === "ressources-links")
            {
                $(e).click(() => {
                    $(e).parent().parent().find(".wsp-block.wsp-left.wsp-resources").css("background-color", "transparent")
                });
            }
            else
            {
                $(e).click(() => {
                    $(e).parent().parent().find(".wsp-block.wsp-left.wsp-resources").css("background-color", "")
                });
            }
        });

        $("#button-create-new-ulink").click(() =>{
            GetLinkPopUp().setLinkEditor(new MelLink(), "workspace", "update_ulink", {_workspace_id:rcmail.env.current_workspace_uid}, async (result) => {
                
                if (result)
                { 
                    await mel_metapage.Functions.callAsync(`$(".links-frame").remove()`, false);
                    $(".wsp-toolbar-item.wsp-links").click();
                }

                GetLinkPopUp().hide();
            }).show();
        });
        
    }
}

function PaperClipCopy(link)
{
    function copyOnClick (val) {
        var tempInput = document.createElement ("input"); 
        tempInput.value = val;
         document.body.appendChild (tempInput); 
         tempInput.select (); 
         document.execCommand ("copy"); 
         document.body.removeChild (tempInput); 
    }
    const url = link[0].href;
    copyOnClick(url);
    rcmail.display_message(`${url} copier dans le presse-papier.`, "confirmation")
}

function refreshUsefulLinks()
{
    if (rcmail.env.current_workspace_services["useful-links"]) 
    {
        mel_metapage.Functions.post(mel_metapage.Functions.url("workspace", "refresh_html_ulinks"), {
            _workspace_id:rcmail.env.current_workspace_uid
        }, (datas) => {
            $(".wsp-block.wsp-left.wsp-resources .ressources-links").html(datas);
        });
        //$(".ressources-links")
    }
}

function setup_params()
{
    const tmp = (img) =>
    {
        img = img.split(".");
        
        if (img.length > 1)
            img[img.length-1] = "";

        img = img.join(".");
        img = img.slice(0, img.length-1);

        return img;
    };

    let html = "";

    if (rcmail.env.mel_metapage_workspace_logos.length > 0)
    {
        html += `<li role=menuitem><a title="" aria-disabled=true href=# tabindex=-1 class="active" id="" href="#" onclick="m_wp_change_picture(null)"><img src="`+rcmail.env.mel_metapage_workspace_logos[0].path+`" class="menu-image invisible">Aucune image</a></li>`;
        
        for (let index = 0; index < rcmail.env.mel_metapage_workspace_logos.length; index++) {
            const element = rcmail.env.mel_metapage_workspace_logos[index];
            html += `<li role=menuitem><a aria-disabled=true href=# alt="${Enumerable.from(element.path.replace(".png", "").replace(".jpg", "").replace(".PNG", "").split("/")).last()}" title="" class="active" id="" tabindex=-1 href="#" onclick="m_wp_change_picture('`+element.path+`')"><img src="`+element.path+`" class=menu-image>`+tmp(element.name)+`</a></li>`;
        }
    }
    $("#ul-wsp-params").html(html);
}

function m_wp_change_picture(img)
{
    if (img === null)
    {
        $("#worspace-avatar-b").html(`<span>${$(".wsp-head h1.header-wsp").html().slice(0,3)}</span>`);
    }
    else
        $("#worspace-avatar-b").html(`<img alt="${Enumerable.from(img.replace(".png", "").replace(".PNG", "").split("/")).last()}" src="${img}" /><p class="sr-only"> - Changer d'avatar</p>`);

    $("#wsp-param-chg-button-plz").removeAttr("disabled").removeClass("disabled");
}

function setup_end_date()
{
    let querry = $("#new-end-date");

    if (querry.length > 0)
    {
        querry.datetimepicker({
            format: 'd/m/Y H:i',
            lang:"fr",
            step:15
        });
    }

    const date = rcmail.env.current_settings.end_date;
    if (date !== undefined && date !== null && date !== "")
    {
        let querry = $("#wsp-end-date");
        if (moment() >= moment(date, "DD/MM/YYYY hh:mm"))
            querry.html("<i>Espace clôt !</i>")
        else
            querry.html(`Date de fin : ${date}`);
    }
}