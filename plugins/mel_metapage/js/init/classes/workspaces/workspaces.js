(() => {

function SynchroniseWorkspaces()
{
    this.empty = null;
    delete this.empty;
}

SynchroniseWorkspaces.Post = function (w, data)
{
    w.postMessage(data);
}

SynchroniseWorkspaces.PostToParent = function (data)
{
    SynchroniseWorkspaces.im_who_have_lunched_this = true;
    SynchroniseWorkspaces.Post(parent, data);
}

SynchroniseWorkspaces.PostToChilds = function (datas)
{
    $("iframe.mm-frame").each((i,e) => {
        ////console.error("SynchroniseWorkspaces.PostToChilds", e, datas);
        SynchroniseWorkspaces.Post(e.contentWindow, datas)
    });
}

SynchroniseWorkspaces.im_who_have_lunched_this = false;

SynchroniseWorkspaces.integrated_functions = (func_name, args) => {

    switch (func_name) {
        case "searchToAddressbook":
            $("#contact-frame").css("padding", "");

            SynchroniseWorkspaces.PostToParent({
                exec:"searchToAddressbookParent",
                _integrated:true,
                child:false
            });

            break;
        case "searchToAddressbookParent":
            $(".addressbook-frame").css("padding-top", "0");
        break;
        case "search":
            if (window.search_action !== undefined)
                search_action(...args.args);
            break;
        case "update_cal":
            rcmail.triggerEvent(mel_metapage.EventListeners.calendar_updated.get);

            if (args.args !== undefined)
            {
                const arguments = args.args;

                if (arguments.refresh === true && rcmail.commands["refreshcalendar"] === true)
                {
                    wait(() => rcmail.busy).then((() => {
                        rcmail.command("refreshcalendar");
                    }));
                }

                
                if (arguments.goToTop === true && window !== parent)
                {
                    args.child = false;
                    SynchroniseWorkspaces.PostToParent(args);
                }
                else if (window === parent && arguments.child === true)
                {
                    args.args.goToTop = false;
                    SynchroniseWorkspaces.PostToChilds(args);
                }
            }



            break;

        case "update_location":
            try {
                if (args.args.length === 1)
                    window.location.href = args.args[0];
                else {
                    if (args.args.length === 3)
                    {
                        if ($(`iframe.${args.args[1]}`).length === 0)
                        {
                            $(`iframe#${args.args[2]}`)[0].src = args.args[0];
                            console.log("iframe", $(`iframe#${args.args[2]}`), $(`iframe#${args.args[2]}`)[0].src);
                        }
                        else
                            $(`iframe.${args.args[1]}`)[0].contentWindow.postMessage({
                                exec:"update_location",
                                child:"false",
                                _integrated:true,
                                args:args.args
                            });
                    }
                }
            } catch (error) {
                
            }
            break;

        case "reload_location":
            window.location.reload();
            break;

        case "reload_frame":
            let querry = $(`iframe.${args.args[0]}`);

            //console.log("[SynchroniseWorkspaces.integrated_functions]",querry, args);

            if (querry.length > 0)
            {
                //delete jQuery._data($(`.${args.args[0]}`)[0], 'events').load;
                // querry[0].contentWindow.postMessage({
                //     exec:"reload_location",
                //     child:false,
                //     always:true,
                //     _integrated:true
                // });
                querry.remove();
                //mel_metapage.Functions.change_frame(mm_st_ClassContract(args.args[0]), false, false);
            }
            else if ($(`.${args.args[0]}`).length > 0)
                SynchroniseWorkspaces.integrated_functions("reload_location");
            break;

        case "refresh_frame":
            const frame = rcmail.env.task;

            if (frame === "mail")
            {
                if (rcmail && rcmail.refresh_list)
                    rcmail.refresh_list();
            }

            break;

        case "display_webconf":
            let __frame = $(".webconf-frame");
            $(".mm-frame").css("display", "none");

            if (__frame.parent()[0].id === "layout-frames")
                __frame.css("display", "").parent().css("display", "");
            else
                __frame.css("display", "");

            break;

        case "select_mail":

            if (args.args[1])
            {
                $("iframe.mail-frame")[0].contentWindow.postMessage({
                    exec:"select_mail",
                    _integrated:true,
                    child:false,
                    args:[args.args[0], false]
                });
            }
            else {
                rcmail.set_busy(true, "loading");
                let config = {
                    _uid:args.args[0]
                };
                config[rcmail.env.mel_metapage_const.key] = rcmail.env.mel_metapage_const.key.value;
                window.location.href = mel_metapage.Functions.url("mail", "show", config);
            }

            break;
        
            case "open_create":
                m_mp_Create();
                switch (args.args[0]) {
                    case "document":
                        m_mp_InitializeDocument(args.args[1] === undefined ? null : args.args[1]);
                        break;
                
                    default:
                        break;
                }
                break;

        default:

            if (func_name.includes("trigger"))
            {
                rcmail.triggerEvent(func_name.split(".")[1]);
            }

            break;
    }

};

if (parent === window)
{
    window.addEventListener("message", receiveMessage, false);
    function receiveMessage(event)
    {
        const datas = event.data;
        if (datas.exec === undefined)
            return;

        try {
            if (SynchroniseWorkspaces.im_who_have_lunched_this)
                SynchroniseWorkspaces.im_who_have_lunched_this = false;
            ////console.error("post", datas);
            if (datas._integrated === true && datas.this !== false)
                SynchroniseWorkspaces.integrated_functions(datas.exec, datas);
            else {
                if (datas.this !== false)
                    eval(datas.exec);
            }
        } catch (error) {
            console.error(error, datas);
        }
        //console.error("parent", datas, datas.child !== false);
        if (datas.child !== false)
            SynchroniseWorkspaces.PostToChilds(datas);
            
        if (mel_metapage.Storage.get(mel_metapage.Storage.wait_call_loading) === mel_metapage.Storage.wait_frame_waiting)
            mel_metapage.Storage.remove(mel_metapage.Storage.wait_call_loading)
    }
}
else {
    window.addEventListener("message", receiveMessage, false);
    function receiveMessage(event)
    {
        //console.log("event", event, SynchroniseWorkspaces.im_who_have_lunched_this, event.data.exec);
        const datas = event.data;
        if (datas.exec === undefined)
            return;
            //console.error("eval", datas, datas.exec, window);
        if (SynchroniseWorkspaces.im_who_have_lunched_this)
        {
            SynchroniseWorkspaces.im_who_have_lunched_this = false;
            if (event.data.eval !== "always")
                return;
        }

        try {
            //console.log("eval", datas, datas.exec);
            if (datas._integrated === true)
                SynchroniseWorkspaces.integrated_functions(datas.exec, datas);
            else
                eval(datas.exec);
        } catch (error) {
            console.error(error, datas);
        }
    }  
}

window.workspaces = {
    sync:SynchroniseWorkspaces
}

})();