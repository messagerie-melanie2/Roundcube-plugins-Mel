$(document).ready(async () => {

    let it = 0;
    await wait(() => {
        if (++it >= 5)
            return false;
        
        return window.news_ui === undefined;
    });
    init_news();

    function init_news()
    {
        if (window.news_ui !== undefined)
        {
            try {
                news_ui.buttons.$filter.click(() => {
                    NewsPopup.fabric().filter();
                });

                news_ui.buttons.$sort.click(() => {
                    NewsPopup.fabric().sort();
                });

                news_ui.buttons.$add.click(() => {
                    NewsPopup.fabric().createOrEdit();
                });

                news_ui.buttons.$publish.click(() => {
                    NewsPopup.fabric().createOrEditPublish();
                });
            } catch (error) {
                console.error('###[init_news]', error);
            }
        }
    }

    class NewsPopup
    {
        constructor()
        {
            if (window.create_popUp !== undefined)
                delete window.create_popUp

            let config = new GlobalModalConfig();
            config.title = 'Chargement...';
            config.content = `<center><span class="spinner-grow"><span class="sr-only">Chargement....</span></span></center>`;
            config.footer = "";
            this.modal = new GlobalModal("globalModal", config);
            this.symbols = {
                allIsSelected:Symbol("allIsSelected")
            };

            // if (rcmail.env.news_filter !== undefined && rcmail.env.news_filter !== null)
            //     this.filters = JSON.parse(rcmail.env.news_filter);
        }

        /**
         * 
         * @returns {NewsPopup}
         */
        static fabric()
        {
            if (NewsPopup.cache === undefined)
                NewsPopup.cache = new NewsPopup();

            return NewsPopup.cache;
        }

        createOrEditPublish(id = null)
        {
            const obFields = '';//<p class="red-star-removed"><star class="red-star mel-before-remover">*</star>Champs obligatoires</p>';
            const classes = "form-control input-mel required"
            const news = new MelPublishNew(id);
            console.log(id, $(`#${id}`), $(`#${id}`).find(".title").html(), news);

            if (id === null) this.modal.editTitle("Créer une publication");
            else this.modal.editTitle(`Modifier "${news.title}"`);

            let html = obFields + '<div>' + this.createSelect("Choisissez un service", "mel-publish-service", "Sélectionnez un service", [], "none") + '</div>';
            html += '<div>' + this.createInput("Choisissez un titre", "mel-publish-title", "text", "Titre de la publication", news.title, "mel-publish-title", classes) + '</div>';
            html += '<div>' + this.createTextarea("Ecrivez la publication", "mel-publish-body", "Voici les nouvelles....", news.body) + '</div>';

            this.modal.editBody(html);
            this.modal.footer.querry.html("");
            $(`<button class="mel-button" style="margin-right:15px">${(news.id === "" ? "Ajouter" : "Modifier")} <span class="plus icon-mel-${(news.id === "" ? "plus" : "pencil")}"></span></button>`).click(() => {
                if (this.check([$("#mel-publish-service"), $("#mel-publish-title"), $("#mel-publish-body")], {2:() => tinyMCE.activeEditor.getContent() === ""})) 
                    this.confirm("createOrEditPublish", {id:"news-generated-tmp-id"});
            }).appendTo(this.modal.footer.querry);

            setTimeout(async  () => {
                if (rcmail.editor !== undefined && rcmail.editor.editor !== null)
                {
                    rcmail.editor.editor.remove();
                    rcmail.editor.editor = null;
                    delete rcmail.editor;
                }
                // tinymce.init({
                //     selector: '#mel-publish-body'
                //   });image media 
                let config = rcmail.env.editor_config;
                config.disabled_buttons = ["image", "media"];
                rcmail.editor_init(config, "mel-publish-body");
                this.modal.show();

                if (NewsPopup.corrected !== true)
                {
                    $(document).on('focusin', function(e) {
                        if ($(e.target).closest(".mce-window").length) {
                            e.stopImmediatePropagation();
                        }
                    });
                    NewsPopup.corrected = true;
                }

                let it = 0;
                await wait(() => {
                    if (it++ > 5)
                        return false;
            
                    return rcmail.editor === undefined || rcmail.editor === null || rcmail.editor.editor === null;
                });

                rcmail.command("updateEditor");

            }, 10);

            return this;
        }

        check(itemToTest = [], specCond = {})
        {
            $(".fieldNotOkay").remove();

            for (let index = 0; index < itemToTest.length; index++) {
                const element = itemToTest[index];
                const val = element.val();

                const valid = specCond[index] === undefined ? (val === "none" || val === "") : specCond[index]();

                if (valid)
                {
                    element.parent().append('<span class="fieldNotOkay" style="color:red;">*Vous devez renseigner ce champs !</span>');
                    return false;
                }
            }

            return true;
        }

        confirm(caller, args)
        {
            switch (caller) {
                case "createOrEditPublish":
                    const news = new MelPublishNew(null)
                    .create($("#mel-publish-title").val(), $("#mel-publish-body").val())
                    .setService($("#mel-publish-service").val());

                    console.log(news, "confirm");
                    //Modification du titre de la modale
                    this.modal.editTitle("Visualisation de la publication");

                    //Modification du corps de la modale
                    this.modal.editBody(`
                    <div class="square_div">
                        <div class="contents " id="${args.id}" style=overflow:auto>
                            <div class="square-contents">
                                <p class="headlines-by">Information ${news.getService()}</p>
                                <h3 class="headlines-title bold title">${news.title}</h3>
                                <p class="headlines-publish">Publié le Mercredi 05 mai 2021</p>
                                <div class="headlines-contents body">${tinyMCE.activeEditor.getContent()}</div>
                            </div>
                        </div>
                    </div>`)

                    //Modification du pied de la modale
                    this.modal.footer.querry.html("");
                    $('<button class="mel-button white" style="position:absolute;left:40px">Retour <span class="plus icon-mel-undo"></span></button>').click(() => {
                        this.createOrEditPublish(args.id.replace("news-", ''));
                    }).appendTo(this.modal.footer.querry);
                    $(`<button class="mel-button" style="margin-right:40px">Confirmer <span class="plus icon-mel-plus"></span></button>`).click(() => {

                    }).appendTo(this.modal.footer.querry);
                    break;
            
                default:
                    console.error('###[confirm]Impossible de créer une fenêtre de confirmation pour cette action, elle n\'éxiste pas !', caller);
                    break;
            }

            return this;
        }

        createOrEdit(id = null)
        {
            if (id === null || id === "")
            {
                this.modal.editTitle("Quel type d'information ajouter ? (étape 1/2)");

                let $flex = $('<div style="display:flex"></div>')
                // Intranet
                .append($(`<button style="margin-top:0px;margin-right:15px" class="btn btn-block btn-secondary btn-mel"><span class="block icon-mel-intranet"></span>Site intranet</button>`).click(() => {
                        this.showStep2(new MelNews(null).setType(MelNews.type.intranet));
                    })
                )               
                // Twitter
                .append($(`<button style="margin-top:0px;margin-right:15px" class="btn btn-block btn-secondary btn-mel"><span class="block icon-mel-twitter"></span>Compte twitter</button>`).click(() => {
                        this.showStep2(new MelNews(null).setType(MelNews.type.twitter));
                    })
                )
                // Internet
                .append($(`<button style="margin-top:0px;margin-right:15px" class="btn btn-block btn-secondary btn-mel"><span class="block icon-mel-rss"></span>Flux RSS externe</button>`).click(() => {
                        this.showStep2(new MelNews(null).setType(MelNews.type.internet));
                    })
                );

                this.modal.editBody($flex);
                this.modal.footer.querry.html("");
                this.modal.show();
            }
            else{
                const news = new MelNews(id);
            }

            return this;
        }

        showStep2(datas)
        {
            const obFields = '<p class="red-star-removed"><star class="red-star mel-before-remover">*</star>Champs obligatoires</p>';
            const formats = [
                {
                    id:"mel-news-format-check-1",
                    value:"small",
                    text:"Petit format"
                },
                {
                    id:"mel-news-format-check-2",
                    value:"large",
                    text:"Grand format"
                }
            ];
            let html = obFields;
            this.modal.editBody("");

            switch (datas.type) {
                case MelNews.type.intranet:

                    if (datas.id === "")
                        this.modal.editTitle("Ajouter les informations d'un site intranet (étape 2/2)");

                    html += this.createSelect("Choisir le site Intranet à afficher", "news-intranet-select", "Sélectionner un site", Enumerable.from(rcmail.env.news_intranet_list).select(x => {return {value:x.key, text:x.value.name}}).toArray(), "none");
                    break;

                case MelNews.type.twitter:
                    if (datas.id === "")
                        this.modal.editTitle("Ajouter un fil Twitter (étape 2/2)");

                    html += this.createInput("Entrez l'identifiant du compte Twitter à afficher", "news-twitter-input", "text", "@NomDuCompte", datas.link, "mel-twitter", "form-control input-mel required");
                    break;

                case MelNews.type.internet:
                    if (datas.id === "")
                        this.modal.editTitle("Ajouter un flux RSS externe (étape 2/2)");

                    html += this.createSelect("Choisir le flux RSS à afficher", "news-internet-select", "Sélectionner un site", [], "none");
                    break;
            
                default:
                    break;
            }

            html += this.createCheckBoxChoices("Choisir le format du block", "newsMelFormat", formats, datas.format, true);
            
            this.modal.editBody(html);

            this.modal.footer.querry.html("");
            $('<button class="mel-button white" style="position:absolute;left:40px">Retour <span class="plus icon-mel-undo"></span></button>').click(() => {
                this.createOrEdit(datas.id);
            }).appendTo(this.modal.footer.querry);

            $(`<button class="mel-button" style="margin-right:40px">${(datas.id === "" ? "Ajouter" : "Modifier")} <span class="plus icon-mel-${(datas.id === "" ? "plus" : "pencil")}"></span></button>`).click(() => {

            }).appendTo(this.modal.footer.querry);
            
            return this;
            
        }

        filter()
        {
            this.modal.editTitle("Que voulez-vous filtrer ?");

            const filters = {
                type:{
                    name:"Par type",
                    array:[{value:"intranet", text:"Sites intranet", id:"mel-new-filter-1"}, {value:"twitter", text:"Comptes Twitter", id:"mel-new-filter-2"}, {value:"rss", text:"Flux RSS", id:"mel-new-filter-3"}]
                },
                category:{
                    name:"Par catégorie",
                    array:[{value:"news", text:"Fils d'informations", id:"mel-new-filter-4"}, {value:"defaults", text:"Sites par défauts", id:"mel-new-filter-5"}, {value:"custom", text:"Vos ajouts", id:"mel-new-filter-6"}]
                }
            }

            let html = "";

            if (this.filters === undefined)
                this.filters = {};

            for (const key in filters) {
                if (Object.hasOwnProperty.call(filters, key)) {
                    const element = filters[key];
                    html += `<h4>${element.name}</h4>`;
                    html += this.createCheckBoxChoices(null, "mel-news-filters", element.array, this.filters, false, false);

                    if (this.filters[element.id] === undefined)
                        this.filters[element.id] = true;
                }
            }

            this.modal.editBody(html);

            this.modal.footer.querry.html("");
            $(`<button class="mel-button" style="margin-right:40px">Filtrer <span class="plus icofont-filter"></span></button>`).click(async () => {
               (await this.updateFilter()).modal.close();
            }).appendTo(this.modal.footer.querry);

            this.modal.show();

            return this;
        }

        async updateFilter()
        {
            $('input[name="mel-news-filters"]').each((i,e) => {
                this.filters[e.id] = e.checked;
                $(e).addClass("disabled").attr("disabled", "disabled");
            });

            if (this.filters[undefined] !== undefined)
                delete this.filters[undefined];

            if (this.filters["undefined"] !== undefined)
                delete this.filters["undefined"];

            // rcmail.set_busy(true, "loading");
            // await this.post("setFilter", {_filter:JSON.stringify(this.filters)}).always(() => {
            //     rcmail.set_busy(false);
            //     rcmail.clear_messages();
            //     rcmail.display_message("Filtre sauvegarder avec succès !");
            // });

            return this;
        }

        sort()
        {
            return this;
        }

        createInput(title, id, type, placeholder, value, name = "", classes = "",attrs="")
        {
            let html = title !== null ? `<label for="${id}" class="span-mel t1 first">${title}<span style="color:red">*</span> </label>` : "";
            html += `<input class="${classes}" id="${id}" ${attrs} ${name === null || name === undefined || name === "" ? "" : `name="${name}"`} type="${type}" placeholder="${placeholder}" value="${value}" />`;
            return html;
        }

        createSelect(title, id, placeholder, values, value)
        {
            let html = `<label for="${id}" class="span-mel t1 first">${title}<span style="color:red">*</span> </label>`;
            html += `<select class="form-control input-mel custom-select pretty-select" id="${id}">`;

            if (placeholder !== "" && placeholder !== null && placeholder !== undefined)
                html += `<option style="display:none;" value="none">${placeholder}</option>`;

            for (const key in values) {
                if (Object.hasOwnProperty.call(values, key)) {
                    const element = values[key];
                    html += `<option value="${element.value}" ${element.value === value ? "selected" : ""}>${element.text}</option>`;
                }
            }

            html += "</select>";

            return html;    
        }

        createCheckBoxChoices(title, name, values, value, format = false, isRadio = true)
        {
            let html = `<fieldset>
            <legend class="red-star-after span-mel t1 mel-after-remover" ${title === null ? 'style=display:none;' : ''}>${title}</legend>`;

            if (format)
                html += '<div class="row">';

            for (const key in values) {
                if (Object.hasOwnProperty.call(values, key)) {
                    const element = values[key];

                    if (format)
                        html += `<div class="col-md-${12/values.length}">`;

                    html += `<div class="custom-control custom-${isRadio ? 'radio' : 'switch'}" ${!format && !isRadio ? 'style=display:block' : ''}>`;
                    html += this.createInput(null, element.id, (isRadio ? "radio" : "checkbox"), "", element.value, name, (" custom-control-input required " + (isRadio ? "" : "form-check-input")),(  typeof value === "string" ? (value === element.value ? "checked" : "") : (value[element.id] === false ? "" : "checked")));    
                    html += `<label class="custom-control-label" for="${element.id}">${element.text}</label></div>`;               
                
                    if (format)
                        html += "</div>";
                }
            }
            if (format)
                html += "</div>";

            html += "</fieldset>";

            return html;
        }

        createTextarea(title, id, placeholder, value)
        {
            let html = `<label for="${id}" class="span-mel t1 first">${title}<span style="color:red">*</span> </label>`;
            html += `<textarea class="form-control input-mel mce_editor" placeholder="${placeholder}" id="${id}">${value}</textarea>`;
            return html;
        }

        post(action, datas, onSuccess, onError = (a,b,c) => {})
        {
            return mel_metapage.Functions.post(
                mel_metapage.Functions.url("news", action),
                datas,
                onSuccess,
                onError
            );
        }

    }

    class MelNews{
        constructor(id)
        {
            this.init();

            if (id !== null)
                this.setup(id);
        }

        init()
        {
            this.$news = $();
            this.id = "";
            this.link = "";
            this.format = MelNews.format.small;
            this.type = MelNews.type.intranet;
        }

        setup(id)
        {
            this.$news = $(`#news-${id}`);
            this.id = id;
            this.link = this.$news.data("link");
            this.format = this.$news.data("format");
            this.type = this.$news.data("type");
        }

        setType(type)
        {
            this.type = type;
            return this;
        }
    }

    MelNews.format = {
        small:"small",
        large:"large"
    };

    MelNews.type = {
        internet:"internet",
        intranet:"intranet",
        twitter:"twitter"
    };

    class MelPublishNew extends MelNews
    {
        constructor(id)
        {
            super(id);
            this.ini().startup(id);
        }

        ini()
        {
            this.body = "";
            this.title = "";
            return this;
        }

        startup(id)
        {
            if (id !== null)
            {
                this.body = this.$news.find(".body").html();
                console.log(this.body, this.$news.find(".body"));
                this.title = this.$news.find(".title").html();
            }

            return this;
        }

        create(title, body)
        {
            this.title = title;
            this.body = body;
            return this;
        }

        setService(service)
        {
            return this.setType(service);
        }

        getService()
        {
            return this.type;
        }
    }

});