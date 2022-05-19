(() => 
{
    class Workspace_Param
    {
        constructor(workspace_id)
        {
            this.async(() => {
                this.change_icons();
            });
            this.uid = workspace_id;

            Object.defineProperty(this, '_data_null', {
                enumerable: false,
                configurable: false,
                writable: false,
                value: Workspace_Param.data_null
              });

            this.init_params_buttons();
        }

        init_params_buttons()
        {
            if ($("#update-channel-button").length > 0)
                $("#update-channel-button").on("click", () => {
                    this.change_canal();
                });

            if ($("#update-wekan-button").length > 0)
                $("#update-wekan-button").on("click", () => {
                    this.change_wekan();
                });
        }

        change_icons()
        {
            $(".wsp-change-icon").each((i,e) => {
                let _class = null;

                for (let index = 0; index < e.classList.length; ++index) {
                    const element = e.classList[index];

                    if (element !== "wsp-change-icon" && !element.includes("text"))
                    {
                        _class = element;
                        break;
                    }
                }

                e = $(e);

                if (_class !== null)
                    e.removeClass(_class).addClass(m_mp_CreateDocumentIconContract(_class));

                e.removeClass("wsp-change-icon");
              });
        }

        url(action = null)
        {
            if (action === null)
            {
                let default_config = null;

                if (window.location.href.includes(rcmail.env.mel_metapage_const.value))
                {
                    default_config = {};
                    default_config[rcmail.env.mel_metapage_const.key] = rcmail.env.mel_metapage_const.value;
                }

                return MEL_ELASTIC_UI.url("workspace", "", default_config);
            }
            else
                return MEL_ELASTIC_UI.url("workspace", action);
        }

        async(func)
        {
            return new Promise((a, b) => func());
        }

        ajax(url, datas = Workspace_Param.data_null, success = (datas) => {}, failed = (xhr, ajaxOptions, thrownError) => {console.error(xhr, ajaxOptions, thrownError)}, type = "POST")
        {
            let config = { // fonction permettant de faire de l'ajax
                type: type, // methode de transmission des données au fichier php
                url: url,//rcmail.env.ev_calendar_url+'&start='+dateNow(new Date())+'&end='+dateNow(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()+1)), // url du fichier php
                success,
                error: failed
            };

            if (datas !== Workspace_Param.data_null)
                config["data"] = datas;

            return $.ajax(config);
        }

        busy(is_busy = true)
        {
            if (is_busy)
                rcmail.set_busy(true, "loading");
            else
            {
                if (this.is_busy())
                {
                    rcmail.set_busy(false);
                    rcmail.clear_messages();
                }
            }
        }

        async busyAsync(is_busy = true)
        {
           this.busy(is_busy);
        }

        is_busy()
        {
            return rcmail.busy;
        }

        changeColor(element)
        {
            if (this.is_busy())
                return;

            this.busy();
            let color;

            if (typeof element === "string")
            {
                if (!element.includes("#"))
                    element = "#" + element;

                color = element;
            }
            else if ("value" in element)
                color = element.value;
            else if ("val" in element)
                color = element.val();
            else
            {
                console.warn("[changeColor]/!\\ Impossible de déterminer le type de la variable \"element\".", element);
                color = element
            }

            return this.ajax(this.url("PARAM_Change_color"), {
                _color:color,
                _uid:this.uid
            },
            () => {
                $(".dwp-round").css("background-color", color);
                this.update_home();
            }
            ).always(() => {
                this.busy(false);
            });
        }

        async add_user()
        {
            if (this.is_busy())
                return;

            if (Workspace_Param.PopUp !== undefined)
                delete Workspace_Param.PopUp;

            const config = new GlobalModalConfig("Ajouter un utilisateur",
            "default",
            MEL_ELASTIC_UI.get_input_mail_search("tmp-id-wsp"),
            null,
            "default",
            "default",
                () => {
                    let tmp = new Workspace_Param(rcmail.env.current_workspace_uid);
                    tmp.save_users();
                }
            );

            if ($("#globalModal .modal-close-footer").length == 0)
                await GlobalModal.resetModal();

            Workspace_Param.PopUp = new GlobalModal("globalModal", config, true);
            Workspace_Param.PopUp.input = $("#tmp-id-wsp");
            rcmail.init_address_input_events($("#tmp-id-wsp"));
        }

        save_users()
        {
            this.busy();
            let users = [];
            let input = Workspace_Param.PopUp.input;

            if (input.val() !== "")
            {
                input.val(input.val() + ",");
                m_mp_autocoplete(input[0]);
            }
            $(".workspace-recipient").each((i,e) => {
                users.push($(e).find(".email").html());
            });

            Workspace_Param.PopUp.close();
            delete Workspace_Param.PopUp;

            return this.ajax(this.url("PARAMS_add_users"), {
                _users:users,
                _uid:this.uid,
            }, (datas) => {
                //console.log("datas", datas);
                if (datas === 'no one was found')
                {
                    this.busy(false);
                    rcmail.display_message('Les personnes ajoutées ne font pas partie de l\'annuaire... Elles ne sont donc pas ajouté à l\'espace.', 'warning');
                }
                else if (datas === "denied")
                {
                    this.busy(false);
                    rcmail.display_message('Accès interdit !', "error");
                }
                else {
                    try{
                        datas = JSON.parse(datas);
                        if (datas.length > 0)
                        {
                            this.busy(false);
                            for (let index = 0; index < datas.length; ++index) {
                                const element = datas[index];
                                rcmail.display_message(`Impossible d'ajouter ${element} !`, "warning");
                            }
                        }
                    }catch(e)
                    {}
                }

            }).always(() => {
                return this.update_user_table();
            });
        }

        join()
        {
            this.busy();
            return this.ajax(this.url("join_user"), {
                _uid:this.uid
            }).always(() => {
                window.location.reload();
            });
        }

        update_user_table(func = () => this.busy(false))
        {
            return this.ajax(this.url("PARAMS_update_user_table_rights"), {
                _uid:this.uid
            }, (datas) => {
                this.update_table(datas);
            }).always(() => {
                func();
                MEL_ELASTIC_UI.update();
            });
        }
        update_table(html, id="#wsp-user-rights")
        {
            //console.log("id", id);
            $(id).parent().html(html);
        }

        update_user_right(value)
        {
            this.busy();
            $(".btn-u-r").addClass("disabled").attr("disabled", "disabled");
            value = value.split(":");
            const user = value[1];
            value = value[0];

            return this.ajax(this.url("PARAMS_update_user_rights"), {
                _uid:this.uid,
                _id:user,
                _right:value
            },
            (datas) => {
                this.busy(false);
                $(".btn-u-r").removeClass("disabled").removeAttr("disabled");
                switch (datas) {
                    case "reload":
                        window.location.reload();
                        return;
                    case "error":
                        $(".btn-u-r").each((i,e) => {
                            if ($(e).data("onchange").includes(user))
                                MEL_ELASTIC_UI.setValue((value === "o" ? "w" : "o"), $(e));
                        });
                        return;
                    case "you are the alone":
                        $(".btn-u-r").each((i,e) => {
                            if ($(e).data("onchange").includes(user))
                                MEL_ELASTIC_UI.setValue((value === "o" ? "w" : "o"), $(e));
                        });
                        rcmail.clear_messages();
                        rcmail.display_message("Il doit y avoir au minimum un administrateur par espace !", "error");
                        return;
                    default:
                        break;
                }
            },
            (a,b,c) => {
                console.error("###[update_user_right]",a,b,c);
                $(".btn-u-r").each((i,e) => {

                    if ($(e).data("onchange").includes(user))
                        MEL_ELASTIC_UI.setValue((value === "o" ? "w" : "o"), $(e));
                });
                this.busy(false);
                $(".btn-u-r").removeClass("disabled").removeAttr("disabled");
            });
        }

        update_end_date(new_date)
        {
            if (new_date === undefined || new_date === null || new_date === "")
            {
                if (!confirm("Vous n'avez pas inscrit de nouvelle date, cela aura pour effet de supprimer la date de fin.\r\nSi c'est ce que vous voulez, appuyez sur \"Ok\"."))
                    return;
            }

            this.busy();
            return this.ajax(this.url("PARAMS_update_end_date"), {
                _uid:this.uid,
                _date:new_date,
            },
            (datas) => {
                this.busy(false);

                if (datas === "denied")
                    rcmail.display_message("Vous devez être un administrateur pour faire ça !", "error");
                else {
                    rcmail.display_message("Date de fin modifié avec succès !", "confirmation");

                    if (new_date === undefined || new_date === null || new_date === "")
                        $("#wsp-end-date").remove();
                    else
                    {
                        if (moment(new_date, "DD/MM/YYYY hh:mm") <= moment())
                            $("#wsp-end-date").html(`<i>Espace clôt !</i>`);
                        else
                            $("#wsp-end-date").html(`Date de fin : ${new_date}`);
                    }

                    //$("#wsp-param-chg-button-enddate").attr("disabled", "disabled").addClass("disabled");
                }

            }).always(() => {
                this.busy(false);
            });
        }

        update_primary_parameters(config = {
            type:"",
            input:$(),
            checks:"empty;already-exist",
            text_on_error:"Impossible de changer le paramètre.",
            text_on_succes:"Paramètre changer avec succès.",
            action:null
        })
        {
            const empty = '';
            const val = config.input.val();
            if (config.checks !== undefined && config.checks !== null && config.checks !== empty)
            {
                const checks = config.checks.split(";");
                for (let index = 0; index < checks.length; ++index) {
                    const element = checks[index];
                    switch (element) {
                        case 'empty':
                            if (val === empty)
                            {
                                rcmail.display_message('La valeur ne peut pas être vide.', 'error');
                                return this;
                            }
                            break;

                        case 'already-exist':
                            if (val === config.input.attr("placeholder"))
                            {
                                rcmail.display_message('La valeur ne peut pas être la même que la précédente.', 'error');
                                return this;
                            }
                    
                        default:
                            break;
                    }
                }
            }

            this.busy();
            return this.ajax(this.url("PARAMS_change_primary"), 
            {
                _uid:this.uid,
                _type:config.type,
                _val:val
            },
            (datas) => {
                this.busy(false);
                const denied = 'denied'
                if (datas === denied)
                {
                    rcmail.display_message('Vous n\'avez pas les droits pour effectuer cette action.', 'error');
                }
                else {
                    switch (config.type) {
                        case 'title':
                            $(".wsp-head .header-wsp").html(val);
                            config.input.attr("placeholder", val);
                            this.titleUpdated(empty);
                            break;
                    
                        default:
                            if (config.action !== null) 
                                config.action(datas, config, val, empty);
                            break;
                    }

                    this.update_home();

                    rcmail.display_message(config.text_on_succes, "confirmation");
                }
            }, 
            (xhr, ajaxOptions, error) => {
                this.busy(false);
                rcmail.display_message(config.text_on_error, "error");
                console.error("###[update_primary_parameters]", error, ajaxOptions, xhr);
            });
        }

        update_workspace_logo(new_logo)
        {
            if (new_logo === undefined || new_logo === null || new_logo === "")
                new_logo = "false";

                this.busy();
                return this.ajax(this.url("PARAMS_change_logo"), 
                {
                    _uid:this.uid,
                    _logo:new_logo
                },                    
                (datas) => {
                    if (datas === "denied")
                    {
                        this.busy(false);
                        rcmail.display_message("Vous devez être administrateur pour pouvoir changer de logo.", "error");
                    }
                    else {
                        if (new_logo === "false")
                        {
                            $("#worspace-avatar-b").html(`<span>${$(".wsp-head h1.header-wsp").html().slice(0,3)}</span>`);
                            $(".dwp-round.wsp-picture").html(`<span>${$(".wsp-head h1.header-wsp").html().slice(0,3)}</span>`);
                        }
                        else {
                            $("#worspace-avatar-b").html(`<img src="${new_logo}" />`);
                            $(".dwp-round.wsp-picture").html(`<img src="${new_logo}" />`);
                        }

                        $("#wsp-param-chg-button-plz").attr("disabled", 'disabled').addClass("disabled");

                        this.update_home();
                    }
                }).always(() => {
                    this.busy(false);
                });
        }

        delete_user(user)
        {
            this.busy();
            return this.ajax(this.url("PARAMS_delete_user"), {
                _uid:this.uid,
                _user_to_delete:user
            }, 
            (datas) => {
                switch (datas) {
                    case 'denied':
                        this.busy(false);
                        rcmail.display_message("Vous devez être administrateur pour pouvoir faire cette action !", "error");
                        break;
                    case 'you are the alone':
                        this.busy(false);
                        rcmail.display_message("Vous êtes le seul administrateur, nommez un autre administrateur ou supprimez l'espace.", "error");
                        break;
                
                    default:
                        return this.update_user_table();
                }
            });
            // ).always(() => {
            //     return this.update_user_table();
            // })
        }

        set_body_loading()
        {
            return $(".body").html($('<span style="margin-top:30px;width:200px;height:200px" class=spinner-border></span>')).css("display", "grid").css("justify-content", "center");
        }

        leave()
        {
            this.busy();
            if (confirm("Êtes vous-sûr de vouloir quitter cet espace de travail ?"))
            {
                return this.ajax(this.url("leave_workspace"),
                {
                    _uid:this.uid
                },
                (msg) => {
                    this.busy(false);
                    switch (msg) {
                        case "yourealone":
                            rcmail.display_message("Vous êtes la seule personne de cet espace, si vous souhaitez le quitter, supprimer le.", "error");
                            break;
                        case "youretheone":
                            rcmail.display_message("Vous êtes le seul administrateur, si vous souhaitez quittez, ajoutez un autre administrateur avant.", "error");
                        break;
                        default:
                            this.update_home();
                            this.quit();
                            break;
                    }
                },
                (a,b,c) => {
                    console.error(a,b,c);
                    this.busy(false);
                }
                );
            }
            else
                return this.busyAsync(false);
        }

        change_visibility()
        {
            this.busy();
            return this.ajax(this.url("PARAMS_change_visibility"), {
                _uid:this.uid
            }, (datas) => {
                this.busy(false);
                if (datas === "denied")
                    rcmail.display_message("Vous n'avez pas les droits pour changer la visibilité de cet espace !", "error");
                else
                {
                    rcmail.display_message("Visibilité changé avec succès !", "confirmation");
                    let querry = $("#param-visibility");
                    if (querry.html().includes("privé"))
                        querry.html("Passer en public");
                    else
                        querry.html("Passer en privé");
                }
            }, (a,b,c) => {
                this.busy(false);
                console.error(a,b,c);
                rcmail.display_message("Une erreur est survenue...", "error");
            }).always(() => this.busy(false));
        }

        update_app(app)
        {
            this.busy();
            return this.ajax(this.url("PARAMS_update_app"),
            {
                _uid:this.uid,
                _app:app
            }).always(() => {
                return this.update_app_table(() => {
                    this.change_icons();
                });
            }).always(async () => {
                if (true || app === "doc")
                    this.reload();
                else {
                    await this.ajax(this.url("PARAMS_update_services"), {
                        _uid:this.uid
                    },
                    (datas) => {
                        $(".wsp-services").html(datas);
                        WSPReady();
                    }
                    );
                    await this.update_toolbar().always(() => {
                        $(".wsp-services button").addClass("btn btn-secondary");
                        this.busy(false);
                    });
                }
            });
        }

        reload()
        {
            if (window !== top) window.location.href = `${window.location.href}&_is_from=iframe`;
            else
            {
                const url = mel_metapage.Functions.url("workspace", "workspace", {_uid:this.uid, _page:'params'});
                window.history.replaceState({}, document.title, url.replace(`${rcmail.env.mel_metapage_const.key}=${rcmail.env.mel_metapage_const.value}`, ""));
                rcmail.set_busy(false);
                rcmail.command('refreshFrame');
            }
        }

        update_toolbar()
        {
            return this.ajax(this.url("PARAMS_update_toolbar"), {
                _uid:this.uid
            }, (datas) => {
                //console.log("toolbar", datas, $("#wsp-toolbar"));
               $(".wsp-toolbar").html(datas);
               $(".wsp-home.active").removeClass("active");
               $(".wsp-toolbar-item").addClass("btn btn-secondary").removeAttr("disabled").removeAttr("aria-disabled");
               $(".wsp-item-params").addClass("active").attr("disabled", "disabled").attr("aria-disabled", true);
            });
        }

        update_app_table(func = () => this.busy(false))
        {
            return this.ajax(this.url("PARAMS_update_app_table"), {
                _uid:this.uid
            }, (datas) => {
                this.update_table(datas, "#table-apps");
            }).always(() => {
                func();
                //MEL_ELASTIC_UI.update();
            });
        }

        async update_home()
        {
            let $querry = parent.$('iframe.bureau-frame');

            if ($querry.length > 0)
                $querry[0].contentWindow.location.reload();
            else if (parent.$('.bureau-frame').length > 0)
            {
                await mel_metapage.Functions.get(
                    mel_metapage.Functions.url('bureau', 'get_html_workspaces'),
                    {},
                    (datas) => {
                        parent.$("#layout-content .--col-dwp .workspaces").html(datas);
                        parent.rcmail.triggerEvent("init");
                        parent.ariane = parent.ariane_reinit();
                    }
                )
            }

            return this;
        }

        delete()
        {
            this.busy();

            if (confirm("Êtes-vous sûr de vouloir supprimer cet espace de travail ?\r\nAttention, cette action sera irréversible !"))
            {
                return this.ajax(this.url("delete_workspace"), {
                    _uid:this.uid
                },
                (datas) => {
                    this.update_home();
                    this.quit();
                },
                (a,b,c) => {
                    this.busy(false);
                    console.error(a,b,c);
                    rcmail.display_message("Impossible de supprimer cet espace, regardez la console pour plus d'informations.", "error");
                }
                );
            }
            else
                return this.busyAsync(false);
        }

        compose()
        {
            parent.rcmail.open_compose_step({to:rcmail.env.current_workspace_email});
        }

        async create_webconf(needParameters = false)
        {
            if (!needParameters)
            {
                const conf = this.generate_webconf();
                const key = `${conf.letters}${rcmail.env.current_workspace_uid.replaceAll("-", "").toUpperCase()}${conf.numbers}`;
                await parent.webconf_helper.go(key, rcmail.env.current_workspace_uid, null);
                await parent.webconf_helper.notify(key, rcmail.env.current_workspace_uid);
            }
            else
                await parent.webconf_helper.go("", rcmail.env.current_workspace_uid, null);  
        }

        generate_webconf()
        {
            const letters = ["A","B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T",
                             "U", "V", "W", "X", "Y", "Z"];

            let datas = {
                "letters":"",
                numbers:""
            };

            for (let index = 0; index < 10; index++) {
                datas.letters += letters[this.getRandomInt(0, 26)];
                if (index <= 3)
                    datas.numbers += this.getRandomInt(0,10).toString(); 
            }

            return datas;
        }

        toggle_nav_color()
        {
            this.busy();
            return this.ajax(this.url("toggle_nav_color"), {
                _uid:this.uid
            }).always(() => {
                this.busy(false);
                parent.rcmail.command('refreshFrame');
            });
        }

        getRandomInt(min, max) {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
        }

        change_canal()
        {
            if (this.is_busy())
                return Promise.resolve();
            else
                this.busy(true);

            let globalModal;
            if ($("#globalModal .modal-close-footer").length == 0)
                globalModal = GlobalModal.resetModal();
            else
                globalModal = Promise.resolve();

            return this.ajax(this.url("PARAMS_get_arianes_rooms"),
            {_uid:this.uid},
            (datas) => {
                globalModal.then(() => {

                if (Workspace_Param.PopUp !== undefined)
                    delete Workspace_Param.PopUp;

                const config = new GlobalModalConfig("Changer de canal",
                "default",
                datas,
                null,
                "default",
                "default",
                    () => {
                        let val = $("#selectnewchannel select").val();

                        const confirmation = confirm(rcmail.gettext("canal_change_confirmation", "mel_workspace"));

                        if (confirmation && val.includes(":"))
                        {
                            val = val.split(":")[1];

                            if (val === rcmail.env.current_workspace_channel.name)
                            {
                                let querry = $("#selectnewchannel");
                                querry.find("#addederrorsn").remove();
                                querry.append(`<div id="addederrorsn" style="color:red;">*Vous devez choisir un canal différent !</div>`) 
                                return;
                            }
                            
                            this.busy(true);
                            this.ajax(this.url("PARAMS_change_ariane_room"), {
                                _name:val,
                                _uid:this.uid
                            }, (datas) => {
                                window.location.reload();
                            },
                                (a,b,c) => {
                                    console.error("###[change_canal]une erreur est survenue ! ", a, b, c);
                                    this.busy(false);
                                    rcmail.display_message("impossible de mettre à jour le canal !", "error");
                                }).always(() => {
                                this.busy(false);
                                Workspace_Param.PopUp.close();
                            });
                        }
                        else if (confirmation)
                        {
                            if (!val.includes(":"))
                            {
                                let querry = $("#selectnewchannel");
                                querry.find("#addederrorsn").remove();
                                querry.append(`<div id="addederrorsn" style="color:red;">*Vous devez choisir un canal !</div>`)
                            }
                        }
                    }
                );
    
                Workspace_Param.PopUp = new GlobalModal("globalModal", config, false);

                let querry = $("#selectnewchannel select");
                querry.find(`option[value="home"]`).remove();
                querry = querry.find("option")

                for (let index = 0; index < querry.length; ++index) {
                    const element = querry[index];

                    try {
                        if ($(element).attr("value").split(":")[1] === rcmail.env.current_workspace_channel.name)
                        {
                            $(element).attr("selected", "selected");
                            break;
                        }
                    } catch (error) {
                        console.warn(error);
                        continue;
                    }
                }

                Workspace_Param.PopUp.footer.buttons.save.addClass("mel-button btn-secondary").removeClass("btn-primary").html(
                    rcmail.gettext("save") + 
                    '<span class="plus icon-mel-plus"></span>'
                );

                Workspace_Param.PopUp.footer.buttons.exit.addClass("mel-button btn-danger").removeClass("btn-secondary").html(
                    rcmail.gettext("close") + 
                    '<span class="plus icon-mel-close"></span>'
                );
                //console.log("popup", Workspace_Param.PopUp);
               

                this.busy(false);
                Workspace_Param.PopUp.show();
                });
            },
            (a,b,c) => {},
            "GET");
        }     
        
        change_wekan()
        {
            if (this.is_busy())
                return Promise.resolve();
            else
                this.busy(true);

            let globalModal;
            if ($("#globalModal .modal-close-footer").length == 0)
                globalModal = GlobalModal.resetModal();
            else
                globalModal = Promise.resolve();

            return this.ajax(this.url("get_wekan_admin_boards"),
            {_wsp:this.uid},
            (datas) => {
                globalModal.then(() => {

                if (Workspace_Param.PopUp !== undefined)
                    delete Workspace_Param.PopUp;

                const config = new GlobalModalConfig("Changer de tableau",
                "default",
                datas,
                null,
                "default",
                "default",
                    () => {
                        let val = $("#select-update-wekan").val();

                        const confirmation = confirm(`Attention !\r\nCe tableau sera synchroniser avec votre espace.\r\nCelui-ci ne sera pas supprimer si l'espace est supprimé.\r\nÊtes-vous sûr de vouloir continuer ?`);

                        if (confirmation)
                        {
                            if (val === rcmail.env.wekan_datas.id)
                            {
                                let querry = $("#select-update-wekan").parent();
                                querry.find("#addederrorsn").remove();
                                querry.append(`<div id="addederrorsn" style="color:red;">*Vous devez choisir un canal différent !</div>`) 
                                return;
                            }
                            
                            this.busy(true);
                            this.ajax(this.url("update_wekan_board"), {
                                _id:val,
                                _wsp:this.uid
                            }, (datas) => {
                                window.location.reload();
                            },
                                (a,b,c) => {
                                    console.error("###[change_canal]une erreur est survenue ! ", a, b, c);
                                    this.busy(false);
                                    rcmail.display_message("impossible de mettre à jour le tableau !", "error");
                                }).always(() => {
                                this.busy(false);
                                Workspace_Param.PopUp.close();
                            });
                        }
                        // else if (confirmation)
                        // {
                        //     if (!val.includes(":"))
                        //     {
                        //         let querry = $("#selectnewchannel");
                        //         querry.find("#addederrorsn").remove();
                        //         querry.append(`<div id="addederrorsn" style="color:red;">*Vous devez choisir un canal !</div>`)
                        //     }
                        // }
                    }
                );
    
                Workspace_Param.PopUp = new GlobalModal("globalModal", config, false);

                // let querry = $("#selectnewchannel select");
                // querry.find(`option[value="home"]`).remove();
                // querry = querry.find("option")

                // for (let index = 0; index < querry.length; ++index) {
                //     const element = querry[index];

                //     try {
                //         if ($(element).attr("value").split(":")[1] === rcmail.env.current_workspace_channel.name)
                //         {
                //             $(element).attr("selected", "selected");
                //             break;
                //         }
                //     } catch (error) {
                //         console.warn(error);
                //         continue;
                //     }
                // }

                Workspace_Param.PopUp.footer.buttons.save.addClass("mel-button btn-secondary").removeClass("btn-primary").html(
                    rcmail.gettext("save") + 
                    '<span class="plus icon-mel-plus"></span>'
                );

                Workspace_Param.PopUp.footer.buttons.exit.addClass("mel-button btn-danger").removeClass("btn-secondary").html(
                    rcmail.gettext("close") + 
                    '<span class="plus icon-mel-close"></span>'
                );
                //console.log("popup", Workspace_Param.PopUp);
               

                this.busy(false);
                Workspace_Param.PopUp.show();
                });
            },
            (a,b,c) => {},
            "GET");
        }    

        archive(archive = true)
        {
            this.busy();
            let bool;
            if (archive)
                bool = confirm("Êtes-vous sûr de vouloir archiver cet espace de travail ?");
            else
                bool = confirm("Êtes-vous sûr de vouloir désarchiver cet espace de travail ?");

            if (bool)
            {
                return this.ajax(this.url("archive_workspace"), {
                    _uid:this.uid
                },
                (datas) => {
                    if (archive)
                        this.quit();
                    else
                        window.location.reload();
                },
                (a,b,c) => {
                    this.busy(false);
                    console.error(a,b,c);
                    rcmail.display_message("Impossible d'archiver cet espace, regardez la console pour plus d'informations.", "error");
                }
                );
            }
            else
                return this.busyAsync(false);
        }

        quit()
        {
            this.busy();
            this.set_body_loading();
            window.location.href = rcmail.env.current_workspace_back === undefined || rcmail.env.current_workspace_back === null ? this.url() : rcmail.env.current_workspace_back;
        }

        endDateChanged()
        {
            //$("#wsp-param-chg-button-enddate").removeAttr("disabled").removeClass("disabled");
            return this.updateButtonState($("#wsp-param-chg-button-enddate"));
        }

        updateButtonState(jquery, enable = true)
        {
            if (enable && jquery.hasClass("disabled"))
            {
                jquery.removeAttr("disabled").removeClass("disabled");
            }
            else if (!enable && !jquery.hasClass("disabled"))
            {
                jquery.attr("disabled", 'disabled').addClass("disabled");
            }

            return this;
        }

        paramUpdated($button, newVal = null, authorizeEmpty = false)
        {
            let $jquery = $button;
            let $input = $jquery.parent().parent().find("input");

            if ($input.length === 0)
                $input = $jquery.parent().parent().find("textarea");

            if (newVal !== null)
                $input.val(newVal);

            const val = $input.val();
            const empty = '';
            if ((val !== empty || authorizeEmpty) && val !== $input.attr("placeholder"))
                return this.updateButtonState($jquery);
            else
                return this.updateButtonState($jquery, false);
        }

        titleUpdated(newVal = null)
        {
            return this.paramUpdated($("#wsp-param-btn-title"), newVal);
        }

    }
    Object.defineProperty(Workspace_Param, 'data_null', {
        enumerable: false,
        configurable: false,
        writable: false,
        value: Symbol("null")
      });
      
    $(document).ready(() => {
        rcmail.addEventListener("init", () => {
            rcmail.env.WSP_Param = new Workspace_Param(rcmail.env.current_workspace_uid);
            rcmail.register_command('workspace.changeColor', (x) => rcmail.env.WSP_Param.changeColor(x), true);
            rcmail.register_command('workspace.add_users', () => rcmail.env.WSP_Param.add_user(), true);
            rcmail.register_command('workspace.update_user', (x) => rcmail.env.WSP_Param.update_user_right(x), true);
            rcmail.register_command('workspace.remove_user', (x) => rcmail.env.WSP_Param.delete_user(x), true);
            rcmail.register_command('workspace.leave', () => rcmail.env.WSP_Param.leave(), true);
            rcmail.register_command('workspace.delete', () => rcmail.env.WSP_Param.delete(), true);
            rcmail.register_command('workspace.join', () => rcmail.env.WSP_Param.join(), true);
            rcmail.register_command('workspace.go', () => {
                rcmail.env.WSP_Param.quit();
            } ,true);
            rcmail.register_command('workspace.archive', () => rcmail.env.WSP_Param.archive(), true);
            rcmail.register_command('workspace.update_app', (e) => rcmail.env.WSP_Param.update_app(e), true);
            rcmail.register_command('workspace.unarchive', () => rcmail.env.WSP_Param.archive(false), true);
            rcmail.register_command("workspace.changeLogo", (x) => rcmail.env.WSP_Param.update_workspace_logo(x), true);
            rcmail.register_command('workspace.change_visibility', () => rcmail.env.WSP_Param.change_visibility(), true);
            rcmail.register_command('workspace.compose', () => rcmail.env.WSP_Param.compose(), true);
            rcmail.register_command('workspace.webconf', () => rcmail.env.WSP_Param.create_webconf(), true);
            rcmail.register_command('workspace.webconf.needParams', () => rcmail.env.WSP_Param.create_webconf(true), true);
            rcmail.register_command('workspace.update_end_date', (jquery) => rcmail.env.WSP_Param.update_end_date(jquery.val()), true);
            rcmail.register_command('workspace.toggle_bar_color', () => {rcmail.env.WSP_Param.toggle_nav_color()}, true);
            rcmail.register_command('workspace.update_primary_parameter', (config) => {rcmail.env.WSP_Param.update_primary_parameters(config)}, true);
            rcmail.register_command('workspace.update_title', () => 
            {
                if (!confirm(rcmail.gettext('change_title_confirmation', 'mel_workspace'))) return;
                rcmail.env.WSP_Param.update_primary_parameters({
                    type:"title",
                    input:$("#spaceTitle"),
                    checks:"empty;already-exist",
                    text_on_error:'Une erreur est survenue.\r\nImpossible de changer le titre de l\'espace.',
                    text_on_succes:'Le titre a été changer avec succès.'
                })
            }, true);
            rcmail.register_command('workspace.update_desc', (isDelete = false) => {
                let $input = $("#spaceDesc");
                if (isDelete)
                    $input.val('');

                rcmail.env.WSP_Param.update_primary_parameters({
                type:"desc",
                input:$input,
                checks:"already-exist",
                text_on_error:'Une erreur est survenue.\r\nImpossible de changer la description de l\'espace.',
                text_on_succes:'la description a été changer avec succès.',
                action:(data, config, newValue, empty) => {
                    $("#wsp-desc-desc").html(newValue);
                    config.input.attr("placeholder", (newValue === empty ? "Nouvelle description...." : newValue));
                    rcmail.env.WSP_Param.paramUpdated($('#wsp-param-btn-desc'), empty);
                }
            })}, true);
            rcmail.register_command('workspace.update_hashtag', (isDelete = false) => {
                let $input = $("#spaceHashtag");

                if ($input.val().includes('#')) $input.val($input.val().replaceAll("#", ''));

                if (isDelete)
                    $input.val('');

                $("#list-of-all-hashtag-param").css("display", "none");
                    
                rcmail.env.WSP_Param.update_primary_parameters({
                type:"hashtag",
                input:$input,
                checks:"already-exist",
                text_on_error:'Une erreur est survenue.\r\nImpossible de changer la thématique de l\'espace.',
                text_on_succes:'la thématique a été changer avec succès.',
                action:(data, config, newValue, empty) => {
                    
                    let $querry = $(".wsp-head .col-10");
                    let $span = $querry.children()[0];

                    if ($span.nodeName === "SPAN")
                        $span = $($span);
                    else
                        $span = false;

                    const hashtag = newValue.includes('#') || newValue === empty ? newValue : `#${newValue}`;

                    if (hashtag !== empty)
                    {
                        if ($span !== false) $span.html(hashtag);
                        else {
                            $span = null;
                            $querry.prepend(`<span>${hashtag}</span>`);
                        }
                    }
                    else if ($span !== false) $span.remove();

                    config.input.attr("placeholder", (newValue === empty ? "Nouvelle thématique...." : newValue));
                    rcmail.env.WSP_Param.paramUpdated($('#wsp-param-btn-hashtag'), empty);
                }
            });}, true);

            rcmail.addEventListener("onHashtagChange", (selector) => {
                if (selector.input === "#spaceHashtag")
                {
                    rcmail.env.WSP_Param.paramUpdated($('#wsp-param-btn-hashtag'));
                }
            });

        }); //init end
    })

})();