class RoundriveShow 
{
    constructor(...args)
    {
        this.init(...args);
    }

    init(initFolder, parent, config = {
        afterInit:null,
        updatedFunc:null,
        classes:{
            folder:"",
            file:"",
        },
        wsp:"unknown",
        ignoreInit:false
    })
    {
        this.wsp = config.wsp;
        this.config = config;
        this.config.initFolder = initFolder;
        this.parent = typeof parent === "string" ? $(parent) : parent;
        this.enum = {
            type:{
                file:"file",
                directory:"dir"
            },
            ext:{
                music:{
                    types:["mp3", "waw", "midi"],
                    icon:"icon-mel-file-empty"
                },
                image:{
                    types:["png", "jpg", "jpeg", "bmp", "gif"],
                    icon:"icon-mel-file-empty"
                },
                raxText:{ 
                    types:["txt", "md", "cs", "js", "php", "html", "css", "rtf"],
                    icon:"icon-mel-file-empty"
                },
                doc:{
                    types:["docm", "doc", "docx", "dot", "dox", "odt"],
                    icon:"icon-mel-file-word"
                },
                exel:{
                    types:["csv", "xlsx", "xsl", "ods"],
                    icon:"icon-mel-file-excel"
                },
                powerpoint:{
                    types:["ppt", "ppm", "pptx", "odp"],
                    icon:"icon-mel-file-ppt"
                },
                pdf:{
                    types:["pdf"],
                    icon:"icon-mel-file-pdf"
                }
            }
        };
        this.openDatas = {};

        this.load();

        const ignoreInit = this.config.ignoreInit;

        if (!ignoreInit)
        {

            let tmp = this.expandInitialFolder(initFolder);
            if (tmp !== undefined && tmp !== null && tmp.always)
            {
                tmp.always(() => {

                    if (config.afterInit !== undefined && config.afterInit !== null)
                        config.afterInit();
        
                    this.checkNews();

                });
            }
            else
            {
                if (config.afterInit !== undefined && config.afterInit !== null)
                    config.afterInit();

                this.checkNews();
            }

        }
    }

    getIcon(file)
    {
        const type = file.extension;

        for (const key in this.enum.ext) {
            if (Object.hasOwnProperty.call(this.enum.ext, key)) {
                const element = this.enum.ext[key];

                if (element.types.includes(type))
                    return element.icon;
                
            }
        }

        return "icon-mel-file-empty";
    }

    expandInitialFolder(initFolder)
    {

        let treeDatas = this.tree.getFolder(this.wsp, initFolder);
        if (treeDatas.length !== 0)
        {
            this.showDatas(treeDatas, this.parent, false, true);
        }
        else {

            let config = {
                _folder:initFolder
            };
        
            return mel_metapage.Functions.get(
                mel_metapage.Functions.url("roundrive", "folder_list_all_items"),
                config,
                (datas) => {
                    this.showDatas(datas, this.parent);
                },
                (xhr, ajaxOptions, thrownError) => {
                    console.error(xhr, ajaxOptions, thrownError, this);
                    this.parent.html("Connexion impossible.");
                    rcmail.display_message("Impossible de se connecter au stockage !", "error");

                }
            );
        }
    }

    generateID(path)
    {
        let id = ``;
        for (let index = 0; index < path.length; ++index) {
            const element = path[index];
            id += element.charCodeAt();
        }

        return id;
    }

    showDatas(datas, parent, isChild = false, isFromTree = false, checkOpen = false)
    {
        if (!isFromTree)
        {
            datas = JSON.parse(datas);

            datas = Enumerable.from(datas).select(x => {
                x.order = x.type === this.enum.type.directory ? 0 : 1;
                return x;
            }).orderBy(x => x.order).thenBy(x => x.basename).toArray();

            console.log("datas root",datas);

            this.tree.addOrUpdateRange(this.wsp, datas);
            this.save();
        }

        const col_text = 7;
        const col_datas = 4;
        const col_link = 1;

        let id;
        let tmp;
        let html;
        let it = 0;
        for (const key in datas) {
            if (Object.hasOwnProperty.call(datas, key)) {
                const element = datas[key];

                switch (element.type) {
                    case this.enum.type.directory:

                        id = this.generateID(element.path);

                        if (this.openDatas[element.path] === undefined)
                            this.setFolderOpenOrClose(element.path, false);

                        html = `<button style="display:flex" class=" ${isChild ? "child" : ""} no-style full-width btn btn-secondary row ${it === datas.length - 1 ? "last" : ""} ">`;
                        html += `<div class="col-${col_text + col_datas}"><h4><span class="icon-mel-folder"><span class="sr-only">Dossier</span></span> <span class="elementname" style="position:relative">${decodeURIComponent(element.filename)}${this.openDatas[element.path].news ? `<span style="" class="notif roundbadge lightgreen nc">•</span>` : ""}</span><h4></div>`;
                        html += `<div class="col-${col_link} col-arrow"><h4><span class="${this.openDatas[element.path].opened ? "icon-mel-chevron-down" : "icon-mel-chevron-right"}"></span></h4></div>`;
                        html += "</button>";

                        tmp = $(`<div class="${this.config.classes !== undefined && this.config.classes.folder !== undefined ? this.config.classes.folder : ""}"></div>`);

                        html = $(html).on("click", (event) => {
                            console.log("click", event);
                            this.expandOrMinimizeFolder(event, element.path, this.generateID(element.path));
                        }).appendTo(tmp);

                        console.log("ELEMENET", html, element, this.openDatas[element.path]);

                        tmp.append(`<div class="child-for" style="${this.openDatas[element.path].opened ? "" : "display:none"}" data-path="${id}"></div>`)
                        .appendTo(parent);

                        if (this.openDatas[element.path].opened)
                            setTimeout(() => {
                                const tmpId = this.generateID(element.path);
                                this.expandOrMinimizeFolder({
                                    currentTarget:$(`.child-for[data-path=${tmpId}]`)
                                }, element.path, tmpId);
                            }
                            , 10);

                        break;
                    case this.enum.type.file:

                        html = `<div class=" ${isChild ? "child" : ""}   ${it === datas.length - 1 ? "last" : ""} ${this.config.classes !== undefined && this.config.classes.file !== undefined ? this.config.classes.file : ""}">`;
                        html += '<div class="row" style="width:100%">';
                        html += `<div class=" col-${col_text}"><button class="havefunc1 no-style full-width btn btn-secondary"><h4><span class="${this.getIcon(element)}"><span class="sr-only">Fichier</span></span> ${decodeURIComponent(element.basename)}<h4></button></div>`;
                        html += `<div style="text-align:right;cursor:pointer;" class="havefunc1 col-${col_datas}"><p>Créé par : ${element.createdBy.includes(" - ") ? element.createdBy.split(" - ")[0] : element.createdBy}<br/>Dernières mise à jour : ${moment(element.modifiedAt).format("DD/MM/YYYY")}</p></div>`;
                        html += `<div class="col-${col_link} col-arrow"><button class="col-arrow havefunc2 no-style btn btn-secondary"><h4><span class="icon-mel-expand"></span></h4></button></div>`;
                        html += "</div></div>";

                        html = $(html);
                        html.find(".havefunc1").on("click", (event) => {
                            this.clickFile(event, element);
                        });
                        html.find(".havefunc2").on("click", (event) => {
                            this.clickGoToFile(event, element);
                        });

                        html.appendTo(parent);

                        break;
                
                    default:
                        html = "";
                        break;
                }


                ++it;
            }
        }

        return parent;
    }

    setFolderOpenOrClose(folder, opened)
    {
        if (this.openDatas[folder] === undefined)
            this.openDatas[folder] = {opened:opened, news:false};
        else
            this.openDatas[folder].opened = opened;
    }

    setFolderNewOrnot(folder, _new)
    {
        if (this.openDatas[folder] === undefined)
            this.openDatas[folder] = {opened:false, news:_new};
        else
            this.openDatas[folder].news = _new;
    }

    expandOrMinimizeFolder(event, folder, id)
    {
        let target = $(event.currentTarget);
        //console.log("[expandOrMinimizeFolder]", event, folder, target, id);
        if (target.hasClass("open"))
        {
            this.minimizeFolder(event, id);
            this.setFolderOpenOrClose(folder, false);
        }
        else
            this.expandFolder(event, folder, id);
    }

    expandFolder(event, folder, path)
    {
        this.setFolderOpenOrClose(folder, true);
        this.setFolderNewOrnot(folder, false);
        const initFolder = folder;
        folder = `${rcmail.gettext("files", "roundrive")}/${decodeURIComponent(folder)}`;

        //console.log("path", $(`.child-for[data-path=${path}]`));

        let parent = $(`.child-for[data-path=${path}]`);

        parent.parent().find("button").first().find(".notif").remove();
        this.config.updatedFunc(this.parent.find(".notif").length > 0);

        $(event.currentTarget).addClass("open").find(".icon-mel-chevron-right").removeClass("icon-mel-chevron-right").addClass("icon-mel-chevron-down");

        if (parent.html() === "")
        {
            parent.html('<center><span class="spinner-grow"></span></center>').css("display", "").addClass("open");

            let treeDatas = this.tree.getFolder(this.wsp, initFolder)
            console.log("yolo", treeDatas, initFolder, this.wsp, this.tree);
            if (treeDatas.length !== 0)
            {
                parent.find("center").remove();
                this.showDatas(treeDatas, parent, true, true);
            }
            else {

                let config = {
                    _folder:folder
                };

                return mel_metapage.Functions.get(
                    mel_metapage.Functions.url("roundrive", "folder_list_all_items"),
                    config,
                    (datas) => {
                        parent.find("center").remove();
                        this.showDatas(datas, parent, true);
                    },
                    (xhr, ajaxOptions, thrownError) => {
                        console.error(xhr, ajaxOptions, thrownError);
                        parent.removeClass("open").find("center").remove();
                        rcmail.display_message("Impossible de se connecter au stockage !", "error");
                    }
                );
            }
        }

        parent.css("display", "");
        


    }

    minimizeFolder(event, key)
    {
        $(event.currentTarget).removeClass("open").find(".icon-mel-chevron-down").removeClass("icon-mel-chevron-down").addClass("icon-mel-chevron-right");
        $(`.child-for[data-path=${key}]`).removeClass("open").css("display", "none");
    }

    clickFile(event, file)
    {
        //console.log(file, "file");

        // if (window.Nextcloud !== undefined && !rcmail.busy)
        // {
        //     const datas = {
        //         file:file.basename,
        //         path:file.path.replace(file.basename, "")
        //     };

        //     mel_metapage.Functions.stockage.go({
        //         file:datas.file,
        //         folder:datas.path
        //     }, false, async (error) => {
        //         if (!error)
        //         {
        //             console.error("Impossible d'ouvrir le fichier", error);
        //             mel_metapage.Functions.busy(false);
        //             await mel_metapage.Functions.change_frame("stockage", true, true);
        //             rcmail.display_message("Impossible d'ouvrir le fichier.", "error");
        //         }
        //     });
        // }    
        ChangeToolbar('stockage', this, Nextcloud.index_url + "/apps/files?dir=/"+file.dirname+"&openfile=" + file.id);
    }

    clickGoToFile(event, file)
    {
        ChangeToolbar('stockage', this, Nextcloud.index_url + "/apps/files?dir=/"+file.path+"&fileid=" + file.id);
        //window.open();
    }

    createFile()
    {
        mel_metapage.Functions.call("open_create", false, {
            _integrated:true,
            always:true,
            args:["document", `dossiers-${this.config.wsp}`]
        });
    }

    save()
    {
        mel_metapage.Storage.set(`wsp_nc_${rcmail.env.username}`, this.tree);
    }

    load()
    {
        const datas = mel_metapage.Storage.get(`wsp_nc_${rcmail.env.username}`);
        this.tree = new WorkspaceDriveTree(datas === undefined || datas === null ? {tree:{}, parentMetadatas:{}} : datas);
    }

    async checkNews(onlyCheck = false)
    {
        if (!onlyCheck)
            $("#refresh-nc").find("span").css("display", "none").parent().addClass("disabled").attr("disabled", "disabled").append('<span class="spinner-grow spinner-grow-sm"></span>');
        const folders = this.tree.getFolders(this.wsp, {path:this.config.initFolder});
        console.log("folders", folders);
        if (folders.length > 0)
        {
            mel_metapage.Functions.post(
                mel_metapage.Functions.url("roundrive", "folder_get_metadatas"),
                {
                    _folders:folders
                }, (datas) => {
                    console.log("datas",JSON.parse(datas), this, this.tree);
                    datas = JSON.parse(datas);
                    
                    let tmpId;
                    let updated = false;
                    let querry;
                    let openedQuerries = [];
                    let isRootFolder;
                    for (const key in datas) {
                        if (Object.hasOwnProperty.call(datas, key)) {
                            const element = datas[key];

                            isRootFolder = element.path === this.config.initFolder;
                            console.log("isroot", isRootFolder, element);
                            if (isRootFolder)
                            {
                                if (this.tree.parentMetadatas[this.wsp] === undefined)
                                {
                                    this.tree.parentMetadatas[this.wsp] = element.metadatas;
                                    this.save();
                                }
                            }
                            
                            if ((isRootFolder && element.metadatas.etag !== this.tree.parentMetadatas[this.wsp].etag) || (!isRootFolder && element.metadatas.etag !== this.tree.tree[this.wsp][element.path].etag))
                            {

                                console.log("update", element, isRootFolder, isRootFolder ? this.tree.parentMetadatas[this.wsp].etag : "");

                                if (!updated)
                                {
                                    if (this.config.updatedFunc !== undefined && this.config.updatedFunc !== null)
                                        this.config.updatedFunc(true);

                                    updated = true;
                                }

                                if (!onlyCheck)
                                {

                                    tmpId = this.generateID(element.path)

                                    querry = isRootFolder ? this.parent : $(`.child-for[data-path=${tmpId}]`);

                                    if (querry.hasClass("open") || isRootFolder)
                                        this.actionQuerryOpen(querry, element, tmpId);
                                    else
                                        this.actionQuerryClose(querry, element);

                                }
                                    
                            }

                        }
                    }

                    if (!updated && this.config.updatedFunc !== undefined && this.config.updatedFunc !== null)
                    {
                        this.config.updatedFunc(false);
                        this.save();
                    }

                    if (!onlyCheck)
                        $("#refresh-nc").removeClass("disabled").removeAttr("disabled").find("span").css("display", "").parent().find(".spinner-grow").remove();


                }
            )


        }

        
    }

    actionQuerryOpen(querry, element, idPath)
    {
            mel_metapage.Functions.get(
                mel_metapage.Functions.url("roundrive", "folder_list_all_items"),
                {
                    _folder:`${rcmail.gettext("files", "roundrive")}/${decodeURIComponent(element.path)}`
                },
                (datas) => {
                    let isRootFolder = element.path === this.config.initFolder;
                    console.log("datas", this.openDatas[element.path])
                    if (!isRootFolder && (this.openDatas[element.path] === undefined || this.openDatas[element.path] === false))
                    {
                        this.actionQuerryClose(querry, element);
                    }
                    else {
                        let tmp;

                        // if (isRootFolder)
                        // {
                        //     this.tree.tree[this.wsp] = {};
                        //     this.tree.parentMetadatas[this.wsp].etag = element.metadatas.etag;
                        // }
                        // else {
                        tmp = Enumerable.from(this.tree.tree[this.wsp]).where(x => x.value.dirname !== element.path);
                        this.tree.tree[this.wsp] = {};
                        tmp.forEach((x,i) => {
                            this.tree.tree[this.wsp][x.key] = x.value;
                        })
                        //}

                        console.log("updatedtree",   this.tree.tree[this.wsp]);
                        tmp = this.showDatas(datas, $('<generated></generated'), !isRootFolder, false, true);
                        (isRootFolder ? this.parent : $(`.child-for[data-path=${idPath}]`)).html("").append(tmp);
                        console.log(querry, tmp);
                        if (!isRootFolder)
                            this.tree.tree[this.wsp][element.path].etag = element.metadatas.etag;
                        else
                            this.tree.parentMetadatas[this.wsp].etag = element.metadatas.etag;
                    }

                    this.save();
                },
                (xhr, ajaxOptions, thrownError) => {
                    console.error(xhr, ajaxOptions, thrownError);
                    //parent.removeClass("open").find("center").remove();
                    rcmail.display_message("Impossible de se connecter au stockage !", "error");
                }
            );
    }

    actionQuerryClose(querry, element)
    {
        this.setFolderNewOrnot(element.path, true);
        querry.html("").parent().find("button").first().find("div").first().find(".elementname").first().append(`<span style="" class="notif roundbadge lightgreen nc">•</span>`).css("position", "relative");
        querry.removeClass("open");
        this.tree.tree[this.wsp][element.path].etag = element.metadatas.etag;
        let tmp = Enumerable.from(this.tree.tree[this.wsp]).where(x => x.value.dirname !== element.path);
        this.tree.tree[this.wsp] = {};
        tmp.forEach((x,i) => {
            this.tree.tree[this.wsp][x.key] = x.value;
        })
        console.log("updatedtree",   this.tree.tree[this.wsp]);
    }
}