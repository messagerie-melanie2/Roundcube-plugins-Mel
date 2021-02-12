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
        super(moment(cal.start).format(format) + " - " + moment(cal.end).format(format) + " : " + cal.title, cal.description, "#");
        this.onclick = 'mm_s_Calendar(`'+JSON.stringify(cal).replace(/"/g, "£¤£")+'`)';
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