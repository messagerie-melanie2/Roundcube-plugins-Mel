class SearchAction
{
    constructor(text, onclick)
    {
        this.init().setup(text, onclick);
    }

    init()
    {
        this.text = '';
        this.onclick = () => {};
        return this;
    }

    setup(text, onclick)
    {
        this.text = text;
        this.onclick = onclick;
    }

    html(classes = '')
    {
        if (this.text === '') return '';
        return $(`<button class="$${classes} mel-button btn btn-secondary">${this.text}<span class="plus icon-mel-arrow-right"></span></button>`).click(this.onclick);
    }
}

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
    constructor(icon = '', action = null, datas = {})
    {
        this.init().setup(icon, action, datas);
    }

    init()
    {
        this.icon = '';
        this.html = '';
        this.datas = {date:null};
        this.action = new SearchAction('', null);
        return this;
    }

    setup(icon, action, datas)
    {
        this.icon = icon;
        this.action = action ?? this.action;
        this.datas = Object.assign(this.datas, datas);
        this.html = this.GenerateHtml();
    }

    GenerateHtml()
    {
        return `
            <div class="mel-block-list">
                <div style="display:inline-block;vertical-align:top">
                    <span class='icon ${this.icon || 'no-icon'}'></span>
                </div>
                ${this._html()}
            </div>
        `;
    }

    _html()
    {
        return '';
    };
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
        super('icon-mel-calendar', null, {cal, date:cal.start});
        //this.datas.date = cal.start;
        //a.select(x => Enumerable.from(x.value.raw).where(w => w.key === 'datas').select(s => s.value.date).toArray()).toArray()

        //const format = "DD/MM/YYYY HH:mm";
        //super(moment(cal.start).format(format) + " - " + moment(cal.end).format(format) + " : " + cal.title, cal.description, "#");
        //this.onclick = "SearchResultCalendar.CreateOrOpen('"+JSON.stringify(cal).replace(/"/g, "£¤£").replaceAll("'", "µ¤¤µ")+"')";//'mm_s_Calendar(`'+JSON.stringify(cal).replace(/"/g, "£¤£")+'`)';
        //JSON.stringify(cal).replace(/"/g, "£¤£")
    }   
    
    _html()
    {
        const cal = this.datas.cal;
        let html = super._html();
        html += `<div style='display:inline-block'>${rcube_calendar.mel_metapage_misc.GetDateFr(moment(cal.start).format("dddd D MMMM"))}</div>`;
        html += html_helper.Calendars({
            datas:[cal],
            get_only_body:true
        });
        return html;
    };
}

/**
 * Convertit une liste d'évènement en résultat de recherche.
 * @param {array} cals Liste d'évènements.
 */
SearchResultCalendar.from_array = function (cals)
{
    retour = [];
    for (let index = 0; index < cals.length; ++index) {

        if (SearchResult.calendarToReadable(cals[index].calendar) !== rcmail.env.username)
            continue;

        retour.push(new SearchResultCalendar(cals[index]));
    }
    return {label:rcmail.gettext('agenda', 'mel_portal'), datas:retour};
}

SearchResult.calendarToReadable = function (key) {
	return key
		.replaceAll('_-p-_', ".")
		.replaceAll('_-s-_', "$")
		.replaceAll('_-e-_', "&")
		.replaceAll('_-t-_', "~")
		.replaceAll('_-q-_', "\\")		
        .replaceAll('_-P-_', ".")
		.replaceAll('_-S-_', "$")
		.replaceAll('_-E-_', "&")
		.replaceAll('_-T-_', "~")
		.replaceAll('_-Q-_', "\\");
}

SearchResult.parse = function (string) {
    const key = "£¤£";
    const ap = "µ¤¤µ";
    const n = "-¤¤n¤¤-";
	if (string.includes(key))
        string = string.replaceAll(key, '"');

    if (string.includes(ap))
        string = string.replaceAll(ap, "'");

    if (string.includes("\n"))
        string = string.replaceAll("\n", n);

    string = JSON.parse(string);

    if (string.description.includes(n))
        string.description = string.description.replaceAll(n, "\n");

    return string;

}


/**
 * Ouvre ou ferme une frame calendrier.
 * @param {string} json 
 */
SearchResultCalendar.CreateOrOpen= function (json)
{

    if (event !== undefined)
        event.preventDefault();

    if (parent !== window)
    {
        workspaces.sync.PostToParent({
            exec:`SearchResultCalendar.CreateOrOpen('${json}');`,
            always:true,
            child:false
        });
        return;
    }

    cal = SearchResult.parse(json)//JSON.parse(json.replace(/£¤£/g, '"').replaceAll("µ¤¤µ", "'"));
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
            querry[0].src = rcmail.get_task_url("calendar&source=" + cal.calendar + "&date="+(new Date(cal.start)).getTime()/1000.0)+"&_is_from=iframe";
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
            querry[0].src = rcmail.get_task_url("calendar&source=" + cal.calendar + "&date="+(new Date(cal.start)).getTime()/1000.0)+"&_is_from=iframe";
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
    event = SearchResult.parse(event);//JSON.parse(event.replace(/£¤£/g, '"'))
    //console.log("event", event, window.ui_cal);
    if (event !== null && window.ui_cal !== undefined)
    {
        setTimeout(() => {
            window.ui_cal.event_show_dialog(event);
        }, 111);
        //console.log(event);
    }
}