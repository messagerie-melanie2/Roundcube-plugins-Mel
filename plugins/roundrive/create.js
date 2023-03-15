/**
 * Gère la création d'un document
 * @param  {...any} args 
 */
function RoundriveCreate(...args)
{
    this.init(...args);
}

/**
 * Initialise l'objet
 */
RoundriveCreate.prototype.init = function()
{
    this.item = $("#roundrive-create");
    this.buttons = {
        parent:$("#roundrive-elements")
    }
    this.folders = $("#roundrive-folders");

    this.inputs={
        name:$("#generated-document-input-mel-metapage"),
        folder:$("#roundrive-folder-input"),
        models:$("#office-models"),
    };

    this.create_buttons();
    this.fill_select_models();
}

/**
 * Créer les boutons pour choisir un type de document
 */
RoundriveCreate.prototype.create_buttons = function()
{
    let html = "";

    for (let index = 0; index < rcmail.env.mel_metapage_templates_doc.length; index++) {
        const element = rcmail.env.mel_metapage_templates_doc[index];
        html += '<div class=col-md-3><button data-doc="'+element.type+'" type=button class="doc-'+element.type+' btn-template-doc btn btn-block btn-secondary btn-mel" onclick="m_mp_UpdateCreateDoc(`'+JSON.stringify(element).replace(/"/g, "¤¤¤")+'`)"><span style="display:block;margin-right:0px" class="'+m_mp_CreateDocumentIconContract(element.icon)+'"></span>'+ rcmail.gettext("mel_metapage." + element.name) +'</button></div>';
    }

    this.buttons.parent.html(`<div class=row>${html}</div>`);

    this.buttons.parent.find("button").each((i,e) => {
        e = $(e);
        this.buttons[e.data("doc")] = e;
    });
}

/**
 * Ajoute les options pour les modèles pour les documents de type office
 */
RoundriveCreate.prototype.fill_select_models = function()
{
  for (let index = 0; index < rcmail.env.mel_metapage_templates_models.length; index++) {
    const element = rcmail.env.mel_metapage_templates_models[index];

    $("#office-models").append(new Option(rcmail.gettext("mel_metapage." + element.name),element.name));
  }
}

/**
 * Selectionne un dossier.
 * @param {DOMElement} event Dossier à séléctionner. 
 */
RoundriveCreate.prototype.select = function(event)
{
    event = $(event).parent();
    this.folders.find(".selected").removeClass("selected");
    event.addClass("selected");
    $("input.roundrive-folder").val(event.data("path"));
}

/**
 * Affiche la fenêtre de choix des documents
 */
RoundriveCreate.prototype.choose_document = function()
{
    this.item.css("display", "none");
    this.folders.css("display", "");
}

/**
 * Ferme le fenêtre de choix des documents 
 */
RoundriveCreate.prototype.accept_document = function()
{
    this.item.css("display", "");
    this.folders.css("display", "none");
}

/**
 * Créer le document.
 * @returns {Promise<void>} 
 */
RoundriveCreate.prototype.create_document = function(goFunc = null)
{
    const values = {
        type:this.buttons.parent.find("button.active").data("doc"),
        folder:this.inputs.folder.val(),
        name:this.inputs.name.val(),
        model:this.inputs.models.val()
    };

    let $return = RoundriveCreate.CompletedPromise();
    let $continue = true;

    //check
    if (values.type === undefined)
    {
        mel_metapage.Functions.call('rcmail.display_message("Vous devez choisir un type de document !", "error")');
        this.item.find(".first").addClass("error");
        $continue = false;
    }
    else
        this.item.find(".first").removeClass("error");

    if (values.name === "")
    {
        mel_metapage.Functions.call('rcmail.display_message("Vous devez entrer un nom !", "error")');
        this.inputs.name.addClass("error");
        $continue = false;
    }
    else
        this.inputs.name.removeClass("error");

        if (values.folder === "")
            values.folder = rcmail.gettext("files", "roundrive");

    if ($continue)
    {
        mel_metapage.Functions.call("create_popUp.editTitle('')");
        this.item.html("<center><span class=spinner-border></span></center>")
        $return = mel_metapage.Functions.post(
            mel_metapage.Functions.url("roundrive", "create_file"),
            {
                _type:values.type,
                _name:values.name,
                _folder:values.folder,
                _model:values.model
            },
            (datas) => {
                datas = JSON.parse(datas);

                //console.log("created",datas);
                
                if (datas.success)
                {
                    if (window.Nextcloud !== undefined)
                    {
                        // mel_metapage.Functions.stockage.go({
                        //     file:datas.file,
                        //     folder:datas.path
                        // }, false, async (error) => {
                        //     create_popUp.close(); 
                        //     create_popUp = undefined;
                        //     if (!error)
                        //     {
                        //         console.error("Impossible d'ouvrir le fichier");
                        //         mel_metapage.Functions.busy(false);
                        //         await mel_metapage.Functions.change_frame("stockage", true, true);
                        //         rcmail.display_message("Impossible d'ouvrir le fichier.", "error");
                        //     }
                        // });
                        mel_metapage.Functions.stockage.go({
                            path:datas.path,
                            name:datas.file
                        }, goFunc, async (error) => {
                                create_popUp.close(); 
                                create_popUp = undefined;
                                // if (!error)
                                // {
                                //     console.error("Impossible d'ouvrir le fichier", error);
                                //     mel_metapage.Functions.busy(false);
                                //     await mel_metapage.Functions.change_frame("stockage", true, true);
                                //     rcmail.display_message("Impossible d'ouvrir le fichier.", "error");
                                // }
                            });
                    }
                }
                else
                {
                    mel_metapage.Functions.call("create_popUp.close(); create_popUp = undefined");
                    mel_metapage.Functions.call(`rcmail.display_message("${datas.error}", "error")`);
                }

            }
        )
    }

    return $return;
}

/**
 * Retourne une promesse terminée.
 * @returns {Promise<void>} Promesse terminée.
 */
RoundriveCreate.CompletedPromise = function ()
{
    return new Promise((a, b) => {});
}

RoundriveCreate.chevrons = {
    right:"icon-mel-chevron-right",
    down:"icon-mel-chevron-down",
    none:"icon-mel-minus-roundless",
    loading:"icon-mel-last-frame",
};

/**
 * Affiche les dossiers fils
 * @param {DomElement} event 
 */
RoundriveCreate.expand_folder = function(event)
{
    var returns = RoundriveCreate.CompletedPromise();

    let elements = {
        raw:event,
        querry:$(event),
        chevron:$($(event).find(".mel-clickable")[0]),
        text:$(event).find(".mel-text"),
        path:$(event).data("path").replace("¤¤¤", '"')
    };

    if (elements.chevron.length > 0)
    {
        const chevron = RoundriveCreate.chevrons

        if (elements.querry.find("ul").length > 0)
        {
            elements.chevron.removeClass(chevron.right).addClass(chevron.down);
            $(elements.querry.find("ul")[0]).css("display", "");
        }
        else
        {
            elements.chevron.removeClass(chevron.right).addClass(chevron.loading).addClass("mel-loading");

            //console.log("path", elements.path);

            returns = mel_metapage.Functions.get(
                mel_metapage.Functions.url("roundrive", "folder_list_items"),
                {
                    _folder:elements.path
                },
                (datas) => {
                    datas = JSON.parse(datas);
                    if (datas.length === 0)
                        elements.chevron.removeClass(chevron.loading).removeClass("mel-loading").addClass(chevron.none).removeClass("mel-clickable");
                    else
                    {
                        elements.chevron.removeClass(chevron.loading).removeClass("mel-loading").addClass(chevron.down);
                        let html = `<ul class="list-group list-group-flush";>`;
                        for (let index = 0; index < datas.length; ++index) {
                            const element = datas[index];
                            const path = `${rcmail.gettext("files", "roundrive")}/${decodeURIComponent(element.path)}`.replaceAll('"', "¤¤¤");
                            const length = path.split("/").length%8;
                            html += `<li data-path="${path}" class="list-group-item mel-list-item mel-item-${length}">`;
                            html += `<a href=# onclick=RoundriveCreate.folder_click(this) class="mel-not-link color-white mel-item-icon icon-mel-chevron-right mel-clickable"></a><a href=# onclick=rcmail.env.roundrive.select(this) class="mel-text mel-focus mel-not-link link-like-hover color-white">${decodeURIComponent(element.filename)}</a>`;
                            html += "</li>";
                        }
                        html += "</ul>";
                        elements.querry.append(html);
                    }

                }
            );
        }

    }

    return returns;

}

/**
 * Cache les dossiers fils
 * @param {DomElement} event 
 */
RoundriveCreate.minimize_folder = function(event)
{
    var returns = RoundriveCreate.CompletedPromise();

    let elements = {
        raw:event,
        querry:$(event),
        chevron:$(event).find(".mel-clickable"),
        ul:$(event).find("ul")
    };

    const chevron = RoundriveCreate.chevrons;

    elements.chevron.removeClass(chevron.down).addClass(chevron.right);
    elements.ul.css("display", "none");

}

/**
 * Affiche ou cache les dossiers fils
 * @param {DomElement} event 
 */
RoundriveCreate.folder_click = function (event)
{
    var returns = RoundriveCreate.CompletedPromise();

    event = $(event).parent()[0];

    let elements = {
        raw:event,
        querry:$(event),
        chevron:$($(event).find(".mel-clickable")[0]),
    };

    const chevron = {
        right:"icon-mel-chevron-right",
        down:"icon-mel-chevron-down",
        none:"icon-mel-minus-roundless",
        loading:"icon-mel-last-frame",
    }

    if (elements.chevron.hasClass(chevron.right))
        returns = RoundriveCreate.expand_folder(event);
    else if (elements.chevron.hasClass(chevron.down))
        returns = RoundriveCreate.minimize_folder(event);
    
    return returns;
}

$(document).ready(() => {
    rcmail.env.roundrive = new RoundriveCreate();
})