(() => 
{
    class Workspace_Param
    {
        constructor(workspace_id)
        {
            this.uid = workspace_id;
        }

        url(action)
        {
            return MEL_ELASTIC_UI.url("workspace", action);
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
            console.log("auto", users);
            return this.ajax(this.url("PARAMS_add_users"), {
                _users:users,
                _uid:this.uid
            }).always(() => {
                return this.ajax(this.url("PARAMS_update_user_table_rights"), {
                    _uid:this.uid
                }, this.update_table).always(() => {
                    this.busy(false);
                    MEL_ELASTIC_UI.update();
                });
            });
        }
        update_table(html)
        {
            $("#wsp-user-rights").parent().html(html);
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



    }

    Workspace_Param.data_null = Symbol("null");
    $(document).ready(() => {
        rcmail.addEventListener("init", () => {
            rcmail.env.WSP_Param = new Workspace_Param(rcmail.env.current_workspace_uid);
            rcmail.register_command('workspace.changeColor', (x) => rcmail.env.WSP_Param.changeColor(x), true);
            rcmail.register_command('workspace.add_users', () => rcmail.env.WSP_Param.add_user(), true);
            rcmail.register_command('workspace.update_user', (x) => rcmail.env.WSP_Param.update_user_right(x), true);
        })
    })

})();