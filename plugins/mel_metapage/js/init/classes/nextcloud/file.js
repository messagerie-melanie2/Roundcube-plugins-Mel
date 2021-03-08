function Nextcloud_File(xml)
{
    this.document_path = function()
    {
        let txt = "";
        let retour = "";
        let canSave = false;
        let nextIsUSer = false;
        for (let index = 0; index < this.href.length; index++) {
            const element = this.href[index];
            //console.log("[element]",element);
            if (element === "/")
            {
                //console.log("[txt]",txt);
                if (!canSave)
                {
                    if (!nextIsUSer)
                    {
                        if (txt === "files")
                            nextIsUSer = true;
                    }
                    else
                        canSave = true;
                    txt = "";
                }
                else {
                    //console.log("[retour]", retour);
                    retour += txt + "/";
                    txt = "";
                }
            }
            else
                txt += element;
        }
        return retour;
    }
    
    this.file = xml;
    try {
        this.href = xml.getElementsByTagName("d:href")[0].innerHTML;
    } catch (error) {
        this.is_valid_file = false;
        return;
    }
    let text = "";
    let lastText = "";
    for (let index = 0; index < this.href.length; index++) {
        const element = this.href[index];
        if (element === "/")
        {
            if (index === (this.href.length - 1))
                break;
            lastText = text;
            text = "";
        }
        else
            text += element;
    }
    this.name = decodeURI(text);
    this.folder_parent = decodeURI(lastText);
    if (this.folder_parent === "files")
        this.folder_parent = null;
    text = lastText = null;
    //console.log(xml.getElementsByTagName("d:propstat"));
    let prop = Enumerable.from(xml.getElementsByTagName("d:propstat")).select(x => x.getElementsByTagName("d:status")[0]).where(x => x.innerHTML.includes("OK")).firstOrDefault(null);
    this.is_valid_file = prop !== null;
    if (!this.is_valid_file)
        return;
    prop = prop.parentElement.getElementsByTagName("d:prop")[0];
    try {
        this.lastModified = new Date(prop.getElementsByTagName("d:getlastmodified")[0].innerHTML);
    } catch (error) {
        this.lastModified = null;
    }
    try {
        this.tag = prop.getElementsByTagName("d:getetag")[0].innerHTML;
    } catch (error) {
        this.tag = null;
    }
    try {
        this.id = prop.getElementsByTagName("oc:fileid")[0].innerHTML;
    } catch (error) {
        this.id = undefined;
    }

    try {
        this.size = prop.getElementsByTagName("oc:size")[0].innerHTML;
    } catch (error) {
        this.size = undefined;
    }
    //console.log(this.filename,prop.getElementsByTagName("d:resourcetype")[0], prop.getElementsByTagName("d:resourcetype")[0].children);
    try {
        this.type = prop.getElementsByTagName("d:resourcetype")[0].children.length !== 0 ? mel_metapage.Symbols.nextcloud.folder : mel_metapage.Symbols.nextcloud.file;
    } catch (error) {
        this.type = undefined;
    }

    this.is_file = function () {
        return this.type === mel_metapage.Symbols.nextcloud.file;
    };

    this.is_master_folder = function (user)
    {
        return !this.is_file() && this.filename === user;
    }

}

Nextcloud_File.get_path = function(path)
{
    let tmp = new Nextcloud_File(null);
    tmp.href = path;
    return tmp.document_path();
}