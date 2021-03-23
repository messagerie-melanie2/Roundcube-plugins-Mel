// workspaces.sync.PostToParent({
//     child:false,
//     exec:"window.tmp_wsp_epingle = '' + window.wsp_epingle;window.wsp_epingle = undefined;"
// });


function wsp_epingle(id)
{
    event.preventDefault();
    if (rcmail.busy)
        return async () => {};
    rcmail.set_busy(true, "loading");
    const initialId = id.replace("-epingle", "");
    workspaces.sync.PostToParent({
        exec:"workspace_disable_epingle(`" + initialId + "`)"
    });
    workspace_disable_epingle(initialId);
    //$("#tak-" + initialId).addClass("disabled");
    $("#tak-" + initialId + "-epingle").addClass("disabled");
    if (id.includes("wsp-"))
        id = id.replace("wsp-", "").replace("-epingle", "");
    return $.ajax({ // fonction permettant de faire de l'ajax
    type: "POST", // methode de transmission des données au fichier php
    url: "/?_task=workspace&_action=epingle",
    data:{
        _uid:id
    },
    success: function (data) {
        data = JSON.parse(data);
        workspace_load_epingle(data, initialId);
        // if (data.success)
        // {
        //     if (data.is_epingle)
        //     {
        //         if ($(".wsp-epingle").find("#" + initialId + "-epingle").length === 0)
        //         {
        //             $("#tak-" + initialId).addClass("active");
        //             $(".wsp-epingle").append($("#" + initialId)[0].outerHTML);
        //             $(".wsp-epingle").find("#" + initialId)[0].id = initialId + "-epingle";
        //             $("#" + initialId + "-epingle").find("#wsp-notifs-" + initialId)[0].id = "wsp-notifs-" + initialId + "-epingle";
        //             $("#" + initialId + "-epingle").find("#tak-" + initialId)[0].id = "tak-" + initialId + "-epingle";
        //             $("#tak-" + initialId + "-epingle").removeClass("disabled");
        //         }
        //     }
        //     else {
        //         if ($(".wsp-epingle").find("#" + initialId + "-epingle").length !== 0)
        //         {
        //             $("#" + initialId + "-epingle").remove();
        //             $("#tak-" + initialId).removeClass("active").removeClass("disabled");
        //         }
        //     }
        // }
        $("#tak-" + initialId).removeClass("disabled");
        $("#tak-" + initialId + "-epingle").removeClass("disabled");
        EpingleEmpty();

        workspaces.sync.PostToParent({
            datas:data,
            id:initialId,
            exec:"(" + function exec(is_epingle, id) {
                if (is_epingle)
                    $("#tak-" + id).addClass("active");
                else 
                    $("#tak-" + id).removeClass("active");
            } + ")("+data.is_epingle+", `"+initialId+"`)"
        });
    },
    error: function (xhr, ajaxOptions, thrownError) { // Add these parameters to display the required response
        console.error(xhr, ajaxOptions, thrownError);
    },
    }).always(() => {
        rcmail.set_busy(false);
        rcmail.clear_messages();
        workspaces.sync.PostToParent({
            exec:"workspace_enable_epingle(`" + initialId + "`)"
        });
        workspace_enable_epingle(initialId);
     });  
}