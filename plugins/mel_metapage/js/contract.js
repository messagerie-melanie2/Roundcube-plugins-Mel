class SearchResult {
    constructor(header, sub_header, link)
    {
        this.header = header;
        this.sub_header = sub_header;
        this.link = link;
    }
}

class SearchResultCalendar extends SearchResult
{
    constructor(cal)
    {
        const format = "DD/MM/YYYY HH:mm";
        super(moment(cal.start).format(format) + " - " + moment(cal.end).format(format) + " : " + cal.title, cal.description, cal.title);
        this.onclick = "SearchResultCalendar.CreateOrOpen('"+JSON.stringify(cal).replace(/"/g, "£¤£")+"')";//'mm_s_Calendar(`'+JSON.stringify(cal).replace(/"/g, "£¤£")+'`)';
        //JSON.stringify(cal).replace(/"/g, "£¤£")
    }    
}

SearchResultCalendar.from_array = function (cals)
{
    retour = [];
    for (let index = 0; index < cals.length; ++index) {
        retour.push(new SearchResultCalendar(cals[index]));
    }
    return {label:rcmail.gettext('agenda', 'mel_portal'), datas:retour};
}
SearchResultCalendar.CreateOrOpen= function (json)
{
    event.preventDefault();
    cal = JSON.parse(json.replace(/£¤£/g, '"'));
    m_mp_set_storage('calendar_redirect', json, false)
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
            rcmail.set_busy(true, "loading");
            rcmail.env.frame_created = false;
            querry[0].src = rcmail.get_task_url("calendar&source=" + cal.calendar + "&date="+(new Date(cal.start)).getTime()/1000.0);
            rcmail.env.calendar_mm_created = true;
            if (!rcmail.busy)
                rcmail.set_busy(true, "loading");
                new Promise(async (a, b) => {
                    while (rcmail.env.frame_created === false) {
                        console.log("waiting....");
                        await delay(1000);
                        if (!rcmail.busy)
                            rcmail.set_busy(true, "loading");
                    }
                    mm_st_CreateOrOpenModal('calendar', true);
                    console.log("opening....");
                    //m_mp_action_from_storage('calendar_redirect', SearchResultCalendar.after_loading, true, "¤avoid")
                    rcmail.set_busy(false);
                    rcmail.clear_messages();
                });


        }
        else
        {
            rcmail.set_busy(true, "loading");
            let id = mm_st_CreateOrOpenModal("calendar", false);
            querry = $("#" + id);
            rcmail.env.frame_created = false;
            querry[0].src = rcmail.get_task_url("calendar&source=" + cal.calendar + "&date="+(new Date(cal.start)).getTime()/1000.0);
            new Promise(async (a, b) => {
                while (rcmail.env.frame_created === false) {
                    await delay(1000);
                    if (!rcmail.busy)
                        rcmail.set_busy(true, "loading");
                }
                mm_st_CreateOrOpenModal("calendar");
                m_mp_action_from_storage('calendar_redirect', SearchResultCalendar.after_loading, true, "¤avoid")
                rcmail.set_busy(false);
                rcmail.clear_messages();
            });
        }
    }
    // m_mp_CreateOrOpenFrame('calendar', 
    // () => m_mp_set_storage('calendar_redirect', json, false), 
    // () => m_mp_action_from_storage('calendar_redirect', SearchResultCalendar.after_loading, true, "¤avoid"));
}
SearchResultCalendar.after_loading = function (event)
{
    event = JSON.parse(event.replace(/£¤£/g, '"'))
    console.log("event", event, parent.child_cal);
    if (event !== null)
    {
        parent.child_cal.event_show_dialog(event);
        console.log(event);
    }
}