(function(){

if (rcmail)
{
    if (rcmail.env.task === "tasks")
        parent.child_rcmail = rcmail;
    if (parent != window && rcmail.mel_metapage_fn === undefined)
    {
            rcmail.mel_metapage_fn = {
                refresh:() => {}
            };
    }
    console.log(parent, window, parent === window);
    if (parent.rcmail.mel_metapage_fn !== undefined)
        return;
    parent.rcmail.addEventListener("init", function() {
        //Definition des functions
        parent.rcmail.mel_metapage_fn = {
            calendar_updated: function () {
                parent.rcmail.triggerEvent(mel_metapage.EventListeners.calendar_updated.before);
                rcmail.set_busy(true, "loading");
                if (parent.rcmail.env.ev_calendar_url === undefined)
                    parent.rcmail.env.ev_calendar_url = ev_calendar_url;
                return $.ajax({ // fonction permettant de faire de l'ajax
                type: "POST", // methode de transmission des données au fichier php
                url: parent.rcmail.env.ev_calendar_url+'&start='+dateNow(new Date())+'&end='+dateNow(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()+1)), // url du fichier php
                success: function (data) {
                    try {
                        let events = [];
                        data = JSON.parse(data);
                        let startMoment;
                        let endMoment;
                        let element;
                        let now = moment().startOf('day');
                        for (let index = 0; index < data.length; ++index) {
                            element = data[index];
                            if (element.allDay)
                            {
                                if (moment(element.start).date() === moment().date())
                                {                                   
                                    element.start = moment(element.start).startOf('day').format("YYYY-MM-DDTHH:mm:ss");
                                    element.end = moment(element.start).startOf('day').add({
                                        hours:23,
                                        minutes:59,
                                        seconds:59
                                    }).format("YYYY-MM-DDTHH:mm:ss");
                                    //console.log(element);
                                    events.push(element);
                                }
                            }
                            else
                            {
                                startMoment = moment(element.start);
                                endMoment = moment(element.end);
                                if (startMoment < now)
                                    element.start = now.format("YYYY-MM-DDTHH:mm:ss");
                                if (endMoment > now.add({
                                    hours:23,
                                    minutes:59,
                                    seconds:59
                                }))
                                    element.end = now.add({
                                        hours:23,
                                        minutes:59,
                                        seconds:59
                                    }).format("YYYY-MM-DDTHH:mm:ss");
                                events.push(element);
                            }
                        }
                        data = null;
                        try_add_round(".calendar", mel_metapage.Ids.menu.badge.calendar);
                        update_badge(events.length, mel_metapage.Ids.menu.badge.calendar);
                        mel_metapage.Storage.set(mel_metapage.Storage.calendar, events);
                        parent.rcmail.triggerEvent(mel_metapage.EventListeners.calendar_updated.after);
                    } catch (ex) {
                        console.error(ex);
                        rcmail.display_message("Une erreur est survenue lors de la synchronisation.", "error")
                    }
                },
                error: function (xhr, ajaxOptions, thrownError) { // Add these parameters to display the required response
                    console.error(xhr, ajaxOptions, thrownError);
                    rcmail.display_message("Une erreur est survenue lors de la synchronisation.", "error")
                },
             }).always(() => {
                rcmail.set_busy(false);
                rcmail.clear_messages();
             });
            },
            tasks_updated: function(){
                rcmail.set_busy(true, "loading");
                //?_task=tasks&_action=fetch&filter=0&lists=tommy_-P-_delphin_-P-_i&_remote=1&_unlock=true&_=1613118450180
                parent.rcmail.triggerEvent(mel_metapage.EventListeners.tasks_updated.before);
                return $.ajax({ // fonction permettant de faire de l'ajax
                type: "POST", // methode de transmission des données au fichier php
                url: '?_task=tasks&_action=fetch&filter=0&_remote=1&_unlock=true&_=1613118450180',//rcmail.env.ev_calendar_url+'&start='+dateNow(new Date())+'&end='+dateNow(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()+1)), // url du fichier php
                success: function (data) {
                    try {
                        data=JSON.parse(data).callbacks[0][1].data;
                        let datas_to_save = [];
                        let element;
                        for (let index = 0; index < data.length; ++index) {
                            element = data[index];
                            if (element.complete === 0)
                            {
                                element.mel_metapage = {
                                    order:(element._hasdate === 1 ? (moment(element.datetime*1000) <= moment() ? 0 : 1 ) : 1),
                                };
                                datas_to_save.push(element);
                            }
                        }
                        datas_to_save.sort((a,b) => a.mel_metapage.order - b.mel_metapage.order);
                        mel_metapage.Storage.set(mel_metapage.Storage.tasks, datas_to_save);
                        try_add_round(".tasklist", mel_metapage.Ids.menu.badge.tasks);
                        update_badge(datas_to_save.length, mel_metapage.Ids.menu.badge.tasks);
                        console.log(datas_to_save);
                        parent.rcmail.triggerEvent(mel_metapage.EventListeners.tasks_updated.after);
                    } catch (ex) {
                        console.error(ex);
                        rcmail.display_message("Une erreur est survenue lors de la synchronisation.", "error")
                    }
                },
                error: function (xhr, ajaxOptions, thrownError) { // Add these parameters to display the required response
                    console.error(xhr, ajaxOptions, thrownError);
                    rcmail.display_message("Une erreur est survenue lors de la synchronisation.", "error")
                },
             }).always(() => {
                rcmail.set_busy(false);
                rcmail.clear_messages();
             });
            },
            mail_updated: function() {
                parent.rcmail.triggerEvent(mel_metapage.EventListeners.mails_updated.before);
                return $.ajax({ // fonction permettant de faire de l'ajax
                type: "GET", // methode de transmission des données au fichier php
                url: '?_task=mel_metapage&_action=get_unread_mail_count',//rcmail.env.ev_calendar_url+'&start='+dateNow(new Date())+'&end='+dateNow(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()+1)), // url du fichier php
                success: function (data) {
                    try {
                        console.log("datas", data);
                        mel_metapage.Storage.set(mel_metapage.Storage.mail, data);
                        try_add_round(".mail ", mel_metapage.Ids.menu.badge.mail);
                        update_badge(data, mel_metapage.Ids.menu.badge.mail);
                        parent.rcmail.triggerEvent(mel_metapage.EventListeners.mails_updated.after);
                    } catch (ex) {
                        console.error(ex);
                        rcmail.display_message("Une erreur est survenue lors de la synchronisation.", "error")
                    }
                },
                error: function (xhr, ajaxOptions, thrownError) { // Add these parameters to display the required response
                    console.error(xhr, ajaxOptions, thrownError);
                    rcmail.display_message("Une erreur est survenue lors de la synchronisation.", "error")
                },
                });
            },
            refresh: function () {
                let querry = $(".calendar-frame");
                if (querry.length > 0)
                {
                    //refresh du calendrier
                    if (parent.child_cal !== undefined)
                    {
                        //child_cal.refresh({ source:child_cal.calendars["tommy_-P-_delphin_-P-_i"].id, refetch:true });
                        for (const key in parent.child_cal.calendars) {
                            child_cal.refresh({ source:key, refetch:true });
                        }
                    }
                }
                querry = $(".tasks-frame");
                if (querry.length > 0)
                {
                    if (parent.rctasks !== undefined)
                        rctasks.init();

                }
                parent.rcmail.mel_metapage_fn.calendar_updated().always(() => {
                    parent.rcmail.mel_metapage_fn.tasks_updated();
                    parent.rcmail.mel_metapage_fn.mail_updated();
                });
            }
        };

        //ajout des events listener
        parent.rcmail.addEventListener(mel_metapage.EventListeners.calendar_updated.get, parent.rcmail.mel_metapage_fn.calendar_updated);
        parent.rcmail.addEventListener(mel_metapage.EventListeners.tasks_updated.get, parent.rcmail.mel_metapage_fn.tasks_updated);
        parent.rcmail.addEventListener(mel_metapage.EventListeners.mails_updated.get, parent.rcmail.mel_metapage_fn.mail_updated);
        parent.rcmail.enable_command("my_account", true);
        parent.rcmail.register_command("my_account", () => {
            window.location.href = "./?_task=settings&_action=plugin.mel_moncompte";
        })

        // //checks
        let local_storage = {
            calendar:mel_metapage.Storage.get(mel_metapage.Storage.calendar),
            tasks:mel_metapage.Storage.get(mel_metapage.Storage.tasks),
            mails:{
                unread_count:mel_metapage.Storage.get(mel_metapage.Storage.mail),
            }
        }
        if (local_storage.calendar != null && local_storage.calendar.length > 0)
        {
            let startMoment = moment(local_storage.calendar[0].start);
            let startDate = startMoment.date();
            let endMoment = moment(local_storage.calendar[0].end);
            let endDate = endMoment.date();
            let now = moment();
            let date = now.date();
            //console.log(startDate != date, endDate != date, startMoment, now, endMoment);
            if (startDate != date)
                parent.rcmail.triggerEvent(mel_metapage.EventListeners.calendar_updated.get);
        }

        // //add
        if (parent === window) //Si on est pas dans une frame
        {
            init_badge(local_storage.calendar, mel_metapage.Storage.calendar, rcmail.mel_metapage_fn.calendar_updated,
                ".calendar", mel_metapage.Ids.menu.badge.calendar, true);
            init_badge(local_storage.tasks, mel_metapage.Storage.tasks, rcmail.mel_metapage_fn.tasks_updated,
                ".tasklist", mel_metapage.Ids.menu.badge.tasks, true);
            init_badge(local_storage.mails.unread_count, mel_metapage.Storage.mail, rcmail.mel_metapage_fn.mail_updated, 
                ".mail", mel_metapage.Ids.menu.badge.mail, true, true);
        }


        $("#menu-small").appendTo("#taskmenu").css("display", "");
        //create-modal
        parent.rcmail.enable_command("create-modal", true);
        parent.rcmail.register_command("create-modal", () => {
            m_mp_Create();
        })
        parent.rcmail.enable_command("help-modal", true);
        parent.rcmail.register_command("help-modal", () => {
            m_mp_Help();
        })
        parent.rcmail.enable_command("search", true);
        parent.rcmail.register_command("search", () => {
            $("#barup-buttons").css("display", "none");
            $("#barup-user").css("display", "none");
            $("#barup-search-input").css("max-width", "70%");
            $("#barup-search").css("left", 0);
            if ($("#gbtniabsc").length === 0)
                $("#barup-search-col").find(".input-group-append").append('<button onclick="rcmail.command(`stop-search`)" id="gbtniabsc" class="btn btn-danger"><span class="icofont-close"></button>')
            $(".barup").css("display", "initial");
        })
        parent.rcmail.enable_command("stop-search", true);
        parent.rcmail.register_command("stop-search", () => {
            $("#barup-buttons").css("display", "");
            $("#barup-user").css("display", "");
            $("#barup-search-input").css("max-width", "");
            $("#barup-search").css("left", "").addClass("hidden");
            if ($("#gbtniabsc").length !== 0)
                $("#gbtniabsc").remove();
            $(".barup").css("display", "");
        })
        new Promise(async (a,b) => {
            while (rcmail.env.last_frame_class === undefined) {
                await delay(500);
            }
            let eClass = mm_st_ClassContract(rcmail.env.last_frame_class);
            let btn = ArianeButton.default();
            console.log(parent.rcmail, rcmail);
            if (parent.rcmail.env.mel_metapage_ariane_button_config[eClass] !== undefined)
            {
                if (parent.rcmail.env.mel_metapage_ariane_button_config[eClass].hidden === true)
                    btn.hide_button();
                else {
                    btn.show_button();
                    btn.place_button(parent.rcmail.env.mel_metapage_ariane_button_config[eClass].bottom, parent.rcmail.env.mel_metapage_ariane_button_config[eClass].right);
                }
            }
            else {
                btn.show_button();
                btn.place_button(parent.rcmail.env.mel_metapage_ariane_button_config["all"].bottom, parent.rcmail.env.mel_metapage_ariane_button_config["all"].right);
            }
        });
        
    });

}

/**
 * Initialise un des badges du menu.
 * @param {*} storage Donnée en local.
 * @param {string} storage_key Clé de la donnée en local.
 * @param {function} func Fonction à appeller si la donnée en local est nulle.
 * @param {string} selector Classe ou id de la commande du menu à ajouter un badge.
 * @param {string} idBadge Id du badge.
 * @param {boolean} isAsyncFunc Si la function "func" est asynchrone ou non. "false" par défaut. 
 * @param {boolean} isLength Si la données en local est un tableau ou une taille. 
 * - "false" = tableau (défaut)
 * - "true" = taille
 */
function init_badge(storage, storage_key, func, selector, idBadge, isAsyncFunc = false, isLength = false)
{
    try {
        if (storage === null)
        {
            if (isAsyncFunc)
            {
                func().then(() => {
                    try {
                        try_add_round(selector, idBadge);
                        storage = mel_metapage.Storage.get(storage_key);
                        update_badge((isLength ? storage : storage.length), idBadge);
                    } catch (error) {
                        console.error(error);
                    }
                });
            }
            else {
                func();
                try_add_round(selector, idBadge);
                storage = mel_metapage.Storage.get(storage_key);
                update_badge((isLength ? storage : storage.length), idBadge);
            }
        }
        else
        {
            try_add_round(selector, idBadge);
            update_badge((isLength ? storage : storage.length), idBadge);
        }       
    } catch (error) {
        console.error(error);
    }
}

/**
 * Ajoute un badge si la taille est supérieur à 0.
 * @param {string} selector Objet à ajouter le badge.
 * @param {string} idBadge Id du badge.
 */
function try_add_round(selector, idBadge)
{
    selector =  $(selector);
    if ($("#" + idBadge).length === 0)
        selector.append(`<sup><span id="` + idBadge + `" class="roundbadge menu lightgreen" style="display:none;">?</span></sup>`)
}

/**
 * Met à jours le badge.
 * @param {number} size Nombre à afficher.
 * @param {string} idBadge Id du badge à modifier.
 */
function update_badge(size, idBadge)
{
    let querry = $("#" + idBadge);
    if (size === 0)
        querry.css("display", "none");
    else
    {
        if (size > 999)
        {
            size = "999+";
            querry.css("font-size", "6px");
        }
        else
            querry.css("font-size", "");
        querry.html(size);
        querry.css("display", "");
    }
}

function dateNow(date){
	let set = date; 
	let getDate = set.getDate().toString();
	if (getDate.length == 1){ //example if 1 change to 01
	 getDate = "0"+getDate;
	}
	let getMonth = (set.getMonth()+1).toString();
	if (getMonth.length == 1){
	 getMonth = "0"+getMonth;
	}
	let getYear = set.getFullYear().toString();
	let dateNow = getYear + "-" + getMonth + '-' + getDate+"T00:00:00";
	return dateNow;
  }

})();

$(document).ready(() => {
    if (parent != window)
    {
        rcmail.addEventListener("init", function() {
            //$(".mm-frame").css("margin-top", "0");
            if ($("html.iframe").length > 0)
                $(".mm-frame").css("margin-top", "0");
        });
    }
})