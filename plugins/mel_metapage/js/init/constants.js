/**
 * Met en pause une fonction asynchrone.
 * @param {number} ms 
 */
const delay = ms => new Promise(res => setTimeout(res, ms));
const isAsync = myFunction => myFunction.constructor.name === "AsyncFunction";
const wait = async function (func, waitTime = 500)
{
    while ((isAsync(func) ? await func() : func()))
    {
        await delay(waitTime);
    }
}
const ping = async function(url, useSSL = true)
{

    // //let ip = url;

    // var _that = this;

    // let img = new Image();

    // img.onload = function() {_that.ok = true;};
    // img.onerror = function(e) {_that.ok = false; console.error(e);};

    // //let start = new Date().getTime();
     let ssl = useSSL ? "https" : "http";
    // img.src = !url.includes("https") && !url.includes("http") ? (ssl + "://" + url) : url;
    // console.log(img.src);
    // let timer = setTimeout(function() { _that.ok = false;}, waitTime*1000);
    // await wait(() => _that.ok === undefined);
    // clearTimeout(timer)
    // return _that.ok;
    let ok;
    try {
        await $.ajax({
            url: !url.includes("https") && !url.includes("http") ? (ssl + "://" + url) : url,
            success: function(result){
            ok = true;
            },     
            error: function(result){
                ok = false;
            }
        });
    } catch (error) {
        console.error(error);
        ok = false;
    }
    return ok;
}
const mceToRcId = function (txt = "")
{
    return txt.replaceAll(".", '_-P-_').replaceAll("@", "'_-A-_'").replaceAll("%", '_-C-_');
}
/**
 * Lien du chargement des évènements d'un calendrier.
 */
const ev_calendar_url = '?_task=calendar&_action=load_events';
/**
 * Liste des différents données constantes utile pour le plugin "mel_metapage".
 */
const mel_metapage = {
    /**
     * Liste des différents évènements.
     */
    EventListeners: {
        /**
         * Lorsque le calendrier est mis à jours.
         */
        calendar_updated:new EventListenerDatas("mel_metapage.calendar_updated"),
        /**
         * Lorsque les tâches sont mises à jours. 
         */
        tasks_updated:new EventListenerDatas("mel_metapage.tasks_updated"),
        /**
         * Lorsque les mails sont mis à jours.
         */
        mails_updated: new EventListenerDatas("mel_metapage.mails_updated"),
    },
    /**
     * Différents clés de stockage local.
     */
    Storage: {
        unexist:Symbol("unexist"),
        /**
         * Récupère une donnée depuis le stockage local.
         * @param {string} key Clé de la donnée à récupérer.
         */
        get:function(key) {
            try {
                return JSON.parse(window.localStorage.getItem(key));
            } catch (error) {
                return this.unexist;
            }
        },
        /**
         * Ajoute ou modifie une donnée dans le stockage local.
         * @param {string} key Clé de la donnée pour la retrouver. 
         * @param {*} item Donnée à sauvegarder.
         */
        set:function(key, item)
        {
            window.localStorage.setItem(key, JSON.stringify(item));
        },
        /**
         * Supprime une donnée dans le stockage local.
         * @param {string} key Clé de la donnée à supprimer.
         */
        remove: function (key){
            window.localStorage.removeItem(key);
        },
        check(storage = null)
        {
            if (storage === null)
            {
                let items = [];
                for (const key in mel_metapage.Storage) {
                    const element = mel_metapage.Storage[key];
                    if (element !== undefined) {
                       items.push(mel_metapage.Storage.check_day(key));
                    }                  
                }

                return {
                    items:items,
                    wait:async function()
                    {
                        for (let index = 0; index < this.items.length; ++index) {
                            const element = this.items[index];
                            if (element.wait !== undefined)
                                await element.wait();
                        }
                    }
                }
            }
            else {
                const update_element = (update_key, day_key) => {
                    let item = {
                        wait:async () => {return mel_metapage.Storage.get(update_key);}
                    }
                    let update = false;
                    if (!update && moment(mel_metapage.Storage.get(day_key)).format("DD/MM/YYYY") !== moment().format("DD/MM/YYYY"))
                        update = true;
                    if (!update && mel_metapage.Storage.get(update_key) === null)  
                        update = true;
                    if (update)
                    {
                        mel_metapage.Storage.remove(update_key);
                        workspaces.sync.PostToParent({
                            exec:"rcmail.mel_metapage_fn.tasks_updated()",
                            child:false
                        })
                        item.wait = async () => {
                            await wait(() => mel_metapage.Storage.get(update_key) === null);
                            return mel_metapage.Storage.get(update_key);
                        };        
                    }
                    return item;
                };

                switch (storage) {
                    case mel_metapage.Storage.other_tasks:
                    case mel_metapage.Storage.tasks:
                        return update_element(storage, mel_metapage.Storage.last_task_update);
                    case "all_events":
                    case mel_metapage.Storage.calendar:
                        return update_element(storage, mel_metapage.Storage.last_calendar_update);
                    default:
                        return item;
                }
            }
        },
        /**
         * Clé des données du calendrier.
         */
        calendar:"mel_metapage.calendar",
        /**
         * Clé des données des tâches.
         */
        tasks:"mel_metapage.tasks",
        other_tasks:"mel_metapage.tasks.others",
        other_tasks_count:"mel_metapage.tasks.others.count",
        /**
         * Clé du nombre de mail non lus.
         */
        mail:"mel_metapage.mail.count",
        last_calendar_update:"mel_metapage.calendar.last_update",
        last_task_update:"mel_metapage.tasks.last_update",
        ariane:"ariane_datas",
        wait_frame_loading:"mel_metapage.wait_frame_loading",
        wait_frame_waiting:"waiting...",
        wait_frame_loaded:"loaded",
        wait_call_loading:"mel_metapage.call.loading",
    },
    /**
     * Liste des symboles.
     */
    Symbols: {
        /**
         * Symboles du plugin "My_Day".
         */
        my_day:{
            /**
             * Symbole "Calendrier", est utilisé pour savoir si il faut mettre à jours uniquement les évènements ou non.
             */
            calendar:Symbol("calendar"),
            /**
             * Symbole "Tâches", est utilisé pour savoir si il faut mettre à jours uniquement les tâches ou non.
             */
            tasks:Symbol("tasks")
        },
        nextcloud:{
            folder:Symbol("folder"),
            file:Symbol("file")
        },
        null:Symbol("null")
    },
    /**
     * Les différents Identifiants
     */
    Ids: {
        /**
         * Ids pour le menu.
         */
        menu:{
            /**
             * Id des différents badges du menu.
             */
            badge:{
                calendar:"menu-badge-calendar",
                tasks:"menu-badge-tasks",
                mail:"menu-badge-mail",
                ariane:"menu-badge-ariane"
            }
        },
        create:{
            doc_input:"generated-document-input-mel-metapage",
            doc_input_ext:"generated-document-input-mel-metapage-ext",
            doc_input_hidden:"generated-document-input-mel-metapage-hidden",
            doc_input_path:"generated-document-select-mel-metapage-path"
        }
    },
    PopUp:{
        open_ariane: function () {
            if (rcmail.busy)
                return;
            if (mel_metapage.PopUp.ariane === null)
                mel_metapage.PopUp.ariane = new ArianePopUp(ArianeButton.default());
            //console.log(mel_metapage, window == parent);
            mel_metapage.PopUp.ariane.show();
        },
        ariane:null,
    },
    RCMAIL_Start:{
        ping_nextcloud: async function ()
        {
            if (rcmail.env.nextcloud_url !== undefined && rcmail.env.nextcloud_url !== null && rcmail.env.nextcloud_url !== "")
            {
                rcmail.env.nextcloud_pinged = await ping(rcmail.env.nextcloud_url);
                if (rcmail.env.nextcloud_pinged === false)
                    rcmail.env.nextcloud_pinged = await ping(rcmail.env.nextcloud_url, true);
            }
        }
    },
    Functions:{

        /**
         * 
         * @param {moment} start (moment) Début des évènements à récupérer
         * @param {moment} end (moment) Fin des évènements à récupérer
         */
        update_calendar: function (start, end){
            start = start.format("YYYY-MM-DDTHH:mm:ss");
            end = end.format("YYYY-MM-DDTHH:mm:ss");
            if (parent.rcmail.env.ev_calendar_url === undefined)
                parent.rcmail.env.ev_calendar_url = ev_calendar_url;
            return $.ajax({ // fonction permettant de faire de l'ajax
            type: "POST", // methode de transmission des données au fichier php
            url: rcmail.env.ev_calendar_url+'&start='+start+'&end='+end, // url du fichier php
            success: function (data) {
                try {
                    let events = [];
                    data = JSON.parse(data);
                    data = Enumerable.from(data).where(x => mel_metapage.Functions.check_if_date_is_okay(x.start, x.end, start) || mel_metapage.Functions.check_if_date_is_okay(x.start, x.end, end)).toArray();
                    return data;

  
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

        check_if_calendar_valid:function(element, events, test=true)
        {
            if (mceToRcId(rcmail.env.username) !== element.calendar)
                return false;
            else {
                if (element._instance !== undefined && test)
                {
                    for (let it = 0; it < events.length; it++) {
                        const event = events[it];
                        if (event.uid === element.uid && event._instance === undefined)
                            return event;
                    }
                }
            }
            return true;
        },

        check_if_date_is_okay(sd, ed, date)
        {
            if (typeof sd === "string")
                sd = moment(sd).startOf("day");

            if (typeof ed === "string")
                ed = moment(ed).endOf("day");

            if (typeof date === "string")
                date = moment(date);

            startDate = moment(date).startOf("day");
            endDate = moment(date).endOf("day");
            //  console.log("event sd", sd.format(), "event ed",ed.format(), "date", date.format(), "sd", startDate.format(), "ed", endDate.format());
            //  console.log(startDate <= sd && sd <= endDate, startDate <= sd, sd <= endDate)
            //  console.log(startDate <= ed && ed <= endDate, startDate <= ed , ed <= endDate)
            if (startDate <= sd && sd <= endDate)
                return true;
            else if (startDate <= ed && ed <= endDate)
                return true;
            else if (sd <= startDate && startDate <= ed && sd <= endDate && endDate <= ed)
                return true;
            else
                return false;
            
        },

        /**
         * Récupère une URL conforme.
         * @param {string} task Tâche 
         * @param {string} action Action
         * @param {JSON} args divers arguments ex {_eventType:1}
         * @returns {string}
         */
        url: function (task, action = "", args = null)
        {
            let url = task;
            if (action !== null && action !== undefined && action !== "")
                url += "&_action=" + action;

            if (window.location.href.includes(`${rcmail.env.mel_metapage_const.key}=${rcmail.env.mel_metapage_const.value}`) || window !== parent)
            {
                if (args === null || args === undefined)
                {
                    args = {};
                    args[rcmail.env.mel_metapage_const.key] = rcmail.env.mel_metapage_const.value;
                }
                else if (args[rcmail.env.mel_metapage_const.key] === undefined)
                    args[rcmail.env.mel_metapage_const.key] = rcmail.env.mel_metapage_const.value;
            }

            if (args !== null)
            {
                for (const key in args) {
                    if (Object.hasOwnProperty.call(args, key)) {
                        const element = args[key];
                        url += "&" + key + "=" + element
                    }
                }
            }
            return rcmail.get_task_url(url, window.location.origin + window.location.pathname)
        },

        /**
         * Change de frame, même si l'on est pas depuis "TOP"
         * @param {string} frame Frame à ouvrir
         * @param {boolean} changepage Si vrai, on change de page, sinon la page ouverte sera caché.
         * @param {boolean} waiting Si l'on veux attendre que la frame sois ouverte ou non.
         * @param {JSON} args Arguments à ajouter dans l'url de la frame.
         */
        change_frame: async function(frame, changepage = true, waiting = false, args = null)
        {
            if (frame === "webconf")
            {
                var initial_change_page = changepage;
                changepage = false;
            }

            if (waiting)
                mel_metapage.Storage.set(mel_metapage.Storage.wait_frame_loading, mel_metapage.Storage.wait_frame_waiting);
            
            workspaces.sync.PostToParent({
                exec:`mm_st_OpenOrCreateFrame('${frame}', ${changepage}, JSON.parse('${JSON.stringify(args)}'))`,//"mm_st_OpenOrCreateFrame('"+frame+"', "+changepage+", )",
                child:false
            });
            
            if (waiting)
            {
                await wait(() => mel_metapage.Storage.get(mel_metapage.Storage.wait_frame_loading) !== mel_metapage.Storage.wait_frame_loaded);
                mel_metapage.Storage.remove(mel_metapage.Storage.wait_frame_loading);
            }

            if (frame === "webconf")
            {
                if (initial_change_page)
                {
                    mel_metapage.Functions.call(`mm_st_OpenOrCreateFrame('webconf', true, JSON.parse('${JSON.stringify(args)}'))`);
                    // workspaces.sync.PostToParent({
                    //     exec:"$('#layout-frames').css('display', '');$('.mm-frame').css('display', 'none');$('.webconf-frame').css('display', '')",
                    //     child:false
                    // });
                }
            }
            
        },

        /**
         * Reviens à la frame d'avant.
         * @param {boolean} wait Si l'on doit attendre le changement de frame ou non.
         * @param {string} default_frame Frame par défaut si il n'y a pas de frame d'avant. Si null, ne fait rien dans ce cas.
         */
        frame_back:async function(wait = true, default_frame = null)
        {
            let last = await this.ask("rcmail.env.last_frame_class");
            if (last === null || last === undefined || last === mel_metapage.Storage.unexist)
            {
                if (default_frame !== null)
                    last = default_frame;
                else
                    return;
            }
            await this.change_frame(last, true, wait);
        },

        /**
         * Execute un string depuis "TOP"
         * @param {string} exec String à éxécuter
         * @param {string} child Exécuter aussi dans les fenetres filles ?
         * @param  {JSON} args Autres arguments (eval etc....)
         */
        call:function(exec, child = false, args = {})
        {
            if (typeof exec !== "string")
            {
                const tmp_exec = JSON.stringify(exec);
                if (tmp_exec === undefined)
                {
                    if (typeof exec === "function")
                        exec = `(${exec.toString()})()`;
                    else
                        exec = exec.toString();
                }
                else
                    exec = tmp_exec;
            }
            let config = {
                exec:exec,
                child:child
            };
            
            if (args != null && args !== undefined)
            {
                for (const key in args) {
                    if (Object.hasOwnProperty.call(args, key)) {
                        const element = args[key];
                        config[key] = element;
                    }
                }
            }

            if (window.workspaces !== undefined && window.workspaces.sync !== undefined)
                workspaces.sync.PostToParent(config);    
            else {
                parent.postMessage(config);
            }      
        },

        /**
         * Execute du script à un contexte au dessus.
         * @param {string} exec String à éxécuter
         * @param {boolean} child Exécuter aussi dans les fenetres filles ?
         * @param {JSON} args Autres arguments (eval etc....)
         */
        callAsync:async function(exec, child = false, args = {})
        {
            mel_metapage.Storage.set(mel_metapage.Storage.wait_call_loading, mel_metapage.Storage.wait_frame_waiting);
            this.call(exec, child, args);
            await wait(() => {
                return mel_metapage.Storage.get(mel_metapage.Storage.wait_call_loading) === mel_metapage.Storage.wait_frame_waiting;
            });
        },

        /**
         * Modifie l'url du navigateur
         * @param {string} url URL à afficher 
         */
        title:function (url)
        {
            mel_metapage.Functions.call(`window.history.replaceState({}, document.title, '${url}')`);
        },

        busy:function (busy = true)
        {
            const framed = window !== parent;
            mel_metapage.Storage.set("mel.busy", busy);
            if (busy)
            {
                this.call("rcmail.set_busy(true, 'loading')");
                if (framed)
                    rcmail.set_busy(true, 'loading')
            }
            else {
                this.call("rcmail.set_busy(false);rcmail.clear_messages();");
                if (framed)
                {
                    rcmail.set_busy(false);
                    rcmail.clear_messages();
                }
            }

        },

        is_busy:function ()
        {
            const framed = window !== parent && rcmail.busy != undefined;
            if (framed)
                return mel_metapage.Storage.get("mel.busy") === true || rcmail.busy;
            else
            {
                if (rcmail.busy === undefined)
                    return mel_metapage.Storage.get("mel.busy") === true;
                else
                    return rcmail.busy || mel_metapage.Storage.get("mel.busy") === true;
            }
        },

        /**
         * @async
         * Récupère une variable globale parente.
         * @param {string} props Variable à récupérer
         * @returns {Promise<any>} Valeur de la variable
         */
        ask:async function(props)
        {
            this.call(`mel_metapage.Storage.set("mel.ask", ${props})`);
            await wait(() => mel_metapage.Storage.get("mel.ask") === null);
            props = mel_metapage.Storage.get("mel.ask");
            mel_metapage.Storage.remove("mel.ask");
            return props;
        },

        /**
         * Faire facilement une requête ajax
         * @param {string} url 
         * @param {JSON} datas 
         * @param {function} success 
         * @param {function} failed 
         * @param {string} type 
         * @returns {Promise<any>} Appel ajax
         */
        ajax:function(url, datas = mel_metapage.Symbols.null, success = (datas) => {}, failed = (xhr, ajaxOptions, thrownError) => {console.error(xhr, ajaxOptions, thrownError)}, type = "POST")
        {
            let config = { // fonction permettant de faire de l'ajax
                type: type, // methode de transmission des données au fichier php
                url: url,//rcmail.env.ev_calendar_url+'&start='+dateNow(new Date())+'&end='+dateNow(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()+1)), // url du fichier php
                success: success,
                error: failed
            };
            if (datas !== mel_metapage.Symbols.null)
                config["data"] = datas;

            return $.ajax(config);
        },

        /**
         * Execute un appel ajax get
         * @param {string} url 
         * @param {JSON} datas 
         * @param {function} success 
         * @param {function} failed
         * @returns {Promise<any>}
         */
        get:function(url, datas = {}, success = (datas) => {}, failed = (xhr, ajaxOptions, thrownError) => {console.error(xhr, ajaxOptions, thrownError)})
        {
            for (const key in datas) {
                if (Object.hasOwnProperty.call(datas, key)) {
                    const element = datas[key];
                    url += `${(url.includes("?") ? "&" : "?")}${key}=${encodeURIComponent(element)}`;
                }
            }
            return this.ajax(url, mel_metapage.Symbols.null, success, failed, "GET");
        },

        /**
         * Execute un appel ajax post
         * @param {string} url 
         * @param {Symbol|JSON} datas <c>mel_metapage.Symbols.null</c> si aucune données.
         * @param {function} success 
         * @param {function} failed 
         */
        post:function(url, datas = mel_metapage.Symbols.null, success = (datas) => {}, failed = (xhr, ajaxOptions, thrownError) => {console.error(xhr, ajaxOptions, thrownError)})
        {
            return this.ajax(url, datas, success, failed);
        },

        /**
         * Contient différents fonctions pour mettre à jours certaines données.
         */
        update :{
            /**
             * Met à jours le calendrier.
             */
            calendar:function ()
            {
                mel_metapage.Functions.call("rcmail.mel_metapage_fn.calendar_updated();");
            }
        },

        /**
         * Vérifie si un handler existe sur un élément.
         * @param {DOMElement} element Element à tester.
         * @param {function} handler Fonction à vérifier
         * @param {string} type Type d'évènement
         * @returns {boolean}
         */
        handlerExist:function (element, handler, type = "click")
        {
            if (element.val !== undefined)
                element = element[0];
            return Enumerable.from(jQuery._data(element, 'events')[type]).where(x => x.handler + "" === handler + "").any();
        },

        /**
         * Fonctions lié au stockage nextcloud.
         */
        stockage:{
            /**
             * Ouvre la frame nextcloud et affiche un document en particulier (si il existe).
             * @param {JSON|Nextcloud_File} datas Données du document à afficher. 
             * {
                    file:nom du fichier,
                    folder:chemin du fichier
                }
             * @param {boolean} isfiledatas Si vrai, datas est un objet <c>Nextcloud_File</c>
             * @param {function} thenFunc Action à faire une fois que l'on à changer de page.
             */
            go:function(datas, isfiledatas, thenFunc = null)
            {
                let init = 'new Nextcloud("rcmail.env.nextcloud_username")';
                let go = `.go(${JSON.stringify(datas)}, ${isfiledatas})`;
                let then = "";

                if (thenFunc !== null)
                {
                    then = `.then((a) => { (${thenFunc + ""})(a) })`;
                }

                mel_metapage.Functions.call(init + go + then);
            }
        }




    }
}; 
window.mel_metapage = mel_metapage;

// if (mel_metapage.RCMAIL_Start !== undefined)
// {
//     rcmail.addEventListener("init", () => {
//         for (const key in mel_metapage.RCMAIL_Start) {
//             if (Object.hasOwnProperty.call(mel_metapage.RCMAIL_Start, key)) {
//                 const element = mel_metapage.RCMAIL_Start[key];
//                 element();
//             }
//         }
//     });
// }