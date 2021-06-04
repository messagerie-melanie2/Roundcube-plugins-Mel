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
        case "update_workspaces":

        throw "Not implemented";
            if (window.update_workspaces !== undefined && window.update_workspaces !== null)
                window.update_workspaces();

            break;

        default:
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
            console.error(error);
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
            //console.error("eval", datas, datas.exec, window);
            if (datas._integrated === true)
                SynchroniseWorkspaces.integrated_functions(datas.exec, datas);
            else
                eval(datas.exec);
        } catch (error) {
            console.error(error);
        }
    }  
}

window.workspaces = {
    sync:SynchroniseWorkspaces
}

})();