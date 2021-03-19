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
         EpingleEmpty();
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

function EpingleEmpty()
{
    if ($(".epingle").find(".workspace").length === 0)
    {
        if ($("#wsp-not-epingle-0").length === 0)
            $(".wsp-others").append("<span id=wsp-not-epingle-0>Pas d'espace de travail épinglé</span>");
        else
            $("#wsp-not-epingle-0").css("display", "");
    }
    else {
        $("#wsp-not-epingle-0").css("display", "none");
    }

}