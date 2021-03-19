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
        $(".dwp-user").each((i,e) => {
            var image = $(e).find("img")[0];
            image.onerror = function(){
                $(e).html("<span>" + $(e).data("user").slice(0,2) + "</span>");
            };
         });

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