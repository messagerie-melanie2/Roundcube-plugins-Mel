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

         $("#wsp-search-input").on("input", (element) => {
            const val = element.target.value.toUpperCase();
            if (val === "")
            {
                $(".epingle").css("display", "");
                $(".workspace").css("display", "");
            }
            else {
                $(".epingle").css("display", "none");
                $(".workspace").css("display", "");
                $(".workspace").each((i,e) => {
                    e = $(e);
                    if (e.find(".wsp-title").length === 0 || !e.find(".wsp-title").html().toUpperCase().includes(val))
                    {
                        e.css("display", "none");
                    }
                });
            }
         });

     })


})();

function wsp_epingle(id)
{
    console.log("id", id);
    if (id.includes("wsp-"))
        id = id.replace("wsp-", "").replace("-epingle", "");
    $.ajax({ // fonction permettant de faire de l'ajax
    type: "POST", // methode de transmission des données au fichier php
    url: "/?_task=workspace&_action=epingle",
    data:{
        _uid:id
    },
    success: function (data) {
        data = JSON.parse(data);
        console.log("epingle ok", data);
    },
    error: function (xhr, ajaxOptions, thrownError) { // Add these parameters to display the required response
        console.error(xhr, ajaxOptions, thrownError);
    },
    });  
}