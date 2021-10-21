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
     setLinkEditor(link = null, task = "useful_links", action = "update", addonConfig= null, afterCreate = null)
     {
         if (link === null)
             link = new MelLink();

        console.log("LINK", link);
 
         this.setTitle(link.id === "" ? "Création d'un nouveau lien" : "Modification d'un lien");
 
         if (this.modal.contents.find("#mul-editor").length === 0)
         {
 
             const redstar = '<span style=color:red>*</span> ';
             let parentDiv = $(`<div id="mul-editor">${redstar}Champs obligatoires</div>`);
 
             /**Id */
             $(`<input type="hidden" id="mulc-id" value="${link.id}" />`).appendTo(parentDiv);
             /**subItem */
             $(`<input type="hidden" id="mulc-subItem" value="${link.isSubLink()}" />`).appendTo(parentDiv);

             if (link.isSubLink())
             {
                /**Sub Id */
                $(`<input type="hidden" id="mulc-subid" value="${link.subItem.id}" />`).appendTo(parentDiv);
                /**SubParent */
                $(`<input type="hidden" id="mulc-subparent" value="${link.subItem.parentId}" />`).appendTo(parentDiv);
             }
 
             /**Title */
             this.linkText("mulc-title", "Nom du lien", "Titre du lien", link.title, true).appendTo(parentDiv);
 
             /**Url */
             this.linkText("mulc-url", "Adresse de la page", "URL", link.link).appendTo(parentDiv);

             /**Couleur */
             this.linkColor("mulc-color", "Couleur de la vignette", link.color).appendTo(parentDiv);
         
             /**Show When */
             //this.linkChoice("mulc-sw", "Choisissez quand le lien doit être visible", 0, {value:"always", text:"Tout le temps"}, {value:"internet", text:"Depuis internet"}, {value:"intranet", text:"Depuis l'intranet"}).appendTo(parentDiv);
 
             this.setBody("");
             this.modal.appendToBody(parentDiv);
 
             this.modal.footer.querry.html("").append($(`<button id="mulc-button" class="mel-button btn btn-secondary">${link.id === "" ? 'Ajouter<span class="plus icon-mel-plus"></span>' : 'Modifier<span class="plus icon-mel-pencil"></span>'}</button>`).on("click", () => {
                 event.preventDefault();
 
                 if (!$("#mulc-title")[0].reportValidity())
                     return;
                 if (!$("#mulc-url")[0].reportValidity())
                     return;

                 const link = new MelLink($("#mulc-id").val(), $("#mulc-title").val(), $("#mulc-url").val(), "always", "always",  false,($("#mulc-subItem").val() == "true" ? new MelSubLink($("#mulc-subid").val(), $("#mulc-subparent").val()) : null), $("#mulc-color").val()/*$("#mulc-sw").val()*/);//.callUpdate().then(() => this.hide());
                 this.setLoading();

                 link.callUpdate(task, action, addonConfig).then((result) => {
 
                    if (afterCreate !== null)
                        afterCreate(result);
                    else {

                      if (result === true)
                          window.location.reload();
                      else
                          this.setLinkEditor(link);
                    }
 
                 });
             }));
         }
         else
         {
            $("#mulc-color").val(link.color);
             $("#mulc-id").val(link.id);
             $("#mulc-title").val(link.title);
             $("#mulc-url").val(link.link);
             $("#mulc-subItem").val(link.isSubLink());
             $("#mulc-subid").val(link.subItem.id);
             $("#mulc-subparent").val(link.subItem.parentId);
             $("#mulc-sw").val(link.showWhen === "" ? "always" : link.showWhen);
             $("#mulc-button").html(link.id === "" ? 'Ajouter<span class="plus icon-mel-plus"></span>' : 'Modifier<span class="plus icon-mel-pencil"></span>');
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
 
         //console.log(link);
 
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

     linkColor(id, title, value)
     {
        return $(`<div><label for="${id}" class="span-mel t1">${title}</label><input style="max-width:50px;display:inline-block" id="${id}" class="link-color-before form-control input-mel required" required type="color" value="${value}" /><span style="background-color:${value}" class=link-test-color>Test couleur | <a  href="#">Test lien</a></span></div>`)
        .find("input").on("input", (e) => {
            $(e.currentTarget).parent().find(".link-test-color").css("background-color", $(e.currentTarget).val());
        }).parent();
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
         this.subItem = null;
         this.hidden = false;
         this.color = "#F0F0F0";
     }
 
     init(id, title, link, from, showWhen, hidden, subItem = null, color = "#F0F0F0")
     {
         this.id = id;
         this.title = title;
         this.link = link;
         this.from = from;
         this.showWhen = showWhen;
         this.hidden = hidden;
         this.subItem = subItem;
         this.color = color;
     }

     isSubLink()
     {
         return this.subItem !== null;
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

     async callHideOrShow(task = "useful_links", action="hideOrShow", addonConfig = null)
     {
        rcmail.set_busy(true, "loading");

        let ok = false;
        let config = {
            _id:this.id,
            _is_sub_item:this.isSubLink()
        }

        if (config._is_sub_item)
            config = this.subItem.updateConfig(config);

        config = this.getConfig(config, addonConfig);

        //Call
        await mel_metapage.Functions.post(mel_metapage.Functions.url(task, action),
        config,
        (data) => {
            ok = true;
        }
        );
        //Si réussi
        if (ok)
        {
            if (rcmail.env.link_show_hiddened === undefined)
                rcmail.env.link_show_hiddened = false;
            
            //MAJ des liens
            ok = await this.callUpdateLinks(task, rcmail.env.showHiddenLinks);
        }

        rcmail.set_busy(false);
        rcmail.clear_messages();

        // if (!ok)
        //     rcmail.display_message("Une erreur est survenue lors de cette action !", "error");

     }

     async callUpdateLinks(task = "useful_links", showHiddened = false)
     {
        let ok = false;

        await mel_metapage.Functions.post(
            mel_metapage.Functions.url(task, "get_joined_links"),
            {_show:showHiddened}, 
            (datas) => {
                $(".body .joined .links-items").html(datas);
            }
        );

        return false;
     }

     static updateLinks(task = "useful_links", showHiddened = false)
     {
        return new MelLink().callUpdateLinks(task, showHiddened);
     }
 
     callDelete(task = "useful_links", action = "delete", addonConfig = null)
     {
         rcmail.set_busy(true, "loading");
 
         return mel_metapage.Functions.post(mel_metapage.Functions.url(task, action),
         this.getConfig({_id:this.id}, addonConfig),
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
 
     getConfig(config, addonConfig = null)
     {
         if (addonConfig !== null)
         {
             for (const key in addonConfig) {
                 if (Object.hasOwnProperty.call(addonConfig, key)) {
                     const element = addonConfig[key];
                     
                     config[key] = element; 
                 }
             }
         }
 
         return config;
     }
 
     async callPin(task = "useful_links", action = "tak", addonConfig = null)
     {
        let resultDatas = true;
        let config = {
            _id:this.id,
            _is_sub_item:this.isSubLink()
        }

        rcmail.set_busy(true, "loading");

        await mel_metapage.Functions.post(mel_metapage.Functions.url(task, action),
        this.getConfig(config, addonConfig),
        (datas) => {

        if (datas === "override")
        {
            resultDatas = datas;
            return;
        }

        rcmail.set_busy(false);
        rcmail.clear_messages();
        rcmail.display_message("Modification effectué avec succès !", "confirmation");
        }
        );

        if (resultDatas === "override" && confirm("Il s'agit d'un lien personnel venant de l'ancien bureau numérique, si vous continuez, il sera supprimé de l'ancien bureau numérique.\r\nÊtes-vous sûr de vouloir continuer ?"))
        {

            config["_forced"] = true;
            if (config._is_sub_item)
            {
                config = this.subItem.updateConfig(config);
                config["_subtitle"] = this.title;
            }

            await mel_metapage.Functions.post(mel_metapage.Functions.url(task, action),
            this.getConfig(config, addonConfig),
                (datas) => { 
                    rcmail.set_busy(false);
                    rcmail.clear_messages();
                    rcmail.display_message("Modification effectué avec succès !", "confirmation");
                }
            );
        }
        else
        {
            rcmail.set_busy(false);
            rcmail.clear_messages();
        }
     }
 
     async callUpdate(task = "useful_links", action = "update", addonConfig = null)
     {
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
             _sw:this.showWhen,
             _is_sub_item:this.isSubLink(),
             _color:(this.color === "#F0F0F0" ? null : this.color)
         };
 
         if (config._is_sub_item)
            config  = this.subItem.updateConfig(config);

         config = this.getConfig(config, addonConfig);

         await mel_metapage.Functions.post(mel_metapage.Functions.url(task, action), config, (datas) => {
             code = datas;
         }, (a,b,c) => {
             success = false;
             notBusy();
             rcmail.display_message("Impossible d'ajouter ou de modifier ce lien.", "error");
             console.error(a,b,c);
         });
 
         if (code === override)
         {
             if (confirm("Il s'agit d'un lien personnel venant de l'ancien bureau numérique, si vous continuez, il sera supprimé de l'ancien bureau numérique.\r\nÊtes-vous sûr de vouloir continuer ?"))
             {
                 config["_force"] = true;
                 config["_subtitle"] = this.title;
                 await mel_metapage.Functions.post(mel_metapage.Functions.url(task, action), config, (datas) => {
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
 
         const isSubItem = id.data("subitem");

         let subLink = null;
         if (isSubItem)
            subLink = new MelSubLink(id.data("subid"), id.data("subparent"));

         return new MelLink(id.data("id"), id.data("title"), id.data("link"), id.data("from"), id.data("showWhen"), id.data("hidden"), subLink, id.data("color"));
     }
 
 }

 class MelSubLink
 {
     constructor(id, parentId)
     {
        this.id = id;
        this.parentId = parentId;
     }

     updateConfig(config)
     {
        config["_subparent"] = this.parentId;
        config["_subid"] = this.id;
        return config;
     }
 }