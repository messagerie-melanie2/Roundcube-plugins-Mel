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

         $(".workspace").each((i,e) => {
            const id = e.id.replace("wsp-", "");
            getUnread("apitech-1");
         });

     })

})();