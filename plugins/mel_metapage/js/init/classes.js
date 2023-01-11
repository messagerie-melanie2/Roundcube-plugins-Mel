const is_touch = function(){
    return $("html").hasClass("touch");
}

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
        // $(function () {
        //     $('[data-toggle="tooltip"]').tooltip()
        //   })
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
        this.ariane.popUp.css("min-height", "");
        this.ariane.card.card.card.css("position", "absolute");
        this.ariane.card.card.card.css("right", "0");
        this.ariane.enable();
        this.ariane.popUp.contents().find("#rocket_chat_frame").css("padding-top", "0px");
        this.ariane.popUp.addClass("tiny-rocket-chat-card");
        this.ariane.popUp.css("display", "initial");
        this.ariane.popUp.css("width", "100%");
        this.ariane.popUp.css("padding-top", "0");
        this.ariane.popUp.css("margin-top", "0");
        //this.ariane.popUp.css("margin-top", "-1.25em");
        this.button.stop();
        if (rcmail.env.mel_metapage_mail_configs["mel-chat-placement"] === rcmail.gettext("up", "mel_metapage"))
            this.button.button.find(".icon-mel-message").removeClass("icon-mel-message").addClass("icon-mel-close");
        else
            this.button.button.css("display", "none");

        this.is_show = true;
        // if ($("#pop-up-resizer").length === 0)
        //     ArianePopUp.splitter_init(this.ariane.popUp);
        window.onresize();
    }

    hide()
    {
        this.is_show = false;

        if (this.is_anchor())
            this.anchor();

        this.ariane.popUp.contents().find("#rocket_chat_frame").css("padding-top", "");
        this.ariane.popUp.css("display", "none");
        this.ariane.popUp.css("height", "100%");
        this.ariane.popUp.css("min-height", "100%");
        this.ariane.popUp.css("flex", "1 0 auto");
        this.ariane.popUp.removeClass("tiny-rocket-chat-card");
        this.button.button.css("display", "initial");
        this.ariane.popUp.css("padding-top", "");
        this.ariane.disable();
        this.ariane.popUp.css("width", "100%");

        if (rcmail.env.mel_metapage_mail_configs["mel-chat-placement"] === rcmail.gettext("up", "mel_metapage"))
            this.button.button.find(".icon-mel-close").removeClass("icon-mel-close").addClass("icon-mel-message");

        $("html").removeClass("ariane-started");
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
        let context = $("body");
        this.is_touch = is_touch();
        this.load_ended = false;
        if ($(".discussion-frame").length > 0)
        {
            this.popUp = $(".discussion-frame");
            this.card = {
                card:new ArianeCard(context,"card-disabled", "card","ariane-card"),
                header:new ArianeCard(context,"card-header-disabled", "card-header", "ariane-card-header"),
                body: new ArianeCard(context,"card-body-disabled", "card-body", "ariane-card-body")
            };
            this.load_ended = true;
        }
        else if ($("#rocket_chat_frame").length > 0)
        {
            this.popUp = $("#rocket_chat_frame");
            this.card = {
                card:new ArianeCard(context,"card-disabled", "card","ariane-card"),
                header:new ArianeCard(context,"card-header-disabled", "card-header", "ariane-card-header"),
                body: new ArianeCard(context,"card-body-disabled", "card-body", "ariane-card-body")
            };
            this.load_ended = true;
        }
        else{
            rcmail.env.frame_created = false;
            mm_st_CreateOrOpenModal("rocket", false);
            new Promise(async (a, b ) => {
                while (!rcmail.env.frame_created || $(".discussion-frame").length == 0/* || $(".discussion-frame").contents().find("#rocket_chat_frame").length == 0*/) {
                    await delay(500);
                }
                this.popUp = $(".discussion-frame");
                this.card = {
                    card:new ArianeCard(context,"card-disabled", "card","ariane-card"),
                    header:new ArianeCard(context, "card-header-disabled", "card-header", "ariane-card-header"),
                    body: new ArianeCard(context, "card-body-disabled", "card-body", "ariane-card-body")
                };
                while (rcmail.env.ariane_is_logged !== true) {
                    await delay(500);
                }
                this.load_ended = true;
            });
        }
    }

    anchor()
    {
        if (!this.is_anchor())
        {
            this.card.card.card.css("flex","0 0 calc(25% - 60px)");
            this.card.card.card.css("position", "relative");
            //this.popUp.css("width", "initial");
            //if (!is_touch())
                //this.popUp.css("margin-top", "60px");
            this.card.card.card.find(".card-anchor").addClass(ArianeFrame.unanchor).removeClass(ArianeFrame.anchor);

            if (rcmail.env.task === "mail")
            {
                $("#layout-content").css("overflow", "hidden").find(".header").css("overflow-x", "auto").css("overflow-y", "hidden");
            }

            $("html").addClass("ariane-started");
            $(window).resize();
            //ArianePopUp.set_width(this.popUp);
        }
        else {
            this.card.card.card.css("flex","");
            // this.popUp.css("flex","1 0 auto");
            //this.popUp.css("height", '');
            //this.popUp.css("position", "");
            this.card.card.card.css("position", "absolute");
            //this.popUp.css("width", "");
            //if (!is_touch())
                //this.popUp.css("margin-top", "");
            this.card.card.card.find(".card-anchor").removeClass(ArianeFrame.unanchor).addClass(ArianeFrame.anchor);   
            
            if (rcmail.env.task === "mail")
            {
                $("#layout-content").css("overflow", "").find(".header").css("overflow-x", "").css("overflow-y", "");
            }

            $("html").removeClass("ariane-started");
            $(window).resize();
            //ArianePopUp.set_width(this.popUp);
        }

    }

    is_anchor()
    {
        return this.card.card.card.find(".card-anchor").hasClass(ArianeFrame.unanchor);
    }

    enable()
    {
        this.card.body.card.css("height", "");
        this.card.card.card.css("width", "calc(25% - 60px)");
        this.card.card.card.css("height", "");
        this.popUp.css("padding-left", "initial");
        this.popUp.addClass("ariane-popup");
        // let height = $(window).height()-60 + "px";
        // this.popUp.css("height", height);
        // this.card.card.card.css("height", height);
        // this.card.body.card.css("height", height);
        this.card.card.enable();
        this.card.card.card.parent().css("margin", "0");
        this.card.body.enable();
        this.card.header.enable();
        window.onresize = function ()
        {
            if (mel_metapage.PopUp.ariane !== undefined && mel_metapage.PopUp.ariane.is_show)
            {
                let height = $(window).height();
                //console.log("height 1", height);
                mel_metapage.PopUp.ariane.ariane.popUp.css("height", (height-60-45)+ "px");
                mel_metapage.PopUp.ariane.ariane.card.card.card.css("height", "100%");
                mel_metapage.PopUp.ariane.ariane.card.body.card.css("height", (height)+ "px");
                new Promise(async (a,b) => {
                    const exec = function ()
                    {
                        if (false && is_touch())
                        {
                            // mel_metapage.PopUp.ariane.ariane.popUp.css("top", 0);
                            // mel_metapage.PopUp.ariane.ariane.popUp.css("margin-top", "");
                            //console.log("height",height);
                            //mel_metapage.PopUp.ariane.ariane.card.card.card.css("height", (height)+ "px");
                            mel_metapage.PopUp.ariane.ariane.popUp.css("height", "100%");
                        }
                        else {
                            //mel_metapage.PopUp.ariane.ariane.popUp.css("top", "60px");
                            mel_metapage.PopUp.ariane.ariane.popUp.css("height", "calc(100% - 58px)");
                        }
                    }
                    let stop = false;
                    let tmp = 0;

                    if (window.location.href.includes("&_action=chat"))
                        return;

                    exec();

                    while ((this.is_touch ? is_touch() : !is_touch())) {
                        await delay(100);
                        tmp += 100;
                        if (tmp === 1000)
                            break;
                    }

                    if (window.location.href.includes("&_action=chat"))
                        return;

                    this.is_touch = is_touch();
                    exec();
                    // if (is_touch())
                    // {
                    //     mel_metapage.PopUp.ariane.ariane.popUp.css("top", 0);
                    //     mel_metapage.PopUp.ariane.ariane.popUp.css("margin-top", "");
                    //     //console.log("height",height);
                    //     mel_metapage.PopUp.ariane.ariane.card.card.card.css("height", (height)+ "px");
                    //     //mel_metapage.PopUp.ariane.ariane.card.body.card.css("height", (height)+ "px");
                    // }
                    // else
                    // {
                    //     mel_metapage.PopUp.ariane.ariane.popUp.css("top", "60px");
                    //     //mel_metapage.PopUp.ariane.ariane.card.card.card.css("height", (height-60)+ "px");
                    // }
                    //clearTimeout(prom_timeout);
                });
            }
            else if (!mel_metapage.PopUp.ariane.is_show)
            {
                mel_metapage.PopUp.ariane.ariane.popUp.css("height", "100%");
            }
        }
        window.onresize();
    }

    disable()
    {
        this.popUp.css("padding-left", "");
        this.popUp.css("margin-top", "");
        this.card.card.card.parent().css("margin", "");
        this.popUp.removeClass("ariane-popup");
        this.card.body.card.css("height", "100%");
        this.card.card.card.css("width", "100%");
        this.card.card.card.css("height", "100%");
        this.card.card.disable();
        this.card.body.disable();
        this.card.header.disable();
        this.card.card.card.css("display", "none");
        window.onresize = null;
        this.popUp.css("height", "100%");
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

ArianeFrame.unanchor = "icon-mel-popup-external";
ArianeFrame.anchor = "icon-mel-popup-anchor";

class ArianeCard
{
    constructor(context,classDisabled, ...classEnabled)
    {
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
            this.card.css("display", "").removeClass(this.disabled).addClass(this.enabled_string(false));
    }

    disable()
    {
        if (this.is_enabled())
            this.card.css("display", "").removeClass(this.enabled_string(false)).addClass(this.disabled)
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
        if (rcmail.env.mel_metapage_mail_configs["mel-chat-placement"] === rcmail.gettext("up", "mel_metapage"))
            this.button.removeClass("disabled").removeAttr("disabled");

        this.button.css("display", "initial");
    }

    hide_button = function()
    {
        //console.log("test", this.hide_button + "", rcmail.env.mel_metapage_mail_configs["mel-chat-placement"] === rcmail.gettext("up", "mel_metapage"), rcmail.env.mel_metapage_mail_configs["mel-chat-placement"], rcmail.gettext("up", "mel_metapage"))
        if (rcmail.env.mel_metapage_mail_configs["mel-chat-placement"] === rcmail.gettext("up", "mel_metapage"))
            this.button.addClass("disabled").attr("disabled", "disabled").css("display", "initial");
        else
            this.button.css("display", "none");
    }
    
    place_button = function(bottom, right)
    {
        this.button.css("bottom", bottom);
        this.button.css("right", right);
    }

    place_button_top = function(top, right)
    {
        this.button.css("top", top);
        this.button.css("right", right);
    }

    loading()
    {
        this.font.removeClass(this.default_font).addClass("spinner-grow" + (rcmail.env.mel_metapage_mail_configs["mel-chat-placement"] === rcmail.gettext("up", "mel_metapage") ? " spinner-grow-sm" : "")).parent().addClass("disabled");
    }

    stop()
    {
        this.font.removeClass("spinner-grow").addClass(this.default_font).parent().removeClass("disabled");  
    }
}

ArianeButton.default = function () {
    return new ArianeButton(".tiny-rocket-chat", "icon-mel-message");
}

class MetapageFrames {
    constructor()
    {
        this._events = {};
        this._break = false;
    }

    open(key, changePage = true)
    {
        mm_st_OpenOrCreateFrame(key, changePage);
    }

    break()
    {
        this._break = true;
    }

    unbreak()
    {
        this._break = false;
    }

    async openAsync(key, changePage = true, delay_ms = 500)
    {
        mm_st_OpenOrCreateFrame(key, changePage);
        while (!rcmail.env.frame_created) {
            await delay(delay_ms)
        }
        return true;
    }

    addEvent(key, event, ignore_context = false)
    {
        if (ignore_context)
        {
            event = {
                ignore_context:true,
                ev:event
            };
        }

        if (this._events[key] === undefined)
            this._events[key] = [];
        this._events[key].push(event);
    }

    triggerEvent(key, ...args)
    {
        if (this._events[key] === undefined || this._break)
            return;
        else {
            let result = null;

            for (let index = 0; index < this._events[key].length; index++) {
                const element = typeof this._events[key][index] != 'function' && this._events[key][index]?.ignore_context ? eval(this._events[key][index].ev + '') : this._events[key][index];
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

                if (result === "break")
                {
                    this.break();
                    break;
                }
            }
            
            return result;
        }
    }
}

var metapage_frames = new MetapageFrames();



class Roundcube_Mel_Color{

    constructor() {
        this.init().setup();
    }

    init()
    {
        this.color = '';
        return this;
    }

    setup()
    {
        this.color = mel_metapage.Storage.get(Roundcube_Mel_Color.storageKey);

        if (!this.color){
            this.color = rcmail.get_cookie(Roundcube_Mel_Color.cookieKey);
        }

        if (!this.color){
            if($('html').hasClass('dark-mode')) this.color = Roundcube_Mel_Color.dark;
            else this.color = Roundcube_Mel_Color.light;
        }
        return this;
    }

    isDarkMode()
    {
        return this.color === Roundcube_Mel_Color.dark;
    }

    isLightMode()
    {
        return this.color === Roundcube_Mel_Color.light;
    }

    switch_color()
    {
        Roundcube_Mel_Color.switch_theme_function();
        return this.setup();
    }

    setColor(color)
    {
        if (color === Roundcube_Mel_Color.light && this.isDarkMode()) this.switch_color();
        else if (color === Roundcube_Mel_Color.dark && this.isLightMode()) this.switch_color();
        else if (color !== Roundcube_Mel_Color.dark && color !== Roundcube_Mel_Color.light)
        {
            throw `###[Roundcube_Mel_Color]La couleur ${color} n'éxiste pas...`;
        }
        return this;
    }

    update()
    {
        return this.setup();
    }
}

Object.defineProperty(Roundcube_Mel_Color, 'light', {
    enumerable: false,
    configurable: false,
    writable: false,
    value:'light'
});

Object.defineProperty(Roundcube_Mel_Color, 'dark', {
    enumerable: false,
    configurable: false,
    writable: false,
    value:'dark'
});

Object.defineProperty(Roundcube_Mel_Color, 'storageKey', {
    enumerable: false,
    configurable: false,
    writable: false,
    value:'colorMode'
});

Object.defineProperty(Roundcube_Mel_Color, 'cookieKey', {
    enumerable: false,
    configurable: false,
    writable: false,
    value:'colorMode'
});

Object.defineProperty(Roundcube_Mel_Color, 'html_dark_mode_class', {
    enumerable: false,
    configurable: false,
    writable: false,
    value:'dark-mode'
});

Object.defineProperty(Roundcube_Mel_Color, 'switch_theme_function', {
    enumerable: false,
    configurable: false,
    writable: false,
    value:() => {
        MEL_ELASTIC_UI.switch_color();
    }
});

class MelEnum
{
	constructor(json)
	{
		for (const key in json) {
			if (Object.hasOwnProperty.call(json, key)) {
				const element = json[key];
				Object.defineProperty(this, key, {
					enumerable: true,
					configurable: false,
					writable: false,
					value:element
				});
			}
		}
	}

	static createEnum(name, json)
	{
		if (MelEnum.createEnum.enums === undefined) MelEnum.createEnum.enums = {};
		
		if (MelEnum.createEnum.enums[name] !== undefined) throw 'Already exist';
		else MelEnum.createEnum.enums[name] = new MelEnum(json);

		return MelEnum.createEnum.enums[name];
	}

	static get(name) {
		return MelEnum.createEnum.enums[name];
	}
}


var _paq = _paq || [];
_paq.push(['setDocumentTitle', rcmail.env.task]);
_paq.push(['setDownloadClasses', ["LienTelecharg","document"]]);
_paq.push(['trackPageView']);
_paq.push(['enableLinkTracking']);
(function() {
var u="//audience-sites.din.developpement-durable.gouv.fr/";
_paq.push(['setTrackerUrl', u+'piwik.php']);
_paq.push(['setSiteId','1503']);
var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
g.type='text/javascript'; g.async=true; g.defer=true; g.src=u+'piwik.js'; s.parentNode.insertBefore(g,s);
})();

$(document).ready(function() {
  piwikTrackClick(rcmail.env.matomo_tracking);
});

rcmail.addEventListener('on_create_window.matomo', () => {
  piwikTrackClick(rcmail.env.matomo_tracking_popup);
})

rcmail.addEventListener('on_click_button.matomo', (args) => {
  _paq.push(['trackEvent', 'Bouton', args, 'Clic']);
})


function piwikTrackVideo(type,section,page,x1){
_paq.push(['trackEvent', 'Video', 'Play', page]);
}

function piwikTrackClick(config_value) {
  if (config_value) {
    for (const key in config_value) {
      if (Object.hasOwnProperty.call(config_value, key)) {
        const element = config_value[key];
        $(key).on('click', () => {
          _paq.push([...element]);
        });
      }
    }
  }
}