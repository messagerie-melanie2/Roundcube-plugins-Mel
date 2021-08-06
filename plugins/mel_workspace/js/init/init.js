(() => {
     rcmail.addEventListener("init", () => {
        WSPNotification.agenda().update();

        if (rcmail.env.task === "workspace" && (rcmail.env.action === "" || rcmail.env.action === "index"))
        {
            try {
                if (rcmail.env.wsp_index === undefined)
                    rcmail.env.wsp_index = {};
                rcmail.env.wsp_index["wsp_doc"] = WSPNotification.documents();
                rcmail.env.wsp_index.wsp_doc.update();
            } catch (error) {
                console.error("###[WSPNotification.documents().update(true)]", error);
            }

            WSPNotification.mails().update();
        }

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

$(document).ready(() => {
    $('.wsp-focusable-link').each((i,e) => {
        $(e).on("keydown", (event) => {
            if (event.type === "keydown")
            {
                if (event.originalEvent.code === "Enter" || event.originalEvent.code === "Space")
                {
                    $(`#${$(e).data("id")}`).find(".btn_btn-secondary_no-style_mel-focus").click();
                }
            }
        }).on("focus", () => {
           $(`#${$(e).data("id")}`).css("box-shadow","0 0 0 .2rem #484D7A69");
        })
        .on("blur", () => {
            $(`#${$(e).data("id")}`).css("box-shadow","");
        });
    });
});