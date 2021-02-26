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
        if (parent === window && (rcmail.env.task === "discussion" || rcmail.env.task === "ariane"))
        {
            mel_metapage.Storage.set("open_frame", "rocket");
            window.location.href = "./?_task=mel_portal";
            return;
        }
        else if (parent === window && mel_metapage.Storage.get("open_frame") !== null)
        {
            $(document).ready(() =>{
                mm_st_CreateOrOpenModal(mel_metapage.Storage.get("open_frame"));
            mel_metapage.Storage.remove("open_frame");
            });
        }
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
         case "rocket":
            return "discussion";
        case "discussion":
            return "rocket";
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
    if ($("#layout-frames").length === 0)
        $("#layout").append(`<div id="layout-frames" style="display:none;"></div>`)
    if (changepage)
    {  
        if ($(".ui-dialog-titlebar-close").length > 0)
            $(".ui-dialog-titlebar-close").click();
        if (mel_metapage.PopUp.ariane !== null && mel_metapage.PopUp.ariane.is_show)
            mel_metapage.PopUp.ariane.hide();
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
    let isAriane = eClass === "discussion" || eClass === "ariane";
    if (changepage)
    {
        rcmail.env.current_frame_name = eClass;
        $("."+mm_frame).css("display", "none");
        window.history.replaceState({}, document.title, "/?_task=" + (isAriane ? "chat" : mm_st_CommandContract(eClass)));
        if (rcmail.env.mel_metapage_ariane_button_config[eClass] !== undefined)
        {
            let btn = ArianeButton.default();
            if (rcmail.env.mel_metapage_ariane_button_config[eClass].hidden === true)
                btn.hide_button();
            else {
                btn.show_button();
                btn.place_button(rcmail.env.mel_metapage_ariane_button_config[eClass].bottom, rcmail.env.mel_metapage_ariane_button_config[eClass].right);
            }
        }
        else {
            let btn = ArianeButton.default();
            btn.show_button();
            btn.place_button(rcmail.env.mel_metapage_ariane_button_config["all"].bottom, rcmail.env.mel_metapage_ariane_button_config["all"].right);
        }
        if (isAriane || $("."+eClass+"-frame").length > 1)
            $("#layout-frames").css("display", "none");
        else 
            $("#layout-frames").css("display", "");
    }   

    if (querry.length == 0)
    {
        rcmail.env.frame_created = false;
        let id = "fame-n-" + $("iframe").length;
        rcmail.env.current_frame = id;
        ( isAriane ? $("#layout") : $("#layout-frames")).append('<iframe id="'+id+'" style="' + (isAriane ? "flex: 1 0 auto;" : "width:100%;height:100%;") + ' border:none;" class="'+eClass+'-frame '+mm_frame+'" src="'+rcmail.get_task_url(mm_st_CommandContract(eClass))+'&_from=iframe"></iframe>');

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
        if (changepage)
            m_mp_ChangeLasteFrameInfo();
        return id;
    }
    else {
        rcmail.env.frame_created = true;
       /* $("." + eClass + "-frame")*/querry.css("display", "");//.removeClass("hidden");
        let id = querry[0].id;
        rcmail.env.current_frame = querry.length > 1 ? "default" : id;
        if (window.FrameUpdate === undefined)
            Update();
        else
        {
            if (FrameUpdate.exists(id))
                FrameUpdate.start(id);
        }
        if (changepage)
            m_mp_ChangeLasteFrameInfo();
        return id;
    }

} 

function m_mp_ChangeLasteFrameInfo()
{
    const text = rcmail.gettext('last_frame_opened', "mel_metapage");
    let querry = $(".menu-last-frame").find(".inner");
    querry.html(`<span class=menu-last-frame-inner-up>`+text+` :</span><span class=menu-last-frame-inner-down>`+rcmail.env.last_frame_name+`</span>`);   
    window.document.title = $("." + mm_st_ClassContract(rcmail.env.current_frame_name)).find(".inner").html();
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

