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
    rcmail.addEventListener("init", async () => {
        if (parent === window && (rcmail.env.task === "discussion" || rcmail.env.task === "ariane"))
        {
            mel_metapage.Storage.set("open_frame", "rocket");
            window.location.href = "./?_task=bureau";
            return;
        }
        else if (parent === window && mel_metapage.Storage.get("open_frame") !== null)
        {
            $(document).ready(() =>{
                mm_st_CreateOrOpenModal(mel_metapage.Storage.get("open_frame"));
            mel_metapage.Storage.remove("open_frame");
            });
        }
        await wait(() => $("#layout-menu a.selected").length === 0);
        rcmail.env.last_frame_class = mm_st_GetClass($("#layout-menu a.selected")[0].classList);//[0] == "selected" ? $("#layout-menu a.selected")[0].classList[1] : $("#layout-menu a.selected")[0].classList[0];
        rcmail.env.last_frame_name = $("#layout-menu a.selected").find(".inner").html();
        let querry = $(".menu-last-frame").find(".inner");
        querry.html(`<span class=menu-last-frame-inner-up>`+rcmail.gettext('last_frame_opened', "mel_metapage")+` :</span><span class=menu-last-frame-inner-down>`+rcmail.gettext('nothing', "mel_metapage")+`</span>`); 
        rcmail.enable_command('last_frame', true);
        rcmail.register_command('last_frame', function() {
            try {
                event.preventDefault();
            } catch (error) {
                
            }
            mm_st_CreateOrOpenModal(rcmail.env.last_frame_class, true);
          }); 
        rcmail.env.can_backward = true;
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
        if (element.includes("button") || element.includes("order") || element.includes("selected")  || element.includes("icofont") || element.includes("icon-mel-"))
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
                case "mel":
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
            return "bureau";
        case "bureau":
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
        case "wsp":
            return "workspace"
        case "workspace":
            return "wsp";
        default:
            return _class;
    }
}

function mm_st_CommandContract(_class)
{
    switch (_class) {
        case "news":
            return 'bureau&action=index&_data=news'
        default:
            return _class;
    }
}

function mm_st_CreateOrOpenModal(eClass, changepage = true)
{
    return mm_st_OpenOrCreateFrame(eClass, changepage);
} 

function mm_st_OpenOrCreateFrame(eClass, changepage = true, args = null)
{
    metapage_frames.unbreak();
    if (rcmail.busy)
        return;
    //Actions à faire avant de traiter la classe.
    metapage_frames.triggerEvent("before", eClass, changepage);
    if (changepage) //Actions à faire si on change de page, avant d'avoir traité la classe.
        metapage_frames.triggerEvent("changepage.before", eClass);
    eClass = mm_st_ClassContract(eClass);
    let querry = $("." + eClass + "-frame");
    let isAriane = eClass === "discussion" || eClass === "ariane";
    console.error("class to open", eClass, querry);
    if (changepage)//Actions à faire si on change de page.
        metapage_frames.triggerEvent("changepage", eClass, changepage, isAriane, querry);

    if (querry.length == 0) //Si on doit créer la frame
    {
        if (rcmail.nb_frames === undefined)
            rcmail.nb_frames = 0;
        let id = "fame-n-" + (++rcmail.nb_frames);//$(`iframe.${mm_frame}`).length;
        //Mise en place de diverses configurations lorque l'on doit créer une frame.
        metapage_frames.triggerEvent("rcmailconfig.no", eClass, changepage, isAriane, querry, id);
        metapage_frames.triggerEvent("node", eClass, changepage, isAriane, querry, id) //Récupération de la node
        .append(metapage_frames.triggerEvent("frame", eClass, changepage, isAriane, querry, id, args) /* Récupération de la frame */);
        //Mise à jours de la frame
        metapage_frames.triggerEvent("editFrame", eClass, changepage, isAriane, $("#"+id));
        rcmail.set_busy(true, "loading");
        $("."+eClass+"-frame").on("load", () =>
        {
            //Action à faire une fois que la frame est chargée.
            metapage_frames.triggerEvent("onload", eClass, changepage, isAriane, querry, id);
            //Actions à faire une fois que l'évènement "onload" est fini.
            metapage_frames.triggerEvent("onload.after", eClass, changepage, isAriane, querry, id);
        });
        if (changepage) //Action à faire après avoir créer la frame, si on change de page.
            metapage_frames.triggerEvent("changepage.after", eClass, changepage, isAriane, querry, id);
        //Action à faire avant de terminer la fonction.
        metapage_frames.triggerEvent("after", eClass, changepage, isAriane, querry, id);
        return id;
    }
    else {
        let id = querry[0].id;
        //Mise en place de diverses configurations lorque l'on doit ouvrir une frame.
        metapage_frames.triggerEvent("rcmailconfig.yes", eClass, changepage, isAriane, querry, id);
        //Ouverture d'une frame.
        metapage_frames.triggerEvent("open", eClass, changepage, isAriane, querry, id);
        metapage_frames.triggerEvent("open.after", eClass, changepage, isAriane, querry, id);
        if (changepage)//Action à faire après avoir ouvert la frame, si on change de page.
            metapage_frames.triggerEvent("changepage.after", eClass, changepage, isAriane, querry, id);
        //Action à faire avant de terminer la fonction.
        metapage_frames.triggerEvent("after", eClass, changepage, isAriane, querry, id);
        return id;
    }

}

metapage_frames.addEvent("before", (eClass, changepage) => {
    if ($("#layout-frames").length === 0)
        $("#layout").append(`<div id="layout-frames" style="display:none;"></div>`)
    if (changepage)
    {
        if (rcmail.env.current_frame_name !== undefined && rcmail.env.current_frame_name !== null)
        {
            rcmail.env.last_frame_class = mm_st_ClassContract(rcmail.env.current_frame_name);
            rcmail.env.last_frame_name = $("." + mm_st_ClassContract(rcmail.env.current_frame_name)).find(".inner").html();
        }
    }
});

metapage_frames.addEvent("changepage.before", (eClass) => {
    if ($(".ui-dialog-titlebar-close").length > 0)
        $(".ui-dialog-titlebar-close").click();
    $("#taskmenu").find("a").each((i,e) => {
        if (e.classList.contains(eClass))
        {
            if (!e.classList.contains("selected"))
                e.classList.add("selected");
        }
        else
            e.classList.remove("selected");
    });
});

metapage_frames.addEvent("changepage", (eClass, changepage, isAriane, querry) => {
    rcmail.env.current_frame_name = eClass;
    $("."+mm_frame).each((i,e) => {
        if ((mel_metapage.PopUp.ariane !== null && mel_metapage.PopUp.ariane.is_show && e.classList.contains("discussion-frame") ) || e.classList.contains("webconf-frame"))
            return;
        e.style.display = "none";
    });//.css("display", "none");
    $(".a-frame").css("display", "none");
    const url = rcmail.get_task_url((isAriane ? "mel_metapage&_action=chat" : mm_st_CommandContract(eClass)), window.location.origin + window.location.pathname); 
    window.history.replaceState({}, document.title, url);
    if (isAriane || $("."+eClass+"-frame").length > 1)
        $("#layout-frames").css("display", "none");
    else 
        $("#layout-frames").css("display", "");
    let arianeIsOpen = mel_metapage.PopUp.ariane === undefined || mel_metapage.PopUp.ariane === null ? false : mel_metapage.PopUp.ariane.is_show;
    if (isAriane)
    {
        if (mel_metapage.PopUp.ariane !== null && mel_metapage.PopUp.ariane.is_show)
            mel_metapage.PopUp.ariane.hide();
    }
    if (isAriane)
    {
        let btn = ArianeButton.default();
        btn.hide_button();
    }
    else if (rcmail.env.mel_metapage_ariane_button_config[eClass] !== undefined)
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
    if (arianeIsOpen && !isAriane)
    {
        let btn = ArianeButton.default();
        btn.hide_button();
        $(".a-frame").css("display", "");
    }
});

metapage_frames.addEvent("rcmailconfig.no", (eClass, changepage, isAriane, querry, id) => {
    rcmail.env.frame_created = false;
    rcmail.env.current_frame = id;
})

metapage_frames.addEvent("rcmailconfig.yes", (eClass, changepage, isAriane, querry, id) => {
    rcmail.env.frame_created = true;
    rcmail.env.current_frame = querry.length > 1 ? "default" : id;
})

metapage_frames.addEvent("node", (eClass, changepage, isAriane, querry, id, result) => {
    if (result)
        return result;
    else
        return (isAriane ? $("#layout") : $("#layout-frames"));
})

metapage_frames.addEvent("frame", (eClass, changepage, isAriane, querry, id, args, result) => {
    //let src = rcmail.get_task_url(mm_st_CommandContract(eClass), window.location.origin + window.location.pathname) + "&_from=iframe";
    if (args === null || args === undefined)
        args = {};
    args["_from"] = "iframe";
    let src = mel_metapage.Functions.url(mm_st_CommandContract(eClass), "", args);
    if (eClass === "discussion")
        src = rcmail.env.rocket_chat_url + "home";
    const frame = '<iframe id="'+id+'" style="' + (isAriane ? "flex: 1 0 auto;width:100%;height:100%;" : "width:100%;height:100%;") + ' border:none;" class="'+eClass+'-frame '+mm_frame+'" src="'+src+'"></iframe>';
    let html = frame;
    if (eClass === "discussion")
    {
        html = "";
        html += '<div class="card-disabled frame-card a-frame" style="height:100%;width:100%;">';
        html += '<div class="card-header-disabled frame-header" >';
        // html += '<span>Ariane</span>';
        html += '<a href="close_ariane" onclick="m_mp_close_ariane()" class="icon-mel-close card-close"></a>';
        html += '<a class="icofont-anchor card-anchor" href="anchor_ariane" onclick="m_mp_anchor_ariane()"></a>';
        html += '<a class="icon-mel-expand card-expand" href="full_screen_ariane" onclick="m_mp_full_screen_ariane()"></a>';
        html += "</div>";
        html += '<div class="card-body-disabled frame-body a-frame" style="height:100%;width:100%;">'
        html += frame;
        html += "</div></div>";
    }

    
    return (result ? result : "") + html;
    
})

metapage_frames.addEvent("editFrame", (eClass, changepage, isAriane, frame) => {
    frame.css("display", "none");
    if (!changepage && rcmail.env.task != "mel_metapage" && rcmail.env.action !== "chat")
        $(".a-frame").css("display", "none");
    if (eClass === "discussion")
        rcmail.triggerEvent("init_ariane", frame[0].id);
});

metapage_frames.addEvent("onload", (eClass, changepage, isAriane, querry, id) => {
    $("."+eClass+"-frame").contents().find("#layout-menu").remove();
    $("."+eClass+"-frame").contents().find(".barup").remove();
    $("."+eClass+"-frame").contents().find("html").addClass("framed");
    rcmail.set_busy(false);
    rcmail.clear_messages();
    rcmail.env.frame_created = true;
    if (changepage)
        $("#"+id).css("display", "");
    console.error("onload", querry, id);
    if (mel_metapage.Storage.get(mel_metapage.Storage.wait_frame_loading) === mel_metapage.Storage.wait_frame_waiting)
        mel_metapage.Storage.set(mel_metapage.Storage.wait_frame_loading, mel_metapage.Storage.wait_frame_loaded);
});

metapage_frames.addEvent("changepage.after", () => {
    if (rcmail.env.can_backward === true)
        m_mp_ChangeLasteFrameInfo();
});

metapage_frames.addEvent("open", (eClass, changepage, isAriane, querry, id) => {
    try {
        if (window.FrameUpdate === undefined)
            Update();
        else
        {
            if (FrameUpdate.exists(id))
                FrameUpdate.start(id);
        }
    } catch (error) {
        
    }
    querry.css("display", "");
    //console.log("changepage", changepage	);
    if (eClass === "discussion" && changepage)
        $(".a-frame").css("display", "");
    if (mel_metapage.Storage.get(mel_metapage.Storage.wait_frame_loading) === mel_metapage.Storage.wait_frame_waiting)
        mel_metapage.Storage.set(mel_metapage.Storage.wait_frame_loading, mel_metapage.Storage.wait_frame_loaded);
});

function m_mp_ChangeLasteFrameInfo()
{
    console.log("last", rcmail.env.last_frame_class);
    const text = rcmail.gettext('last_frame_opened', "mel_metapage");
    let querry = $(".menu-last-frame").find(".inner");
    querry.html(`<span class=menu-last-frame-inner-up>`+text+` :</span><span class=menu-last-frame-inner-down>`+rcmail.env.last_frame_name+`</span>`);   
    window.document.title = $("." + mm_st_ClassContract(rcmail.env.current_frame_name)).find(".inner").html();
    m_mp_CreateOrUpdateIcon("." + rcmail.env.last_frame_class);
    $(".menu-last-frame").removeClass("disabled");
}

function m_mp_CreateOrUpdateIcon(querry_selector)
{

    //console.error("querry-selector", querry_selector);

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

    if (querry_selector === ".settings")
    {
        content = "e926";
        font = "DWP";
    }

    document.styleSheets[0].addRule('.menu-last-frame-item:before', 'content: "\\' + content + '"; font-family: "'+font+'"');
    document.styleSheets[0].addRule('.menu-last-frame-item:before', 'font-family: '+font+';');
}

