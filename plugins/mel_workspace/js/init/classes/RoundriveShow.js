class RoundriveShow 
{
    constructor(...args)
    {
        this.init(...args);
    }

    init(initFolder, parent, config = {
        afterInit:null,
        classes:{
            folder:"",
            file:"",
        }

    })
    {
        this.config = config;
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

        this.expandInitialFolder(initFolder).then(() => {

            if (config.afterInit !== undefined && config.afterInit !== null)
                config.afterInit();

            this.checkNews();
        });
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
        let config = {
            _folder:initFolder
        };
    
        return mel_metapage.Functions.get(
            mel_metapage.Functions.url("roundrive", "folder_list_all_items"),
            config,
            (datas) => {
                this.showDatas(datas, this.parent);
            }
        );
    }

    generateID(path)
    {
        let id = "";
        for (let index = 0; index < path.length; ++index) {
            const element = path[index];
            id += element.charCodeAt();
        }

        return id;
    }

    showDatas(datas, parent, isChild = false)
    {
        datas = JSON.parse(datas);

        datas = Enumerable.from(datas).select(x => {
            x.order = x.type === this.enum.type.directory ? 0 : 1;
            return x;
        }).orderBy(x => x.order).thenBy(x => x.basename).toArray();

        console.log("datas", datas);

        const col_text = 6;
        const col_datas = 4;
        const col_link = 2;

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

                        html = `<button style="display:flex" class=" ${isChild ? "child" : ""} no-style full-width btn btn-secondary row ${it === datas.length - 1 ? "last" : ""} ">`;
                        html += `<div class="col-${col_text + col_datas}"><h4><span class="icon-mel-folder"><span class="sr-only">Dossier</span></span> ${decodeURIComponent(element.filename)}<h4></div>`;
                        html += `<div class="col-${col_link} col-arrow"><h4><span class="icon-mel-chevron-right"></span></h4></div>`;
                        html += "</button>";

                        tmp = $(`<div class="${this.config.classes !== undefined && this.config.classes.folder !== undefined ? this.config.classes.folder : ""}"></div>`);

                        html = $(html).on("click", (event) => {
                            //console.log("click");
                            this.expandOrMinimizeFolder(event, element.path, this.generateID(element.path));
                        }).appendTo(tmp);

                        tmp.append(`<div class="child-for" style="display:none" data-path="${id}"></div>`)
                        .appendTo(parent);

                        

                        break;
                    case this.enum.type.file:

                        html = `<button style="display:flex" class=" ${isChild ? "child" : ""} no-style full-width btn btn-secondary row ${it === datas.length - 1 ? "last" : ""} ${this.config.classes !== undefined && this.config.classes.file !== undefined ? this.config.classes.file : ""}">`;
                        html += `<div class="col-${col_text}"><h4><span class="${this.getIcon(element)}"><span class="sr-only">Fichier</span></span> ${decodeURIComponent(element.basename)}<h4></div>`;
                        html += `<div class="col-${col_datas}"><h4></h4></div>`;
                        html += `<div class="col-${col_link} col-arrow"><h4></h4></div>`;
                        html += "</button>";

                        html = $(html).on("click", (event) => {
                            this.clickFile(event, element);
                        }).appendTo(parent);

                        break;
                
                    default:
                        html = "";
                        break;
                }


                ++it;
            }
        }
    }

    expandOrMinimizeFolder(event, folder, id)
    {
        let target = $(event.currentTarget);
        //console.log("[expandOrMinimizeFolder]", event, folder, target, id);
        if (target.hasClass("open"))
            this.minimizeFolder(event, id);
        else
            this.expandFolder(event, folder, id);
    }

    expandFolder(event, folder, path)
    {
        const initFolder = folder;
        folder = `${rcmail.gettext("files", "roundrive")}/${decodeURIComponent(folder)}`;

        //console.log("path", $(`.child-for[data-path=${path}]`));

        let parent = $(`.child-for[data-path=${path}]`);

        $(event.currentTarget).addClass("open").find(".icon-mel-chevron-right").removeClass("icon-mel-chevron-right").addClass("icon-mel-chevron-down");

        if (parent.html() === "")
        {
            parent.html('<center><span class="spinner-grow"></span></center>').css("display", "").addClass("open");

            let config = {
                _folder:folder
            };
        
            return mel_metapage.Functions.get(
                mel_metapage.Functions.url("roundrive", "folder_list_all_items"),
                config,
                (datas) => {
                    parent.find("center").remove();
                    this.showDatas(datas, parent, true);
                }
            );
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

        if (window.Nextcloud !== undefined && !rcmail.busy)
        {
            const datas = {
                file:file.basename,
                path:file.path.replace(file.basename, "")
            };

            mel_metapage.Functions.stockage.go({
                file:datas.file,
                folder:datas.path
            }, false, async (error) => {
                if (!error)
                {
                    console.error("Impossible d'ouvrir le fichier");
                    mel_metapage.Functions.busy(false);
                    await mel_metapage.Functions.change_frame("stockage", true, true);
                    rcmail.display_message("Impossible d'ouvrir le fichier.", "error");
                }
            });
        }    
    }

    clickGoToFile(event, file, id)
    {
        window.open(Nextcloud.index_url + "/apps/files?dir=/"+file.path+"&fileid=" + id);
    }

    save()
    {
        mel_metapage.Storage.set(`nc_${rcmail.env.current_workspace_uid}_${rcmail.env.username}`, this.documents);
    }

    load()
    {

    }

    async checkNews()
    {}

}