(function(){
    $.datetimepicker.setLocale("fr");
if (rcmail)
{
    if (rcmail.env.task === "tasks")
        parent.child_rcmail = rcmail;

    var refreshWorkspaceCloudNotification = function ()
    {
        switch (rcmail.env.task) {
            case "bureau":
                if (rcmail.env.bureau && rcmail.env.bureau.wsp_doc)
                    rcmail.env.bureau.wsp_doc.update(true);
                break;

            case "workspace":
                switch (rcmail.env.action) {
                    case "":
                    case "index":
                        if (rcmail.env.wsp_index && rcmail.env.wsp_index.wsp_doc)
                            rcmail.env.wsp_index.wsp_doc.update(true);
                        break;

                    case "workspace":
                        if (rcmail.env.wsp_roundrive_show)
                            rcmail.env.wsp_roundrive_show.checkNews();
                        break;
                
                    default:
                        break;
                }
                break;
        
            default:
                break;
        }
    };

    $(document).ready(( )=> {
        if (rcmail.env.mailboxes_display === "unified")
            $("#folderlist-content ul#mailboxlist").addClass(rcmail.env.mailboxes_display);
    })

    if (parent != window && rcmail.mel_metapage_fn === undefined)
    {
            rcmail.mel_metapage_fn = {
                refresh:() => {
                    refreshWorkspaceCloudNotification();
                    rcmail.triggerEvent("mel_metapage_refresh");
                }
            };
    }

    //console.log(parent, window, parent === window);
    if (parent.rcmail.mel_metapage_fn !== undefined)
        return;

    parent.rcmail.addEventListener("init", function() {
        $(`<p id="sr-document-title-focusable" tabindex="-1" class="sr-only">${window.document.title}</p>`).prependTo("body");

        
        //Definition des functions
        parent.rcmail.mel_metapage_fn = {
            calendar_updated: function () {
                parent.rcmail.triggerEvent(mel_metapage.EventListeners.calendar_updated.before);
                //rcmail.set_busy(true, "loading");

                if (parent.rcmail.env.ev_calendar_url === undefined)
                    parent.rcmail.env.ev_calendar_url = ev_calendar_url;

                return $.ajax({ // fonction permettant de faire de l'ajax
                type: "POST", // methode de transmission des données au fichier php
                url: parent.rcmail.env.ev_calendar_url+'&start='+dateNow(new Date())+'&end='+dateNow(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()+1)), // url du fichier php
                success: function (data) {
                    try {
                        let events = [];
                        data = JSON.parse(data);
                        //console.log("calendar", data);
                        data = Enumerable.from(data).where(x =>  mel_metapage.Functions.check_if_date_is_okay(x.start, x.end, moment()) ).toArray();
                        let startMoment;
                        let endMoment;
                        let element;
                        let now = moment().startOf('day');

                        const parse = window.cal !== null && window.cal !== undefined && window.cal.parseISO8601 ? window.cal.parseISO8601 : (item) => item;

                        for (let index = 0; index < data.length; ++index) {
                            element = data[index];

                            if (element.allDay)
                                element.order = 0;
                            else
                                element.order = 1;

                            if (moment(parse(element.end)) < now)
                                    continue;

                            if (element.allDay)
                            {
                                element.end = moment(parse(element.end)).startOf("day");
                                if (element.end.format("YYYY-MM-DD HH:mm:ss") == now.format("YYYY-MM-DD HH:mm:ss") && moment(element.start).startOf("day").format("YYYY-MM-DD HH:mm:ss") != element.end.format("YYYY-MM-DD HH:mm:ss"))
                                    continue;
                                else
                                    element.end = element.end.format();
                            }

                            events.push(element);
                            
                        }

                        mel_metapage.Storage.set("all_events", events);
                        data = null;
                        let ids = [];

                        for (let index = 0; index < events.length; index++) {
                            const element = events[index];
                            //console.log(mceToRcId(rcmail.env.username) !== element._id, rcmail.env.username, mceToRcId(rcmail.env.username), element._id, element)
                            if (mceToRcId(rcmail.env.username) !== element.calendar)
                                ids.push(element);
                            else {
                                if (element._instance !== undefined)
                                {
                                    
                                    for (let it = 0; it < events.length; it++) {
                                        const event = events[it];

                                        if (event.uid === element.uid && event._instance === undefined)
                                            ids.push(event);
                                    }
                                }
                            }
                        }

                        events = Enumerable.from(events).where(x => !ids.includes(x)).orderBy(x => x.order).thenBy(x => moment(x.start)).toArray();
                        try_add_round(".calendar", mel_metapage.Ids.menu.badge.calendar);
                        update_badge(events.length, mel_metapage.Ids.menu.badge.calendar);
                        mel_metapage.Storage.set(mel_metapage.Storage.calendar, events);
                        mel_metapage.Storage.set(mel_metapage.Storage.last_calendar_update, moment().startOf('day'))
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
                // rcmail.set_busy(false);
                // rcmail.clear_messages();
             });
            },
            tasks_updated: function(){
                //rcmail.set_busy(true, "loading");
                //?_task=tasks&_action=fetch&filter=0&lists=tommy_-P-_delphin_-P-_i&_remote=1&_unlock=true&_=1613118450180
                parent.rcmail.triggerEvent(mel_metapage.EventListeners.tasks_updated.before);
                return $.ajax({ // fonction permettant de faire de l'ajax
                type: "POST", // methode de transmission des données au fichier php
                url: '?_task=tasks&_action=fetch&filter=0&_remote=1&_unlock=true&_=1613118450180',//rcmail.env.ev_calendar_url+'&start='+dateNow(new Date())+'&end='+dateNow(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()+1)), // url du fichier php
                success: function (data) {
                    try {
                        data=JSON.parse(data).callbacks[0][1].data;
                        let datas_to_save = [];
                        let other_datas = {};
                        let other_datas_count = {};
                        let element;
                        let username = mceToRcId(rcmail.env.username);
                        for (let index = 0; index < data.length; ++index) {
                            element = data[index];
                            // if ()
                            //     continue;
                            if (element.list !== username && other_datas[element.list] === undefined)
                            {
                                other_datas[element.list] = [];
                                other_datas_count[element.list] = 1;
                            }
                            else if (element.list !== username)
                                ++other_datas_count[element.list];
                            if (element.complete === 0)
                            {
                                element.mel_metapage = {
                                    order:(element._hasdate === 1 ? (moment(element.datetime*1000) <= moment() ? 0 : 1 ) : 1),
                                };
                                if (element.list !== username)
                                    other_datas[element.list].push(element);
                                else
                                    datas_to_save.push(element);
                            }
                        }
                        datas_to_save.sort((a,b) => a.mel_metapage.order - b.mel_metapage.order);
                        mel_metapage.Storage.set(mel_metapage.Storage.tasks, datas_to_save);
                        mel_metapage.Storage.set(mel_metapage.Storage.other_tasks, other_datas);
                        mel_metapage.Storage.set(mel_metapage.Storage.other_tasks_count, other_datas_count);
                        try_add_round(".tasklist", mel_metapage.Ids.menu.badge.tasks);
                        update_badge(datas_to_save.length, mel_metapage.Ids.menu.badge.tasks);
                        mel_metapage.Storage.set(mel_metapage.Storage.last_task_update, moment().startOf('day'))
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
                // rcmail.set_busy(false);
                // rcmail.clear_messages();
             });
            },
            mail_updated: function(isFromRefresh = false, new_count = null) {
                parent.rcmail.triggerEvent(mel_metapage.EventListeners.mails_updated.before);

                mel_metapage.Storage.remove(mel_metapage.Storage.mail);

                rcmail.mel_metapage_fn.mail_wsp_updated();

                if (new_count !== null && new_count !== undefined)
                {
                    mel_metapage.Storage.set(mel_metapage.Storage.mail, new_count);
                    try_add_round(".mail ", mel_metapage.Ids.menu.badge.mail);
                    update_badge(new_count, mel_metapage.Ids.menu.badge.mail);
                    parent.rcmail.triggerEvent(mel_metapage.EventListeners.mails_updated.after);
                    if ($(".mail-frame").length > 0)
                        Title.update($(".mail-frame")[0].id);

                    return (async () => {})();
                }

                const last_count = mel_metapage.Storage.get(mel_metapage.Storage.mail);
                return $.ajax({ // fonction permettant de faire de l'ajax
                type: "GET", // methode de transmission des données au fichier php
                url: '?_task=mel_metapage&_action=get_unread_mail_count',//rcmail.env.ev_calendar_url+'&start='+dateNow(new Date())+'&end='+dateNow(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()+1)), // url du fichier php
                success: function (data) {
                    try {
                        //console.log("mail_updated", data);
                        if (isFromRefresh === true && ( last_count === null || last_count || undefined || last_count < data))
                        {
                            if (rcmail.env.current_frame_name !== "mail")
                            {
                                const querry = $(`iframe.mail-frame`);
                                if (querry.length > 0)
                                    querry[0].contentWindow.postMessage({
                                        exec:"refresh_frame",
                                        child:false,
                                        _integrated:true,
                                        always:true
                                    });
                            }
                        }
                        
                        mel_metapage.Storage.set(mel_metapage.Storage.mail, data);
                        try_add_round(".mail ", mel_metapage.Ids.menu.badge.mail);
                        update_badge(data, mel_metapage.Ids.menu.badge.mail);
                        parent.rcmail.triggerEvent(mel_metapage.EventListeners.mails_updated.after);
                        if ($(".mail-frame").length > 0)
                            Title.update($(".mail-frame")[0].id);
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
            mail_wsp_updated: async function()
            {
                return mel_metapage.Functions.get(
                    mel_metapage.Functions.url("mel_metapage", "get_wsp_unread_mails_count"),
                    {},
                    (datas) => {
                        // try {
                        //     console.log("datas mails upd", JSON.parse(datas));
                        // } catch (error) {
                        //     console.log("datas mails upde", datas);
                        // }
                        datas = JSON.parse(datas);
                        //console.log("datas", datas);
                        mel_metapage.Storage.set(mel_metapage.Storage.wsp_mail, datas.datas);

                        workspaces.sync.PostToParent({
                            exec:"trigger.mail_wsp_updated",
                            _integrated:true,
                            always:true
                        })
                    }
                );
            },
            weather: async function()
            {
              //3600000  

              const maxAge = 1000 * 60;
              const weatherKey = "weatherIcon";

              let options = {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: maxAge
              };
              
              function success(pos) {
                let crd = pos.coords;
              
                console.log('Your current position is:');
                console.log(`Latitude : ${crd.latitude}`);
                console.log(`Longitude: ${crd.longitude}`);
                console.log(`More or less ${crd.accuracy} meters.`);

                mel_metapage.Functions.post(mel_metapage.Functions.url("mel_metapage", "weather"), {
                    _lat:crd.latitude,
                    _lng:crd.longitude
                },
                (datas) => {
                    console.log("datas", datas);
                });

              }
              
              function error(err) {
                console.warn(`ERROR(${err.code}): ${err.message}`);
                mel_metapage.Storage.remove(weatherKey);
              }
              
              navigator.geolocation.getCurrentPosition(success, error, options);
              
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
                    parent.rcmail.mel_metapage_fn.mail_updated(true);
                });

                refreshWorkspaceCloudNotification();
                rcmail.triggerEvent("mel_metapage_refresh");
            }
        };

        //ajout des events listener
        parent.rcmail.addEventListener(mel_metapage.EventListeners.calendar_updated.get, parent.rcmail.mel_metapage_fn.calendar_updated);
        parent.rcmail.addEventListener(mel_metapage.EventListeners.tasks_updated.get, parent.rcmail.mel_metapage_fn.tasks_updated);
        parent.rcmail.addEventListener(mel_metapage.EventListeners.mails_updated.get, (x) => {
            parent.rcmail.mel_metapage_fn.mail_updated((x.isFromRefresh === undefined ? false : x.isFromRefresh), (x.new_count === undefined ? null : x.new_count));
        });
        
        parent.rcmail.enable_command("my_account", true);
        parent.rcmail.register_command("my_account", () => {

            if($(".settings-frame").length > 1 && $("iframe.settings-frame").length === 0)
                window.location.href = mel_metapage.Functions.url("settings", "plugin.mel_moncompte");
            else {

                if ($("iframe.settings-frame").length === 0)
                {
                    mel_metapage.Functions.change_frame("settings", true, true, {
                        _action:"plugin.mel_moncompte"
                    });
                }
                else if ($("iframe.settings-frame").length === 1)
                {
                    let config = {};
                    config[rcmail.env.mel_metapage_const.key] = rcmail.env.mel_metapage_const.value;
                    $("iframe.settings-frame")[0].src = mel_metapage.Functions.url("settings", "plugin.mel_moncompte", config);
                    mel_metapage.Functions.change_frame("settings", true, false);
                }
                else
                    window.location.href = mel_metapage.Functions.url("settings", "plugin.mel_moncompte");

            }
        });


        parent.rcmail.enable_command("change_avatar", true);
        parent.rcmail.register_command("change_avatar", () => {
            const func = function () {
                document.querySelector("iframe.discussion-frame").contentWindow.postMessage({
                    externalCommand: 'go',
                    path: '/account/profile'
                  }, '*')
            };

            if (rcmail.env.current_frame_name === "discussion")
                func();
            else
                mel_metapage.Functions.change_frame("rocket", true, true).then(func);
        });

        rcmail.register_command("more_options", () => {
            let otherapp = $("#otherapps");
            if (otherapp.css("display") === "none")
            {
                otherapp.css("display", "");
                otherapp.find("a").first().focus();
                $("#taskmenu a.more-options").addClass("selected");
            }
            else {
                otherapp.css("display", "none");
                if ($("#otherapps a.selected").length === 0)
                    $("#taskmenu a.more-options").focus().removeClass("selected");
                else
                    $("#taskmenu a.more-options").focus().addClass("selected");
            }
        }, true);

        $(".barup").on("click", (e) => {
            let target = $(e.target);

            let isFav = false;

            while (!isFav && !target.hasClass("barup")) {
                if (target.hasClass("my_favorites"))
                    isFav = true;
                else
                    target = target.parent();
            }

            if (!isFav)
                FullscreenItem.close_if_exist();
        });

        //Ajustement de la barre des tâches
        $(window).on("resize", () => {
            let check = false;
            if ($("#otherapps .resized").length > 0)
            {
                $("#otherapps .resized").remove();
                $("#taskmenu li.hiddedli").css("display", "block");
                check = true;
            }

            if ($("#taskmenu")[0].scrollHeight > window.innerHeight)
            {
                let items = $("#taskmenu li");
                let it = items.length;

                while($("#taskmenu")[0].scrollHeight > window.innerHeight)
                {
                    --it;
                    
                    if (it <= 5)
                        break;

                    if ($(items[it]).find("a").hasClass("settings") || $(items[it]).find("a").hasClass("more-options"))
                        continue;
                    else {
                        const tmp = $(items[it]).clone();
                        $(items[it]).addClass("hiddedli").css("display", "none");
                        $("#otherapps ul").append(tmp.addClass("resized"));
                    }
                }
                setTimeout(() => {
                    mm_st_ChangeClicks("#otherapps", ".resized a");
                }, 10);
                check = true;
            }

            if (check)
             setTimeout(() => {
                if ($("#otherapps .selected").length === 0)
                    $(".more-options").removeClass("selected");
                else
                    $(".more-options").addClass("selected");
             }, 10);

        });

        $(document).ready(() => {
        $(window).resize();});
        
        

        // //checks
        let local_storage = {
            calendar:mel_metapage.Storage.get(mel_metapage.Storage.calendar),
            tasks:mel_metapage.Storage.get(mel_metapage.Storage.tasks),
            mails:{
                unread_count:mel_metapage.Storage.get(mel_metapage.Storage.mail),
            },
            last_update:{
                calendar:moment(mel_metapage.Storage.get("mel_metapage.calendar.last_update")),
                tasks:moment(mel_metapage.Storage.get("mel_metapage.tasks.last_update"))
            }
        }

        if (local_storage.last_update.calendar.format() !== moment().startOf("day").format())
            parent.rcmail.triggerEvent(mel_metapage.EventListeners.calendar_updated.get);
        
        if (local_storage.last_update.tasks.format() !== moment().startOf("day").format())
            parent.rcmail.triggerEvent(mel_metapage.EventListeners.tasks_updated.get);

        if (window.alarm_managment !== undefined)
        {
            window.alarm_managment.clearTimeouts();
            setTimeout(async () => {
                let it = 0;
                await wait(() => {
                    return rcmail._events["plugin.display_alarms"] === undefined && it++ < 5;
                });
                window.alarm_managment.generate(local_storage.calendar);
            }, 100);

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


        $("#menu-small-li").prependTo("#taskmenu ul").css("display", "");

        $("#user-up-panel-a").on("click", m_mp_avatarOnSelect).on("keydown", m_mp_avatarOnSelect).on("focus", () => {
            $("#user-up-panel").find(".row").first().css("box-shadow","0 0 0 .2rem #484D7A69");
        })
        .on("blur", () => {
            $("#user-up-panel").find(".row").first().css("box-shadow","");
        });

        //create-modal
        parent.rcmail.enable_command("create-modal", true);
        parent.rcmail.register_command("create-modal", () => {
            m_mp_Create();
        })

        rcmail.register_command("fav-modal", () => {
            m_mp_shortcuts();
        }, true);

        parent.rcmail.enable_command("help-modal", true);
        parent.rcmail.register_command("help-modal", () => {
            m_mp_Help();
        })

        parent.rcmail.enable_command("mm-search", true);
        parent.rcmail.register_command("mm-search", () => {
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
        });
        
        // new Promise(async (a,b) => {
        //     while (rcmail.env.last_frame_class === undefined) {
        //         await delay(500);
        //     }
        //     let eClass = mm_st_ClassContract(rcmail.env.last_frame_class);
        //     let btn = ArianeButton.default();
        //     //console.log(parent.rcmail, rcmail);
        //     if (parent.rcmail.env.mel_metapage_ariane_button_config[eClass] !== undefined)
        //     {
        //         if (parent.rcmail.env.mel_metapage_ariane_button_config[eClass].hidden === true)
        //             btn.hide_button();
        //         else {
        //             btn.show_button();
        //             btn.place_button(parent.rcmail.env.mel_metapage_ariane_button_config[eClass].bottom, parent.rcmail.env.mel_metapage_ariane_button_config[eClass].right);
        //         }
        //     }
        //     else {
        //         btn.show_button();
        //         btn.place_button(parent.rcmail.env.mel_metapage_ariane_button_config["all"].bottom, parent.rcmail.env.mel_metapage_ariane_button_config["all"].right);
        //     }
        // });

        window.addEventListener("message", receiveMessage, false);
        function receiveMessage(event)
        {
            if (event.data.message === undefined)
                return;
            const datas = event.data.datas;
            switch (event.data.message) {
                case "update_calendar":
                    rcmail.triggerEvent(mel_metapage.EventListeners.calendar_updated.get);
                    break;
                // case "ChangeMenu()":
                //     rcmail.env.wsp_from_child = true;
                //     ChangeMenu(datas.hide,datas.picture, datas.toolbar);
                //     break;
                // case "_ChangeFrameWorkspace()":
                //     _ChangeFrameWorkspace(datas);
                //     break;
                // case "_OpenHome()":
                //     _OpenHome();
                // break;
                default:
                    break;
            }
        }
        
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
    if (size == 0)
    {
        //console.log("heeeeere", querry);
        querry.css("display", "none");
    }
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
            let querry = $("#user-picture");
        });
    }
    else {
        rcmail.addEventListener("init", async function() {
            let querry = $("#user-picture");
            // console.log("ping", _ping, rcmail.env.rocket_chat_url + "/avatar/" + rcmail.env.username);
            querry.html('<img alt="" src='+rcmail.env.rocket_chat_url + "avatar/" + rcmail.env.username + ' />');
            let image = querry.find("img")[0];
            image.onerror = function(){
                $("#user-picture").html("<span>" + rcmail.env.username.slice(0,2) + "</span>");
            };
        });
    }
})