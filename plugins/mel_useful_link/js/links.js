function PaperClipCopy(link)
{
    function copyOnClick (val) {
        var tempInput = document.createElement ("input"); 
        tempInput.value = val;
         document.body.appendChild (tempInput); 
         tempInput.select (); 
         document.execCommand ("copy"); 
         document.body.removeChild (tempInput); 
    }
    const url = link[0].href;
    copyOnClick(url);
    rcmail.display_message(`${url} copier dans le presse-papier.`, "confirmation")
}

function EditLink(id)
{
    GetLinkPopUp().setPopUpChoice(MelLink.from(id)).show();
}

function ModifyLink(link)
{
    GetLinkPopUp().setLinkEditor(link).show();
}

function CreateLink()
{
    GetLinkPopUp().setLinkEditor(new MelLink()).show();
}

function SearchLinks(search)
{
    search = search.value;

    $(".epingle").css("display", search === "" ? "" : "none");
    $(".joined").css("display", search === "" ? "" : "none");

    if (search === "")
    {
        $(".searched").remove();
    }
    else 
    {
        if ($(".searched").length === 0)
            $("#layout-content .body").prepend(`<div class="searched"><h2>Liens trouvés</h2><div class="found-links"></div>`)
        else
            $(".searched .found-links").html("");

        $(".joined .link-block").each((i,e) => {
            e = $(e);

            if (e.data("title").toUpperCase().includes(search.toUpperCase()) || e.data("link").toUpperCase().includes(search.toUpperCase()))
                e.clone().appendTo($(".searched .found-links"));
        });
    }
}

/**
 * 
 * @param {MelLink} link 
 */
function DeleteLink(link)
{
    GetLinkPopUp().setLoading();
    return link.callDelete().then(() => {
        GetLinkPopUp().hide();
    });
}

function TakLink(id)
{
    return MelLink.from(id).callPin().then(() => {
        window.location.reload();
    });
}

/**
 * Récupère la popup et permet de la manipuler.
 * @returns {LinkPopUp}
 */
function GetLinkPopUp()
{
    if (GetLinkPopUp.popup === undefined)
        GetLinkPopUp.popup = new LinkPopUp();

    return GetLinkPopUp.popup;
}

class LinkPopUp
{
    constructor()
    {
        let config = new GlobalModalConfig();
        config.title = "Chargement...";
        config.content = `<center><span class="spinner-grow"><span class="sr-only">Chargement....</span></span></center>`;
        config.footer = "";
        this.modal = new GlobalModal("globalModal", config);
    }

    setTitle(string)
    {
        this.modal.editTitle(string);
    }

    setBody(string)
    {
        this.modal.editBody(string);
    }

    setLoading()
    {
        this.setTitle("Chargement...");
        this.setBody(`<center><span class="spinner-grow"><span class="sr-only">Chargement....</span></span></center>`);
        this.modal.footer.querry.html("")
    }

    /**
     * 
     * @param {MelLink|null} link 
     * @returns {LinkPopUp}
     */
    setLinkEditor(link = null)
    {
        if (link === null)
            link = new MelLink();

        this.setTitle(link.id === "" ? "Création d'un nouveau lien" : "Modification d'un lien");

        if (this.modal.contents.find("#mul-editor").length === 0)
        {

            const redstar = '<span style=color:red>*</span> ';
            let parentDiv = $(`<div id="mul-editor">${redstar}Champs obligatoires</div>`);

            /**Id */
            $(`<input type="hidden" id="mulc-id" value="${link.id}" />`).appendTo(parentDiv);

            /**Title */
            this.linkText("mulc-title", "Nom du lien", "Titre du lien", link.title, true).appendTo(parentDiv);

            /**Url */
            this.linkText("mulc-url", "Adresse de la page", "URL", link.link).appendTo(parentDiv);
        
            /**Show When */
            this.linkChoice("mulc-sw", "Choisissez quand le lien doit être visible", 0, {value:"always", text:"Tout le temps"}, {value:"internet", text:"Depuis internet"}, {value:"intranet", text:"Depuis l'intranet"}).appendTo(parentDiv);

            this.setBody("");
            this.modal.appendToBody(parentDiv);

            this.modal.footer.querry.html("").append($(`<button id="mulc-button" class="mel-button btn btn-secondary">${link.id === "" ? 'Ajouter<span class="plus icon-mel-plus"></span>' : 'Modifier<span class="plus icon-pencil"></span>'}</button>`).on("click", () => {
                event.preventDefault();

                if (!$("#mulc-title")[0].reportValidity())
                    return;
                if (!$("#mulc-url")[0].reportValidity())
                    return;

                const link = new MelLink($("#mulc-id").val(), $("#mulc-title").val(), $("#mulc-url").val(), "always", $("#mulc-sw").val());//.callUpdate().then(() => this.hide());
                this.setLoading();
                link.callUpdate().then((result) => {

                     if (result === true)
                         window.location.reload();
                     else
                         this.setLinkEditor(link);

                });
            }));
        }
        else
        {
            $("#mulc-id").val(link.id);
            $("#mulc-title").val(link.title);
            $("#mulc-url").val(link.link);
            $("#mulc-sw").val(link.showWhen === "" ? "always" : link.showWhen);
            $("#mulc-button").html(link.id === "" ? 'Ajouter<span class="plus icon-mel-plus"></span>' : 'Modifier<span class="plus icon-pencil"></span>');
        }

        return this;
    }

    /**
     * 
     * @param {MelLink} link 
     */
    setPopUpChoice(link)
    {
        this.setTitle(`Que souhaitez-vous faire du lien "${this.setLinkMaxSize(link.title)}"`);
        let html = '<div style="display:flex">';

        console.log(link);

        for (let index = 0; index < rcmail.env.link_modify_options.length; ++index) {
            const element = rcmail.env.link_modify_options[index];
            html += `<button style="margin-top:0px;margin-right:15px" onclick="${element.action}(MelLink.from('${link.id}'))" class="btn btn-block btn-secondary btn-mel"><span class="block ${element.icon}"></span>${rcmail.gettext(element.name, "mel_useful_link")}</button>`;
        }

        html += "</div>";
        this.setBody(html);
        this.modal.footer.querry.html("");

        return this;
    }

    /**
     * Troncate un texte trop grand.
     * @param {string} txt 
     * @param {number} max 
     * @returns {string}
     */
    setLinkMaxSize(txt, max = 40)
    {
        if (txt.length > max)
            txt = txt.slice(0, max-3) + "...";
        
        return txt;
    }

    linkText(id, title, placeholder, value, isFirst = false)
    {
        const redstar = '<span style=color:red>*</span> '
        return $(`<label for="${id}" class="span-mel t1 ${isFirst ? "first" : ""}">${title}${redstar}</label><input id="${id}" class="form-control input-mel required" required type="text" placeholder="${placeholder}" value="${value}" />`);
    }

    linkChoice(id, title, _default = 0, ...choices)
    {
        let options = "";
        for (let index = 0; index < choices.length; ++index) {
            const element = choices[index];
            options += `<option ${index === _default ? "selected" : ""} value="${element.value}">${element.text}</option>`;
        }

        return $(`<label for="${id}" class="span-mel t1 first">${title}</label><select id="${id}" class="form-control input-mel custom-select pretty-select">${options}</select>`);
    }

    show()
    {
        this.modal.show();
    }

    hide()
    {
        this.modal.close();
    }
}

class MelLink
{
    constructor(...args)
    {
        this.setup();

        if (args.length > 0)
            this.init(...args);
    }

    find()
    {
        return $(`#link-block-${this.id}`);
    }

    setup()
    {
        this.id = "";
        this.title = "";
        this.link = "";
        this.from = "";
        this.showWhen = "";
    }

    init(id, title, link, from, showWhen)
    {
        this.id = id;
        this.title = title;
        this.link = link;
        this.from = from;
        this.showWhen = showWhen;
    }

    delete(popup = null)
    {
        if (popup === null)
            popup = ModifyLink.popup;
        
        if (popup !== null)
            popup.setLoading();
        
        rcmail.setBusy(true, "loading");

        return this.callDelete().always(() => {
            popup.hide();
            if (rmail.busy)
            {
                rcmail.setBusy(false);
                rcmail.clear_messages();
            }
         });
    }

    callDelete()
    {
        rcmail.set_busy(true, "loading");
        return mel_metapage.Functions.post(mel_metapage.Functions.url("useful_links", "delete"),
        {_id:this.id},
        (datas) => {
           rcmail.set_busy(false);
           rcmail.clear_messages();
           rcmail.display_message("Suppression effectué avec succès !", "confirmation");
           this.find().remove();
        }
        ).done(() => {
            MelLink.refresh("joined");
            MelLink.refresh("epingle");
        });
    }

    callPin()
    {
        rcmail.set_busy(true, "loading");
        return mel_metapage.Functions.post(mel_metapage.Functions.url("useful_links", "tak"),
        {_id:this.id},
        (datas) => {
           rcmail.set_busy(false);
           rcmail.clear_messages();
           rcmail.display_message("Modification effectué avec succès !", "confirmation");
        }
        );
    }

    async callUpdate()
    {
        console.log(this);

        rcmail.set_busy(true, "loading");
        const notBusy = () => {
            rcmail.set_busy(false);
            rcmail.clear_messages();
        };

        const override = "override";
        const ok = true;

        let code;
        let success = true;
        let config = {
            _id:this.id,
            _title:this.title,
            _link:this.link,
            _from:this.from,
            _sw:this.showWhen
        };
        await mel_metapage.Functions.post(mel_metapage.Functions.url("useful_links", "update"), config, (datas) => {
            code = datas;
        }, (a,b,c) => {
            success = false;
            notBusy();
            rcmail.display_message("Impossible d'ajouter ou de modifier ce lien.", "error");
            console.error(a,b,c);
        });

        if (code === override)
        {
            if (confirm("Il s'agit d'un lien personnel venant de l'ancien bureau numérique, si vous continuez, il sera supprimé de l'ancien bureau numérique.\r\nÊtes-vous sûr de voloir contnuer ?"))
            {
                config["_force"] = true;
                await mel_metapage.Functions.post(mel_metapage.Functions.url("useful_links", "update"), config, (datas) => {
                    if (datas === override)
                    {
                        notBusy();
                        success = false;
                        rcmail.display_message("Une erreur est survenue !", "error");
                        console.error(datas, this, config);
                    }
                }, (a,b,c) => {
                    notBusy();
                    success = false;
                    rcmail.display_message("Impossible d'ajouter ou de modifier ce lien.", "error");
                    console.error(a,b,c);
                });
                
            }
            else
                success = false;
        }

        if (rcmail.busy)
            notBusy();

        return success;

    }

    static refresh(_class)
    {
        let next = false;
        let last = null;
        $(`.${_class} .col-md-6`).each((i, e) => {
            e = $(e);
            if (!next && e.html() === "")
            {
                next = true;
                last = e;
            }
            else if (next && last !== null)
            {
                e.find("div").first().appendTo(last);
                last = e;
            }
        });

        $(`.${_class} .row`).each((i, e) => {
            let it = 0;
            $(e).find(".col-md-6").each((it, col) => {
                if ($(col).html === "")
                    ++it;
            });
            if (it === 2)
                $(e).remove();
        });
    }

    static from(id)
    {
        id = $(`#link-block-${id}`);

        return new MelLink(id.data("id"), id.data("title"), id.data("link"), id.data("from"), id.data("showWhen"));
    }

}