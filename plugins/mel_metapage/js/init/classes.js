/**
 * String des différents listeners pour rcmail.
 */
class EventListenerDatas
{
    /**
     * 
     * @param {string} event Evènement par défaut
     * @param {string} before Trigger à appeler avant l'évènement
     * @param {string} after Trigger à appeler après l'évènement.
     */
    constructor(event, before = null, after = null)
    {
        this.get = event;
        if (before === null)
        {
           if (event.includes("."))
           {
               let tmp = event.split(".");
               before = tmp[0] + ".before." + tmp[1];
           } 
        }
        this.before = before;
        if (after === null)
        {
           if (event.includes("."))
           {
               let tmp = event.split(".");
               after = tmp[0] + ".after." + tmp[1];
           } 
        }
        this.after = after;
    }

    toString()
    {
        return this.get;
    }
}

class ArianePopUp{
    constructor(arianeButton = new ArianeButton("", ""))
    {
        this.ariane = new ArianeFrame();
        this.button = arianeButton;
        this.is_show = false;
    }

    anchor()
    {
        this.ariane.anchor();
    }

    is_anchor()
    {
        return this.ariane.is_anchor();
    }

    show()
    {
        this.button.loading();
        if (!this.ariane.is_loaded())
            new Promise(async (a,b) => {
                await this.ariane.wait_loading();
                this._show();
            });
        else
            this._show();
        //this.button.css("display", "none");
    }

    _show()
    {
        this.button.button.css("display", "none");
        this.ariane.enable();
        this.ariane.popUp.contents().find("#rocket_chat_frame").css("padding-top", "0px");
        this.ariane.popUp.addClass("tiny-rocket-chat-card");
        this.ariane.popUp.css("display", "initial");
        this.button.stop();
        this.is_show = true;
        // if ($("#pop-up-resizer").length === 0)
        //     ArianePopUp.splitter_init(this.ariane.popUp);
        window.onresize();
    }

    hide()
    {
        if (this.is_anchor())
            this.anchor();
        this.ariane.popUp.contents().find("#rocket_chat_frame").css("padding-top", "");
        this.ariane.popUp.css("display", "none");
        this.ariane.popUp.css("height", "");
        this.ariane.popUp.css("flex", "1 0 auto");
        this.ariane.popUp.removeClass("tiny-rocket-chat-card");
        this.button.button.css("display", "initial");
        this.ariane.disable();
        this.is_show = false;
    }
}
ArianePopUp.set_width = function(node)
{
    let set_width = function(width) {
        let max = 300;
        if (width > window.innerWidth / 2.0)
            width = window.innerWidth / 2.0;
        node.css({
            width: width,
            // reset default properties
            // 'min-width': 100,
            flex: 'none'
        });
        //.ariane-popup, .ariane-card-body, .ariane-card
        node.contents().find(".ariane-popup").css({
            width: width,
            // reset default properties
            // 'min-width': 100,
            flex: 'none'
        });
        node.contents().find(".ariane-card-body").css({
            width: width,
            // reset default properties
            // 'min-width': 100,
            flex: 'none'
        });
        node.contents().find(".ariane-card").css({
            width: width,
            // reset default properties
            // 'min-width': 100,
            flex: 'none'
        });
    };
    let pos = rcmail.local_storage_get_item("ariane_popUp");
    if (pos) {
        set_width(pos);
        $("#pop-up-resizer").css("right", (pos-3) + "px");
    }
}
ArianePopUp.splitter_init =     function splitter_init(node)
{
    // Use id of the list element, if exists, as a part of the key, instead of action.column-id
    // This way e.g. the sidebar in Settings is always the same width for all Settings' pages
    let pos = rcmail.local_storage_get_item("ariane_popUp");
    let reverted = true;
    let set_width = function(width) {
        let max = 300;
        if (width > window.innerWidth / 2.0)
            width = window.innerWidth / 2.0;
        node.css({
            width: width,
            // reset default properties
            // 'min-width': 100,
            flex: 'none'
        });
        //.ariane-popup, .ariane-card-body, .ariane-card
        node.contents().find(".ariane-popup").css({
            width: width,
            // reset default properties
            // 'min-width': 100,
            flex: 'none'
        });
        node.contents().find(".ariane-card-body").css({
            width: width,
            // reset default properties
            // 'min-width': 100,
            flex: 'none'
        });
        node.contents().find(".ariane-card").css({
            width: width,
            // reset default properties
            // 'min-width': 100,
            flex: 'none'
        });
    };
    $('<div id="pop-up-resizer" class="column-resizer" style=right:396px>')
        .appendTo(node.parent())
        .on('mousedown', function(e) {
            var ts, splitter = $(this), offset = node.position().left;

            // Makes col-resize cursor follow the mouse pointer on dragging
            // and fixes issues related to iframes
            splitter.width(10000).css('right',  node.width()-3);

            // Disable selection on document while dragging
            // It can happen when you move mouse out of window, on top
            document.body.style.userSelect = 'none';

            // Start listening to mousemove events
            $(document)
                .on('mousemove.resizer', function(e) {
                    // Use of timeouts makes the move more smooth in Chrome
                    clearTimeout(ts);
                    ts = setTimeout(function() {
                        // For left-side-splitter we need the current offset
                        if (reverted) {
                            offset = node.position().left;
                        }
                        var cursor_position = rcube_event.get_mouse_pos(e).x,
                            width = reverted ? node.width() + (offset - cursor_position) : cursor_position - offset;

                        set_width(width);
                    }, 5);
                })
                .on('mouseup.resizer', function() {
                    // Remove registered events
                    $(document).off('.resizer');
                    $('iframe').off('.resizer');
                    document.body.style.userSelect = 'auto';

                    // Set back the splitter width to normal
                    splitter.width(6).css('right', node.width()-3);

                    // Save the current position (width)
                    rcmail.local_storage_set_item("ariane_popUp", node.width());
                });
        });

    if (pos) {
        set_width(pos);
        $("#pop-up-resizer").css("right", (pos-3) + "px");
    }
};


ArianePopUp.hide = function()
{
    try {
        event.preventDefault();
    } catch (error) {
        
    }
    new ArianePopUp(ArianeButton.default()).hide();
}

ArianePopUp.show = function()
{
    event.preventDefault();
    new ArianePopUp(ArianeButton.default()).show();   
}

class ArianeFrame{
    constructor()
    {
        this.load_ended = false;
        if ($(".discussion-frame").length > 0)
        {
            this.popUp = $(".discussion-frame");
            this.card = {
                card:new ArianeCard(this.popUp.contents(),"card-disabled", "card","ariane-card"),
                header:new ArianeCard(this.popUp.contents(),"card-header-disabled", "card-header", "ariane-card-header"),
                body: new ArianeCard(this.popUp.contents(),"card-body-disabled", "card-body", "ariane-card-body")
            };
            this.load_ended = true;
        }
        else if ($("#rocket_chat_frame").length > 0)
        {
            this.popUp = $("#rocket_chat_frame");
            this.card = {
                card:new ArianeCard(this.popUp.contents(),"card-disabled", "card","ariane-card"),
                header:new ArianeCard(this.popUp.contents(),"card-header-disabled", "card-header", "ariane-card-header"),
                body: new ArianeCard(this.popUp.contents(),"card-body-disabled", "card-body", "ariane-card-body")
            };
            this.load_ended = true;
        }
        else{
            rcmail.env.frame_created = false;
            mm_st_CreateOrOpenModal("rocket", false);
            new Promise(async (a, b ) => {
                while (!rcmail.env.frame_created || $(".discussion-frame").length == 0 || $(".discussion-frame").contents().find("#rocket_chat_frame").length == 0) {
                    await delay(500);
                }
                this.popUp = $(".discussion-frame");
                this.card = {
                    card:new ArianeCard(this.popUp.contents(),"card-disabled", "card","ariane-card"),
                    header:new ArianeCard(this.popUp.contents(), "card-header-disabled", "card-header", "ariane-card-header"),
                    body: new ArianeCard(this.popUp.contents(), "card-body-disabled", "card-body", "ariane-card-body")
                };
                this.load_ended = true;
            });
        }
    }

    anchor()
    {
        if (!this.is_anchor())
        {
            this.popUp.css("flex","0 0 400px");
            this.popUp.css("position", "initial");
            //this.popUp.css("width", "initial");
            this.popUp.css("margin-top", "60px");
            this.popUp.contents().find(".card-anchor").addClass("icofont-external-link").removeClass("icofont-anchor");
            //ArianePopUp.set_width(this.popUp);
        }
        else {
            // this.popUp.css("flex","1 0 auto");
            //this.popUp.css("height", '');
            this.popUp.css("position", "");
            //this.popUp.css("width", "");
            this.popUp.css("margin-top", "");
            this.popUp.contents().find(".card-anchor").removeClass("icofont-external-link").addClass("icofont-anchor");      
            //ArianePopUp.set_width(this.popUp);
        }

    }

    is_anchor()
    {
        return this.popUp.contents().find(".card-anchor").hasClass("icofont-external-link");
    }

    enable()
    {
        this.popUp.css("padding-left", "initial");
        this.popUp.addClass("ariane-popup");
        let height = $(window).height()-60 + "px";
        this.popUp.css("height", height);
        this.card.card.card.css("height", height);
        this.card.body.card.css("height", height);
        this.card.card.enable();
        this.card.card.card.parent().css("margin", "0");
        this.card.body.enable();
        this.card.header.enable();
        window.onresize = function ()
        {
            if (mel_metapage.PopUp.ariane !== undefined && mel_metapage.PopUp.ariane.is_show)
            {
                let height = $(window).height();
                mel_metapage.PopUp.ariane.ariane.popUp.css("height", height+ "px");
                mel_metapage.PopUp.ariane.ariane.card.card.card.css("height", (height-60)+ "px");
                mel_metapage.PopUp.ariane.ariane.card.body.card.css("height", (height)+ "px");
            }
        }
    }

    disable()
    {
        this.popUp.css("padding-left", "");
        this.card.card.card.parent().css("margin", "");
        this.popUp.removeClass("ariane-popup");
        this.card.card.disable();
        this.card.body.disable();
        this.card.header.disable();
        window.onresize = null;
    }

    is_loaded()
    {
        return this.load_ended;
    }

    async wait_loading()
    {
        while (!this.is_loaded()) {
            await delay();
        } 
        return this.is_loaded(); 
    }
}

class ArianeCard
{
    constructor(context,classDisabled, ...classEnabled)
    {
        console.log(context);
        this.disabled = classDisabled;
        this.enabled = classEnabled;
        if (context.find("." + this.disabled).length > 0)
            this.card = context.find("." + this.disabled);
        else{
            let enabled_str = this.enabled_string();
            if (context.find(enabled_str).length > 0)
                this.card = context.find(enabled_str);
            else
            {
                console.error(this, context, classDisabled, ...classEnabled);
                throw classDisabled + " & " + enabled_str + " doesn't exists !";
            }
        }
    }

    is_enabled()
    {
        return !this.card.hasClass(this.disabled);
    }

    enable()
    {
        if (!this.is_enabled())
            this.card.removeClass(this.disabled).addClass(this.enabled_string(false));
    }

    disable()
    {
        if (this.is_enabled())
            this.card.removeClass(this.enabled_string(false)).addClass(this.disabled)
    }

    enabled_string(addPoint = true)
    {
        if (this.enabled_str === undefined)
        {
            let str = "";
            for (let index = 0; index < this.enabled.length; index++) {
                const element = this.enabled[index];
                str += (addPoint ? " ." : " ") + element;
            }
            this.enabled_str = str;
            return str;
        }
        else
            return this.enabled_str;
    }

    update()
    {
        this.enabled_str = undefined;
    }
}

class ArianeButton
{
    constructor(selector, fontClass)
    {
        this.button = $(selector);
        this.font = $(selector).find("." + fontClass);
        this.default_font = fontClass;
    }

    show_button = function()
    {
        this.button.css("display", "initial");
    }

    hide_button = function()
    {
        this.button.css("display", "none");
    }
    
    place_button = function(bottom, right)
    {
        this.button.css("bottom", bottom);
        this.button.css("right", right);
    }

    loading()
    {
        this.font.removeClass(this.default_font).addClass("spinner-border").parent().addClass("disabled");
    }

    stop()
    {
        this.font.removeClass("spinner-border ").addClass(this.default_font).parent().removeClass("disabled");  
    }
}

ArianeButton.default = function () {
    return new ArianeButton(".tiny-rocket-chat", "icofont-chat");
}

class MetapageFrames {
    constructor()
    {
        this._events = {};
    }

    open(key, changePage = true)
    {
        mm_st_OpenOrCreateFrame(key, changePage);
    }

    async openAsync(key, changePage = true, delay_ms = 500)
    {
        mm_st_OpenOrCreateFrame(key, changePage);
        while (!rcmail.env.frame_created) {
            await delay(delay_ms)
        }
        return true;
    }

    addEvent(key, event)
    {
        if (this._events[key] === undefined)
            this._events[key] = [];
        this._events[key].push(event);
    }

    triggerEvent(key, ...args)
    {
        if (this._events[key] === undefined)
            return;
        else {
            let result = null;
            for (let index = 0; index < this._events[key].length; index++) {
                const element = this._events[key][index];
                try {
                    if (index === 0)
                    result = element(...args);
                    else {
                        if (result !== null && result !== undefined)    
                            result = element(...[...args, result]);
                        else
                            result = element(...args);
                    }  
                } catch (error) {
                    console.error(error);
                }
            }
            return result;
        }
    }
}

var metapage_frames = new MetapageFrames();



