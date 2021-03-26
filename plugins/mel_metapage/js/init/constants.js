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
        /**
         * Récupère une donnée depuis le stockage local.
         * @param {string} key Clé de la donnée à récupérer.
         */
        get:function(key) {
            return JSON.parse(window.localStorage.getItem(key));
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
        /**
         * Clé des données du calendrier.
         */
        calendar:"mel_metapage.calendar",
        /**
         * Clé des données des tâches.
         */
        tasks:"mel_metapage.tasks",
        other_tasks:"mel_metapage.tasks.others",
        /**
         * Clé du nombre de mail non lus.
         */
        mail:"mel_metapage.mail.count",
        last_calendar_update:"mel_metapage.calendar.last_update",
        last_task_update:"mel_metapage.tasks.last_update",
        ariane:"ariane_datas"
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
        }
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
        check_if_calendar_valid:function(element, events)
        {
            if (mceToRcId(rcmail.env.username) !== element.calendar)
                return false;
            else {
                if (element._instance !== undefined)
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
            //console.log(sd.format(), ed.format(), date.format(), startDate.format(), endDate.format());
            //console.log(start)
            if (startDate <= sd && sd <= endDate)
                return true;
            else if (startDate <= ed && ed <= endDate)
                return true;
            else
                return false;
            
        },
        url: function (task, action = "", args = null)
        {
            let url = task;
            if (action !== null && action !== undefined && action !== "")
                url += "&_action=" + action;
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
        }
    }
}; 
window.mel_metapage = mel_metapage;
if (mel_metapage.RCMAIL_Start !== undefined)
{
    rcmail.addEventListener("init", () => {
        for (const key in mel_metapage.RCMAIL_Start) {
            if (Object.hasOwnProperty.call(mel_metapage.RCMAIL_Start, key)) {
                const element = mel_metapage.RCMAIL_Start[key];
                element();
            }
        }
    });
}