(() => {
     rcmail.addEventListener("init", () => {
        WSPNotification.agenda().update();
        //WSPNotification.tasks().update();
        $(".dwp-user").each((i,e) => {
            var image = $(e).find("img")[0];
            if (image !== undefined && image !== null)
            {
                image.onerror = function(){
                    $(e).html("<span>" + $(e).data("user").slice(0,2) + "</span>");
                };
            }
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

     });



})();

function EpingleEmpty()
{
    if ($(".epingle").find(".workspace").length === 0)
    {
        if ($("#wsp-not-epingle-0").length === 0)
            $(".wsp-others").append("<p id=wsp-not-epingle-0>Pas d'espace de travail épinglé</p>");
        else
            $("#wsp-not-epingle-0").css("display", "");
    }
    else {
        $("#wsp-not-epingle-0").css("display", "none");
    }

}