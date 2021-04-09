(() => {
    function getUnread(channel)
    {
        $.ajax({ // fonction permettant de faire de l'ajax
        type: "POST", // methode de transmission des données au fichier php
        url: "/?_task=discussion&_action=get_channel_unread_count",
        data:{
            _channel:channel
        },
        success: function (data) {
            data = JSON.parse(data);
            data.content = JSON.parse(data.content);
            // if (data.content.success)
            //     $("#wsp-notifs");
            console.log("yeay", data);
        },
        error: function (xhr, ajaxOptions, thrownError) { // Add these parameters to display the required response
            console.error(xhr, ajaxOptions, thrownError);
        },
        });
    }

     rcmail.addEventListener("init", () => {
try {
    WSPNotification.tasks().update();
} catch (error) {
    console.error("###[WSPNotification.tasks().update()]", error);
}
try {
    WSPNotification.agenda().update();
} catch (error) {
    console.error("###[WSPNotification.agenda().update()]", error);
}
        $(".dwp-user").each((i,e) => {
            var image = $(e).find("img")[0];
            if (image === null || image === undefined)
                return;
            image.onerror = function(){
                $(e).html("<span>" + $(e).data("user").slice(0,2) + "</span>");
            };
         });

         rcmail.register_command("portal.go.workspace", async (uid) => {
            if ($(".workspace-frame").length === 0)
                await mel_metapage.Functions.change_frame("wsp", false, true);
            rcmail.set_busy(true, 'loading');
            let config = {
                _uid:uid.replace("wsp-", "")
            };
            if ($("iframe.workspace-frame").length > 0)
                config["_from"] = "iframe";
             mel_metapage.Storage.set(mel_metapage.Storage.wait_frame_loading, mel_metapage.Storage.wait_frame_waiting);
            $(".workspace-frame")[0].src = MEL_ELASTIC_UI.url('workspace','workspace', config);
            await wait(() => mel_metapage.Storage.get(mel_metapage.Storage.wait_frame_loading) !== mel_metapage.Storage.wait_frame_loaded);
            rcmail.set_busy(false);
            rcmail.clear_messages();
            await mel_metapage.Functions.change_frame("wsp", true, true);
            rcmail.set_busy(false);
            rcmail.clear_messages();
         }, true);

        //  $(".workspace").each((i,e) => {
        //     const id = e.id.replace("wsp-", "");
        //     getUnread("apitech-1");
        //  });

     })

})();

function desk_epingle(id)
{
    if (rcmail.busy)
        return;
    workspace_epingle(id, (initialId) => {       
        workspaces.sync.PostToParent({
            exec:"workspace_disable_epingle(`" + initialId + "`)"
        });
    },(data, initialId) => {
        if (data.success)
        {
            if (data.is_epingle)
                $("#tak-" + initialId).addClass("active");
            else
                $("#tak-" + initialId).removeClass("active");

            workspaces.sync.PostToParent({
                exec:"workspace_load_epingle(`" + JSON.stringify(data) + "`, `" + initialId + "`)"
            });
        }
    }, null, (initialId) => {
        $("#tak-" + initialId).removeClass("disabled");
        $("#tak-" + initialId + "-epingle").removeClass("disabled");
        workspaces.sync.PostToParent({
            exec:"workspace_enable_epingle(`" + initialId + "`)"
        });
    });

}