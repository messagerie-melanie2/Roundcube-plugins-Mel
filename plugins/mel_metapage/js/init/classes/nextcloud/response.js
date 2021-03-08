function Nextcloud_Response(xml, func_class, includeFolder = false, includeInvalid = false)
{
    this.files = [];
    this.type = func_class;
    this.document = xml;
    let tmp = xml.firstElementChild.children;
    for (let index = 0; index < tmp.length; index++) {
        const element = tmp[index];
        const file = new func_class(element);
        if (file.type !== mel_metapage.Symbols.nextcloud.folder || includeFolder)
        {
            if (file.is_valid_file !== false)
                this.files.push(file);
        }
    }
}

Nextcloud_Response.prototype.GetFile = function(filename)
{
    return Enumerable.from(this.files).where(x => x.name.includes(filename)).firstOrDefault(null);
}

Nextcloud_Response.prototype.GetFiles = function(filename)
{
    return Enumerable.from(this.files).where(x => x.name.includes(filename)).toArray();
}

Nextcloud_Response.prototype.FileExist = function(filename)
{
    return this.GetFiles(filename).length > 0;
}