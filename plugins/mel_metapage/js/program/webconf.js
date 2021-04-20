
function Webconf(frameconf_id, framechat_id, ask_id, key, ariane, wsp, ariane_size = 323, is_framed=null)
{
    if (is_framed === null && parent !== window)
        this._is_framed = true;
    else if (is_framed === null)
        this._is_framed = false;
    else
        this._is_framed = is_framed
    console.error("yolo",is_framed === null,parent !== window , this._is_framed);
    this.master_bar = `window.webconf_master_bar = new MasterWebconfBar('${frameconf_id}', '${framechat_id}', '${ask_id}', '${key}', ${ariane === undefined ? "undefined" : `'${ariane}'`}, '${html_helper.JSON.stringify(wsp)}', ${ariane_size}, ${this._is_framed})`;

    this.conf = $("#" + frameconf_id);
    this.chat = $("#" + framechat_id);
    this.chat.css("max-width", `${ariane_size}px`);
    this.window_selector = $("#" + ask_id);
    this.key = key;
    if ((ariane === null  || ariane === undefined))
    {
        if (wsp !== undefined && wsp !== null)
        {
            this.wsp = wsp;
            if (wsp.objects.channel !== null && wsp.objects.channel !== undefined && wsp.datas.allow_ariane)
            {
                if (typeof wsp.objects.channel === "string")
                    this.ariane = {room_id:wsp.objects.channel};
                else
                    this.ariane = {room_name:wsp.objects.channel.name};
                this.ariane._is_allowed = wsp.datas.allow_ariane;
            } 
            else
                this.ariane = {};
            this.ariane.ispublic = this.wsp.datas.ispublic === 0 ? false: true;
        }
    }
    else
        this.ariane = ariane;
    this.ariane.is_hide = false;
    this.ariane.size = ariane_size;
    // console.error(window.location.href, window.location.href.includes("_from=iframe"));
    this.is_framed = () => this._is_framed;
    this._is_minimized = false;
    this.jitsii = undefined;

    this.ariane_is_allowed = function ()
    {
        return this.ariane._is_allowed === undefined || this.ariane._is_allowed;
    }

    this.set_title = function()
    {
        let config = {
            _key:this.key
        };
        if (this.wsp !== undefined)
            config["_wsp"] = this.wsp.datas.uid;
        else if (this.have_ariane())
            config["_ariane"] = encodeURIComponent(JSON.stringify(this.ariane));
        const url = MEL_ELASTIC_UI.url("webconf", "", config);
        //window.history.replaceState({}, document.title, url);
        mel_metapage.Functions.title(url);
    }

    this.get_room = async function ()
    {
        return (this.ariane.ispublic ? "channel/" : "group/") + this.ariane.room_name;
    }

    this.have_ariane = function()
    {
        return this.ariane !== null && this.ariane !== undefined && this.ariane.room_name !== undefined && this.ariane_is_allowed();
    }

    this.ariane_is_hide = function()
    {
        return !this.have_ariane() || this.ariane.is_hide
    }

    this.go = async function (changeSrc = true)
    {
        this.busy();
        mel_metapage.Storage.remove("webconf_token");
        this.set_title();
        this.update();
        $("#mm-webconf").css("display", "");
        $("#mm-ariane").css("display", "none");
        if (this.have_ariane())
        {
            if (changeSrc)
                this.chat[0].src = rcmail.env.rocket_chat_url + await this.get_room();
            else
            {
                this.chat[0].contentWindow.postMessage({
                    externalCommand: 'go',
                    path: '/' + await this.get_room()
                }, '*')
            }
        }
        //this.conf[0].src = rcmail.env["webconf.base_url"] + "/" + this.key; 
        const domain = rcmail.env["webconf.base_url"].replace("http://", "").replace("https://", "");
        const options = {
            roomName: this.key,
            width: "100%",
            height: "100%",
            parentNode: document.querySelector('#mm-webconf'),
            configOverwrite: { 
                hideLobbyButton: true,
                startWithAudioMuted: true,
                startWithVideoMuted:true,
                toolbarButtons: [''
                // 'microphone', 'camera', 'closedcaptions', 'desktop', 'embedmeeting', 'fullscreen',
                // 'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
                // 'livestreaming', 'etherpad', 'sharedvideo', 'shareaudio', 'settings', 'raisehand',
                // 'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
                // 'tileview', 'select-background', 'download', 'help', 'mute-everyone', 'mute-video-everyone', 'security'
                ],
             },
             interfaceConfigOverwrite:{
                INITIAL_TOOLBAR_TIMEOUT:1,
                TOOLBAR_TIMEOUT:-1,
                HIDE_INVITE_MORE_HEADER:true,
                TOOLBAR_BUTTONS : [""]
            },
            userInfo: {
                email: rcmail.env["webconf.user_datas"].email,
                displayName: rcmail.env["webconf.user_datas"].name
            }
        };
        await wait(() => window.JitsiMeetExternalAPI === undefined);
        this.jitsii = new JitsiMeetExternalAPI(domain, options);
        $(this.jitsii._frame).on("load", () => {
            mel_metapage.Storage.set("webconf_token", true);
        });
        await wait(() => mel_metapage.Storage.get("webconf_token") === null);
        mel_metapage.Storage.remove("webconf_token");
        if (this.have_ariane())
            $("#mm-ariane").css("display", "");
        this.jitsii.executeCommand('avatarUrl', `${rcmail.env.rocket_chat_url}avatar/${rcmail.env.username}`);
        // this.jitsii.executeCommand("hangup");
        this.busy(false);
        MasterWebconfBar.start(this.master_bar);
    }

    this.minimize = function()
    {
        this._is_minimized = true;
        this.update();
    }

    this.full_screen = function()
    {
        this._is_minimized = false;
        this.update();
    }

    this.update = function ()
    {
        const pixel_correction = !this.is_framed() ? 60 : 0;
        if (this.have_ariane())
        {
            if (this.ariane.is_hide)
            {
                this.chat.css("display", "none");
                this.conf.css("width", "calc(100% - "+pixel_correction+"px)");
            }
            else
            {
                this.chat.css("display", "");
                this.conf.css("width", "calc(100% - "+(pixel_correction + this.ariane.size)+"px)");
            }
        }

        if (this._is_minimized)
        {
            this.conf.css("max-width", `${this.ariane.size}px`)
            .css("top", `${pixel_correction}px`)
            .css("right", '0')
            .css("left", "unset");
            if (this.have_ariane())
            {
                this.chat.css("max-height", `calc(100% - ${pixel_correction}px - 225px)`);
                if (!this.ariane_is_hide())
                    this.conf.css("max-height", "225px")
                else
                    this.conf.css("max-height", "")
            }
            else
                this.conf.css("max-height", "")

            if (this._is_framed)
            {
                this.conf.css("width", "100%");
                // this.chat.css("max-width", "100%");
                this.chat.css("width", "100%");
            }
        }
        else
        {
            this.conf.css("max-width", "")
            .css("top", "")
            .css("right", "")  
            .css("left", "") 
            .css("max-height", ""); 

            if (this.have_ariane())
                this.chat.css("max-height", "");

            if (this._is_framed)
            {
                // this.chat.css("max-width", "");
                this.chat.css("width", "");
            }
        }
    }

    this.busy = function(is_busy = true)
    {
        mel_metapage.Functions.busy(is_busy);
    }

    this.is_busy = function ()
    {
        return mel_metapage.Functions.is_busy();
    }

    this.show_selector = function()
    {
        this.window_selector.css("display", "");
    }

    this.remove_selector = function()
    {
        this.window_selector.remove();
        delete this.window_selector;
    }

    this.apply = function()
    {
        let val = $("#salon").val();
        this.ariane = {
            room_name:val[0],
            ispublic:true
        };
        this.go();
    }

}

class MasterWebconfBar {
    constructor(frameconf_id, framechat_id, ask_id, key, ariane, wsp, ariane_size = 340, is_framed = null) {
        this.webconf = new Webconf(frameconf_id, framechat_id, ask_id, key, ariane, (typeof wsp === "string" ? html_helper.JSON.parse(wsp) : wsp), ariane_size, is_framed);
        this.create_bar();
        if (!this.webconf.have_ariane()) 
            this.ariane.css("display", "none");
        else 
        {
            if (this.webconf.ariane_is_hide())
                this.hide_ariane(false);
            else
                this.show_ariane(false);
        }

        if (MasterWebconfBar.micro === undefined)
        {
            MasterWebconfBar.micro = Symbol("micro");
            MasterWebconfBar.video = Symbol("video");
        }
        $(".tiny-rocket-chat").css("display", "");
        if (this.webconf.wsp.datas.logo === "")
        {}
        else       
            this.logo.html(`<img src="${this.webconf.wsp.datas.logo}" />`).css("background-color", this.webconf.wsp.datas.color);
    }
    create_bar() {
        const element = function ($class) {
            return $(".webconf-toolbar").find(`.${$class}`);
        };
        $("body").append(rcmail.env["webconf.bar"]);
        this.document = element("conf-documents");
        this.ariane = element("conf-ariane");
        this.micro = element("conf-micro");
        this.micro.mute = function()
        {
            return MasterWebconfBar.mute(this, "icofont-mic", "icofont-mic-mute");
        };
        this.micro.demute = function()
        {
            return MasterWebconfBar.mute(this, "icofont-mic-mute", "icofont-mic");
        };
        this.call = element("conf-call-stop");
        this.video = element("conf-video");
        this.video.mute = function()
        {
            return MasterWebconfBar.mute(this, "icofont-video-cam", "icofont-video");
        };
        this.video.demute = function()
        {
            return MasterWebconfBar.mute(this, "icofont-video", "icofont-video-cam");
        };
        this.broadcast = element("conf-diffuser");
        if (MasterWebconfBar.isFirefox())
        {
            this.broadcast.css("display", "none");
        }
        this.hand = element("conf-participate");
        this.logo = element("tiny-webconf-menu");
        this.mozaik = element("conf-mozaique");
        this.toolbar_item = element;
    }

    update_toolbar()
    {
        if (this.logo.hasClass("hidden-toolbar"))
        {
            this.toolbar_item("wsp-toolbar-item").css("display", "");
            this.logo.removeClass("hidden-toolbar");
            $(".webconf-toolbar").css("background-color", "").find("v_separate").css("display", "");
            if (MasterWebconfBar.isFirefox())
            {
                this.broadcast.css("display", "none");
            }
        }
        else {
            this.toolbar_item("wsp-toolbar-item").css("display", "none");  
            $(".webconf-toolbar").css("background-color", "transparent").find("v_separate").css("display", "none");
            this.toolbar_item("empty").css("display", "");
            this.logo.addClass("hidden-toolbar");     
        }

    }

    switch_toolbar()
    {
        let _toolbar = $(".webconf-toolbar");
        let _switch = $(".conf-switch-toolbar");
        if (_toolbar.hasClass("switched-toolbar"))
        {
            _toolbar.find("v_separate").css("display", "");
            _toolbar.find(".wsp-toolbar-item").css("display", "");
            _toolbar.find(".wsp-toolbar-item-wsp").css("display", "none");
            _switch.css("display", "").find(".text-item").html("Espace");
            _toolbar.removeClass("switched-toolbar");
        }
        else {
            _toolbar.find("v_separate").css("display", "none");
            _toolbar.find(".wsp-toolbar-item").css("display", "none");
            _toolbar.find(".wsp-toolbar-item-wsp").css("display", "");
            _switch.css("display", "").find(".text-item").html("Webconf");
            _toolbar.addClass("switched-toolbar");
            // const tmp = _switch.css("display", "")[0].outerHTML;
            // _switch.remove();
            // _toolbar.append(tmp);
        }
    }

    async hangup()
    {
        //window.open("https://webconf.numerique.gouv.fr/questionnaireSatisfaction.html", '_blank');//.focus();
        delete window.webconf_master_bar;
        $(".webconf-toolbar").remove();
        this.send("hangup");
        //await wait(() => mel_metapage.Storage.get("webconf.hangup") !== true); 
        if (!this.webconf._is_minimized)
        {
            if (rcmail.env.last_frame_class === undefined)
                await mel_metapage.Functions.change_frame("home");
            else
                rcmail.command("last_frame");
        }          
        else
        {
            let querry = $(`#${rcmail.env.current_frame}`);
            if (querry.length > 0)
                querry.css("padding-right", "");
            else
                $("#layout-frame").css("width", "");
            //console.error("########", this.webconf.is_framed(), querry);
            if (!this.webconf.is_framed())
            {
                if (querry.length > 0)
                    querry.css("padding-left", "");
            }
        }
        $(".webconf-frame").remove();
    }

    toogle_film_strip(send = true)
    {
        // if (this.mozaik.hasClass("active"))
        //     this.mozaik.removeClass("active");
        // else
        //     this.mozaik.addClass("active");
        if (send)
            this.send("toggle_film_strip");
        
    }

    switch_ariane(send = true)
    {
        if (mel_metapage.Functions.is_busy())
            return;
        if (this.ariane.hasClass("active"))
            this.hide_ariane(send);
        else
            this.show_ariane(send);
    }

    hide_ariane(send = true)
    {
        if (send)
            this.send("hide_ariane");
        this.ariane.removeClass("active");
    }

    show_ariane(send = true)
    {
        if (send)
            this.send("show_ariane");
        this.ariane.addClass("active");
    }

    mute_demute(what, send = true)
    {
        switch (what) {
            case MasterWebconfBar.micro:
                if (this.micro.hasClass("muted"))
                {
                    this.micro.demute();
                    this.micro.addClass("active").removeClass("muted");
                }
                else
                {
                    this.micro.mute();
                    this.micro.removeClass("active").addClass("muted");
                }
                this.send("toggle_micro");
                break;
            case MasterWebconfBar.video:
                if (this.video.hasClass("muted"))
                {
                    //Activer la vidéo
                    this.video.demute();
                    this.video.addClass("active").removeClass("muted");
                }
                else
                {
                    //désactiver la vidéo
                    this.video.mute();
                    this.video.removeClass("active").addClass("muted");
                }
                this.send("toggle_video");
                break;
            default:
                break;
        }
    }

    share_screen(send = true)
    {
        if (send)
            this.send("share_screen");
    }

    async nextcloud(send = true)
    {
        if (mel_metapage.Functions.is_busy())
            return;
        const show = () => {
            //console.error("show time", $("iframe.stockage-frame").length);
            $(".stockage-frame").css("display", "");
            if ($("iframe.stockage-frame").length > 0)
            {
                $("iframe.stockage-frame").css("padding-right", `${this.webconf.ariane.size}px`);
            }
            else
            {
                $("#layout-frames").css("width", "auto");
                $("#layout-content").css("padding-right", `${this.webconf.ariane.size}px`);
            }
            return true;
        };
        const active = this.document.hasClass("active");
        this.update_screen(active);
        if (active)
        {
            if (send)
                this.send("nextcloud_close");
            this.document.removeClass("active");
            this.webconf._is_minimized = false;
            $(".stockage-frame").css("display", "none");
            if ($("iframe.stockage-frame").length === 0)
            {
                $("#layout-frames").css("width", "");
                $("#layout-content").css("padding-right", "");
            }
        }
        else
        {
            if (send)
                this.send("nextcloud_open");
            this.webconf._is_minimized = true;    
            await mel_metapage.Functions.change_frame("stockage", true, true);
            //this.document.addClass("active");
            // console.error("length", $("iframe.stockage-frame").length === 0 , $(".stockage-frame").length !== 0, $("iframe.stockage-frame").length === 0 && $(".stockage-frame").length !== 0)
            // let already_shown = false;
            // if ($("iframe.stockage-frame").length === 0 && $(".stockage-frame").length !== 0)
            //     already_shown = show();
            // await mel_metapage.Functions.change_frame("stockage", false, true);
            // await wait(() => $(".stockage-frame").length === 0);
            // if (!already_shown)
            //     show();

        }
    }

    change_frame(active)
    {
        this.update_screen(active);
        if (!active)
        {
            this.send("minimize");
            this.webconf._is_minimized = true;
        }
        else
        {
            this.send("full_screen");
            this.webconf._is_minimized = false;
        }
    }

    update_screen(active)
    {
        if (this.webconf._is_framed)
        {
            let frame = $(".webconf-frame");
            if (!active)
            {
                frame.css("position", "absolute")
                .css("right", "0")
                .css("max-width", `${this.webconf.ariane.size+1}px`)
                .css("padding-left", "0")
                ;
            }
            else
            {
                frame.css("position", "")
                .css("right", "")
                .css("max-width", ``)
                .css("padding-left", "")
                ;               
            }
        }
    }

    send(func)
    {
        workspaces.sync.PostToParent({
            exec: `rcmail.env.wb_listener.${func}()`,
            // child: false
        });
    }

    static start(bar) {
        workspaces.sync.PostToParent({
            exec: `window.rcmail.env['webconf.bar'] = \`${rcmail.env['webconf.bar']}\``,
            child: false
        });
        workspaces.sync.PostToParent({
            exec: Webconf+';window.Webconf = Webconf;',
            child: false
        });
        workspaces.sync.PostToParent({
            exec: MasterWebconfBar+';window.MasterWebconfBar = MasterWebconfBar;',
            child: false
        });
        workspaces.sync.PostToParent({
            exec: bar,
            child: false
        });
    }
    static mute(e,old, $new)
    {
        return e.find("span").removeClass(old).addClass($new);
    }
    static isFirefox()
    {
        return  typeof InstallTrigger !== 'undefined';
    }
}

class ListenerWebConfBar
{
    constructor(webconf = new Webconf())
    {
        this.webconf = webconf;
    }

    show_ariane()
    {
        this.webconf.ariane.is_hide = false;
        this.webconf.update();
    }

    hide_ariane()
    {
        this.webconf.ariane.is_hide = true;
        this.webconf.update();
    }

    toggle_video()
    {
        this.webconf.jitsii.executeCommand('toggleVideo');
    }

    toggle_micro()
    {
        this.webconf.jitsii.executeCommand('toggleAudio');
    }

    share_screen()
    {
        this.webconf.jitsii.executeCommand('toggleShareScreen');
    }

    toggle_film_strip()
    {
        this.webconf.jitsii.executeCommand('toggleTileView');
    }

    nextcloud_open()
    {
        this.minimize();
    }

    nextcloud_close()
    {
        this.webconf.full_screen();
    }

    minimize()
    {
        console.error("minimze", "minimize !");
        this.webconf.minimize();
    }

    async hangup()
    {
        this.webconf.jitsii.executeCommand('hangup');
        // mel_metapage.Storage.set("webconf.hangup", true);
        this.webconf.jitsii.dispose();
    }
}

$(document).ready(() => {
    const tmp = async () => {
        await wait(() => rcmail !== undefined && rcmail.busy !== undefined);
        try {
            console.error("here 1");
            $("head").append(`<script src='${rcmail.env["webconf.base_url"]}/external_api.js'></script>`);
            let webconf = new Webconf("mm-webconf", "mm-ariane", "room-selector", rcmail.env["webconf.key"], rcmail.env["webconf.ariane"], rcmail.env["webconf.wsp"]);
            if (webconf.have_ariane())
            {
                console.error("here 2");
                await webconf.go();
                webconf.remove_selector();
            }
            else
                webconf.show_selector();
                console.error("here 3");
            rcmail.env.webconf = webconf;
            rcmail.env.wb_listener = new ListenerWebConfBar(rcmail.env.webconf);  
            if (await mel_metapage.Functions.ask("window.webconf_added") === mel_metapage.Storage.unexist)
            {
                mel_metapage.Functions.call("window.webconf_added = 'a'");
                const donothide = function () {
                    if (window.webconf_master_bar === undefined)
                        return;
                    if (window.webconf_master_bar.webconf.is_framed())
                        $(".webconf-frame").removeClass("mm-frame").css("padding-top", "60px");
                    else
                        $(".webconf-frame.mm-frame").addClass("webconf-mm-frame").removeClass("mm-frame");
                    // if (window.webconf_master_bar !== undefined)
                    // {
                    //     console.error('window.webconf_master_bar.send("minimize");', "" + window.webconf_master_bar.send);
                    // }
                };
                const updateframe = (eClass, changepage, isAriane, querry, id) => {
                    if (window.webconf_master_bar === undefined)
                        return;
                    if (window.webconf_master_bar.webconf.is_framed())
                    {
                        $(".webconf-frame").addClass("mm-frame").css("padding-top", "");
                        if ($(`iframe#${id}`).length > 0)
                        {
                            $(`iframe#${id}`).css("padding-right", `${window.webconf_master_bar.webconf.ariane.size}px`);
                            $("#layout-frames").css("width", "");
                        }
                        else
                        {
                            $("#layout-frames").css("width", `${window.webconf_master_bar.webconf.ariane.size}px`).css("display", "");
                            //$("#layout-content").css("padding-right", `${window.webconf_master_bar.webconf.ariane.size}px`);
                        }
                    }
                    else
                    {
                        $(".webconf-frame.webconf-mm-frame").addClass("mm-frame").removeClass("webconf-mm-frame");
                        $("iframe.mm-frame").css("padding-left", 0);
                        $(`iframe#${id}`).css("padding-right", `${window.webconf_master_bar.webconf.ariane.size}px`);
                    }
                    window.webconf_master_bar.change_frame(false);
                    window.webconf_master_bar.webconf.set_title();
                    $(".tiny-rocket-chat").css("display", "none");
                    if (eClass !== "stockage")
                        window.webconf_master_bar.document.removeClass("active");
                    else
                        window.webconf_master_bar.document.addClass("active");
                }
                console.error(`metapage_frames.addEvent("changepage.before", ${donothide})`);
                mel_metapage.Functions.call(`metapage_frames.addEvent("changepage.before", ${donothide})`);
                mel_metapage.Functions.call(`metapage_frames.addEvent("onload.after", ${updateframe})`);
                mel_metapage.Functions.call(`metapage_frames.addEvent("open.after", ${updateframe})`);
            }     
        } catch (error) {
            console.error(error);
        }
    };
    // console.error(rcmail._events);
    // for (const key in rcmail._events.init) {
    //     if (Object.hasOwnProperty.call(rcmail._events.init, key)) {
    //         const element = rcmail._events.init[key];
    //         console.error(element.func);
    //     }
    // }
    //rcmail.addEventListener("init", async () => {
    tmp();
    $(".footer").css("display", "none");
    //});
});