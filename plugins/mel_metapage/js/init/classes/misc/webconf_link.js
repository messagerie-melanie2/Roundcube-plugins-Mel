class WebconfLink
{
    constructor(link)
    {
        this.key = "";
        this.ariane = null;
        this.wsp = null;

        if (link.includes("#visio:"))
        {
            //let tmp = link.split("_key=")[1].split("_");
            this.key = link.split("_key=")[1].split("&_")[0].replaceAll(rcube_calendar.old_newline_key, rcube_calendar.newline_key).split(rcube_calendar.newline_key)[0];

            if (link.includes("_ariane="))
            {
                this.wsp = null;
                this.ariane = link.split("_ariane=")[1].split("&_")[0];
            }
            else if (link.includes("_wsp="))
            {
                this.wsp = link.split("_wsp=")[1].split("&_")[0];
                this.ariane = null;
            }

            if (this.key.includes(' ')) this.key = this.key.split(' ')[0];
        }
    }

    get_ariane_string()
    {
        return this.ariane === null ? null : `'${this.ariane}'`;
    }

    get_wsp_string()
    {
        return this.wsp === null ? null : `'${this.wsp}'`;
    }

    static create(event)
    {
        if (rcube_calendar.is_desc_frame_webconf(event.location)) return new IntegratedWebconfLink(event.location, event.categories); 
        else if (rcube_calendar.is_desc_bnum_webconf(event.location) && !event.location.includes('#visio')) return new IntegratedPubliWebconfLink(event.location);
        else return new WebconfLink(event.location);
    }
}

class IntegratedWebconfLink extends WebconfLink
{
    constructor(location, category)
    {
        super('');
        this.key = mel_metapage.Functions.webconf_url(location).split(rcube_calendar.newline_key.toUpperCase())[0];
        this.ariane = null;

        if (Array.isArray(category) && category.length > 0) category = category[0];
        
        if (!!category && category.includes('ws#')) this.wsp = category.replace('ws#', '');
    }
}

class IntegratedPubliWebconfLink extends WebconfLink
{
    constructor(url)
    {
        url = url.split('/');
        url[0] = '#visio:';
        super(url.join('/'));
    }
}

window.IntegratedPubliWebconfLink = IntegratedPubliWebconfLink;