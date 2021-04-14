
class Mel_Update
{
    constructor(event, custom_event, func)
    {
        Mel_Update.add_to_refresh(event, '() => Mel_Update.update_notifications(`'+custom_event+'`)');
        Mel_Update.AddEventListener(custom_event, func);
        this.event = event;
        this.custom_event = custom_event;
        this.func = func;
        // this.trigger = () => {
        //     Mel_Update.update_notifications(this.event);
        // }
    }
}


Mel_Update.add_to_refresh = function(listener, func)
{
    console.log("add to refresh", "Mel_Update.AddEventListener('"+listener+"', "+func+");");
    window.workspaces.sync.PostToParent({
        exec:"Mel_Update.AddEventListener('"+listener+"', "+func+");",
        child:false,
    });
}

Mel_Update.AddEventListener = function(listener, func)
{
    console.log("Mel_Update.AddEventListener", listener, func, rcmail._events[listener], Enumerable.from(rcmail._events[listener]).where(x => "" + x.func === "" + func).count());
    if (!Enumerable.from(rcmail._events[listener]).where(x => "" + x.func === "" + func).any())
        rcmail.addEventListener(listener, func);
}

Mel_Update.update_notifications = function (trigger)
{
    console.log("update_notifications", "rcmail.triggerEvent(`trigger`);");
    window.workspaces.sync.PostToParent({
        exec:'rcmail.triggerEvent(`'+trigger+'`);',
        eval:"always"
    });
}