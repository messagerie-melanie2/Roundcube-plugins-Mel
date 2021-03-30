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

        changeColor(element)
        {
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



    }

    Workspace_Param.data_null = Symbol("null");
    $(document).ready(() => {
        rcmail.addEventListener("init", () => {
            rcmail.env.WSP_Param = new Workspace_Param(rcmail.env.current_workspace_uid);
            rcmail.register_command('workspace.changeColor', (x) => rcmail.env.WSP_Param.changeColor(x), true);
        })
    })

})();