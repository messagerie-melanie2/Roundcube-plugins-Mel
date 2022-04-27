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

    const task = mm_st_ClassContract(rcmail.env.task);

    rcmail.env.last_frame_class = task;

    if ($("#layout-menu a.selected").length === 0)
    {
        rcmail.env.last_frame_name = document.title;
    }
    else
        rcmail.env.last_frame_name = $("#layout-menu a.selected").find(".inner").html();

    event_keys.init.chat_button.trigger();

    let querry = $(".menu-last-frame").find(".inner");
    querry.html(`<span class=menu-last-frame-inner-up>`+rcmail.gettext('last_frame_opened', "mel_metapage")+` :</span><span class=menu-last-frame-inner-down>`+rcmail.gettext('nothing', "mel_metapage")+`</span>`); 
    rcmail.enable_command('last_frame', true);

    rcmail.register_command('last_frame', function() {
        try {
            event.preventDefault();
        } catch (error) {
            
        }

        if ($("#taskmenu .menu-last-frame").hasClass("disabled"))
        {
            rcmail.display_message("Vous ne pouvez pas revenir en arrière si vous n'avez pas déjà changer de page.");
            $("#taskmenu .menu-last-frame").attr("disabled", "disabled").attr("aria-disabled", true).attr("tabIndex", "-1");
        }
        else
            mm_st_CreateOrOpenModal(rcmail.env.last_frame_class, true);

        }); 

    rcmail.env.can_backward = true;

    
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
    mm_st_ChangeClicks("#otherapps");
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

function mm_st_ChangeClicks(selector = "#taskmenu", otherSelector = "a")
{
    let as = $(selector).find(otherSelector);
    as.each((i, e) => {

        if (e.classList.contains("more-options"))
            return;

        let cClass = "";
        e.classList.forEach((a) => {
            switch (a) {
                case "mel-focus":
                    return;
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
            if (a.includes("icon-mel-"))
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

function mm_st_getNavClass(element)
{
    e = element;
    if (e.classList.contains("more-options"))
        return "more-options";

    let cClass = "";
    e.classList.forEach((a) => {
        switch (a) {
            case "mel-focus":
                return;
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
        if (a.includes("icon-mel-"))
            return;
        if (a.includes("button"))
            return;
        cClass = a;
    });

    return cClass;
}
window.mm_st_getNavClass = mm_st_getNavClass;

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

window.mm_st_ClassContract = mm_st_ClassContract;

function mm_st_CommandContract(_class)
{
    switch (_class) {
        case "news":
            return 'news'
        default:
            return _class;
    }
}

function mm_st_CreateOrOpenModal(eClass, changepage = true)
{
    return mm_st_OpenOrCreateFrame(eClass, changepage);
} 

function mm_st_OpenOrCreateFrame(eClass, changepage = true, args = null, actions = [])
{
    FullscreenItem.close_if_exist();
    metapage_frames.unbreak();

    if (args === null || args === undefined)
        args = {};

    if (rcmail.busy)
        return "busy";

    //Actions à faire avant de traiter la classe.
    metapage_frames.triggerEvent("before", eClass, changepage);

    if (changepage) //Actions à faire si on change de page, avant d'avoir traité la classe.
        metapage_frames.triggerEvent("changepage.before", eClass);

    eClass = mm_st_ClassContract(eClass);
    let querry = $("." + eClass + "-frame");
    let isAriane = eClass === "discussion" || eClass === "ariane";

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
            metapage_frames.triggerEvent("onload", eClass, changepage, isAriane, querry, id, actions);
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
        //console.log("open datas");
        let id = querry[0].id;
        //Mise en place de diverses configurations lorque l'on doit ouvrir une frame.
        metapage_frames.triggerEvent("rcmailconfig.yes", eClass, changepage, isAriane, querry, id);
        //Ouverture d'une frame.
        metapage_frames.triggerEvent("open", eClass, changepage, isAriane, querry, id, actions);
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
            
            $(e).attr("aria-disabled", true).attr("tabIndex", "-1");
        }
        else
        {
            e.classList.remove("selected");
            $(e).attr("aria-disabled", false).attr("tabIndex", "0");
        }
    });

    $("#otherapps").find("a").each((i,e) => {
        if (e.classList.contains(eClass))
        {
            if (!e.classList.contains("selected"))
                e.classList.add("selected");
            
            $(e).attr("aria-disabled", true).attr("tabIndex", "-1");
            $("#taskmenu a.more-options").addClass("selected");
        }
        else
        {
            e.classList.remove("selected");
            $(e).attr("aria-disabled", false).attr("tabIndex", "0");
        }
    });

    if($("#otherapps a.selected").length === 0)
        $("#taskmenu a.more-options").removeClass("selected");

    $("#otherapps").css("display", "none");

});

metapage_frames.addEvent("changepage", (eClass, changepage, isAriane, querry) => {
    rcmail.env.current_frame_name = eClass;

    mel_metapage.Functions.update_refresh_thing();

    $('.wlp_box').each((i,e) => {
        e = $(e);
        if (!e.hasClass('questionnaireWebconf')) 
        {
            if (e.find('.wlp-minixpand .icon-mel-minus-roundless').length > 0) e.find('.wlp-minixpand').click();
        }
    });

    let _bool;
    $("."+mm_frame).each((i,e) => {

    try {
        _bool = (mel_metapage.PopUp.ariane !== null && mel_metapage.PopUp.ariane.is_show && e.classList.contains("discussion-frame") ) || (e.classList.contains("webconf-frame") && window.webconf_helper.already());
        if (!_bool) e.style.display = "none";
    } catch (error) {
        console.warn('/!\\[changepage]', error);
        try {
            if (!(mel_metapage.PopUp.ariane !== null && mel_metapage.PopUp.ariane.is_show && e.classList.contains("discussion-frame"))) e.style.display = "none";
            if (!(window.webconf_helper && e.classList.contains("webconf-frame") && window.webconf_helper.already())) e.style.display = "none";
        } catch (error) {
            console.error('###[changepage]', error);
        }
    }

        
    });

    $(".a-frame").css("display", "none");
    const url = rcmail.get_task_url((isAriane ? "chat" : mm_st_CommandContract(eClass)), window.location.origin + window.location.pathname); 
    window.history.replaceState({}, document.title, url.replace(`${rcmail.env.mel_metapage_const.key}=${rcmail.env.mel_metapage_const.value}`, ""));
    
    let arianeIsOpen = mel_metapage.PopUp.ariane === undefined || mel_metapage.PopUp.ariane === null ? false : mel_metapage.PopUp.ariane.is_show;
    
    if (isAriane)
    {
        if (mel_metapage.PopUp.ariane !== null && mel_metapage.PopUp.ariane.is_show)
        {
            if (mel_metapage.PopUp.ariane.is_anchor())
                window.bnum_chat_anchored = true;

            mel_metapage.PopUp.ariane.hide();
            window.bnum_chat_hidden = true;
        }
    }
    else if (!isAriane && window.bnum_chat_hidden === true)
    {
        mel_metapage.PopUp.open_ariane();
        delete window.bnum_chat_hidden;

        if (window.bnum_chat_anchored === true)
        {
            mel_metapage.PopUp.ariane.anchor();
            delete window.bnum_chat_anchored;
        }
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
    const empty = "";
    const frameArg = {
        complete:"_is_from=iframe",
        key:"_is_from",
        value:"iframe"
    };

    if (args === null || args === undefined)
        args = {};

    if (rcmail.env.mel_metapage_const !== undefined)
        args[rcmail.env.mel_metapage_const.key] = rcmail.env.mel_metapage_const.value;

    if (eClass === "addressbook" && (args["_action"] === undefined || args["_action"] === null))
    {
        args["_action"] = "plugin.annuaire";
        args["_source"] = rcmail.env.annuaire_source;
    }

    let src = empty;//mel_metapage.Functions.url(mm_st_CommandContract(eClass), "", args);

    if (args["iframe.src"] !== undefined)
        src = args["iframe.src"];
    else if (eClass === "discussion")
        src = rcmail.env.rocket_chat_url + "home";
    else
    {
        let task;

        if (args._task !== undefined && args._task !== null)
        {
            task = args._task;
            delete args._task;
        }
        else
            task = mm_st_CommandContract(eClass);

        //Vérification frame
        if (args[rcmail.env.mel_metapage_const.key] === undefined || args[frameArg.key] === undefined)
            args[frameArg.key] = frameArg.value;

        src = mel_metapage.Functions.url(task, "", args);
    }

    const frame = '<iframe id="'+id+'" allow="clipboard-read; clipboard-write" style="' + (isAriane ? "flex: 1 0 auto;width:100%;height:100%;" : "width:100%;height:100%;") + ' border:none;" class="'+eClass+'-frame '+mm_frame+'" src="'+src+'"></iframe>';
    let html = frame;

    if (eClass === "discussion")
    {
        html = "";
        html += '<div class="card-disabled frame-card a-frame" style="height:100%;width:100%;">';
        html += '<div class="card-header-disabled frame-header" >';
        // html += '<span>Ariane</span>';
        html += `<a data-toggle="tooltip" data-placement="left" title="${rcmail.gettext("close", "mel_metapage")}" href="close_ariane" onclick="m_mp_close_ariane()" class="icon-mel-popup-cose card-close mel-focus"></a>`;
        html += `<a class="mel-focus icon-mel-popup-anchor card-anchor" href="anchor_ariane" data-toggle="tooltip" data-placement="left" title="${rcmail.gettext("anchor", "mel_metapage")}" onclick="m_mp_anchor_ariane()"></a>`;
        html += `<a data-toggle="tooltip" data-placement="left" title="${rcmail.gettext("fullscreen", "mel_metapage")}" class="mel-focus icon-mel-fullscreen-interface card-expand" href="full_screen_ariane" onclick="m_mp_full_screen_ariane()"></a>`;
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
});

metapage_frames.addEvent("onload", (eClass, changepage, isAriane, querry, id, actions) => {
    try {
        //debugger;//console.log("context", $("."+eClass+"-frame")[0].contentWindow.location)
        let querry_content = $("."+eClass+"-frame")[0].contentWindow;//.contents();
        const _$ = querry_content.$;

        _$("#layout-menu").remove();
        _$(".barup").remove();
        _$("html").addClass("framed");
                 
        let menu_small = _$("#menu-small-li");

        if (menu_small.length > 0) menu_small.remove();
        else {
            menu_small = _$("#menu-small-li");

            if (menu_small.length > 0) menu_small.remove();
        }
        
    } catch (error) {
        //console.error("###[onload|querry_content]", error);
    }

    rcmail.set_busy(false);
    rcmail.clear_messages();
    rcmail.env.frame_created = true;

    if (changepage && $("#"+id).data("loaded") != "true")
        $("#"+id).css("display", "");

    if ($("#"+id).data("loaded") != "true")
        $("#"+id).data("loaded", "true");
    
    if (mel_metapage.Storage.get(mel_metapage.Storage.wait_frame_loading) === mel_metapage.Storage.wait_frame_waiting)
        mel_metapage.Storage.set(mel_metapage.Storage.wait_frame_loading, mel_metapage.Storage.wait_frame_loaded);

    if (eClass === "discussion")
    {
        rcmail.triggerEvent("init_ariane", id);
        window.ariane.goLastRoom($("#"+id));
    }

    if (changepage)
        Title.update(id, true);

    metapage_frame_actions(actions, id, true);

    if (isAriane || $("iframe."+eClass+"-frame").length === 0)
        $("#layout-frames").css("display", "none");
    else 
        $("#layout-frames").css("display", "");

});

function metapage_frame_actions(actions, id, after_load) {
    if (actions != null && actions !== undefined && actions.length > 0)
    {
        let config;
        let querry = $(`iframe#${id}`);
        for (let index = 0; index < actions.length; ++index) {
            const element = actions[index];

            config = {
                child:false,
                _integrated:true,
            };

            if (typeof element === "string")
                config["exec"] = element;
            else {
                config["exec"] = element.action;
                config["args"] = element.args;
               
                if (element.onlyExist === true && after_load)
                    continue;

            }

            if (querry.length === 0 || querry.length > 1 || $(`#${id}`).length > 1)
            {
                try {
                    if (element.args !== undefined && element.args != null)
                        window.workspaces.sync.integrated_functions(config["exec"], config);
                    else
                        window.workspaces.sync.integrated_functions(config["exec"])
                } catch (error) {
                    console.error("###[metapage_frame_actions]", error, actions, id);
                }
            }
            else
                querry[0].contentWindow.postMessage(config, '*');
        }
    }
}

metapage_frames.addEvent("changepage.after", (eClass, changepage, isAriane, querry, id) => {
    if (rcmail.env.can_backward === true)
        m_mp_ChangeLasteFrameInfo();

        if (isAriane)
        {
            setTimeout(() => {
                Title.update(id, true);
            }, 10);
        }
});

metapage_frames.addEvent("open", (eClass, changepage, isAriane, querry, id, actions) => {

    if ($(`iframe#${id}`).length === 0)
        Title.set(Title.defaultTitle, true);
    else
        Title.update(id, true);

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
    //console.log("open", changepage, id);
    if (eClass === "discussion" && changepage)
    {
        $(".a-frame").css("display", "");
        setTimeout(async () => {
            if ($(`iframe#${id}`).length === 0)
                await Title.set(Title.defaultTitle, true);
            else
                await Title.updateAsync(id, true);
            Title.focusHidden();
        }, 10);
    }

    metapage_frame_actions(actions, id, false);

    if (mel_metapage.Storage.get(mel_metapage.Storage.wait_frame_loading) === mel_metapage.Storage.wait_frame_waiting)
        mel_metapage.Storage.set(mel_metapage.Storage.wait_frame_loading, mel_metapage.Storage.wait_frame_loaded);

    if (parent === window && $("html").hasClass("webconf-started"))
        $(window).resize();

    if (isAriane || $("iframe."+eClass+"-frame").length === 0)
        $("#layout-frames").css("display", "none");
    else 
        $("#layout-frames").css("display", "");

});

function m_mp_ChangeLasteFrameInfo(force = false)
{
    const text = rcmail.gettext('last_frame_opened', "mel_metapage");
    const isUndefined = rcmail.env.last_frame_name === undefined || rcmail.env.last_frame_name === "undefined";

    if (!isUndefined && (rcmail.env.current_frame_name === rcmail.env.last_frame_class || mm_st_ClassContract(rcmail.env.current_frame_name) === rcmail.env.last_frame_class) && !force)
    {
        rcmail.env.last_frame_name = undefined;
        return m_mp_ChangeLasteFrameInfo();
    }

    if (isUndefined)
        rcmail.env.last_frame_name = rcmail.gettext('nothing', "mel_metapage");

    let querry = $(".menu-last-frame").find(".inner");
    querry.html(`<span class=menu-last-frame-inner-up>`+text+` :</span><span class=menu-last-frame-inner-down>`+rcmail.env.last_frame_name+`</span>`);   
    window.document.title = $("." + mm_st_ClassContract(rcmail.env.current_frame_name)).find(".inner").html();

    try {
        if (!isUndefined)
        {
            m_mp_CreateOrUpdateIcon("#taskmenu ." + rcmail.env.last_frame_class);
            $(".menu-last-frame").removeClass("disabled").removeAttr("disabled").attr("aria-disabled", false).attr("tabIndex", "0");
        }
        else
        {
            m_mp_CreateOrUpdateIcon(null, "");
            $(".menu-last-frame").addClass("disabled").attr("disabled").attr("aria-disabled", true).attr("tabIndex", "-1");
        }
    } catch (error) {
        
    }

}
window.m_mp_ChangeLasteFrameInfo = m_mp_ChangeLasteFrameInfo;

function m_mp_CreateOrUpdateIcon(querry_selector, default_content = null)
{

    //console.error("querry-selector", querry_selector, default_content);

    if ($(".menu-last-frame").find(".menu-last-frame-item").length == 0)
        $(".menu-last-frame").append(`<span class="menu-last-frame-item"></span>`);
    else
    {
        document.styleSheets[0].removeRule(document.styleSheets[0].rules.length-1);
        document.styleSheets[0].removeRule(document.styleSheets[0].rules.length-1);
    }

    var font;
    var content;

    if (default_content === null)
    {
        content =    window.getComputedStyle(
                document.querySelector(querry_selector), ':before'
            ).getPropertyValue('content').replace(/"/g, '').charCodeAt(0).toString(16);
        font =    window.getComputedStyle(
            document.querySelector(querry_selector), ':before'
        ).getPropertyValue('font-family');

        if (querry_selector === ".settings")
        {
            content = "e926";
            font = "DWP";
        }

    }
    else
    {
        content = default_content;
        font = "DWP";
    }

    document.styleSheets[0].addRule('.menu-last-frame-item:before', 'content: "\\' + content + '"; font-family: "'+font+'"');
    document.styleSheets[0].addRule('.menu-last-frame-item:before', 'font-family: '+font+';');
}

function m_mp_focus_current_frame($this)
{
    event.preventDefault();
    const current = rcmail.env.current_frame;
    let focus;
    if (current === undefined || current === null || current === "default")
    {
        let tmp = $("#layout").children();
        for (let index = 0; index < tmp.length; ++index) {
            const element = tmp[index];

            if (element.id !== null && element.id !== undefined && element.id !== "")
            {
                if (element.id.includes("layout"))
                {
                    focus = element.id;
                    break;
                }
            }
        }

        if (focus === undefined || focus === null)
            focus = "layout";

        $($this).parent().append(`<a class="sr-only" id=mel-created-link href="#${focus}">Contenu principal</a>`).find("#mel-created-link");//.click();//.remove();
        setTimeout(() => {
            $("#mel-created-link")[0].click();//.remove();
            $("#mel-created-link").remove();
        }, 10);
    }
    else
    {
        focus = $(`#${current}`);

        if (focus.attr("tabindex") !== -1)
            focus.attr("tabindex", -1);
            
        setTimeout(() => {
            focus[0].focus();
        }, 10);
    }


}
