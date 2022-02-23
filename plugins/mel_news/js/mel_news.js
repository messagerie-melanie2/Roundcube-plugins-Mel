$(document).ready(async () => {

    /**
     * @constant
     * URL du site web
     */
    const news_contact_url = window.location.origin + window.location.pathname;

    /**
     * @constant
     * Enumération de tous les modes disponibles
     */
    const modes = {
        /**
         * Mode "Toutes les informations" : Toutes les informations d'un même site est affiché sur la page. 
         * Une modification entraîne la modification de toutes les informations lié au site modifié.
         */
        all:"tout",
        /**
         * Mode "Vignette", chaque informations d'un site est encapsulé dans une vignette où l'on peut naviguer du plus récent au plus ancien.
         */
        vignette:"un"
    };

    /**
     * @constant
     * Enumération de tous les modes tris dsiponibles.
     */
    const sort_modes = {
        /**
         * Tri par date - du plus ancien au plus récent
         */
        date_asc:"date_asc",
        /**
         * Tri par date - du plus récent au plus ancien
         */
        date_desc:"date_desc",
        /**
         * Tri par site
         */
        site:"site",
        /**
         * Tri par source (intra/inter/twitter)
         */
        source:"source"
    };

    /**
     * @constant
     * Enumération des id de filtres disponibles.
     */
    const filters = {
        types:{
            intranet:"#mel-new-filter-1",
            twitter:"#mel-new-filter-2",
            //rss:"#mel-new-filter-3"
        },
        categories:{
            headlines:"#mel-new-filter-4",
            //defaults:"#mel-new-filter-5",
            customs:"#mel-new-filter-6"
        }
    }

    /**
     * @constant
     * Mode de la page (Tout/Vignette)
     * @type {number}
     */
    const mode = rcmail.env.news_mode;
    /**
     * @constant
     * Tri de la page (Date/Site/Source)
     * @type {string}
     */
    const sort_mode = rcmail.env.news_sort_mode;
    /**
     * @constant
     * Nombres de lignes visibles pour commencer
     * @type {string}
     */
    const nbRows = rcmail.env.news_starting_nb_rows;

    /**
     * Ajoute les script twitter à la page avec gestion d'erreur.
     * @returns Script créé
     */
    function setTwitterSrc() {
        let script = document.createElement('script');
        // any script can be loading from any domain
        script.src = "https://platform.twitter.com/widgets.js";
        script.setAttribute("async", "async");

        document.head.append(script);
        script.onload = function () {

        };

        script.onerror = function(e, a, b) {
            if (setTwitterSrc.first === undefined)
            {
                rcmail.display_message("Votre navigateur ne permet pas de récupérer les flux twitter", "error");
                setTwitterSrc.first = false;
            }

            for (let index = 0; index < MelCustomNews.allCustomNews.length; index++) {
                const element = MelCustomNews.allCustomNews[index];
                
                if (element.type === "twitter")
                {
                    element.$news.find(".square-contents .headlines-title").css("display", "block").html(`Twitter de ${element.id}`);
                    element.$news.find(".square-contents .headlines-contents").css("display", "block").html(
                        `<a href="https://twitter.com/${element.id}" target="_blank">Ouvrir dans un nouvel onglet <span class="icon-mel-external"></span></a>`
                    );
                    element.$news.find(".square-contents").css("padding", "30px");
                }
            }
        };

        return script;
    };

    /**
     * Met la première lettre de la chaîne de caractère en majuscule.
     * @param {string} a 
     * @returns String capitalisé
     */
    function strUcFirst(a){return (a+'').charAt(0).toUpperCase()+a.substr(1)};
    window.strUcFirst = strUcFirst;

    /**
     * @class
     * @classdesc gère les différentes popup de la pages des informations
     */
    class NewsPopup
    {
        constructor()
        {
            if (window.create_popUp !== undefined)
                delete window.create_popUp

            const _GlobalModalConfig = this.isSettings() ? parent.GlobalModalConfig : GlobalModalConfig;
            const _GlobalModal = this.isSettings() ? parent.GlobalModal : GlobalModal;

            let config = new _GlobalModalConfig();
            config.title = 'Chargement...';
            config.content = `<center><span class="spinner-grow"><span class="sr-only">Chargement....</span></span></center>`;
            config.footer = "";
            this.modal = new _GlobalModal("globalModal", config);
            this.symbols = {
                allIsSelected:Symbol("allIsSelected")
            };
        }

        /**
         * Permet de récupérer une instance statique de la classe.
         * @returns {NewsPopup}
         */
        static fabric()
        {
            if (NewsPopup.cache === undefined)
                NewsPopup.cache = new NewsPopup();

            return NewsPopup.cache;
        }

        /**
         * 
         * @param {string} title Titre de la modale
         * @param  {...{classes:string, icon:string, title:string, action:Function}} choices Liste des choix disponibles
         * @returns Permet le chaînage
         */
        drawChoice(title, ...choices)
        {
            this.modal.footer.querry.html("");
            this.modal.editTitle(title);

            let $html = $('<div style="display:flex"></div>');
            for (const key in choices) {
                if (Object.hasOwnProperty.call(choices, key)) {
                    const element = choices[key];
                    $html.append($(`<button style="margin-top:0px;margin-right:15px" class="btn btn-block ${element.classes === undefined ? "btn-secondary" : element.classes} btn-mel">
                    <span class="block ${element.icon}"></span> ${element.title}
                </button>`).click(element.action));
                }
            }

            this.modal.editBody("");
            this.modal.contents.append($html);

            return this;
        }

        /**
         * Ouvre la modale de publication de flux.
         * @param {string} id Id du flux
         * @param {boolean} isFlux Si vrai, il s'agit d'un flux rss, sinon, d'une publication
         * @returns Chaînage
         */
        createOrEditPublish(id = null, isFlux = false)
        {
            let obFields = '';
            const classes = "form-control input-mel required"
            let news = new MelPublishNew(id);

            //Gère les données des flux
            if (rcmail.env.news_current_news_datas !== undefined)
            {
                news.server_uid = rcmail.env.news_current_news_datas.uid;
                news.setService(rcmail.env.news_current_news_datas.service);
                news.title = news.id;

                if (rcmail.env.news_service_for_publish[rcmail.env.news_current_news_datas.service] === undefined)
                    rcmail.env.news_service_for_publish[rcmail.env.news_current_news_datas.service] = rcmail.env.news_current_news_datas.service.split(',', 2)[0].split("=")[1];

                rcmail.env.news_current_news_datas = undefined;
            }//Gère les données de l'édition/des flux enfants
            else if (!isFlux && id !== null)
            {
                //console.log("else", rcmail.env.news_service_for_publish, news);
                if (rcmail.env.news_service_for_publish[news.type] === undefined && news.type !== null && news.type !== undefined && news.type !== "")
                    rcmail.env.news_service_for_publish[news.type] = news.type.split(',', 2)[0].split("=")[1];
            }

            //Titre de la modale
            if (id === null) this.modal.editTitle("Créer une publication");
            else this.modal.editTitle(`Modifier "${news.title}"`);

            //Si on modifie une vrai news
            if (id !== null && id !== "generated-tmp-id")
                obFields = `<div style="text-align:right;"><button id="publish-delete-button" class="mel-button btn btn-danger" style="">Supprimer <span class="plus icon-mel-trash"></span></button></div>`;

            //Affichage du texte
            let html = obFields + '<div><div class="row"><div class="service-left col-12">' + this.createSelect("Choisissez un service", "mel-publish-service", "Sélectionnez un service", Enumerable.from(rcmail.env.news_service_for_publish).select(x => {return {value:x.key,text:x.value}}).toArray(), id === null ? "none" : news.getService()) + '</div><div class="service-right hidden"><button id="np-select-child" class="mel-button btn btn-secondary" style="margin-top: 53px;">Choisir un sous-service</button></div></div></div>';
            
            //Si on publie une publication
            if (!isFlux)
            {
                html += '<div>' + this.createInput("Choisissez un titre", "mel-publish-title", "text", "Titre de la publication", news.title, "mel-publish-title", classes) + '</div>';
                html += '<div>' + this.createTextarea("Ecrivez la publication", "mel-publish-body", "Voici les nouvelles....", news.body) + '</div>';
            }//Si on publie un flux
            else {
                html += this.createSelect("Choisir le site Intranet à afficher", "news-intranet-select", "Sélectionner un site", Enumerable.from(rcmail.env.news_intranet_list).select(x => {return {value:x.key, text:x.value.name}}).toArray(), (id === null ? "none" : news.id));
            }

            //Modification de l'affichage de la modale (Voir la classe modal de mel_metapage)
            this.modal.editBody('<div class="np-content mel-r">'+html+'</div><div class="np-other mel-r"></div>');

            //Affichage de pied de modal
            this.modal.footer.querry.html("");

            //Suppression de la publicartion
            this.modal.modal.find("#publish-delete-button").click(() => {
                if (confirm("Cela affectera tout ceux qui voient actuellement cette publication.\r\nÊtes-vous sûr de vouloir continuer ?"))
                {
                    this.modal.close();
                    rcmail.set_busy(true);
                    rcmail.display_message("Suppression...", "loading");
                    this.post((isFlux ? "delete_rss" : "delete"), {
                        _uid:(isFlux ? news.server_uid : id)
                    },
                    (datas) => {
                        rcmail.clear_messages();
                        rcmail.set_busy(false);
                        if (datas === "denied")
                        {
                            rcmail.display_message("Vous n'avez pas les droits pour faire cette action !", "error");
                        }
                        else {
                            rcmail.display_message("Publié avec succès !", "confirmation");
                            rcmail.set_busy(true, "loading");
                            window.location.reload();
                        }
                    });
                }
            });

            //Affichage des sous-services ou non
            this.modal.modal.find("#mel-publish-service").on("change", () => {
                const col_right = 3;
                const col_left = 12 - col_right;
                const col_class_right = `col-${col_right}`;

                let service_right = this.modal.modal.find(".service-right");

                if (!service_right.hasClass(col_class_right) && this.modal.modal.find("#mel-publish-service").val() !== "none")
                {
                    service_right.addClass(col_class_right).removeClass("hidden");
                    this.modal.modal.find(".service-left").removeClass("col-12").addClass(`col-${col_left}`);
                    this.modal.modal.find("#np-select-child").click(() => {
                        this.modal.modal.find(".np-content").css("display", "none");
                        this.modal.footer.querry.css("display", "none");
                        new AnnuaireTree(this.modal.modal.find(".np-other"))
                        .setAction(AnnuaireTree.actionsList.onGetAddress, (arbre, service) => {
                            return `${news_contact_url}?_task=addressbook&_is_from=iframe&_action=plugin.annuaire&_source=amande&_base=${btoa(service)}&_remote=1`;
                        })
                        .setAction(AnnuaireTree.actionsList.htmlButton, (arbre, html, service,datas) => {
                            const end = ',dc=equipement,dc=gouv,dc=fr';
                            service = datas.dn;

                            if (!service.includes(end))
                                service += end;

                            html = $(html);
                            let $querry = html.find(".button-text");
                            let text = $querry.html();
                            $querry.remove();
                            $querry = html.append(`<button data-service="${service}" class="mel-button no-button-margin true bckg nbtn-action">${datas.dn.replace(',dc=equipement,dc=gouv,dc=fr', '') === this.modal.modal.find("#mel-publish-service").val() ? '<span class="icon-mel-check icon"></span>' : '<span class="icon"></span>'}${text}</button>`);
                            return html[0].outerHTML;
                        })
                        .setAction(AnnuaireTree.actionsList.afterShowChildren, (arbre, datas, service, $button, $span) => {            
                            if (!Enumerable.from(datas.elements).any(x => x.classes.length > 0 && x.classes[0] === "folder"))
                            {
                                $span.removeClass(arbre.icons.opened).addClass(arbre.icons.empty).parent().parent().addClass("disabled").attr("disabled", "disabled");
                            }
                        })
                        .setAction(AnnuaireTree.actionsList.onNotFolderClick, (arbre, service, $button) => {
                            arbre.panel.find("button.nbtn-action .icon").removeClass("icon-mel-check");
                            $button.find(".icon").addClass("icon-mel-check");
                        })
                        .setAction(AnnuaireTree.actionsList.afterSetup, (arbre) => {
                            arbre.panel.append($(`<button class="added-undo-button mel-button btn btn-primary">Retour <span class="plus icon-mel-undo"></span></button>`).click(() => {
                                this.modal.modal.find(".np-other").html("");
                                this.modal.modal.find(".np-content").css("display", "");
                                this.modal.footer.querry.css("display", "");
                            }));

                            if (arbre.panel.find("li").length === 0)
                            {
                                arbre.panel.find("button.added-undo-button").click();
                                rcmail.display_message("Pas de sous-services pour ce service.");
                            }
                            else {
                                arbre.panel.append($(`<button style="float:right" class="mel-button btn btn-primary">Valider <span class="plus icon-mel-check"></span></button>`).click(() => {
                                    const selected = arbre.panel.find("button.nbtn-action .icon-mel-check");
                                    if (selected.length > 0)
                                    {
                                        const btn = selected.parent();
                                        if (this.modal.modal.find("#mel-publish-service").find(`option[value="${btn.data("service")}"]`).length > 0) this.modal.modal.find("#mel-publish-service").val(btn.data("service"));
                                        else {
                                            this.modal.modal.find("#mel-publish-service").append(`<option value=${btn.data("service")}>${btn.find(".name").html()} - ${btn.find(".description").html()}</option>`).val(btn.data("service"));
                                            
                                            if (rcmail.env.news_service_for_publish === undefined)
                                                rcmail.env.news_service_for_publish = {};
                                            
                                            rcmail.env.news_service_for_publish[btn.data("service")] = btn.find(".name").html() + "-" + btn.find(".description").html();
                                        }
                                    }

                                    arbre.panel.find("button.added-undo-button").click();

                                }));

                                arbre.panel.prepend(`<h4>Choisir un sous-service</h4>`);
                            }


                            
                        })
                        .setupTree(this.modal.modal.find("#mel-publish-service").val());
                    });
                }
            });

            if (!isFlux)//Si publication
            {
                //Bouton de sauvegarde
                $(`<button class="mel-button" style="margin-right:15px">${(news.id === "" ? "Visualiser" : "Visualiser")} <span class="plus icon-mel-${(news.id === "" ? "plus" : "pencil")}"></span></button>`).click(() => {
                    if (this.check([$("#mel-publish-service"), $("#mel-publish-title"), $("#mel-publish-body")], {2:() => tinyMCE.activeEditor.getContent() === ""})) 
                        this.confirm("createOrEditPublish", {id:"news-generated-tmp-id", trueId:news.id});
                }).appendTo(this.modal.footer.querry);

                //Gestion de l'editeur html
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
                            if ($(e.target).closest(".tox-dialog").length) {
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
            }
            else{//Si on publie un flux

                if (this.modal.modal.find("#mel-publish-service").val() !== "none")
                {
                    this.modal.modal.find("#mel-publish-service").change();
                }

                //Gestion de la sauvegarde
                $(`<button class="mel-button" style="margin-right:15px">${(news.id === "" ? "Publier" : "Modifier")} <span class="plus icon-mel-${(news.id === "" ? "plus" : "pencil")}"></span></button>`).click(() => {
                    if (this.check([this.modal.modal.find("#mel-publish-service")])) 
                    {
                        this.modal.close();
                        rcmail.set_busy(true);
                        rcmail.display_message("Ajout en cours...", "loading");
                        mel_metapage.Functions.post(
                            mel_metapage.Functions.url("news", 'publish_rss'),
                            {
                                _uid:(news.server_uid === undefined ? id : news.server_uid),
                                _service:this.modal.modal.find("#mel-publish-service").val(),
                                _source:this.modal.modal.find('#news-intranet-select').val()
                            },
                            (datas) => {
                                rcmail.clear_messages();
                                rcmail.set_busy(false);
                                if (datas === "denied")
                                {
                                    rcmail.display_message("Vous n'avez pas les droits pour faire cette action !", "error");
                                }
                                else {
                                    rcmail.display_message("Publié avec succès !", "confirmation");
                                    rcmail.set_busy(true, "loading");
                                    window.location.reload();
                                }
                            }
                        );
                    }
                }).appendTo(this.modal.footer.querry);

                //Affichage de la modale
                this.modal.show();
            }

            return this;
        }

        /**
         * Vérifie si plusieurs champs sont valides
         * @param {array<JqueryElement>} itemToTest Champs à tester
         * @param {JSON} specCond - Fonctions pour valider un champs spécifique
         * @returns 
         */
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

        /**
         * Page de confirmation d'une autre page. 
         * @param {string} caller Page qui a appelé cette fonciton
         * @param {*} args Divers arguments
         * @returns Chaînage
         */
        confirm(caller, args)
        {
            switch (caller) {
                case "createOrEditPublish":
                    const service_datas = {
                        name:$("#mel-publish-service").find(`option[value="${$("#mel-publish-service").val()}"]`).html(),
                        value:$("#mel-publish-service").val()
                    };

                    let news = new MelPublishNew(null)
                    .create($("#mel-publish-title").val(), tinyMCE.activeEditor.getContent())
                    .setService($("#mel-publish-service").val())
                    .setId(args.id);

                    //Modification du titre de la modale
                    this.modal.editTitle("Visualisation de la publication");

                    //Modification du corps de la modale
                    this.modal.editBody(`
                    <div class="square_div">
                        <div class="contents " id="${args.id}" data-service="${$("#mel-publish-service").val()}" style=overflow:auto>
                            <div class="square-contents">
                                <p class="headlines-by">Information ${news.getService().split(",")[0].split("=")[1]}</p>
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
                        let select = this.modal.modal.find("#mel-publish-service");
                        if (select.find(`option[value="${service_datas.value}"]`).length === 0)
                        {
                            select.append(`<option value="${service_datas.value}">${service_datas.name}</option>`).val(service_datas.value);
                        }
                    }).appendTo(this.modal.footer.querry);
                    $(`<button class="mel-button" style="margin-right:40px">Confirmer <span class="plus icon-mel-plus"></span></button>`).click(() => {
                    
                        if (args.trueId !== "" && args.trueId !== null && args.trueId !== undefined)
                            news.id = args.trueId;

                        this.modal.close();
                        rcmail.set_busy(true);
                        rcmail.display_message("Publication...", "loading");
                        mel_metapage.Functions.post(
                            mel_metapage.Functions.url("news", 'publish'),
                            news.toPostDatas("news-generated-tmp-id"),
                            (datas) => {
                                rcmail.clear_messages();
                                rcmail.set_busy(false);
                                if (datas === "denied")
                                {
                                    rcmail.display_message("Vous n'avez pas les droits pour faire cette action !", "error");
                                }
                                else {
                                    rcmail.display_message("Publié avec succès !", "confirmation");
                                    rcmail.set_busy(true, "loading");
                                    window.location.reload();
                                }
                            }
                        );

                    }).appendTo(this.modal.footer.querry);
                    break;
            
                default:
                    console.error('###[confirm]Impossible de créer une fenêtre de confirmation pour cette action, elle n\'éxiste pas !', caller);
                    break;
            }

            return this;
        }

        /**
         * Affiche la modale pour créer ou modifier un flux custom
         * @param {string} id Id du flux 
         * @param {boolean|string} isAdmin Si on est en mode administrateur
         * @returns Chaînage
         */
        createOrEdit(id = null, isAdmin = false)
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
                // .append($(`<button style="margin-top:0px;margin-right:15px" class="btn btn-block btn-secondary btn-mel"><span class="block icon-mel-rss"></span>Flux RSS externe</button>`).click(() => {
                //         this.showStep2(new MelNews(null).setType(MelNews.type.internet));
                //     })
                // );

                this.modal.editBody($flex);
                this.modal.footer.querry.html("");
                this.modal.show();
            }
            else{
                const news = id.$news !== undefined ? id : new MelCustomNews(id);
                this.showStep2(news, true, isAdmin);
                this.modal.show();
            }

            return this;
        }

        /**
         * Si on est appelé dans la modale des paramètres de rc.
         * @returns 
         */
        isSettings()
        {
            return window !== parent && parent.rcmail.env.task === "settings";
        }

        /**
         * Affiche la suite de @see createOrEdit.
         * @param {MelNews} datas Données de la news
         * @param {Boolean} isEdit Si on modifie une news existante
         * @param {boolean} isAdmin Si on est en mode administrateur
         * @returns Chaînage
         */
        showStep2(datas, isEdit = false, isAdmin = false)
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

            if (mode === modes.all && (isEdit && datas.type !== MelNews.type.twitter))
            {
                html = `
                <div class="alert alert-warning" role="alert">
                    <span class="icon-mel-warning"></span> Toutes les vignettes liés à cet adresse seront impactés !
                </div>` + html;
            }

            this.modal.editBody("");

            switch (datas.type) {
                case MelNews.type.intranet:

                    if (!isEdit)
                        this.modal.editTitle("Ajouter les informations d'un site intranet (étape 2/2)");
                    else
                        this.modal.editTitle("Modifier les informations d'un site intranet");

                    html += this.createSelect("Choisir le site Intranet à afficher", "news-intranet-select", "Sélectionner un site", Enumerable.from(rcmail.env.news_intranet_list).select(x => {return {value:x.key, text:x.value.name}}).toArray(), datas.id);
                    
                    break;

                case MelNews.type.twitter:
                    if (!isEdit)
                        this.modal.editTitle("Ajouter un fil Twitter (étape 2/2)");
                    else
                        this.modal.editTitle("Modifier un fil Twitter");

                    html += this.createInput("Entrez l'identifiant du compte Twitter à afficher", "news-twitter-input", "text", "@NomDuCompte", datas.id, "mel-twitter", "form-control input-mel required");
                    break;

                case MelNews.type.internet:
                    if (!isEdit)
                        this.modal.editTitle("Ajouter un flux RSS externe (étape 2/2)");
                    else
                        this.modal.editTitle("Modifier un flux RSS externe");

                    html += this.createSelect("Choisir le flux RSS à afficher", "news-internet-select", "Sélectionner un site", [], "none");
                
                    break;
            
                default:
                    break;
            }

            html += this.createCheckBoxChoices("Choisir le format du bloc", "newsMelFormat", formats, datas.format, true);

            this.modal.editBody(html);

            //Actions faites après la mise en place du html

            if (datas.type === MelNews.type.intranet && isAdmin !== false && atob(isAdmin) == "true")
            {
                html = $('<div style="text-align:right;"><button id="publishmode" class="mel-button" style="margin-top:0;margin-bottom:15px;float:">Passer en mode publieur</button></div>');
                html.find("button").click(() => {
                    this.createOrEditPublish(datas.$news.data('uid'), true);
                });

                this.modal.contents.prepend(html);
            }

            this.modal.footer.querry.html("");

            $(`<button class="mel-button white" style="position:absolute;left:40px">${(isEdit ? "Annuler" : 'Retour' )} <span class="plus icon-mel-undo"></span></button>`).click(() => {
                if (!isEdit)
                    this.createOrEdit(datas.id);
                else
                    this.modal.close();
            }).appendTo(this.modal.footer.querry);

            $(`<button class="mel-button" style="margin-right:40px">${(!isEdit ? "Ajouter" : "Modifier")} <span class="plus icon-mel-${(datas.id === "" ? "plus" : "pencil")}"></span></button>`).click(() => {

                let url;//= (datas.type === intranet ? $("#news-intranet-select") : $("#news-twitter-input")).val();
                
                if (datas.type === "intranet") url = this.modal.modal.find("#news-intranet-select").val();
                else if (datas.type === "twitter")
                {
                    url = this.modal.modal.find("#news-twitter-input").val();

                    if (url[0] === "@")
                        url = url.replace("@", "");
                }

                if (url === "" || url === "none")
                {
                    rcmail.display_message("Vous devez mettre une valeur valide !", "error");
                    return;
                }

                this.modal.close();

                (this.isSettings() ? parent.rcmail : rcmail).set_busy(true, "loading");

                if (isEdit)
                {
                    this.post("update_custom", 
                    {
                        _url:url,
                        _format:(this.modal.modal.find("#mel-news-format-check-1")[0].checked ? "small" : "large"),
                        _last_url:datas.id
                    }, 
                    (response) => {
                        const isSettings = this.isSettings();
                        (isSettings ? parent.rcmail : rcmail).set_busy(false);
                        (isSettings ? parent.rcmail : rcmail).clear_messages();
                        if (response === "denied")
                        {
                            if (datas.type === "twitter")
                            {
                                this.modal.show();
                                (isSettings ? parent.rcmail : rcmail).display_message("Impossible d'atteindre l'utilisateur !", "error");
                            }
                        }
                        else if (response === "nok")
                        {
                            this.modal.show();
                            (isSettings ? parent.rcmail : rcmail).display_message("Impossible de faire la mise à jours !", "error");  
                        }
                        else {
                            if (mode === modes.all)
                            {
                                (isSettings ? parent.rcmail : rcmail).set_busy(true, "loading");

                                if (isSettings)
                                {
                                    const navigator = parent != parent.parent ? parent.parent : parent;
                                    let $frame = navigator.$("iframe.news-frame");//[0].contentWindow.location.reload();
                                    
                                    if ($frame.length > 0)
                                        $frame[0].contentWindow.location.reload();
                                    else if (navigator.$(".news-frame").length > 0)
                                        navigator.rcmail.refresh();                       
                                }

                            }

                            window.location.reload();
                        }
                    },
                    (a,b,c) => {
                        console.error("###[showStep2]",a,b,c);
                        (isSettings ? parent.rcmail : rcmail).set_busy(false);
                        (isSettings ? parent.rcmail : rcmail).clear_messages();
                    });
                }
                else {
                    this.post("add_custom", 
                    {
                        _url:url,
                        _format:(this.modal.modal.find("#mel-news-format-check-1")[0].checked ? "small" : "large"),
                        _source:datas.type
                    }, 
                    (response) => {
                        rcmail.set_busy(false);
                        rcmail.clear_messages();
                        if (response === "denied")
                        {
                            if (datas.type === "twitter")
                            {
                                this.modal.show();
                                rcmail.display_message("Impossible d'atteindre l'utilisateur !", "error");
                            }
                        }
                        else {
                            this.modal.close();
                            rcmail.set_busy(true, "loading");

                            if (parent.$("iframe.settings-frame").length > 0)
                                parent.$("iframe.settings-frame")[0].contentWindow.location.reload();
                            else if (parent.$(".settings-frame").length > 0)
                                parent.$("#preferences-frame")[0].contentWindow.location.reload();

                            window.location.reload();
                        }
                    },
                    (a,b,c) => {
                        console.error("###[showStep2]",a,b,c);
                        rcmail.set_busy(false);
                        rcmail.clear_messages();
                    });
                }
            }).appendTo(this.modal.footer.querry);
            
            return this;
            
        }

        /**
         * Affiche la modale de filtrage
         * @returns Chaînage
         */
        filter()
        {
            this.modal.editTitle("Que voulez-vous filtrer ?");

            const filters = {
                type:{
                    name:"Par type",
                    array:[{value:"intranet", text:"Sites intranet", id:"mel-new-filter-1"}, {value:"twitter", text:"Comptes Twitter", id:"mel-new-filter-2"}/*, {value:"rss", text:"Flux RSS", id:"mel-new-filter-3"}*/]
                },
                category:{
                    name:"Par catégorie",
                    array:[{value:"news", text:"Fils d'informations", id:"mel-new-filter-4"}, /*{value:"defaults", text:"Sites par défauts", id:"mel-new-filter-5"},*/ {value:"custom", text:"Vos ajouts", id:"mel-new-filter-6"}]
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

        /**
         * @async Met à jours l'affichage lié au filtre.
         * @returns Chaînage
         */
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

            // // rcmail.set_busy(true, "loading");
            // // await this.post("setFilter", {_filter:JSON.stringify(this.filters)}).always(() => {
            // //     rcmail.set_busy(false);
            // //     rcmail.clear_messages();
            // //     rcmail.display_message("Filtre sauvegarder avec succès !");
            // // });
            rcmail.command("news.filter", () => {
                this.modal.close();
            });

            return this;
        }

        sort()
        {
            return this;
        }

        /**
         * Retourne un input en html en string
         * @param {string} title Label de l'input
         * @param {string} id Id de l'input
         * @param {string} type Type de l'input
         * @param {string} placeholder Placeholder de l'input
         * @param {string | number} value Valeur de l'input
         * @param {string} name Nom de l'input
         * @param {string} classes Classes de l'input
         * @param {string} attrs Autres attributs de l'input
         * @returns Input
         */
        createInput(title, id, type, placeholder, value, name = "", classes = "",attrs="")
        {
            let html = title !== null ? `<label for="${id}" class="span-mel t1 first">${title}<span style="color:red">*</span> </label>` : "";
            html += `<input class="${classes}" id="${id}" ${attrs} ${name === null || name === undefined || name === "" ? "" : `name="${name}"`} type="${type}" placeholder="${placeholder}" value="${value}" />`;
            return html;
        }

        /**
         * Retourne un select en html en string
         * @param {string} title Label du select 
         * @param {string} id Id du select 
         * @param {string} placeholder Première valeur, non séléctionnable, du select
         * @param {array<{value:*, text:string}>} values Valeurs disponibles du select
         * @param {*} value Valeur par défaut
         * @returns Select
         */
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

        /**
         * Créer une liste de checkboxes en html en string
         * @param {string} title Légende
         * @param {string} name Nom de toutes les checkboxes
         * @param {array<{id:string, text:string, value:boolean}>} values 
         * @param {boolean} value Valeur par défaut
         * @param {boolean} format Si vrai, elles sont affichés horizontalement
         * @param {boolean} isRadio Type de la checkboxes
         * @returns Checkboxes
         */
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

        /**
         * Créer un textarea en html en string
         * @param {string} title Label du textarea
         * @param {string} id Id du textarea
         * @param {string} placeholder Placeholder du textarea
         * @param {string} value Valeur par défaut
         * @returns Textarea
         */
        createTextarea(title, id, placeholder, value)
        {
            let html = `<label for="${id}" class="span-mel t1 first">${title}<span style="color:red">*</span> </label>`;
            html += `<textarea class="form-control input-mel mce_editor" placeholder="${placeholder}" id="${id}">${value}</textarea>`;
            return html;
        }

        /**
         * @async Retourne une requête ajax post
         * @param {string} action Action roundcube
         * @param {JSON} datas Données de la requête à envoyer au serveur
         * @param {Function} onSuccess Fonction réalisé avec succès
         * @param {Function} onError Fonction réalisé avec echec
         * @returns {Promise<any>} Ajax
         */
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

    /**
     * @class MelNews
     * @classdesc Représente une information
     */
    class MelNews{
        /**
         * Construit la classe
         * @param {string} id Id de l'information
         */
        constructor(id)
        {
            this.init();

            if (id !== null)
                this.setup(id);
        }

        /**
         * Initialise les variables de la classe
         * @returns Chaînage
         */
        init()
        {
            this.$news = null;
            this.id = "";
            this.link = "";
            this.format = MelNews.format.small;
            this.type = MelNews.type.intranet;
            return this;
        }

        /**
         * Ajoutes des valeurs aux variables de la classe
         * @param {string} id Id de l'information
         * @returns Chaînage
         */
        setup(id)
        {
            if (this.$news  === undefined || this.$news === null)
            {
                try {
                    this.$news = $(`#news-${id}`);

                    if (this.$news.length === 0)
                        this.$news = $(`[data-uid="${id}"]`);

                } catch (error) {
                    try {
                        if (this.$news === null)
                            this.$news = $(`[data-uid="${id}"]`);
                    } catch (error) {
                        
                    }
                }
            }
            
            this.id = id;
            this.link = this.$news.data("link");
            this.format = this.$news.data("format");
            this.type = this.$news.data("type");
            this.date = moment(this.$news.data("date"));
            return this;
        }

        /**
         * En mode vignette, ajoute la gestion des informations au html de la vignette
         * @returns Chaînage
         */
        setup_vignette(){

            //Ne marche pas sur les flux twitter
            if (this.type === MelNews.type.twitter)
                return this;

            //Gestion de l'original
            if (this.current === undefined)
            {
                this.original = this.$news[0].outerHTML
                this.current = -1;
            }

            //Si il n'y a pas les flèches
            if (this.$news.find(".vignette-arrows").length === 0 && (rcmail.env.news_vignette_all_news_datas[this.type] !== undefined || rcmail.env.news_vignette_all_news_datas[this.id] !== undefined))
            {
                //Div qui contient les flèches
                let $html = $(`<div class="vignette-arrows" style="text-align:right;">
                <button style="margin-top:0;margin-bottom:15px" class="btn-mel-invisible btn-arrow btn btn-secondary"><span class="icon-mel-arrow-left"></span></button>
                <button style="margin-top:0;margin-bottom:15px" class="btn-mel-invisible btn-arrow btn btn-secondary"><span class="icon-mel-arrow-right"></span></button>
                </div>
                `);

                //Action de la flèche gauche
                let $left = $html.find(".icon-mel-arrow-left").parent().addClass("disabled").attr("disabled", "disabled");
                $left.click((e) => {

                    let reclick = false;
                    let news_datas;

                    if (rcmail.env.news_vignette_all_news_datas[this.id] === undefined)
                        news_datas = rcmail.env.news_vignette_all_news_datas[this.type];
                    else
                        news_datas = rcmail.env.news_vignette_all_news_datas[this.id];

                    let tmp;

                    try {
                        if (this.current - 1 === -1)
                        {
                            tmp = this.original;
                            this.current = -1;
                        }
                        else
                            tmp = news_datas[--this.current];
                    } catch (error) {
                        tmp = undefined;
                    }

                    if (tmp === undefined)
                    {
                        return;
                    
                    }

                    if (this.type === MelNews.type.intranet && this.$news.data("copy") === ($(tmp).children().data("copy") === undefined ? $(tmp).data("copy") : $(tmp).children().data("copy")))
                    {
                        reclick = true;
                    }

                    this.$right.removeClass("disabled").removeAttr("disabled");


                    this.$news.find(".square-contents").children().each((i,e) => {
                        e = $(e);

                        if(!e.hasClass("vignette-arrows"))
                        {
                            e.remove();
                        }
                    });

                    this.$news.data("copy", $(tmp).children().data("copy")).find(".square-contents").append($(tmp).find(".square-contents").html());

                    if (this.current === -1)
                        $(e.currentTarget).addClass("disabled").attr("disabled", "disabled");
                    else if (reclick)
                        this.$left.click();
                });

                //Action de la flèche droite
                let $right = $html.find(".icon-mel-arrow-right").parent();
                $right.click((e) => {

                    let reclick = false;
                    let news_datas;

                    if (rcmail.env.news_vignette_all_news_datas[this.id] === undefined)
                        news_datas = rcmail.env.news_vignette_all_news_datas[this.type];
                    else
                        news_datas = rcmail.env.news_vignette_all_news_datas[this.id];

                    let tmp;

                    try {
                        tmp = news_datas[++this.current];
                    } catch (error) {
                        tmp = undefined;
                    }

                    if (tmp === undefined)
                    {
                        return;
                    }

                    if (this.type === MelNews.type.intranet && this.$news.data("copy") === ($(tmp).children().data("copy") === undefined ? $(tmp).data("copy") : $(tmp).children().data("copy")))
                    {
                        reclick = true;
                    }

                    this.$left.removeClass("disabled").removeAttr("disabled");

                    this.$news.find(".square-contents").children().each((i,e) => {
                        e = $(e);

                        if(!e.hasClass("vignette-arrows"))
                        {
                            e.remove();
                        }
                    });

                    this.$news.data("copy", $(tmp).children().data("copy")).find(".square-contents").append($(tmp).find(".square-contents").html());

                    if (news_datas[this.current + 1] === undefined)
                        $(e.currentTarget).addClass("disabled").attr("disabled", "disabled");
                    else if (reclick)
                        this.$right.click();
                });

                this.$news.find(".square-contents").prepend($html);

                this.$right = this.$news.find(".square-contents").find(".icon-mel-arrow-right").parent();
                this.$left = this.$news.find(".square-contents").find(".icon-mel-arrow-left").parent();
            }

            return this;
        }

        /**
         * Met à jour la querry html de la classe
         * @param {JqueryElement} $querry Nouvelle querry
         * @returns Chaînage
         */
        setNews($querry)
        {
            this.$news = $querry;
            return this;
        }

        /**
         * Met à jours le type de la classe.  
         * @see MelNews.type
         * @param {string} type Type de la classe
         * @returns Chaînage
         */
        setType(type)
        {
            this.type = type;
            return this;
        }
    }

    /**
     * Enumération des formats de la news
     */
    MelNews.format = {
        /**
         * Petit format (col-md-3)
         */
        small:"small",
        /**
         * Grand format (col-md-6)
         */
        large:"large"
    };

    /**
     * Enumération des types de news
     */
    MelNews.type = {
        internet:"internet",
        intranet:"intranet",
        twitter:"twitter"
    };

    class MelCustomNews extends MelNews
    {
        constructor(id)
        {
            super(id);
        }

        static fromServer(serverDatas, original = null)
        {
            let created = new MelCustomNews(serverDatas.id);
            created.id = serverDatas.id;
            created.date = moment(serverDatas.datas.date);
            created.format = original !== null && serverDatas.size === "same" ? original.format : serverDatas.size;
            created.link = serverDatas.datas.link;
            created.site = serverDatas.service;
            created.type = original !== null && serverDatas.source === "same" ? original.type : serverDatas.source;
            created.$news = $(created.loadHtml(rcmail.env.news_skeleton, serverDatas.datas));

            return created;
        }

        init(){
            super.init();
            return this;
        }

        setup(id) {

            this.$news = $(`.rss[data-uid="${id}"]`);

            if (id.includes("@"))
                id = id.split("@")[0];

            super.setup(id);
            this.date = moment(this.$news.data("date"));

            if (!this.date.isValid())
                this.date = moment();

            this.site = this.$news.data("site");
            return this;
        };

        loadHtml(skeleton, content, optional_style = 'style="margin-bottom:15px"')
        {
            return skeleton.
            replaceAll("<type/>", "rss").
            replaceAll("<optional_style/>", optional_style).
            replaceAll("<site/>", this.site).
            replaceAll("<raw_date/>", this.date.format()).
            replaceAll("<uid/>", this.id).
            replaceAll("<datalink/>", this.link).
            replaceAll("<dataformat/>", this.format).
            replaceAll("<datatype/>", this.type).
            replaceAll("<datacopy/>", this.link).
            replaceAll("<div_title/>", "").
            replaceAll("<headlines_other_classes/>", "headlines-rss-type").
            replaceAll("<service/>", this.site).
            replaceAll("<title/>", content.title).
            replaceAll("<text/>", content.content).
            replaceAll("<additionnal_contents/>", `<div style="position: absolute;bottom: 30px;" class="headlines-source"><p>Source : ${strUcFirst(this.type)}</p><p class='p-buttons'>
            <button style="margin-top:0;margin-right:5px;" title="Copier" onclick="rcmail.command('news.copy', $(this))" class="mel-button btn btn-secondary roundbadge large r-news"><span class=" icon-mel-copy"><span class="sr-only">Copier le lien</span></span></button>
            <button style="margin:0" title="Editer" onclick="rcmail.command(\'\')" class="mel-button btn btn-secondary roundbadge large r-news"><span class=" icon-mel-pencil"><span class="sr-only">Modifier</span></span></button>
            </p></div>`).
            replaceAll("<date/>", `Publié le ${this.tradDate(this.date.format('dddd DD MMMM YYYY'))}`)
            ;
        }

        tradDate(date)
        {
            let array = date.split(" ");
            date = "";

            for (const key in array) {
                if (Object.hasOwnProperty.call(array, key)) {
                    const element = array[key];
                    date += rcmail.gettext(element, "mel_news") + " ";
                }
            }

            return date;
        }

        async refresh() 
        {
            let temp_url = window.location.origin + window.location.pathname;

            if (temp_url[temp_url.length - 1] === '/')
                temp_url = temp_url.slice(0, temp_url.length - 1);

            const url = temp_url + this.link;

            await mel_metapage.Functions.get(url, 
            {
                _url:this.id
            }, 
            (datas) => {//headlines-contents
                if (mode === modes.all)
                    this._refresh_mode_all(JSON.parse(datas));
                else
                {
                    datas = JSON.parse(datas);
                    const uid = $(datas[0]).data("uid");
                    this.$news.parent().html(datas[0]);
                    this.$news =  $(`[data-uid="${uid}"]`);
                    rcmail.env.news_vignette_all_news_datas[this.id] = datas;
                    delete this.original;
                    delete this.current;
                    this.setup_vignette();



                }
                // datas = JSON.parse(datas);
                // this.$news.find(".headlines-by").html(rcmail.env.news_intranet_list[this.id].name);
                // this.$news.find(".headlines-title").html(datas.title);
                // this.$news.find(".headlines-publish").html(`Publié le ${moment(datas.date).format('dddd DD MMMM YYYY')}`);
                // this.$news.find(".headlines-contents").html(datas.content);

                // let $headlines_source = this.$news.find('.headlines-source');

                // if ($headlines_source.length === 0)
                //     this.$news.find(".square-contents").append(`<div style="position: absolute;bottom: 30px;" class="headlines-source">Source : ${strUcFirst(this.type)}</div>`);
                // else
                //     this.$news.find('.headlines-source').html(`Source : ${strUcFirst(this.type)}`);
            });
        }

        _refresh_mode_all(datas)
        {
            let oldNews = Enumerable.from(MelCustomNews.allCustomNews).where(x => x.id !== this.id);
            let newNews = [];

            for (const key in datas) {
                if (Object.hasOwnProperty.call(datas, key)) {
                    const element = datas[key];
                    newNews.push(MelCustomNews.fromServer(element, this));
                }
            }

            oldNews.forEach((x, i) => 
                {
                    i = x.$news.clone();
                    x.$news.remove();
                    x.$news = i;

                    if (x.$news.length > 1)
                        x.$news = $(x.$news[0]);
                });
            
            oldNews = oldNews.concat(newNews);//.orderByDescending(x => x.date).toArray();

            switch (sort_mode) {
                case sort_modes.date_desc:
                    oldNews = oldNews.orderByDescending(x => x.date.unix());
                    break;

                case sort_modes.date_asc:
                    oldNews = oldNews.orderBy(x => x.date.unix());
                    break;

                case sort_modes.site:
                    oldNews = oldNews.orderBy(x => x.site);
                    break;
            
                case sort_modes.source:
                    oldNews = oldNews.orderBy(x => x.type);
                    break;
                default:
                    throw {
                        message:"Ce type de tri n'existe pas !",
                        element:this
                    };
            }

            MelCustomNews.allCustomNews = oldNews.toArray();
            let $col;
            let col = 0;
            let $parent = $("#i-custom-news");
            $parent.html("");
            $parent = $parent.append('<div class="row"></div>').find(".row");

            let started = false;
            for (const key in MelCustomNews.allCustomNews) {
                if (Object.hasOwnProperty.call(MelCustomNews.allCustomNews, key)) {
                    if (col >= 12*nbRows && rcmail.env.news_more_showed !== "loading" && rcmail.env.news_more_showed !== true)
                        break;

                    if (MelCustomNews.allCustomNews[key].format === "small")
                    {
                        $col = $('<div class="col-3"></div>');
                        col += 3;
                    }
                    else
                    {
                        $col = $('<div class="col-6"></div>');
                        col += 6;
                    }

                    MelCustomNews.allCustomNews[key].$news = MelCustomNews.allCustomNews[key].$news.appendTo($col);

                    if (MelCustomNews.allCustomNews[key].type === MelNews.type.twitter)
                    {
                        MelCustomNews.allCustomNews[key].$news.find(".headlines-contents").html(`<a class="twitter-timeline" href="https://twitter.com/${MelCustomNews.allCustomNews[key].id}?ref_src=twsrc%5Etfw"></a>`);
                        
                        if (!started)
                            started = true;
                    }

                    $col.appendTo($parent);
                }
            }

            if (started)
            {
                $('script[src="https://platform.twitter.com/widgets.js"]').remove();
                setTwitterSrc();//$("body").append('<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script> ');
            }

        }

        static CreateAndSetup(initialRefresh = false){
            let array = [];
            $("#i-custom-news .mel-news").each((i,e) => {
                const uid = $(e).data("uid");

                if ($(e).hasClass("rss"))
                    array.push(new MelCustomNews(uid));
                else
                {
                    array.push(new MelNews(uid).setNews($(e)).setup(uid));
                }

                if (array[array.length-1].type !== MelNews.type.twitter && array[array.length-1].$news.data("copy") !== "")
                {
                    array[array.length-1].$news.find(".square-contents").children().each((i, e) => {
                        if ($(e).hasClass("vignette-arrows"))
                            return;

                        $(e).css("cursor", "pointer").attr("title", "Ouvrir dans un nouvel onglet");
                    });
                }
            });
            MelCustomNews.allCustomNews = array;
            return MelCustomNews.Refresh(initialRefresh);
        }

        static async Refresh(initialRefresh = false)
        {
            if (MelCustomNews.Refresh.started !== true)
                MelCustomNews.Refresh.started = true;
            else
                return;

            let $button = $("#seemoreorless .plus");
            const button_initial_class = $button.hasClass("icon-mel-chevron-down") ? "icon-mel-chevron-down" : "icon-mel-chevron-up";
            $button.removeClass("icon-mel-chevron-down").addClass("spinner-grow spinner-grow-sm").addClass("disabled").attr("disabled", "disabled");

            let arrayOfRefresh = [];

            if (mode === modes.all)
            {
                let array_id = [];
                for (const key in MelCustomNews.allCustomNews) {
                    if (Object.hasOwnProperty.call(MelCustomNews.allCustomNews, key)) {
                        const element = MelCustomNews.allCustomNews[key];
                        if (!array_id.includes(element.id))
                        {
                            if (initialRefresh === true && element.site !== "")
                                continue;

                            if (element.type === MelNews.type.twitter)
                                continue;

                            array_id.push(element.id);
                            try {
                                arrayOfRefresh.push(element.refresh());
                            } catch (error) {
                                
                            }

                        }
                    }
                }
            }
            else {
                for (const key in MelCustomNews.allCustomNews) {
                    if (Object.hasOwnProperty.call(MelCustomNews.allCustomNews, key)) {
                        const element = MelCustomNews.allCustomNews[key];

                        if (initialRefresh === true && element.site !== "")
                        {
                            try {
                                MelCustomNews.allCustomNews[key].setup_vignette();
                            } catch (error) {
                                console.error("Rv", error);
                            }
                            continue;
                        }

                        if (element.type === MelNews.type.twitter)
                            continue;

                        try {
                            arrayOfRefresh.push(element.refresh());
                        } catch (error) {
                            
                        }
                    }
                }
            }


            await Promise.all(arrayOfRefresh);

            $("#seemoreorless .plus").addClass(button_initial_class).removeClass("spinner-grow").removeClass("spinner-grow-sm").removeClass("disabled").removeAttr("disabled");
            
            MelCustomNews.Refresh.started = false;
        }

        static async Reorder()
        {
            rcmail.set_busy(true, "loading");
            let $parent = $("#i-custom-news .row").css("display", "none");
            $("#i-custom-news-temp").html('<center><div class="spinner-grow"><span class="sr-only">Loading....</span></div></center>');

            let initialclass = $("#seemoreorless .plus").hasClass("icon-mel-chevron-down") ? "icon-mel-chevron-down" : "icon-mel-chevron-up";
            $("#seemoreorless .plus").removeClass("icon-mel-chevron-down").addClass("spinner-grow spinner-grow-sm").addClass("disabled").attr("disabled", "disabled");
            let news = Enumerable.from(MelCustomNews.allCustomNews);

            const sorting = rcmail.env.news_sort_mode

            switch (sorting) {
                case sort_modes.date_desc:
                    news = news.orderByDescending(x => x.date);
                    break;

                case sort_modes.date_asc:
                    news = news.orderBy(x => x.date);
                    break;

                case sort_modes.site:
                    news = news.orderBy(x => x.site === undefined ? x.$news.find(".headlines-by").html() : x.site);
                    break;
            
                case sort_modes.source:
                    news = news.orderBy(x => x.type);
                    break;
                default:
                    throw {
                        message:"Ce type de tri n'existe pas !",
                        element:this
                    };
            }

            news = news.toArray();
            let $col;

            let started = false;
            for (const key in news) {
                if (Object.hasOwnProperty.call(news, key)) {
                    $col = null;
                    const element = news[key];

                    if (element.format === "small")
                    {
                        $col = $(`<div class="col-3" style="display:${element.$news.parent().css("display")}"></div>`);
                    }
                    else
                    {
                        $col = $(`<div class="col-6" style="display:${element.$news.parent().css("display")}"></div>`);
                    }

                    element.$news.clone().appendTo($col);
                    element.$news.parent().remove();
                    $col.appendTo($parent);
                    element.$news = $col.find(".mel-news");

                    if (element.type === MelNews.type.twitter)
                    {
                        element.$news.find(".headlines-contents").html(`<a class="twitter-timeline" href="https://twitter.com/${element.id}?ref_src=twsrc%5Etfw"></a>`);
                        
                        if (!started)
                            started = true;
                    }
                }
            }

             if (started)
             {
                 $('script[src="https://platform.twitter.com/widgets.js"]').remove();
                 setTwitterSrc();//$("body").append('<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script> ');
             }

            $("#seemoreorless .plus").addClass(initialclass).removeClass("spinner-grow").removeClass("spinner-grow-sm").removeClass("disabled").removeAttr("disabled");
            $("#i-custom-news-temp").html("");
            $parent.css("display", "");
            rcmail.set_busy(false);
            rcmail.clear_messages();
        }

        static async Filter(doAfter = null)
        {
            let enum_news = Enumerable.from(MelCustomNews.allCustomNews);
            enum_news.forEach((x, i) => {
                x.$news.parent().css("display", "");
            });

            if (NewsPopup.fabric().filters === undefined)
                return

            let promises = [];
            for (const key in filters) {
                if (Object.hasOwnProperty.call(filters, key)) {
                    const filter = filters[key];
                    
                    for (const name in filter) {
                        if (Object.hasOwnProperty.call(filter, name)) {
                            const _element = $(filter[name]);
                            const $element = _element.length === 0 ? [{checked:NewsPopup.fabric().filters[filter[name]]}] : _element;

                            if ($element[0].checked === false)
                            {
                                if (key === "types")
                                {
                                    promises.push(new Promise((a, b) => {
                                        enum_news.where(x => x.type === name).forEach(x => {
                                            x.$news.parent().css("display", "none")
                                        });
                                        a();
                                    }));
                                    enum_news = enum_news.where(x => x.type !== name);
                                }
                                else {
                                    switch (name) {
                                        case "headlines": //defaults/customs
                                            promises.push(new Promise((a, b) => {
                                                enum_news.where(x => x.type === "").forEach(x => {
                                                    x.$news.parent().css("display", "none")
                                                });
                                                a();
                                            }));
                                            enum_news = enum_news.where(x => x.type !== "");
                                            break;

                                        case "customs": 
                                            promises.push(new Promise((a, b) => {
                                                enum_news.where(x => x.type !== "").forEach(x => {
                                                    x.$news.parent().css("display", "none")
                                                });
                                                a();
                                            }));
                                            enum_news = enum_news.where(x => x.type === "");
                                            break;
                                    
                                        default:
                                            break;
                                    }
                                }
                            }

                        }
                    }

                }
            }

            await Promise.all(promises);

            if (doAfter !== null)
                doAfter();
        }

        
    }

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

                if (this.body === undefined)
                    this.body = this.$news.find(".headlines-contents").html();

                this.title = this.$news.find(".title").html();

                if (this.title === undefined)
                    this.title = this.$news.find(".headlines-title").html();

                if (this.$news.data("service") !== undefined)
                    this.setService(this.$news.data("service"));

                if (this.$news.data("type") !== undefined)
                    this.setService(this.$news.data("type"));

                if (id.includes("@"))
                    this.id = id.split("@")[0];
            }

            return this;
        }

        create(title, body)
        {
            this.title = title;
            this.body = body;
            return this;
        }

        setId(id)
        {
            this.id = id;
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

        toPostDatas(ignoreId = null)
        {
            let item = {
                _title:this.title,
                _description:this.body,
                _service:this.getService()
            };

            if (ignoreId !== this.id)
                item._uid = this.id;

            return item;
        }
    }

if (rcmail.env.news_dont_load === undefined)
{
    init_news();
}
else {
    rcmail.register_command("news.settings.edit", (args) => {
        const id = args[0];
        const format = args[1];
        const source = args[2];
        let news = new MelCustomNews("");
        news.id = id;
        news.format = format;
        news.type = source;
        NewsPopup.fabric().createOrEdit(news);

    }, true);

    rcmail.register_command("news.settings.delete", (id) => {
        if (confirm("Êtes-vous sûr de vouloir supprimer ce flux ?"))
        {
            parent.rcmail.set_busy(true, "loading");
            mel_metapage.Functions.post(
                mel_metapage.Functions.url("news", "delete_custom"),
                {
                    _url:id
                },
                (datas) => {
                    
                    const navigator = parent !== parent.parent ? parent.parent : parent;

                    let $frame = navigator.$("iframe.news-frame");//[0].contentWindow.location.reload();

                    if ($frame.length > 0)
                        $frame[0].contentWindow.location.reload();
                    else if (navigator.$(".news-frame").length > 0)
                        navigator.rcmail.refresh();   

                    window.location.reload();
                }
            )
        }

    }, true);

    $(document).ready(() => {
        (window !== parent ? parent.rcmail : rcmail).set_busy(false);
        (window !== parent ? parent.rcmail : rcmail).clear_messages();
    });
}

    function init_news()
    {

        rcmail.register_command("news.filter", (x = null) => {
            MelCustomNews.Filter(x);
        }, true);

        rcmail.register_command('news.copy', (x) => {
            if (typeof x === "string") mel_metapage.Functions.copy(x);
            else mel_metapage.Functions.copy(x.parent().parent().parent().data("copy"));
        }, true);

        rcmail.register_command('news.edit.action', (x) => {
            let $data = $(x).parent().parent().parent();

            try {
                let news_datas = JSON.parse(atob($(x).data("news")));
                rcmail.env.news_current_news_datas = news_datas;
                NewsPopup.fabric().createOrEdit($data.data("uid"), btoa(news_datas.isPublisher));
            } catch (error) {
                NewsPopup.fabric().createOrEdit($data.data("uid"));
            }

        }, true);

        rcmail.register_command('news.edit', (x) => {
            NewsPopup.fabric().drawChoice("Que souhaitez-vous faire ?", 
            {
                icon:"icon-mel-pencil",
                title:"Modifier le flux",
                action:() => {
                    rcmail.command('news.edit.action', x)
                }
            },
            {
                icon:"icon-mel-trash",
                title:"Supprimer le flux",
                action:() => {
                    let text;

                    if (mode === modes.all && $(x).parent().parent().parent().data("type") === MelNews.type.intranet)
                    {
                        text = "Attention, vous allez supprimer toutes les vignettes lié à ce flux, êtes-vous sûr de votre action ?";
                    }
                    else text = "Attention, vous allez supprimer ce flux, êtes-vous sûr de votre action ?";

                    if (confirm(text))
                    {
                        parent.rcmail.set_busy(true, "loading");
                        NewsPopup.fabric().modal.close();
                        mel_metapage.Functions.post(
                            mel_metapage.Functions.url("news", "delete_custom"),
                            {
                                _url:(new MelCustomNews($(x).parent().parent().parent().data("uid"))).id
                            },
                            (datas) => {          
                                window.location.reload();
                            }
                        );
                    }
                }
            }
            ).modal.show();

        }, true);

        rcmail.register_command('news.published.edit', (x) => {
            let $data = $(x).parent().parent().parent();
            NewsPopup.fabric().createOrEditPublish($data.data('uid'));
        }, true);

        rcmail.register_command('news.click', (x) => {
            if (x._event !== undefined)
            {
                let $parent = $(x._event.originalTarget === undefined ? x._event.target : x._event.originalTarget);
                let it = 0;
                while (it < 3) {
                    console
                    if ($parent.hasClass("vignette-arrows"))
                        return;
                    else {
                        $parent = $parent.parent();
                        ++it;
                    }
                }
            }

            element = x.element.parent();

            if (element.data("site") !== MelNews.type.twitter && element.data("copy") !== "")
            {
                window.open(element.data("copy"), '_blank').focus();
            }
        }, true);

        rcmail.register_command('news.keydown', (x) => {
            if (x._event.keyCode === 13) rcmail.command("news.click", {_event:undefined, element:x.element});
        }, true);

        let initial = true;
        let storage = mel_metapage.Storage.get("news_last_day_refresh");

        if (storage === null || moment(storage).startOf("day").format("DD/MM/YYYY") !== moment().startOf("day").format("DD/MM/YYYY"))
        {
            initial = false;
            mel_metapage.Storage.set("news_last_day_refresh", moment());
            rcmail.set_busy(true);
            rcmail.display_message("Mise à jours des actualités....", "loading");
        }

        MelCustomNews.CreateAndSetup(initial).then(() => {
            if (initial === false)
            {
                rcmail.set_busy(false);
                rcmail.clear_messages();
                rcmail.display_message("Actualités mises à jours avec succès !", "confirmation");
            }

            if (Enumerable.from(MelCustomNews.allCustomNews).any(x => x.type === MelNews.type.twitter))
            {
                $('script[src="https://platform.twitter.com/widgets.js"]').remove();
                setTwitterSrc();
            }

            if (Enumerable.from(MelCustomNews.allCustomNews).select(x => x.format === 'small' ? 3 : 6).sum() < 12 * nbRows)
                $("#seemoreorless").remove();
        });

        if (Enumerable.from(rcmail.env.news_service_for_publish).any())
        {

            $("#news-button-publish").removeClass("disabled").removeAttr("disabled").click(() => {
                NewsPopup.fabric().createOrEditPublish();
            });

            $("#news-button-publish-flux").removeClass("disabled").removeAttr("disabled").click(() => {
                NewsPopup.fabric().createOrEditPublish(null, true);
            });

        }
        else {
            $("#news-button-publish").hide();
            $("#news-button-publish-flux").hide();
        }

        let it = 0;
        wait(() => {
            if (++it >= 5)
                return false;
            
            return window.news_ui === undefined;
        }).then(() => {
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
                } catch (error) {
                    console.error('###[init_news]', error);
                }
            }
        });

        $("#seemoreorless").click(() => {
            if (rcmail.env.news_more_showed === "loading")
                return;

            if (rcmail.env.news_more_showed !== true)
            {
                let $querry = $("#seemoreorless .plus").removeClass("icon-mel-chevron-down").addClass("spinner-grow spinner-grow-sm");
                
                rcmail.set_busy(true, "loading");
                rcmail.env.news_more_showed = "loading";
                mel_metapage.Functions.get(mel_metapage.Functions.url("news", "show_all_custom_news"), {},
                (datas) => {
                    let $parent = $("#i-custom-news");
                    let $temp = $("#i-custom-news-temp");
                    $temp.css("display", "none").html($parent.html());
                    $parent.css("display", "none").html(datas);
                    $temp.css("display", "");
                    MelCustomNews.CreateAndSetup().then(() => {
                        MelCustomNews.Filter().then(() => {
                            rcmail.set_busy(false);
                            rcmail.clear_messages();
                            $querry.removeClass("spinner-grow").removeClass("spinner-grow-sm").addClass("icon-mel-chevron-up").parent().find("rotomeca").html("Voir moins");
                            $parent.css("display", "");
                            $temp.html("");
                            rcmail.env.news_more_showed = true;

                            if (mode === modes.vignette)
                            {
                                let started = false;
                                for (const key in MelCustomNews.allCustomNews) {
                                    if (Object.hasOwnProperty.call(MelCustomNews.allCustomNews, key)) {
                                        try {
                                            MelCustomNews.allCustomNews[key].setup_vignette();
                                        } catch (error) {
                                            console.error("###",error)
                                        }

                                        if (MelCustomNews.allCustomNews[key].type === "twitter" && !started)
                                            started = true;
                                        
                                    }
                                }

                                if (started)
                                {
                                    $('script[src="https://platform.twitter.com/widgets.js"]').remove();
                                    setTwitterSrc();
                                    //$("body").append('<script async onerror="rcmail.command(`news.twitter.error`)" src="https://platform.twitter.com/widgets.js" charset="utf-8"></script> ');
                                }
                            }
                        })

                    })

                });
            } 
            else {
                rcmail.env.news_more_showed = false;
                $("#seemoreorless .plus").removeClass("icon-mel-chevron-up").addClass("icon-mel-chevron-down").parent().find("rotomeca").html("Voir plus");

                let col = 0;
                let arrayOk = [];
                for (const key in MelCustomNews.allCustomNews) {
                    if (Object.hasOwnProperty.call(MelCustomNews.allCustomNews, key)) {
                        const element = MelCustomNews.allCustomNews[key];
                        if (col >= nbRows*12)
                        {
                            element.$news.remove();
                        }
                        else {
                            if (element.format === "small") col += 3;
                            else col += 6;

                            arrayOk.push(element);
                        }
                    }
                }

                MelCustomNews.allCustomNews = arrayOk;
            }
        });

        $("#news-select-order").val(sort_mode);
        $("#news-select-order").on("change", () => {
            let ok = false;
            rcmail.env.news_sort_mode = $("#news-select-order").val();
            Promise.all([
            mel_metapage.Functions.post(mel_metapage.Functions.url("news", "update_sort"), {
                _mode:rcmail.env.news_sort_mode
            },
            (datas) => {
                ok = true;
            }),
            MelCustomNews.Reorder()]).then(() => {
                if (!ok)
                    rcmail.display_message("Une erreur est survenue lors du triage ! Êtes-vous connectez à internet ?", "error");
            })
        });

        rcmail.addEventListener("mel_metapage_refresh", async () => {
            //start
            rcmail.triggerEvent("news.refresh.before");
            mel_metapage.Functions.get(
                mel_metapage.Functions.url("news", "get_rights"), 
                {},
                (success) => {
                    rcmail.env.news_service_for_publish = JSON.parse(success);

                    if (rcmail.env.news_service_for_publish !== null && rcmail.env.news_service_for_publish !== undefined && Enumerable.from(rcmail.env.news_service_for_publish).any())
                    {
                        $("#news-button-publish").show();
                        $("#news-button-publish-flux").show();
                    }
                    else {
                        $("#news-button-publish").hide();
                        $("#news-button-publish-flux").hide();
                    }
                }
            );

            //middle
            rcmail.triggerEvent("news.refresh");
            await MelCustomNews.Refresh();

            if (mode === modes.all) await MelCustomNews.Reorder();

            await MelCustomNews.Filter();

            //end
            for (let index = 0; index < MelCustomNews.allCustomNews.length; index++) {
                if (MelCustomNews.allCustomNews[index].type !== MelNews.type.twitter && MelCustomNews.allCustomNews[index].$news.data("copy") !== "")
                {
                    MelCustomNews.allCustomNews[index].$news.find(".square-contents").children().each((i, e) => {
                        if ($(e).hasClass("vignette-arrows"))
                            return;

                        $(e).css("cursor", "pointer").attr("title", "Ouvrir dans un nouvel onglet");
                    });
                }
            }
            rcmail.triggerEvent("news.refresh.after");
        });

        // window.MelCustomNews = MelCustomNews;

    }

    // rcmail.env.news_actions = {
    //     reorder:MelCustomNews.Reorder
    // };

});