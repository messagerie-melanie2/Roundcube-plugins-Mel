class WebconfLink
{
    constructor(link)
    {
        this.key = "";
        this.ariane = null;
        this.wsp = null;

        if (link.includes("#visio:"))
        {
            let tmp = link.split("_key=")[1].split("_");
            this.key = link.split("_key=")[1].split("&_")[0];

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
}