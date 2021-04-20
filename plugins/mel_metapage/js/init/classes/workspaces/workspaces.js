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
            if (datas.this !== false)
                eval(datas.exec);
        } catch (error) {
            console.error(error);
        }
        //console.error("parent", datas, datas.child !== false);
        if (datas.child !== false)
            SynchroniseWorkspaces.PostToChilds(datas);
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