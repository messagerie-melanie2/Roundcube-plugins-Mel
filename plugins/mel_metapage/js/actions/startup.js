const mm_frame = "mm-frame";
$(document).ready(function() {
    $("#layout-list").addClass(rcmail.env.task + "-frame");
    $("#layout-list").addClass(mm_frame);
    $("#layout-sidebar").addClass(rcmail.env.task + "-frame");
    $("#layout-content").addClass(rcmail.env.task + "-frame");
    $("#layout-sidebar").addClass(mm_frame);
    $("#layout-content").addClass(mm_frame);
    $(".startup").addClass(rcmail.env.task + "-frame");
    $(".startup").addClass(mm_frame);
    if (rcmail.env.task === "addressbook")
    {
        $(".task-addressbook").children().each((i,e) => {
            if (e.classList.contains("modal"))
                return;
            if (e.id == "layout")
                return;
            e.classList.add(rcmail.env.task + "-frame");
            e.classList.add(mm_frame);
        });
    }
    mm_st_ChangeClicks();
});

function mm_st_ChangeClicks()
{
    let as = $("#taskmenu").find("a");
    as.each((i, e) => {
        let cClass = "";
        e.classList.forEach((a) => {
            switch (a) {
                case "selected":
                    return;
                case "order1":
                    return;
                
                default:
                    break;
            }
            if (a.includes("icofont"))
                return;
            if (a.includes("button"))
                return;
            cClass = a;
        });
        switch (cClass) {
            case "logout":
            case "about":
            case "compose":
                return;
        
            default:
                break;
        }
        e.onclick=() => {
            event.preventDefault();
            mm_st_CreateOrOpenModal(cClass);
        };
    });
}

function mm_st_ClassContract(_class)
{
    switch (_class) {
        case "home":
            return "mel_portal";
        case "contacts":
            return "addressbook";
        case "tasklist":
            return "tasks";
        default:
            return _class;
    }
}

function mm_st_CommandContract(_class)
{
    switch (_class) {
        case "news":
            return 'mel_portal&action=index&_data=news'
        default:
            return _class;
    }
}

function mm_st_CreateOrOpenModal(eClass, changepage = true)
{
    if (changepage)
    {
        $("#taskmenu").find("a").each((i,e) => {
            if (e.classList.contains(eClass))
            {
                if (!e.classList.contains("selected"))
                    e.classList.add("selected");
            }
            else
                e.classList.remove("selected");
        });
    }
    eClass = mm_st_ClassContract(eClass);
    let querry = $("." + eClass + "-frame");
    if (changepage)
        $("."+mm_frame).css("display", "none");/*.each((i,e) => {
        e.classList.add("hidden");
    })*/
    
    if (querry.length == 0)
    {
        let id = "fame-n-" + $("iframe").length;
        rcmail.env.current_frame = id;
        $("#layout").append('<iframe id="'+id+'" style="flex: auto; border:none;" class="'+eClass+'-frame '+mm_frame+'" src="'+rcmail.get_task_url(mm_st_CommandContract(eClass))+'&_from=iframe"></iframe>');
        $("#"+id).css("display", "none");
        rcmail.set_busy(true, "loading");
        $("."+eClass+"-frame").on("load", () =>
        {
            $("."+eClass+"-frame").contents().find("#layout-menu").remove();
            $("."+eClass+"-frame").contents().find(".barup").remove();
            rcmail.set_busy(false);
            rcmail.clear_messages();
            if (changepage)
                $("#"+id).css("display", "");
        })
        return id;
    }
    else {
       /* $("." + eClass + "-frame")*/querry.css("display", "");//.removeClass("hidden");
        let id = querry[0].id;
        if (window.FrameUpdate === undefined || !FrameUpdate.exists(id))
            Update();
        else
            FrameUpdate.start(id);
        return id;
    }

} 