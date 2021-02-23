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
    rcmail.addEventListener("init", () => {
        rcmail.env.last_frame_class = mm_st_GetClass($("#layout-menu a.selected")[0].classList);//[0] == "selected" ? $("#layout-menu a.selected")[0].classList[1] : $("#layout-menu a.selected")[0].classList[0];
        rcmail.env.last_frame_name = $("#layout-menu a.selected").find(".inner").html();
        let querry = $(".menu-last-frame").find(".inner");
        querry.html(`<span class=menu-last-frame-inner-up>`+rcmail.gettext('last_frame_opened', "mel_metapage")+` :</span><span class=menu-last-frame-inner-down>`+rcmail.gettext('nothing', "mel_metapage")+`</span>`); 
        rcmail.enable_command('last_frame', true);
        rcmail.register_command('last_frame', function() {
            event.preventDefault();
            mm_st_CreateOrOpenModal(rcmail.env.last_frame_class, true);
          }); 
    });
    //rcmail.env.last_frame_class = $("#layout-menu a.selected")[0].classList[0] == "selected" ? $("#layout-menu a.selected")[0].classList[1] : $("#layout-menu a.selected")[0].classList[0];
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

function mm_st_GetClass(classlist)
{
    for (let index = 0; index < classlist.length; index++) {
        const element = classlist[index];
        if (element.includes("button") || element.includes("order") || element.includes("selected")  || element.includes("icofont"))
            continue;
        return element;
    }
    return "";
}

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
            case "menu-last-frame":
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
        case "mel_portal":
            return "home";
        case "contacts":
            return "addressbook";
        case "addressbook":
            return "contacts";
        case "tasklist":
            return "tasks";
        case "tasks":
            return "tasklist";
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
    if (rcmail.env.current_frame_name !== undefined && rcmail.env.current_frame_name !== null)
    {
        rcmail.env.last_frame_class = mm_st_ClassContract(rcmail.env.current_frame_name);
        rcmail.env.last_frame_name = $("." + mm_st_ClassContract(rcmail.env.current_frame_name)).find(".inner").html();
    }
    eClass = mm_st_ClassContract(eClass);
    let querry = $("." + eClass + "-frame");
    if (changepage)
    {
        rcmail.env.current_frame_name = eClass;
        $("."+mm_frame).css("display", "none");/*.each((i,e) => {
        e.classList.add("hidden");
    })*/
}   
    window.history.replaceState({}, document.title, "/?_task=" + mm_st_CommandContract(eClass));
    if (querry.length == 0)
    {
        rcmail.env.frame_created = false;
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
            rcmail.env.frame_created = true;
            if (changepage)
                $("#"+id).css("display", "");
        });
        m_mp_ChangeLasteFrameInfo();
        return id;
    }
    else {
        rcmail.env.frame_created = true;
       /* $("." + eClass + "-frame")*/querry.css("display", "");//.removeClass("hidden");
        let id = querry[0].id;
        if (window.FrameUpdate === undefined)
            Update();
        else
        {
            if (FrameUpdate.exists(id))
                FrameUpdate.start(id);
        }
        m_mp_ChangeLasteFrameInfo();
        return id;
    }

} 

function m_mp_ChangeLasteFrameInfo()
{
    const text = rcmail.gettext('last_frame_opened', "mel_metapage");
    let querry = $(".menu-last-frame").find(".inner");
    querry.html(`<span class=menu-last-frame-inner-up>`+text+` :</span><span class=menu-last-frame-inner-down>`+rcmail.env.last_frame_name+`</span>`);   
    m_mp_CreateOrUpdateIcon("." + rcmail.env.last_frame_class);
    $(".menu-last-frame").removeClass("disabled");
}

function m_mp_CreateOrUpdateIcon(querry_selector)
{
    if ($(".menu-last-frame").find(".menu-last-frame-item").length == 0)
        $(".menu-last-frame").append(`<span class="menu-last-frame-item"></span>`);
    else
    {
        document.styleSheets[0].removeRule(document.styleSheets[0].rules.length-1);
        document.styleSheets[0].removeRule(document.styleSheets[0].rules.length-1);
    }
    let content =    window.getComputedStyle(
            document.querySelector(querry_selector), ':before'
        ).getPropertyValue('content').replace(/"/g, '').charCodeAt(0).toString(16);
    let font =    window.getComputedStyle(
        document.querySelector(querry_selector), ':before'
    ).getPropertyValue('font-family');
    console.log("font",font);
    document.styleSheets[0].addRule('.menu-last-frame-item:before', 'content: "\\' + content + '"; font-family: "'+font+'"');
    document.styleSheets[0].addRule('.menu-last-frame-item:before', 'font-family: '+font+';');
}

