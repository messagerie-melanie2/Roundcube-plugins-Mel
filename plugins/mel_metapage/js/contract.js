/**
 * Représentation d'un résultat de recherche.
 */
class SearchResult {
    /**
     * 
     * @param {string} header Titre du résultat
     * @param {string} sub_header Corps du résultat
     * @param {string} link Action à faire lorsque l'on clique sur le résultat
     */
    constructor(header, sub_header, link)
    {
        this.header = header;
        this.sub_header = sub_header;
        this.link = link;
    }
}

/**
 * Représente le résultat de recherche d'un évènement de calendrier.
 */
class SearchResultCalendar extends SearchResult
{
    /**
     * 
     * @param {*} cal Evènement d'un calendrier.
     */
    constructor(cal)
    {
        const format = "DD/MM/YYYY HH:mm";
        super(moment(cal.start).format(format) + " - " + moment(cal.end).format(format) + " : " + cal.title, cal.description, "#");
        this.onclick = "SearchResultCalendar.CreateOrOpen('"+JSON.stringify(cal).replace(/"/g, "£¤£").replaceAll("'", "µ¤¤µ")+"')";//'mm_s_Calendar(`'+JSON.stringify(cal).replace(/"/g, "£¤£")+'`)';
        //JSON.stringify(cal).replace(/"/g, "£¤£")
    }    
}

/**
 * Convertit une liste d'évènement en résultat de recherche.
 * @param {array} cals Liste d'évènements.
 */
SearchResultCalendar.from_array = function (cals)
{
    retour = [];
    for (let index = 0; index < cals.length; ++index) {
        retour.push(new SearchResultCalendar(cals[index]));
    }
    return {label:rcmail.gettext('agenda', 'mel_portal'), datas:retour};
}
/**
 * Ouvre ou ferme une frame calendrier.
 * @param {string} json 
 */
SearchResultCalendar.CreateOrOpen= function (json)
{
    event.preventDefault();

    cal = JSON.parse(json.replace(/£¤£/g, '"').replaceAll("µ¤¤µ", "'"));
    // mm_create_calendar(this, cal);
    // return;
    m_mp_set_storage('calendar_redirect', json.replaceAll("µ¤¤µ", "'"), false)
    if (parent === window && rcmail.env.task === "calendar")
    {
        rcmail.set_busy(true, "loading");
        window.location.href = rcmail.get_task_url("calendar&source=" + cal.calendar + "&date="+(new Date(cal.start)).getTime()/1000.0);
    }
    else {
        $("#barup-search").addClass("hidden");
        let querry = $(".calendar-frame");
        if (querry.length > 0)
        {
            //rcmail.set_busy(true, "loading");
            rcmail.env.frame_created = false;
            querry[0].src = rcmail.get_task_url("calendar&source=" + cal.calendar + "&date="+(new Date(cal.start)).getTime()/1000.0);
            rcmail.env.calendar_mm_created = true;
            // if (!rcmail.busy)
            //     rcmail.set_busy(true, "loading");
                new Promise(async (a, b) => {
                    while (rcmail.env.frame_created === false) {
                        //console.log("waiting....");
                        await delay(100);
                        // if (!rcmail.busy)
                        //     rcmail.set_busy(true, "loading");
                    }
                    mm_st_CreateOrOpenModal('calendar', true);

                    $("#barup-search").addClass("hidden");
                    $("#barup-search-background").addClass("hidden");
                    // console.log("opening....");
                    // //m_mp_action_from_storage('calendar_redirect', SearchResultCalendar.after_loading, true, "¤avoid")
                    rcmail.set_busy(false);
                    rcmail.clear_messages();
                });


        }
        else
        {
            let id = mm_st_CreateOrOpenModal("calendar", false);
            rcmail.set_busy(true, "loading");
            querry = $("#" + id);
            rcmail.env.frame_created = false;
            querry[0].src = rcmail.get_task_url("calendar&source=" + cal.calendar + "&date="+(new Date(cal.start)).getTime()/1000.0);
            new Promise(async (a, b) => {
                while (rcmail.env.frame_created === false) {
                    await delay(100);
                    if (!rcmail.busy)
                        rcmail.set_busy(true, "loading");
                }
                rcmail.set_busy(false);
                rcmail.clear_messages();
                $("#barup-search-background").addClass("hidden");
                mm_st_CreateOrOpenModal("calendar");
               // m_mp_action_from_storage('calendar_redirect', SearchResultCalendar.after_loading, true, "¤avoid")

            });
        }
    }
}
/**
 * Action à faire après avoir charger la frame des calendriers.
 * @param {*} event Evènement à afficher.
 */
SearchResultCalendar.after_loading = function (event)
{
    event = JSON.parse(event.replace(/£¤£/g, '"'))
    console.log("event", event, window.ui_cal);
    if (event !== null && window.ui_cal !== undefined)
    {
        setTimeout(() => {
            window.ui_cal.event_show_dialog(event);
        }, 111);
        //console.log(event);
    }
}