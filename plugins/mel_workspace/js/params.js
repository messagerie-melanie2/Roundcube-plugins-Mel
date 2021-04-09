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
        }

        change_icons()
        {
            $(".wsp-change-icon").each((i,e) => {
                //e = $(e);
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
                return MEL_ELASTIC_UI.url("workspace", "", (window.location.href.includes("iframe") ? {"_from":"iframe"} : null));
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
                success: success,
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
                rcmail.set_busy(false);
                rcmail.clear_messages();
            }
        }
        is_busy()
        {
            return rcmail.is_busy;
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
            }
            ).always(() => {
                this.busy(false);
            });
        }

        add_user()
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
            Workspace_Param.PopUp = new GlobalModal("globalModal", config, true);
            Workspace_Param.PopUp.input = $("#tmp-id-wsp");
            rcmail.init_address_input_events($("#tmp-id-wsp"));
        }

        save_users()
        {
            this.busy();
            let users = [];
            let input = Workspace_Param.PopUp.input;
            //console.log("auto", input.val(), input);
            if (input.val() !== "")
            {
                input.val(input.val() + ",");
                m_mp_autocoplete(input[0]);
            }
            $(".workspace-recipient").each((i,e) => {
                users.push($(e).find(".email").html());
                //console.log("auto -rec",e, $(e), $(e).find(".email"), $(e).find(".email").html());
            });
            Workspace_Param.PopUp.close();
            delete Workspace_Param.PopUp;
            //console.log("auto", users);
            return this.ajax(this.url("PARAMS_add_users"), {
                _users:users,
                _uid:this.uid
            }).always(() => {
                return this.update_user_table();
            });
        }

        join()
        {
            this.busy();
            return this.ajax(this.url("join_user"), {
                _uid:this.uid
            }).alway(() => {
                wondow.location.reload();
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
            console.log("id", id);
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
                    default:
                        break;
                }
                this.busy(false);
                $(".btn-u-r").removeClass("disabled").removeAttr("disabled");
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

        delete_user(user)
        {
            this.busy();
            return this.ajax(this.url("PARAMS_delete_user"), {
                _uid:this.uid,
                _user_to_delete:user
            }).always(() => {
                return this.update_user_table();
            })
        }

        set_body_loading()
        {
            return $(".body").html($('<span style="margin-top:30px;width:200px;height:200px" class=spinner-border></span>')).css("display", "grid").css("justify-content", "center");
        }

        leave()
        {
            this.busy();
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
                await this.ajax(this.url("PARAMS_update_services"), {
                    _uid:this.uid
                },
                (datas) => {
                    $(".wsp-services").html(datas);
                    WSPReady();
                }
                );
                await this.update_toolbar().always(() => {
                    this.busy(false);
                });
            });
        }

        update_toolbar()
        {
            return this.ajax(this.url("PARAMS_update_toolbar"), {
                _uid:this.uid
            }, (datas) => {
                console.log("toolbar", datas, $("#wsp-toolbar"));
               $(".wsp-toolbar").html(datas);
               $(".wsp-home.active").removeClass("active");
               $(".wsp-item-params").addClass("active");
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

        delete()
        {
            this.busy();
            return this.ajax(this.url("delete_workspace"), {
                _uid:this.uid
            },
            (datas) => {
                this.quit();
            },
            (a,b,c) => {
                this.busy(false);
                console.error(a,b,c);
                rcmail.display_message("Impossible de supprimer cet espace, regardez la console pour plus d'informations.", "error");
            }
            );
        }

        quit()
        {
            this.busy();
            this.set_body_loading();
            window.location.href = rcmail.env.current_workspace_back === undefined || rcmail.env.current_workspace_back === null ? this.url() : rcmail.env.current_workspace_back;s
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
            rcmail.register_command('workspace.update_app', (app) => rcmail.env.WSP_Param.update_app(app), true);
        })
    })

})();