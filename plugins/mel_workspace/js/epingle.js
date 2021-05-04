function workspace_epingle(id, start = null,success = null, error = null, always = null)
{
    if (rcmail.busy)
        return async () => {};
    rcmail.set_busy(true, "loading");
    const initialId = id.replace("-epingle", "");
    if (start !== null)
        start(initialId);
    $("#tak-" + initialId).addClass("disabled");
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
        if (success !== null)
            success(data, initialId);
    },
    error: function (xhr, ajaxOptions, thrownError) { // Add these parameters to display the required response
        console.error(xhr, ajaxOptions, thrownError);
        if (error !== null)
        error(data, initialId);
    },
    }).always(() => {
        if (always !== null)
            always(initialId);
        rcmail.set_busy(false);
        rcmail.clear_messages();
     });  
}

function workspace_load_epingle(data, initialId)
{
    if (typeof data === "string")
        data = JSON.parse(data);
    //console.log("datas", data, initialId);
    if (data.success)
    {
        if (data.is_epingle)
        {
            if ($(".wsp-epingle").find("#" + initialId + "-epingle").length === 0)
            {
                $("#tak-" + initialId).addClass("active");
                $(".wsp-epingle").append($("#" + initialId)[0].outerHTML);
                $(".wsp-epingle").find("#" + initialId)[0].id = initialId + "-epingle";
                $("#" + initialId + "-epingle").find("#wsp-notifs-" + initialId)[0].id = "wsp-notifs-" + initialId + "-epingle";
                $("#" + initialId + "-epingle").find("#tak-" + initialId)[0].id = "tak-" + initialId + "-epingle";
                $("#tak-" + initialId + "-epingle").removeClass("disabled");
            }
        }
        else {
            if ($(".wsp-epingle").find("#" + initialId + "-epingle").length !== 0)
            {
                $("#" + initialId + "-epingle").remove();
                $("#tak-" + initialId).removeClass("active").removeClass("disabled");
            }
        }
    }
}

function workspace_disable_epingle(id)
{
    $(".tak").addClass("unactive");
    $("#tak-" + id).addClass("disabled");
}

function workspace_enable_epingle(id)
{
    $(".tak").removeClass("unactive");
    $("#tak-" + id).removeClass("disabled");
}