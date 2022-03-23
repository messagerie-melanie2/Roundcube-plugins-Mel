/**
 * Gère la webconf
 * @param {string} frameconf_id Id de l'iframe qui contient la webconf
 * @param {string} framechat_id Id de l frame qui contient rocket.chat
 * @param {string} ask_id Id de la div qui permet de configurer la webconf
 * @param {string} key Room de la webconf 
 * @param {string} ariane Room ariane
 * @param {JSON} wsp Infos de l'espace de travail si il y en a
 * @param {int} ariane_size Taille en largeur et en pixel de la frale ariane 
 * @param {bool} is_framed Si la webconf est dans une frame ou non 
 */
function Webconf(frameconf_id, framechat_id, ask_id, key, ariane, wsp, ariane_size = 323, is_framed=null)
{
    ///console.log("webconf", key);
    //String qui differencie un groupe privé d'un groupe public
    const private_key = "/group"; 

    if (is_framed === null && parent !== window)
        this._is_framed = true;
    else if (is_framed === null)
        this._is_framed = false;
    else
        this._is_framed = is_framed

    if (this._is_framed)
        $(".webconf-fullscreen").css("top", "5px");

    // if ($("html").hasClass("layout-phone"))
    // {
    //     wsp = null;
    //     ariane = "@home";
    // }

    /**
     * Génère un string de la création d'une MasterBar qui sera évalué dans dans une fenêtre parente.
     * @returns {string}
     */
    this.master_bar = function()
    {
        const master_bar_config = this.master_bar_config;
        return  `window.webconf_master_bar = new MasterWebconfBar('${master_bar_config.frameconf_id}', '${master_bar_config.framechat_id}', '${master_bar_config.ask_id}', '${master_bar_config.key}', ${master_bar_config.ariane === undefined || master_bar_config.ariane === null ? "undefined" : `'${html_helper.JSON.stringify(master_bar_config.ariane)}'`}, '${html_helper.JSON.stringify(master_bar_config.wsp)}', ${master_bar_config.ariane_size}, ${master_bar_config.is_framed})`;
    }

    //Configuration de la masterbar
    this.master_bar_config = {
        framechat_id:frameconf_id,
        framechat_id:framechat_id,
        ask_id:ask_id,
        key:key,
        ariane: (typeof ariane === "string" ? {
            ispublic:!ariane.includes(private_key),
            room_name:(' ' + ariane).slice(1).replaceAll(private_key, ""),
            is_hide:ariane.includes("@")
        } : ariane),
        wsp:wsp,
        ariane_size:ariane_size,
        is_framed:this._is_framed
    };

    //Frame webconf
    this.conf = $("#" + frameconf_id);
    //Frame rocket.chat
    this.chat = $("#" + framechat_id);
    this.chat.css("max-width", `${ariane_size}px`);
    //Div configuration
    this.window_selector = $("#" + ask_id);
    //room webconf
    this.key = key;

    if ((ariane === null  || ariane === undefined)) //Si on est en mode espace de travail
    {
        if (wsp !== undefined && wsp !== null) //Si il n'y a pas de bugs
        {
            if (wsp.objects["useful-links"] !== undefined)
                wsp.objects["useful-links"] = null;

            this.wsp = wsp;
            if (this.wsp.objects !== null)
            {
                if (wsp.objects.channel !== null && wsp.objects.channel !== undefined && wsp.datas.allow_ariane) //Si il y a une room ariane
                {
                    if (typeof wsp.objects.channel === "string")
                        this.ariane = {room_id:wsp.objects.channel};
                    else
                        this.ariane = {room_name:wsp.objects.channel.name, is_hide:false};

                    this.ariane._is_allowed = wsp.datas.allow_ariane;
                } 
                else
                    this.ariane = {};
            }
            else
            {
                console.warn("/!\\ [Webconf]wsp.objects est nul, cela peux entrainer des disfonctionnements.", this.wsp);
                this.ariane._is_allowed = false;
            }

            if (this.wsp.datas !== null)
                this.ariane.ispublic = this.wsp.datas.ispublic === 0 ? false: true;
            else{
                console.warn("/!\\ [Webconf]wsp.datas est nul, cela peux entrainer des disfonctionnements.", this.wsp);
                this.ariane.ispublic = true;
            }
        }
        else
            this.ariane = {};
    }
    else
        this.ariane = ariane;

    if (typeof this.ariane === "string") //Si l'on vient d'une url
    {
        this.ariane = {
            ispublic:!this.ariane.includes(private_key),
            room_name:this.ariane.replaceAll(private_key, "")
        };
    }

    if (this.ariane.is_hide === undefined) //on affiche par défaut
        this.ariane.is_hide = false;

    //Taille de la frame rocket.chat
    this.ariane.size = ariane_size;

    /**
     * Renvoie vrai si la webconf est dans un iframe
     * @returns {boolean}
     */
    this.is_framed = () => this._is_framed;
    
    //Si la frame webconf est minimisée ou non
    this._is_minimized = false;
    //Api jitsi
    this.jitsii = undefined;

    /**
     * Si on a le droit d'entrer dans le salon ariane
     * @returns {boolean}
     */
    this.ariane_is_allowed = function ()
    {
        return this.ariane._is_allowed === undefined || this.ariane._is_allowed;
    }

    /**
     * Met à jours l'url du navigateur
     */
    this.set_title = function()
    {
        let config = {
            _key:this.key
        };

        if (this.wsp !== undefined)
            config["_wsp"] = this.wsp.datas.uid;
        else if (this.have_ariane())
            config["_ariane"] = (`${this.ariane.room_name}${(this.ariane.ispublic !== true ? private_key : "")}`);
        
        const url = MEL_ELASTIC_UI.url("webconf", "", config);
        mel_metapage.Functions.title(url.replace(`${rcmail.env.mel_metapage_const.key}=${rcmail.env.mel_metapage_const.value}`, ""));
    }

    /**
     * Récupère la room rocket.chat
     * @returns {string}
     */
    this.get_room = async function ()
    {
        return (this.ariane.ispublic ? "channel/" : "group/") + this.ariane.room_name;
    }

    /**
     * Si il y a une room rocket.chat
     * @returns {boolean}
     */
    this.have_ariane = function()
    {
        return this.ariane !== null && this.ariane !== undefined && this.ariane.room_name !== undefined && this.ariane_is_allowed();
    }

    /**
     * Rocket.Chat est affiché ou non
     * @returns {boolean}
     */
    this.ariane_is_hide = function()
    {
        return !this.have_ariane() || this.ariane.is_hide
    }

    this.jwt = async function()
    {
        if (this._jwt === undefined)
        {
            rcmail.http_get('webconf/jwt', {
				_room : this.key,
			}, rcmail.display_message(rcmail.get_label('loading'), 'loading'));
            while (this._jwt === undefined) {
                await delay(500);
            }
        }
        return this._jwt;
    }

    /**
     * Lance la webconférence ainsi que Rocket.Chat
     * @param {bool} changeSrc Si faux, utilise une commande Rocket.Chat, si vrai, modifie la source de l'iframe rc
     */
    this.go = async function (changeSrc = true)
    {
        rcmail.triggerEvent("init_ariane", "mm-ariane");
        this.busy(); //loading
        mel_metapage.Storage.remove("webconf_token");
        this.update(); //Maj1
        $("#mm-webconf").css("display", "");
        $("#mm-ariane").css("display", "none");

        if (!this.isPhone())
        {
            if (this.have_ariane() && this.ariane.room_name !== "@home") //Si on a une room ariane
            {
                //on affiche
                if (changeSrc)
                    this.chat[0].src = rcmail.env.rocket_chat_url + await this.get_room();
                else
                {
                    this.chat[0].contentWindow.postMessage({
                        externalCommand: 'go',
                        path: `/${await this.get_room()}`
                    }, '*')
                }
            }
            else { //Sinon, on cache
                this.chat[0].src = rcmail.env.rocket_chat_url;
                this.ariane.is_hide = true;
                this.ariane.room_name = "@home";
                this.ariane._is_allowed = "true";
            }
        }
        else {
            this.chat[0].src = rcmail.env.rocket_chat_url;
            parent.$("#touchmelmenu").attr("disabled", "disabled").addClass("disabled");
            parent.$("#user-up-panel").attr("disabled", "disabled").addClass("disabled").css("pointer-events", "none");
        }

        this.set_title();

        //Init jitsi
        const domain = rcmail.env["webconf.base_url"].replace("http://", "").replace("https://", "");
        const options = {
            jwt:await this.jwt(),
            roomName: this.key,
            width: "100%",
            height: "100%",
            parentNode: document.querySelector('#mm-webconf'),
            configOverwrite: { 
                hideLobbyButton: true,
                startWithAudioMuted: false,
                startWithVideoMuted:true,
                prejoinPageEnabled: false,
                toolbarButtons: ['filmstrip'
                // 'microphone', 'camera', 'closedcaptions', 'desktop', 'embedmeeting', 'fullscreen',
                // 'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
                // 'livestreaming', 'etherpad', 'sharedvideo', 'shareaudio', 'settings', 'raisehand',
                // 'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
                // 'tileview', 'select-background', 'download', 'help', 'mute-everyone', 'mute-video-everyone', 'security'
                ],
             },
             interfaceConfigOverwrite:{
                // INITIAL_TOOLBAR_TIMEOUT:1,
                // TOOLBAR_TIMEOUT:-1,
                HIDE_INVITE_MORE_HEADER:true,
                TOOLBAR_BUTTONS : [""]
            },
            userInfo: {
                email: rcmail.env["webconf.user_datas"].email,
                displayName: rcmail.env["webconf.user_datas"].name.split("(")[0].split("-")[0]
            }
        };

        await wait(() => window.JitsiMeetExternalAPI === undefined); //Attente que l'api existe

        this.jitsii = new JitsiMeetExternalAPI(domain, options);
        $(this.jitsii._frame).on("load", () => {
            mel_metapage.Storage.set("webconf_token", true);
        });

        await wait(() => mel_metapage.Storage.get("webconf_token") === null); //Attente que la frame sois chargée

        mel_metapage.Storage.remove("webconf_token");

        if (this.have_ariane())
            $("#mm-ariane").css("display", "");

        this.update();
        this.jitsii.executeCommand('avatarUrl', `${rcmail.env.rocket_chat_url}avatar/${rcmail.env.username}`);
        this.busy(false);
        MasterWebconfBar.start(this.master_bar()); //Affichage de la toolbar

        this.jitsii.addListener("tileViewChanged", (args) => {
            mel_metapage.Functions.call(`window.webconf_master_bar.toggle_tile_view(${args.enabled})`);
        });

        if (parent.rcmail.task !== "webconf")
            parent.$("html").addClass("webconf-started");

        let ongo_config = {
            _room:this.key
        };

        if (rcmail.env.already_logged === "logged") ongo_config["_alreadyLogged"] = true;

        mel_metapage.Functions.post(
            mel_metapage.Functions.url("webconf", "onGo"),
            ongo_config,
            (datas) => {}
        );
        
        
    }

    /**
     * Minimise la webconf
     */
    this.minimize = function()
    {
        this._is_minimized = true;
        this.update();
    }

    /**
     * Passe la webconf en mode plein écran
     */
    this.full_screen = function()
    {
        this._is_minimized = false;
        this.update();
    }

    /**
     * Met à jour les frames.
     */
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
                this.conf.css("width", "calc(100% - "+(pixel_correction + this.ariane.size)+"px)");;
            }
        }

        if (this.ariane.is_full === true)
            this._is_minimized = true;

        if (this._is_minimized)
        {
            $(".webconf-fullscreen").css("display", "");
            $(".webconf-minimize").css("display", "none");
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
            $(".webconf-fullscreen").css("display", "none");

            if (parent.$(".menu-last-frame").hasClass("disabled")) $(".webconf-minimize").css("display", "none");
            else $(".webconf-minimize").css("display", "");
            
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
            else
                this.chat.css("max-height", `calc(100% - ${pixel_correction}px)`);

        }

        if (this.ariane.is_full === true)
        {
            if (this.ariane.is_hide === false)
            {
                this.chat.css("width", "calc(100% - "+(pixel_correction + this.ariane.size)+"px)");
                this.chat.css("max-width", "");
                this.chat.css("max-height", `calc(100% - ${pixel_correction}px)`)
                .css("right", "unset")
                .css("bottom", "unset")
                .css("top", `${pixel_correction}px`)
                .css("left", `${pixel_correction}px`);
                this.conf.css("max-height", "");
            }
            else {

                if (this._is_framed)
                    this.conf.css("width", "100%");

                this.conf.css("max-width", "100%");
            }
        }
        else
            this.chat.css("max-width", this.ariane.size + "px")
            .css("right", "")
            .css("bottom", "")
            .css("top", "")
            .css("left", "");//.css("max-height", `calc(100% - ${pixel_correction}px)`);


    }

    /**
     * Passe roundcube en mode occupé
     * @param {boolean} is_busy 
     */
    this.busy = function(is_busy = true)
    {
        mel_metapage.Functions.busy(is_busy);
    }

    /**
     * Vérifie si rc est occupé
     * @returns {boolean}
     */
    this.is_busy = function ()
    {
        return mel_metapage.Functions.is_busy();
    }

    /**
     * Affiche la div de parametrage de la conf
     */
    this.show_selector = function()
    {
        this.window_selector.css("display", "");
    }

    /**
     * Supprime la div de parametrage de la conf
     */
    this.remove_selector = function()
    {
        this.window_selector.remove();
        delete this.window_selector;
    }

    /**
     * Obsolète
     */
    this.apply = function()
    {
        let val = $("#salon").val();
        this.ariane = {
            room_name:val[0],
            ispublic:true
        };
        this.go();
    }

    this.notify = function()
    {
        let $config = {
            _original_link:`${rcmail.env["webconf.base_url"]}/${this.key}`
        };

        if (this.wsp !== undefined && this.wsp.datas !== undefined)
        {
            $config["_link"] = mel_metapage.Functions.url("webconf", "", {
                _key:this.key,
                _wsp:this.wsp.datas.uid
            }).replace(`&${rcmail.env.mel_metapage_const.key}=${rcmail.env.mel_metapage_const.value}`, '');
            $config["_uid"] = this.wsp.datas.uid;
        }

        return mel_metapage.Functions.post(
            mel_metapage.Functions.url("webconf", "notify"),
            $config
        );
    }

}

Webconf.prototype.isPhone = function()
{
    return $("html").hasClass("layout-phone");
}

/**
 * Appelé depuis la div de paramétrage, lance la webconf
 */
Webconf.set_webconf = function()
{
    const is_wsp = $("#wsp-yes")[0].checked;

    if (is_wsp)
    {
        let _wsp = rcmail.env.webconf.window_selector.find(".wsp_select");
        const wsp = html_helper.JSON.parse(_wsp.val());
        rcmail.env.webconf.wsp = wsp;

        if (wsp.objects["useful-links"] !== undefined)
            wsp.objects["useful-links"] = null;

        if (wsp.objects.channel !== null && wsp.objects.channel !== undefined && wsp.datas.allow_ariane)
        {

            if (typeof wsp.objects.channel === "string")
                rcmail.env.webconf.ariane.room_id= wsp.objects.channel;
            else
                rcmail.env.webconf.ariane.room_name=wsp.objects.channel.name;

            rcmail.env.webconf.ariane._is_allowed = wsp.datas.allow_ariane;
        } 
        // else
        //     rcmail.env.webconf.ariane = {};

        rcmail.env.webconf.ariane.ispublic = rcmail.env.webconf.wsp.datas.ispublic === 0 ? false: true;
        rcmail.env.webconf.master_bar_config.wsp = wsp;
    }
    else {
        let ariane = rcmail.env.webconf.window_selector.find(".ariane_select");
        let raw_val = ariane.val();

        if (raw_val === "@home")
        {
            rcmail.env.webconf.ariane._is_allowed = false;
            rcmail.env.webconf.ariane.is_hide = true;
            rcmail.env.webconf.master_bar_config.ariane = rcmail.env.webconf.ariane;
        }
        else
        {
            raw_val = raw_val.split(":");
            const val = {
                is_public:raw_val[0] === "true" ? true: false,
                room:raw_val[1]
            };
            rcmail.env.webconf.ariane.room_name = val.room;
            rcmail.env.webconf.ariane.ispublic = val.is_public;
            rcmail.env.webconf.ariane._is_allowed = true;
            rcmail.env.webconf.master_bar_config.ariane = rcmail.env.webconf.ariane;
        }
    }

    rcmail.env.webconf.key = $("#webconf-room-name").val();
    rcmail.env.webconf.master_bar_config.key = rcmail.env.webconf.key;
    rcmail.env.webconf.go();
    rcmail.env.webconf.remove_selector();

    //if (is_wsp)
    rcmail.env.webconf.notify();

}

/**
 * Met à jour l'affichage de la div de parametrage en function de la checkbox
 */
Webconf.update_radio = function()
{
    const is_yes = $("#wsp-yes")[0].checked;

    if (is_yes)
    {
        $(".webconf-ariane").css("display", "none");
        $(".webconf-wsp").css("display", "");
    }
    else {
        $(".webconf-ariane").css("display", "");
        $(".webconf-wsp").css("display", "none");
    }
}

/**
 * Met à jours l'url de la webconf
 */
Webconf.update_room_name = function()
{
    let querry = $("#webconf-room-name");
    querry.val(querry.val().toUpperCase());
    let val = querry.val();

    if (val.includes(rcmail.env["webconf.base_url"].toUpperCase()))
    {
        val = val.split("/");
        val = val[val.length-1];
        querry.val(val.toUpperCase());
        //querry.val()
    }

    if (val.length < 10 || Enumerable.from(val).where(x => /\d/.test(x)).count() < 3 || !/^[0-9a-zA-Z]+$/.test(val))
    {
        $("#webconf-enter").addClass("disabled").attr("disabled", "disabled");
        $(".webconf-error-text").css("display", "").css("color", "red");
    }
    else
    {
        const url = MEL_ELASTIC_UI.url("webconf", "", {_key:val});
        mel_metapage.Functions.title(url);
        
        $("#webconf-enter").removeClass("disabled").removeAttr("disabled", "disabled");
        $(".webconf-error-text").css("display", "none").css("color", "black");
    }
}

/**
 * Classe qui gère la toolbal de la webconf
 */
class MasterWebconfBar {
    /**
     * 
    * @param {string} frameconf_id Id de l'iframe qui contient la webconf
    * @param {string} framechat_id Id de l frame qui contient rocket.chat
    * @param {string} ask_id Id de la div qui permet de configurer la webconf
    * @param {string} key Room de la webconf 
    * @param {string} ariane Room ariane
    * @param {JSON} wsp Infos de l'espace de travail si il y en a
    * @param {int} ariane_size Taille en largeur et en pixel de la frale ariane 
    * @param {boolean} is_framed Si la webconf est dans une frame ou non 
     */
    constructor(frameconf_id, framechat_id, ask_id, key, ariane, wsp, ariane_size = 340, is_framed = null) {
       // console.log("Master Webconf", key);
        ariane = html_helper.JSON.parse(ariane);
        this.webconf = new Webconf(frameconf_id, framechat_id, ask_id, key, ariane, (typeof wsp === "string" ? html_helper.JSON.parse(wsp) : wsp), ariane_size, is_framed);
        this.create_bar();

        if (!this.webconf.have_ariane()) 
            this.ariane.css("display", "none");
        else 
        {
            if (this.webconf.ariane.is_hide)
                this.hide_ariane(false);
            else
                this.show_ariane(false);
        }

        if (MasterWebconfBar.micro === undefined)
        {
            MasterWebconfBar.micro = Symbol("micro");
            MasterWebconfBar.video = Symbol("video");
        }

        ArianeButton.default().hide_button();

        //console.log("logo a", (this.webconf.wsp === undefined || this.webconf.wsp === null) || this.webconf.wsp.datas.logo === "" || this.webconf.wsp.datas.logo == "false");

        if ((this.webconf.wsp === undefined || this.webconf.wsp === null) || this.webconf.wsp.datas.logo === "" || this.webconf.wsp.datas.logo == "false")
        {
            if ((this.webconf.wsp === undefined || this.webconf.wsp === null))
                this.logo.html(`<span class="icon-mel-videoconference"></span>`);
            else
                this.logo.html(`<span>${this.webconf.wsp.datas.title.slice(0,3).toUpperCase()}</span>`);
        }
        else { 
            this.logo.html(`<img src="${this.webconf.wsp.datas.logo}" />`).css("background-color", this.webconf.wsp.datas.color);
    
        }

        if ($(".workspace-frame").length > 0 && $("iframe.workspace-frame").length === 0)
            $(".workspace-frame").remove();

        if (rcmail.webconf_from_modal !== true)
        {
            try {
                if (rcmail.env.current_frame_name === undefined)
                {
                    let $element = $("#taskmenu li a.selected");
                    rcmail.env.current_frame_name = mm_st_ClassContract(mm_st_getNavClass($element[0]));
                }
                rcmail.env.last_frame_class = mm_st_ClassContract(rcmail.env.current_frame_name);
                rcmail.env.last_frame_name = $("." + mm_st_ClassContract(rcmail.env.current_frame_name)).find(".inner").html();
                m_mp_ChangeLasteFrameInfo(true);
            } catch (error) {
                console.error('###[m_mp_ChangeLasteFrameInfo]', error);
            }
        }

        this.start().deletePopUpOnLaunch();
    }

    start()
    {
        this.send("start");
        return this;
    }

    isPhone()
    {
        return $("html").hasClass("layout-phone");
    }

    /**
     * Affcihe et met en place la toolbar
     */
    create_bar() {
        
        /**
         * Récupère les différents éléments de la toolbar
         * @param {string} $class
         * @returns {JQUERY} 
         */
        const element = function ($class) {
            return $(".webconf-toolbar").find(`.${$class}`);
        };

        $("body").append(rcmail.env["webconf.bar"]);
        this.document = element("conf-documents");
        this.ariane = element("conf-ariane");
        this.micro = element("conf-micro");

        this.micro.mute = function()
        {
            return MasterWebconfBar.mute(this, "icon-mel-micro2", "icon-mel-micro-off");
        };

        this.micro.demute = function()
        {
            return MasterWebconfBar.mute(this, "icon-mel-micro-off", "icon-mel-micro2");
        };

        this.call = element("conf-call-stop");
        this.video = element("conf-video");

        this.video.mute = function()
        {
            return MasterWebconfBar.mute(this, "icon-mel-camera2", "icon-mel-camera-off");
        };

        this.video.demute = function()
        {
            return MasterWebconfBar.mute(this, "icon-mel-camera-off", "icon-mel-camera2");
        };

        this.broadcast = element("conf-diffuser");

        if (MasterWebconfBar.isFirefox())
            this.broadcast.css("display", "none");

        this.hand = element("conf-participate");
        this.logo = element("tiny-webconf-menu");
        this.mozaik = element("conf-mozaique");
        this.toolbar_item = element;
        this.popup = element("toolbar-popup");
        this.chevrons = {
            micro:element("wsp-icon-micro"),
            video:element("wsp-icon-video")
        }

        // let $webconf = $("iframe.webconf-frame");

        // if ($webconf.length > 0 && $webconf.attr("id") !== 'mm-ariane')    
        // {
        //     $webconf[0].contentWindow.$("#wmap").appendTo($(".wsp-toolbar.webconf-toolbar"));
        //     $webconf[0].contentWindow.$("#webconfmoreactions").appendTo($(".wsp-toolbar.webconf-toolbar").parent());
        // }
        // else {
            $("#wmap").appendTo($(".wsp-toolbar.webconf-toolbar"))
        //     $("#webconfmoreactions").appendTo($(".wsp-toolbar.webconf-toolbar").parent());
        // }
        this.more = $("#wmap").removeClass("hidden").removeClass("active").click(() => {
            this.more.removeClass("active");
        });

        this.more_cont = $("#webconfmoreactions");

        if (this.isPhone())
        {
            this.document.css("display", "none");
            this.ariane.css("display", "none");
            this.logo.css("display", "none");
            $(".wsp-toolbar-item.empty").css("display", "none");
            $(".wsp-toolbar").css("border-radius", 0).css("width", "100%").css("left","0").css("transform", "none");
        }

        return this;
    }

    is_toolbar_hidden()
    {
        return this.logo.hasClass("hidden-toolbar");
    }

    /**
     * Affiche ou cache la toolbar
     */
    update_toolbar()
    {
        if (this.logo.hasClass("hidden-toolbar"))
        {
            if ($(".webconf-toolbar").hasClass("switched-toolbar"))
            {
                this.toolbar_item("wsp-toolbar-item").css("display", "none");
                this.toolbar_item("wsp-toolbar-item-wsp").css("display", "");
                this.toolbar_item("conf-switch-toolbar").css("display", "");
                $(".webconf-toolbar").css("background-color", "").find("v_separate").css("display", "none");
            }
            else
            {
                this.toolbar_item("wsp-toolbar-item").css("display", "");
                this.toolbar_item("wsp-toolbar-item-wsp").css("display", "none");
                $(".webconf-toolbar").css("background-color", "").find("v_separate").css("display", "");
                this.toolbar_item("jitsi-select").css("display", "");  
            }
            this.logo.removeClass("hidden-toolbar");

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
            this.toolbar_item("jitsi-select").css("display", "none");  
        }

        if (this.chevrons.video.hasClass("stop-rotate"))
            this.switch_popup_video(false);

        if (this.chevrons.micro.hasClass("stop-rotate"))
            this.switch_popup_micro(false);

        return this;
    }

    /**
     * Copie l'url de la conf
     */
    copy()
    {
        function copyOnClick (val) {
            var tempInput = document.createElement ("input"); 
            tempInput.value = val;
             document.body.appendChild (tempInput); 
             tempInput.select (); 
             document.execCommand ("copy"); 
             document.body.removeChild (tempInput); 
             }
             copyOnClick(rcmail.env["webconf.base_url"] + "/" + this.webconf.key);
             rcmail.display_message(`${rcmail.env["webconf.base_url"] + "/" + this.webconf.key} copier dans le presse-papier.`, "confirmation")
    }

    /**
     * Change de toolbar si il y a plusieurs toolbar
     */
    switch_toolbar()
    {
        return;
        let _toolbar = $(".webconf-toolbar");
        let _switch = $(".conf-switch-toolbar");
        if (_toolbar.hasClass("switched-toolbar"))
        {
            _toolbar.find("v_separate").css("display", "");
            _toolbar.find(".wsp-toolbar-item").css("display", "");
            _toolbar.find(".wsp-toolbar-item-wsp").css("display", "none");
            _switch.css("display", "").find(".text-item").html("Espace");
            _toolbar.removeClass("switched-toolbar");
            this.toolbar_item("jitsi-select").css("display", "");  
        }
        else {
            _toolbar.find("v_separate").css("display", "none");
            _toolbar.find(".wsp-toolbar-item").css("display", "none");
            _toolbar.find(".wsp-toolbar-item-wsp").css("display", "");
            _switch.css("display", "").find(".text-item").html("Webconf");
            _toolbar.addClass("switched-toolbar");
            this.toolbar_item("jitsi-select").css("display", "none");  
        }
    }

    update_toolbar_position(isMinimized)
    {
        if (isMinimized === undefined || isMinimized === null)
            return; 

        this.lastMinimized = isMinimized;
        let $toolbar = $(".webconf-toolbar");

        if (isMinimized)
        {
            if (this.ariane.hasClass("active"))
            {
                $toolbar.css("bottom", 'unset')
                .css("top", '225px')
                .css('left', 'unset')
                .css('right', '-68px');
            }
            else
            {
                $toolbar.css("bottom", '5px')
                .css("top", 'unset')
                .css('left', 'unset')
                .css('right', '-68px');              
            }
        }
        else {
            $toolbar.css("bottom", '')
            .css("top", '')
            .css('left', '')
            .css('right', '');  
        }

        return this;
    }

    minify_toolbar()
    {

        if (this.minified === true)
            return;

        if (this.is_toolbar_hidden())
            this.update_toolbar();

        this.minified = true;

        this.hide_element(this.document).
        hide_element(this.ariane).
        hide_element(this.broadcast).
        hide_element(this.hand).
        hide_element(this.mozaik).
        hide_element(this.logo).
        hide_element($(".webconf-toolbar .empty.first")).
        hide_element($(".webconf-toolbar .text-item"));

        $($(".webconf-toolbar").find("v_separate")[0]).css("display", "none");
        $(".webconf-toolbar .wsp-toolbar-item").css("margin-bottom", "5px");

        $(".webconf-toolbar .toolbar-popup").css("right", "26px");

        return this.update_toolbar_position(true);
    }

    maximize_toolbar()
    {

        if (this.minified === false)
            return;

        if (this.is_toolbar_hidden())
            this.update_toolbar();

        this.minified = false;
        this.show_element(this.document).
        show_element(this.ariane).
        show_element(this.broadcast).
        show_element(this.hand).
        show_element(this.mozaik).
        show_element(this.logo).
        show_element($(".webconf-toolbar .empty.first")).
        show_element($(".webconf-toolbar .text-item"));

        $($(".webconf-toolbar").find("v_separate")[0]).css("display", "");
        $(".webconf-toolbar .wsp-toolbar-item").css("margin-bottom", "");

        $(".webconf-toolbar .toolbar-popup").css("right", "");

        return this.update_toolbar_position(false);
    }

    hide_element(element)
    {
        if (element.css("display") === "none") element.addClass("already-hidden"); 
        else element.hide(); 

        return this;
    }

    show_element(element)
    {
        if (element.hasClass("already-hidden")) element.removeClass("already-hidden");
        else element.show();

        return this;
    }

    /**
     * @async
     * Met fin à la webconf
     */
    async hangup()
    {
        //L'url à lancer en quittant la webconf
        const url = "https://webconf.numerique.gouv.fr/questionnaireSatisfaction.html";

        //Permet de gérer correctement la barre de navigation d'un espace (Fait revenir sur l'accueil de l'espace)
        if ($(".melw-wsp.webconfstarted").length > 0)
            $(".melw-wsp.webconfstarted").removeClass("webconfstarted").find(".wsp-home").click();

        //Remet le bouton où il était originiellement, pour qu'il puisse être de nouveau la lors de la prochaine conf.
        this.more.appendTo(".barup").addClass("hidden");

        if (this.toolbar_item("wsp-toolbar-item-wsp").length > 0)
        {
            if (!(this.toolbar_item("conf-switch-toolbar").length === 0 || this.toolbar_item("conf-switch-toolbar").css("display") === "none"))
            {
                await ChangeToolbar("home");

                window.open(url, '_blank');

                if ($("iframe.workspace-frame").length > 0)
                    $("iframe.workspace-frame").css("padding-right", "");
            }
        }

        //Supprime les données de la barre d'outil d'une conf et supprime la toolbar visuellement & fonctionelement 
        delete window.webconf_master_bar;
        $(".webconf-toolbar").remove();

        //Envoie la déconnexion à la Jitsii
        this.send("hangup");

        //Remet les frames en place.
        if (!this.webconf._is_minimized)
        {
             if (rcmail.env.last_frame_class === undefined)
                 await mel_metapage.Functions.change_frame("home");
            else if ($("#taskmenu .menu-last-frame").hasClass("disabled"))
            {
                if ($("#taskmenu .selected").length > 0)
                    $("#taskmenu .selected").click();
                else
                    await mel_metapage.Functions.change_frame("home");
            }
            else
                rcmail.command("last_frame");
        }          
        else
        {
            let querry = $(`#${rcmail.env.current_frame}`);

            if (querry.length > 0)
                querry.css("padding-right", "");
            else
                $("#layout-frames").css("width", "");

            if (!this.webconf.is_framed())
            {
                if (querry.length > 0)
                    querry.css("padding-left", "");
            }
        }

        try {
            //Supprime 'mwvcs' pour que tout fonctionne correctement avec les espaces de travail
            $('iframe.mwsp').removeClass("mwsp").each((i,e) => {
                if (!$(e).hasClass("workspace-frame"))
                    e.contentWindow.$("html").removeClass("mwvcs");
            });
        } catch (error) {
            
        }

        //Gère correctement les frames puis affiche la frame en cours
        $("#layout-frames").find("iframe").css("padding-left", "").css("padding-right", "");
        $(".webconf-frame").css("display", "none");

        if ($("#layout-frames").css("width") !== undefined)
        {
            $("#layout-frames").css("width", "");
            let haveFrameOpen = false;

            $("#layout-frames").find("iframe").each((i,e) => {
                if (!haveFrameOpen && $(e).css("display") !== "none")
                    haveFrameOpen = true;
            });

            if ($("#layout-frames").find("iframe").length > 0 && haveFrameOpen)
                $("#layout-frames").css("display", "");
            else
                $("#layout-frames").css("display", "none");
        }

        //Affiche le questionnaire
        this.showEndPageOnPopUp("Questionnaire satisfaction", url);
        // if (!parent.$("body").hasClass("task-webconf"))
        // {
        //     parent.$("#layout-frames").css("display", "");
        //     parent.$(".mm-frame").css("display", "none");
        //     parent.$("iframe.webconf-frame").css("max-width", "100%").css("display", "")[0].src = url;
        // }
        // else {
        //     parent.$(".questionswebconf-frame").remove();
        //     $(".webconf-frame").remove();
        //     mel_metapage.Functions.change_frame("questionswebconf", true, true, {_action:"loading"}).then(() => {
        //         parent.$(".questionswebconf-frame")[0].src = url;
        //         Title.set("Questionnaire Satisfaction", true);
        //     });
        // }

        //Gère le placement de la bulle de tchat
        if (rcmail.env.mel_metapage_mail_configs["mel-chat-placement"] == rcmail.gettext("up", "mel_metapage"))
            $(".tiny-rocket-chat").removeClass("disabled").removeAttr("disabled");
        else
            $(".tiny-rocket-chat").css("display", "block");

        parent.$("html").removeClass("webconf-started");
        $(parent).resize();

        if (this.isPhone())
        {
            parent.$("#touchmelmenu").removeAttr("disabled").removeClass("disabled");
            parent.$("#user-up-panel").removeAttr("disabled").removeClass("disabled").css("pointer-events", "");
        }

        // mm_st_CreateOrOpenModal("home");
    }

    /**
     * Passe ariane en mode plein écran
     */
    change_ariane()
    {
        $(".mm-frame").css("display", "none");
        $(".webconf-frame").css("display", "");
        
        if (this.webconf._is_framed)
        {
            $("#layout-frames").css("width", "");
            $(".webconf-frame").addClass("mm-frame");
        }

        this.update_screen(true);

        if (!this.ariane.hasClass("active"))
            this.show_ariane(true);

        this.send("full_screen_ariane");
        this.webconf.ariane.is_full = true;

        parent.$("#sr-document-title-focusable").focus();
    }

    /**
     * Affiche si l'utilisateur est en mode tileview ou non
     * @param {boolean} active Si vrai tileview, sinon classique
     */
    toggle_tile_view(active)
    {
        if (!active)
            this.mozaik.removeClass("active");
        else
            this.mozaik.addClass("active")
    }

    /**
     * Passe en mode tile view ou inversement
     * @param {boolean} send Doit être envoyé à la frame webconf
     */
    toogle_film_strip(send = true)
    {
        if (send)
            this.send("toggle_film_strip");   
    }

    /**
     * Affiche ou cache Rocket.Chat
     * @param {boolean} send Doit être envoyé à la frame webconf
     */
    switch_ariane(send = true)
    {
        if (!mel_metapage.Functions.is_busy())
        {
            if (this.ariane.hasClass("active"))
                this.hide_ariane(send);
            else
                this.show_ariane(send);
        }

        this.update_toolbar_position(this.lastMinimized);
    }

    /**
     * Cache Rocket.Chat
     * @param {boolean} send Doit être envoyé à la frame webconf
     */
    hide_ariane(send = true)
    {
        if (send)
            this.send("hide_ariane");

        this.ariane.removeClass("active");
    }

    /**
     * Affiche Rocket.Chat
     * @param {boolean} send Doit être envoyé à la frame webconf
     */
    show_ariane(send = true)
    {
        if (send)
            this.send("show_ariane");

        this.ariane.addClass("active");
    }

    /**
     * Mute ou demute le micro ou la caméra
     * @param {Symbol} what Micro (MasterWebconfBar.micro) ou camera (MasterWebconfBar.video)
     */
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
                
                if (send)
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

                if (send)
                    this.send("toggle_video");

                break;

            default:
                break;
        }
    }

    mute(what, send = true)
    {
        switch (what) {
            case MasterWebconfBar.micro:
                if (!this.micro.hasClass("muted"))
                    this.mute_demute(what, send);

                break;

            case MasterWebconfBar.video:
                if (!this.video.hasClass("muted"))
                    this.mute_demute(what, send);

                break;
                
            default:
                break;
        }
    }

    demute(what, send = true)
    {
        switch (what) {
            case MasterWebconfBar.micro:
                if (this.micro.hasClass("muted"))
                    this.mute_demute(what, send);

                break;
                
            case MasterWebconfBar.video:
                if (this.video.hasClass("muted"))
                    this.mute_demute(what, send);

                break;
                
            default:
                break;
        }
    }

    toggleHand()
    {
        this.send("toggleHand");
    }

    toggle_chat()
    {
        this.send("toggle_chat");
    }

    toogle_virtualbackground()
    {
        this.send("open_virtual_background");
    }

    /**
     * Partage l'écran (Non compatible avec firefox)
     * @param {boolean} send Doit être envoyé à la frame webconf
     */
    share_screen(send = true)
    {
        if (send)
            this.send("share_screen");
    }

    /**
     * Affiche le nextcloud de l'espace de travail ou de l'utilisateur
     * @param {boolean} send Doit être envoyé à la frame webconf
     */
    async nextcloud(send = true)
    {
        if (!mel_metapage.Functions.is_busy())
        {            
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

                let config = null;

                try{
                    if (this.webconf.wsp !== undefined && this.webconf.wsp.datas !== undefined && this.webconf.wsp.datas.uid !== undefined)
                    {
                        config = {_params: `/apps/files?dir=/dossiers-${this.webconf.wsp.datas.uid}`,
                        _is_from:"iframe"
                        };
                    }
                }catch (er)
                {}

                if ($("iframe.stockage-frame").length > 0)
                {
                    if (config === null) config = {_is_from:"iframe"};
                    else if (config["_is_from"] === undefined) config["_is_from"] = "iframe";

                    $("iframe.stockage-frame")[0].src = mel_metapage.Functions.url("stockage", "", config);
                }
                else if ($(".stockage-frame").length > 0) $(".stockage-frame").remove();
              
                await mel_metapage.Functions.change_frame("stockage", true, true, config);
            }
        }

    }

    showEndPageOnPopUp(title, url)
    {
        let config = {
            title,
            // onclose:() => {},
            // onminify:() => {},
            // onexpand:() => {},
            // icon_close:"icon-mel-close",
            // icon_minify:'icon-mel-minus',
            // icon_expend:'icon-mel-expend',
            content:`<iframe title="${title}" src="${url}" style="width:100%;height:100%;"/>`,
            // onsetup:() => {},
            // aftersetup:() => {},
            // beforeCreatingContent:() => "",
            // onCreatingContent:(html) => html,
             afterCreatingContent:($html, box) => {
                 box.get.css("left","60px").css("top", "60px").addClass("questionnaireWebconf");
                 setTimeout(() => {
                    box.close.addClass("mel-focus focused");
                    setTimeout(() => {
                        box.close.removeClass("mel-focus").removeClass("focused");
                        setTimeout(() => {
                            box.close.addClass("mel-focus focused");
                            setTimeout(() => {
                                box.close.removeClass("mel-focus").removeClass("focused");
                                setTimeout(() => {
                                    box.close.focus();
                                 }, 100);
                             }, 100);
                         }, 100);
                     }, 200);
                 }, 200);
             },
            width:"calc(100% - 60px)",
            height:"calc(100% - 60px)",
            fullscreen:true
        };

        return new Windows_Like_PopUp($("body"), config);
    }

    deletePopUpOnLaunch()
    {
        return $(".questionnaireWebconf").each((i,e) => {
            const id = parseInt($(e).attr("id").replace("wlpopup-", ""));
            Windows_Like_PopUp.popUps[id].close();
        });
    }

    /**
     * Met à jour les frames.
     * @param {boolean} active Si faux : minimize, si vrai : fullscreen 
     */
    change_frame(active)
    {
        this.update_screen(active);

        if (!active)
        {
            this._switch_tileView();
            this.send("minimize");
            this.webconf._is_minimized = true;
        }
        else
        {
            this.send("full_screen");
            this.webconf._is_minimized = false;
        }
    }

    /**
     * Obsolète
     */
    _switch_tileView()
    {
        // console.error('this.mozaik.hasClass("active")', this.mozaik.hasClass("active"));
        // if (this.mozaik.hasClass("active"))
        //     this.toogle_film_strip();
    }

    switch_popup_micro(checkVideo = true)
    {


        if (this.chevrons.micro.hasClass("stop-rotate"))
        {
            this.popup.css("display", "none");
            this.chevrons.micro.removeClass("stop-rotate")
            this._empty_popup();
        }
        else
        {
            if(checkVideo)
            {
                if (this.chevrons.video.hasClass("stop-rotate"))
                    this.switch_popup_video(false);
            }

            this.send("get_micro_and_audio_devices");
            this.popup.css("display", "");
            this.chevrons.micro.addClass("stop-rotate")
        }
    }

    add_to_popup(devices)
    {
        devices = html_helper.JSON.parse(devices);
        let devices_by_kind = {};

        for (let index = 0; index < devices.length; ++index) {
            const element = devices[index];
            if (devices_by_kind[element.kind] === undefined)
                devices_by_kind[element.kind] = [];
            devices_by_kind[element.kind].push(element);
        }

        let html = "";

        for (const key in devices_by_kind) {
            if (Object.hasOwnProperty.call(devices_by_kind, key)) {
                const array = devices_by_kind[key];
                html += `<span class=toolbar-title>${rcmail.gettext(key, "mel_metapage")}</span><div class="btn-group-vertical" style=width:100% role="group" aria-label="groupe des ${key}">`;
                for (let index = 0; index < array.length; ++index) {
                    const element = array[index];
                    const disabled = element.isCurrent === true ? "disabled" : "";
                    html += `<button onclick="window.webconf_master_bar.set_device('${html_helper.JSON.stringify(element)}')" class="mel-ui-button btn btn-primary btn-block ${disabled}" ${disabled}>${element.label}</button>`;
                }
                html += "</div>";
            }
        }

        this.popup.find(".toolbar-datas").html(html);
    }

    _empty_popup()
    {
        this.popup.find(".toolbar-datas").html('<span class="spinner-border" style="position: absolute;top: 82px;left: 76px;"></span>');
    }

    set_device(device)
    {
        device = html_helper.JSON.parse(device);

        switch (device.kind) {
            case "audioinput":
                this.send("set_micro_device", `'${device.label}', '${device.deviceId}'`);
                break;
            case "audiooutput":
                this.send("set_audio_device", `'${device.label}', '${device.deviceId}'`);
                break;
            case "videoinput":
                this.send("set_video_device", `'${device.label}', '${device.deviceId}'`);
                break;
            default:
                break;
        } 

        if (this.chevrons.video.hasClass("stop-rotate"))
            this.switch_popup_video(false);

        if (this.chevrons.micro.hasClass("stop-rotate"))
            this.switch_popup_micro(false);
    }

    switch_popup_video(checkMicro = true)
    {
        if (this.chevrons.video.hasClass("stop-rotate"))
        {
            this.popup.css("display", "none");
            this.chevrons.video.removeClass("stop-rotate")
            this._empty_popup();
        }
        else
        {
            if(checkMicro)
            {
                if (this.chevrons.micro.hasClass("stop-rotate"))
                    this.switch_popup_micro(false);
            }

            this.send("get_video_devices");
            this.popup.css("display", "");
            this.chevrons.video.addClass("stop-rotate")
        }        
    }

    /**
     * Met à jour les frames si la webconf est sous forme de frame
     * @param {boolean} active 
     */
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

    /**
     * Envoie un appel au listener
     * @param {string} func Function exécuter par le listener
     */
    send(func, args = "")
    {
        workspaces.sync.PostToParent({
            exec: `rcmail.env.wb_listener.${func}(${args})`,
            eval:"always"
        });
    }

    /**
     * Envoie la toolbar à la frame parente
     * @param {string} bar Initialisation de la toolbar
     */
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

    /**
     * Indique l'activation ou la désactivation d'un élément
     * @param {Jquery} e Element
     * @param {string} old Classe à remplacer
     * @param {string} $new Nouvelle classe
     * @return {Jquery}
     */
    static mute(e,old, $new)
    {
        return e.find("span.icon-item").removeClass(old).addClass($new);
    }

    /**
     * Vérifie si on est sous firefox
     * @returns {boolean}
     */
    static isFirefox()
    {
        return  typeof InstallTrigger !== 'undefined';
    }

    /**
     * Passe en fullscreen
     */
    _fullscreen()
    {
        $(".melw-wsp .wsp-home").click();
        this.update_screen(true);
        this.document.removeClass("active");
        this.webconf._is_minimized = false;
        this.webconf.ariane.is_full = false;
        $(".mm-frame").css("display", "none");

        $(".mm-frame").each((i, e) => {
            e = $(e);

            if (e.hasClass("webconf-frame"))
                return;
            else
            {
                if ($(e)[0].nodeName === "IFRAME")
                    $(e).css("padding-right", "");
            }
        })

        if (!this.webconf._is_framed)
            $("#layout-frames").css("display", "none");
        else
            $("#layout-frames").find("iframe").css("padding-left", "");

        $(".webconf-frame").css("display", "");
        $("#layout-frames").css("width", "");
        this.send("fullscreen");


        this.maximize_toolbar();
        $(".melw-wsp").remove();

        try {
            rcmail.env.last_frame_class = mm_st_ClassContract(rcmail.env.current_frame_name);
            rcmail.env.last_frame_name = $("." + mm_st_ClassContract(rcmail.env.current_frame_name)).find(".inner").html();
            m_mp_ChangeLasteFrameInfo(true);
        } catch (error) {
            console.error('###[m_mp_ChangeLasteFrameInfo]', error);
        }
    }

    _minimize()
    {
        $(".menu-last-frame").click();
    }

    /**
     * Passe en fullscreen en passant par top
     */
    static fullscreen()
    {
        workspaces.sync.PostToParent({
            exec: "window.webconf_master_bar._fullscreen()",
            child: false
        });
    }

        /**
     * Passe en fullscreen en passant par top
     */
    static minimize()
    {
        workspaces.sync.PostToParent({
            exec: "window.webconf_master_bar._minimize()",
            child: false
        });
    }
}

class ListenerWebConfBar
{
    constructor(webconf = new Webconf())
    {
        this.webconf = webconf;
        this.alreadyListening = false;
    }

    start()
    {
        this.isVideoMuted().then(muted => {
            this.send((muted ? "mute" : "demute"), "MasterWebconfBar.video, false");
        });

        this.isAudioMuted().then(muted => {
            this.send((muted ? "mute" : "demute"), "MasterWebconfBar.micro, false");
        });

        this.listen();
    }

    listen()
    {
        if (!this.alreadyListening)
        {
            this.alreadyListening = true;

            this.webconf.jitsii.addEventListener("videoMuteStatusChanged", (muted) => {
                muted = muted.muted;
                this.send((muted ? "mute" : "demute"), "MasterWebconfBar.video, false");
            });

            this.webconf.jitsii.addEventListener("audioMuteStatusChanged", (muted) => {
                muted = muted.muted;
                this.send((muted ? "mute" : "demute"), "MasterWebconfBar.micro, false");
            });

            this.webconf.jitsii.addEventListener("incomingMessage", (message) => {
                parent.rcmail.display_message(`${message.nick} : ${message.message}`, (message.privateMessage ? "notice private" : "notice notif"));
            });
        }
    }

    isVideoMuted()
    {
        return this.webconf.jitsii.isVideoMuted();
    }

    isAudioMuted()
    {
        return this.webconf.jitsii.isAudioMuted();
    }


    show_ariane()
    {
        this.webconf.ariane.is_hide = false;
        this.webconf.update();

        if (this.webconf.chat.length > 0 && this.webconf.ariane !== null && this.webconf.ariane !== undefined && this.webconf.ariane.room_name !== undefined && this.webconf.ariane.room_name !== "@home")
        {
            try {
                this.webconf.chat[0].contentWindow.postMessage({
                    externalCommand: 'go',
                    path: `/${(this.webconf.ariane.ispublic === true ? "channel" : "group")}/${this.webconf.ariane.room_name}`
                }, '*');
            } catch (error) {
                
            }
        }
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
        this.webconf.minimize();
    }

    full_screen_ariane()
    {
        this.webconf.ariane.is_full = true;
        this.webconf.update();
    }

    stop_full_screen_ariane()
    {
        this.webconf.ariane.is_full = false;
        this.webconf.update();
    }

    fullscreen()
    {
        this.webconf.ariane.is_full = false;
        this.webconf.full_screen();
    }

    async hangup()
    {
        this.webconf.jitsii.executeCommand('hangup');
        this.webconf.jitsii.dispose();
    }

    async open_virtual_background()
    {
        this.webconf.jitsii.executeCommand('toggleVirtualBackgroundDialog');
    }

    async get_micro_and_audio_devices()
    {
        var devices = await this.webconf.jitsii.getAvailableDevices();

        devices = Enumerable.from(devices.audioOutput).union(devices.audioInput).toArray();
        
        var current_devices = await this.webconf.jitsii.getCurrentDevices();

        for (const key in current_devices) {
            if (key === "videoInput")
                continue;
            if (Object.hasOwnProperty.call(current_devices, key)) {
                const device = current_devices[key];

                for (const _key in devices) {
                    if (Object.hasOwnProperty.call(devices, _key)) {
                        const element = devices[_key];
                        if (element.deviceId === device.deviceId)
                            devices[_key].isCurrent = true;
                        else
                            devices[_key].isCurrent = false;
                    }
                }

            }
        }

        this.send("add_to_popup", `'${html_helper.JSON.stringify(devices)}'`)
    }

    async get_video_devices()
    {
        var devices = await this.webconf.jitsii.getAvailableDevices();

        devices = devices.videoInput;

        var current_devices = await this.webconf.jitsii.getCurrentDevices();

        if (current_devices.videoInput !== undefined)
        {
            for (const key in devices) {
                if (Object.hasOwnProperty.call(devices, key)) {
                    const element = devices[key];
                    if (element.deviceId === current_devices.videoInput.deviceId)
                        devices[key].isCurrent = true;
                    else
                        devices[key].isCurrent = false;
                }
            }
        }

        this.send("add_to_popup", `'${html_helper.JSON.stringify(devices)}'`)
    }

    set_micro_device(label, id)
    {
        this.webconf.jitsii.setAudioInputDevice(label, id);
    }

    set_audio_device(label, id)
    {
        this.webconf.jitsii.setAudioOutputDevice(label, id);
    }


    set_video_device(label, id)
    {
        this.webconf.jitsii.setVideoInputDevice(label, id);
    }

    toggleHand(){
        this.webconf.jitsii.executeCommand('toggleRaiseHand');
    }

    toggle_chat()
    {
        this.webconf.jitsii.executeCommand('toggleChat');
    }


    send(func, args = "")
    {
        mel_metapage.Functions.call(`window.webconf_master_bar.${func}(${args})`);
    }
}

$(document).ready(() => {
    const tmp = async () => {

        workspaces.sync.PostToParent({
            exec:"window.have_webconf = true",
            child:false
        });

        try {
            let isAdded = await mel_metapage.Functions.ask("window.webconf_added");

            if (isAdded === mel_metapage.Storage.unexist)
            {

                mel_metapage.Functions.call("window.webconf_added = 'a'");

                const donothide = function (eClass) {

                    if (window.webconf_master_bar === undefined)
                        return;

                    if (window.webconf_master_bar.webconf.is_framed())
                        $(".webconf-frame").removeClass("mm-frame").css("padding-top", "60px");
                    else
                        $(".webconf-frame.mm-frame").addClass("webconf-mm-frame").removeClass("mm-frame");
                    
                    if (eClass === "ariane" || eClass === "rocket" || eClass === "discussion" || eClass === "chat")
                    {
                        if (window.webconf_master_bar.webconf.have_ariane() && window.webconf_master_bar.webconf.ariane.is_full !== true)
                        {
                            $(".mm-frame").css("display", "none");
                            window.webconf_master_bar.change_ariane();
                            console.error("return break");
                            return 'break';
                        }
                        else
                            return "break";
                    }
                    else if (window.webconf_master_bar.webconf.have_ariane() && window.webconf_master_bar.webconf.ariane.is_full === true)
                    {
                        window.webconf_master_bar.send("stop_full_screen_ariane");
                        window.webconf_master_bar.webconf.ariane.is_full = false;
                    }
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
                        }

                        $(`.${eClass}-frame`).css("display", "");
                    }
                    else
                    {
                        $(".webconf-frame.webconf-mm-frame").addClass("mm-frame").removeClass("webconf-mm-frame");
                        $("iframe.mm-frame").css("padding-left", 0);
                        $(`iframe#${id}`).css("padding-right", `${window.webconf_master_bar.webconf.ariane.size}px`);

                        if ($(`iframe#${id}`).css("display") === 'none')
                            $(`iframe#${id}`).css("display", '');
                    }

                    window.webconf_master_bar.change_frame(false);
                    window.webconf_master_bar.webconf.set_title();

                    if (rcmail.env.mel_metapage_mail_configs["mel-chat-placement"] == rcmail.gettext("up", "mel_metapage"))
                        $(".tiny-rocket-chat").addClass("disabled").attr("disabled", "disabled");
                    else 
                        $(".tiny-rocket-chat").css("display", "none");

                    if (eClass !== "stockage")
                        window.webconf_master_bar.document.removeClass("active");
                    else
                        window.webconf_master_bar.document.addClass("active");

                    if (eClass === "workspace" || $(".wsp-toolbar-edited.melw-wsp").length > 0)
                        window.webconf_master_bar.minify_toolbar();
                    else
                        window.webconf_master_bar.maximize_toolbar();
                }

                mel_metapage.Functions.call(`metapage_frames.addEvent("changepage.before", ${donothide})`);
                mel_metapage.Functions.call(`metapage_frames.addEvent("onload.after", ${updateframe})`);
                mel_metapage.Functions.call(`metapage_frames.addEvent("open.after", ${updateframe})`);
            }   


            $("head").append(`<script src='${rcmail.env["webconf.base_url"]}/external_api.js'></script>`);
            if (window.rcmail) {
                // Call refresh panel
                rcmail.addEventListener('responseafterjwt', function(evt) {
                    //console.log("rcmail.addEventListener('responseafterwebconf_jwt')", evt);
                    if (evt.response.id) {
                        rcmail.env.webconf._jwt = evt.response.jwt;
                        //rcmail.portail_open_url(evt.response.id, rcmail.env.portail_items[evt.response.id].url + evt.response.room + '?jwt=' + evt.response.jwt);
                    }
                });
            }
            rcmail.env.webconf = new Webconf("mm-webconf", "mm-ariane", "room-selector", rcmail.env["webconf.key"], rcmail.env["webconf.ariane"], rcmail.env["webconf.wsp"]);
            rcmail.env.webconf.set_title();

            if ((rcmail.env.webconf.have_ariane() || rcmail.env["webconf.wsp"] !== undefined) && rcmail.env["webconf.key"] !== "")
            {
                await rcmail.env.webconf.go();

                rcmail.env.webconf.remove_selector();
            }
            else
            {//

                try {
                    if (parent.rcmail.env.current_frame_name === undefined)
                    {
                        let $element = parent.$("#taskmenu li a.selected");
                        parent.rcmail.env.current_frame_name = parent.mm_st_ClassContract(parent.mm_st_getNavClass($element[0]));
                    }
                    parent.rcmail.env.last_frame_class = parent.mm_st_ClassContract(parent.rcmail.env.current_frame_name);
                    parent.rcmail.env.last_frame_name = parent.$("." + parent.mm_st_ClassContract(parent.rcmail.env.current_frame_name)).find(".inner").html();
                    parent.m_mp_ChangeLasteFrameInfo(true);
                    parent.$("#taskmenu li a.selected").removeClass("selected");
                } catch (error) {
                    console.error('###[m_mp_ChangeLasteFrameInfo]', error);
                }

                rcmail.env.webconf.set_title();
                rcmail.env.webconf.show_selector();
                if (rcmail.env["webconf.key"] === "")
                {
                    if (rcmail.env["webconf.wsp"] !== undefined)
                    {
                        $(".mel-radio-1").css("display", "none");
                        $(".webconf-wsp").css("display", "").find(".wsp_select").addClass("disabled").attr("disabled", "disabled");
                        $(".webconf-ariane").css("display", "none");
                    }
                    Webconf.update_room_name();
                }

            }
            parent.rcmail.webconf_from_modal = true;
            //rcmail.env.webconf = webconf;
            rcmail.env.wb_listener = new ListenerWebConfBar(rcmail.env.webconf);   

        } catch (error) {
            console.error(error);
        }
    };

    rcmail.addEventListener("init", () => {
        tmp();
    });
    $(".footer").css("display", "none");

});


