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
            //console.log("yeay", data);
        },
        error: function (xhr, ajaxOptions, thrownError) { // Add these parameters to display the required response
            console.error(xhr, ajaxOptions, thrownError);
        },
        });
    }

     rcmail.addEventListener("init", () => {
try {
    //WSPNotification.tasks().update();
    //new Mel_Update(mel_metapage.EventListeners.tasks_updated.after, "wsp-tasks-all-number", update_tasks);
} catch (error) {
    console.error("###[WSPNotification.tasks().update()]", error);
}
try {
    side_notification.wsp_agenda();
} catch (error) {
    console.error("###[WSPNotification.agenda().update()]", error);
}

try {
    side_notification.wsp_documents();
    // $(".doc-notif").css("display", "none");

    // if (rcmail.env.bureau === undefined)
    //     rcmail.env.bureau = {};
    // rcmail.env.bureau["wsp_doc"] = WSPNotification.documents();

    // rcmail.env.bureau.wsp_doc.update().then(bool => 
    //     {
    //         if (!bool)
    //             rcmail.env.bureau.wsp_doc.update(true);
    //     });
    //rcmail.env.bureau.wsp_doc.update(true);
} catch (error) {
    console.error("###[WSPNotification.documents().update(true)]", error);
}

try {
    side_notification.wsp_mail();
    // WSPNotification.mails().update();
    // function event_update_mail(key, items = null){
    //     const storage = items ?? mel_metapage.Storage.get(key);
    //     console.log("meil-check-global", storage);

    //     $(".workspace .mail").each((i,e) => {
    //         e = $(e);

    //         if (e.find('.replacedClass').length > 0) e.find('.replacedClass').removeClass('replacedClass').addClass('icon-mel-mail ariane-icon');

    //         const uid = e.parent().parent().parent().attr("id").replace('wsp-', '');
    //         const datas = storage === null || storage === undefined ? null : storage[uid];
    //         let notif = e.find(".wsp-notif");

    //         console.log("mail-check", uid, datas, storage);

    //         if (datas !== undefined && datas !== null && datas.length > 0)
    //         {
    //             notif.css('display', '').html(datas.length);
    //         }
    //         else notif.css('display', 'none').html(0);
    //     });
    // }
    // event_update_mail('mel_metapage.wsp.mails');
    // rcmail.addEventListener('storage.change.mel_metapage.wsp.mails', (item) => {
    //         event_update_mail('mel_metapage.wsp.mails', item);
    // });
} catch (error) {
    console.error("mail error", error);
}

        $(".dwp-user").each((i,e) => {
            var image = $(e).find("img")[0];
            if (image === null || image === undefined)
                return;
            image.onerror = function(){
                $(e).html("<span>" + $(e).data("user").slice(0,2) + "</span>");
            };
         });

         const tmpFunc = (uid) => {

            uid = uid.replace("wsp-", "");

            let config = {
                _uid:uid
            };

            //console.log("passage", $("iframe.workspace-frame").length, $(".workspace-frame").length, window !== parent);

            if (parent.$("iframe.workspace-frame").length > 0) //Frame déjà ouverte
            {
                config[rcmail.env.mel_metapage_const.key] = rcmail.env.mel_metapage_const.value;
                parent.$("iframe.workspace-frame")[0].contentWindow.location.href = mel_metapage.Functions.url("workspace", "workspace", config);
                return mel_metapage.Functions.change_frame("wsp", true, true);
            }
            else if (parent.$(".workspace-frame").length > 0) //N'est pas une frame
            {
                parent.rcmail.set_busy(true, "loading");
                parent.location.href = mel_metapage.Functions.url("workspace", "workspace", config).replaceAll(`&${rcmail.env.mel_metapage_const.key}=${rcmail.env.mel_metapage_const.value}`, '');
                return Promise.resolve();
            }
            else //Pas ouvert 
            {
                config["_action"] = "workspace";
                return mel_metapage.Functions.change_frame("wsp", true, false, config);
            } 
            
         };


        rcmail.register_command("portal.go.workspace", tmpFunc, true);
    
        
    });

    
})();


rcmail.addEventListener("ariane.updated", () => {
    if ($(".wsp-notif-block .ariane").parent().first().data("added") !== "true")
       $(".wsp-notif-block .ariane").parent().addClass("btn-mel-invisible btn-text btn btn-secondary mel-portail-displayed-wsp-notif mel-hover").data("added", "true")
       .on("click", (e) => {
           //console.log(e);
           wsp_action_notif(e.currentTarget, "rocket");
       });
});

async function wsp_action_notif(target, page)
{
    const key = "fromphp_";
    if (page.includes(key))
        page = page.replace(key, "");

    const uid = $(target).parent()[0].id.replace("wsp-notifs-wsp-", "");
    let config = {
     _action:"workspace",
     _uid:uid,
     _page:page
     };

     if (parent.$(`iframe.workspace-frame`).length > 0)
     {
         //delete config._action;
         console.log("I GO HERE");
         await parent.$(`iframe.workspace-frame`)[0].contentWindow.ChangeToolbar("home", parent.$(`iframe.workspace-frame`)[0].contentWindow.$(".wsp-home "));
         parent.$(`iframe.workspace-frame`).remove();
         config[rcmail.env.mel_metapage_const.key] = rcmail.env.mel_metapage_const.value;
         await mel_metapage.Functions.change_frame("wsp", true, true, config);
         //$(`iframe.workspace-frame`)[0].src = mel_metapage.Functions.url("workspace", "workspace", config);
     }
     else if (parent.$(`.workspace-frame`).length > 0)
     {
        console.log("I GO HERE 2");
         delete config._action;
         parent.location.href = mel_metapage.Functions.url("workspace", "workspace", config).replace(`${rcmail.env.mel_metapage_const.key}=${rcmail.env.mel_metapage_const.value}`, "");
     }
     else {
        console.log("I GO HERE 3");
         config[rcmail.env.mel_metapage_const.key] = rcmail.env.mel_metapage_const.value;
         mel_metapage.Functions.change_frame("wsp", true, false, config);
     }
}

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
                $("#tak-" + initialId).addClass("active").attr("title", rcmail.gettext("untak", "mel_portal"));
            else
                $("#tak-" + initialId).removeClass("active").attr("title", rcmail.gettext("tak", "mel_portal"));

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

function update_tasks()
{
    //console.log("update_tasks()")
    $(".workspace").each((i,e) => {
        const id = e.id.replace("wsp-", "").replace("-epingle", "");
        const datas = mel_metapage.Storage.get(mel_metapage.Storage.other_tasks)[id];
        const count = mel_metapage.Storage.get(mel_metapage.Storage.other_tasks_count)[id];
        //console.log("update_tasks()", id, datas, count);
        if (datas !== undefined && count !== undefined)
        {
            $(e).find(".wsp-tasks-all").html('<span style="font-size:large">'+(count-datas.length)+'</span> tâches réalisées sur '+count+'</div>');
            $(e).find(".wsp-task-all-number").html(count);
        }
    });

}


$(document).ready(() => {
    $('.wsp-focusable-link').each((i,e) => {
        $(e).on("keydown", (event) => {
            if (event.type === "keydown")
            {
                if (event.originalEvent.code === "Enter" || event.originalEvent.code === "Space")
                {
                    $(`#${$(e).data("id")}`).children()[0].click();
                }
            }
        }).on("focus", () => {
           $(`#${$(e).data("id")}`).css("box-shadow","0 0 0 .2rem #484D7A69");
        })
        .on("blur", () => {
            $(`#${$(e).data("id")}`).css("box-shadow","");
        });
    });

    $("#wsp-see-all").click(() => {
        let $frames = top.$('.workspace-frame');
        if ($frames.length > 0) $frames.remove();
        mel_metapage.Functions.change_frame('wsp');
    });
});