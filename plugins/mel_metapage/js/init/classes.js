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
        this.ariane.popUp.addClass("tiny-rocket-chat-card");
        this.ariane.popUp.css("display", "initial");
        this.button.stop();
        this.is_show = true;
    }

    hide()
    {
        this.ariane.popUp.css("display", "none");
        this.ariane.popUp.removeClass("tiny-rocket-chat-card");
        this.button.button.css("display", "initial");
        this.ariane.disable();
        this.is_show = false;
    }
}

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

    enable()
    {
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
                let height = $(window).height()-60 + "px";
                mel_metapage.PopUp.ariane.ariane.popUp.css("height", height);
                mel_metapage.PopUp.ariane.ariane.card.card.card.css("height", height);
                mel_metapage.PopUp.ariane.ariane.card.body.card.css("height", height);
            }
        }
    }

    disable()
    {
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