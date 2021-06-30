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
    url: mel_metapage.Functions.url("workspace", "epingle"),//"/?_task=workspace&_action=epingle",
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
        let querry = $("#tak-" + initialId);
        querry.removeClass("disabled");

        if (querry.hasClass("active"))
            querry.attr("title", querry.attr("title").replace("Épingler", "Désépingler"));
        else
            querry.attr("title", querry.attr("title").replace("Désépingler", "Épingler"));

        $("#tak-" + initialId + "-epingle").removeClass("disabled").attr("title", querry.attr("title"));

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

$(document).ready(() => {
    //console.log("ready", rcmail.env.action, rcmail.env.action === "action");
    if (rcmail.env.action === "action")
        rcmail.register_command("workspaces.page", (page) => {
            rcmail.set_busy(true, "loading");
            //console.log("here");
            window.location.href = MEL_ELASTIC_UI.url("workspace", "action", {"_event":"list_public", "_page":page});
        }, true);
        //<workspace-uid/>
    rcmail.register_command("workspaces.go", (uid) => {
        rcmail.set_busy(true, 'loading');
        let config = {
            _uid:uid
        };
        if (rcmail.env.action === "action")
            config["_last_location"] = encodeURIComponent(window.location.href);

        if (window.location.href.includes(rcmail.env.mel_metapage_const.value))
            config[rcmail.env.mel_metapage_const.key] = rcmail.env.mel_metapage_const.value;

        //console.log("config", config, MEL_ELASTIC_UI.url('workspace','workspace', config));
        window.location.href= MEL_ELASTIC_UI.url('workspace','workspace', config);// + '&_uid=' + uid + (parent !== window ? '&_from=iframe' : '');
    }, true);
    new Mel_Update(mel_metapage.EventListeners.tasks_updated.after, "wsp-tasks-all-number", update_tasks);
});

function load_archives(e)
{
    rcmail.set_busy(true, "loading");
    let config = { // fonction permettant de faire de l'ajax
        type: "GET", // methode de transmission des données au fichier php
        url: MEL_ELASTIC_UI.url("workspace", "archived"),//rcmail.env.ev_calendar_url+'&start='+dateNow(new Date())+'&end='+dateNow(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()+1)), // url du fichier php
        success: (html) => {
            $(".wsp-archive-items").html(html);
        },
        error: () => {}
    };

    return $.ajax(config).always(() => {
        rcmail.set_busy(false);
        rcmail.clear_messages();
    });
}

function update_tasks()
{
    //console.log("here", "update_tasks()");
    $(".workspace").each((i,e) => {
        const id = e.id.replace("wsp-", "").replace("-epingle", "");
        const datas = mel_metapage.Storage.get(mel_metapage.Storage.other_tasks)[id];
        const count = mel_metapage.Storage.get(mel_metapage.Storage.other_tasks_count)[id];
        //console.log("update_tasks()", id, datas, count);
        if (datas !== undefined && count !== undefined)
            $(e).find(".wsp-tasks-all").html('<span style="font-size:large">'+(count-datas.length)+'</span> tâches réalisées sur '+count+'</div>');
    });
}