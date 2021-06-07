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

        //console.log("webconf go", this.key);

        rcmail.triggerEvent("init_ariane", "mm-ariane");
        this.busy(); //loading
        mel_metapage.Storage.remove("webconf_token");
        this.update(); //Maj1
        $("#mm-webconf").css("display", "");
        $("#mm-ariane").css("display", "none");

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
                startWithAudioMuted: true,
                startWithVideoMuted:true,
                prejoinPageEnabled: false,
                toolbarButtons: [''
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
                displayName: rcmail.env["webconf.user_datas"].name
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
    const val = querry.val();
    const url = MEL_ELASTIC_UI.url("webconf", "", {_key:val});
    mel_metapage.Functions.title(url);

    if (val.length < 10 || Enumerable.from(val).where(x => /\d/.test(x)).count() < 3)
    {
        $("#webconf-enter").addClass("disalbled").attr("disabled", "disabled");
        $(".webconf-error-text").css("display", "").css("color", "red");
    }
    else
    {
        $("#webconf-enter").removeClass("disalbled").removeAttr("disabled", "disabled");
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

        $(".tiny-rocket-chat").css("display", "");

        if ((this.webconf.wsp === undefined || this.webconf.wsp === null) || this.webconf.wsp.datas.logo === "")
        {
            //TODO
        }
        else       
            this.logo.html(`<img src="${this.webconf.wsp.datas.logo}" />`).css("background-color", this.webconf.wsp.datas.color);
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

    /**
     * @async
     * Met fin à la webconf
     */
    async hangup()
    {
        window.open("https://webconf.numerique.gouv.fr/questionnaireSatisfaction.html", '_blank');//.focus();

        if (this.toolbar_item("wsp-toolbar-item-wsp").length > 0)
        {
            if (!(this.toolbar_item("conf-switch-toolbar").length === 0 || this.toolbar_item("conf-switch-toolbar").css("display") === "none"))
            {
                await ChangeToolbar("home");

                if ($("iframe.workspace-frame").length > 0)
                    $("iframe.workspace-frame").css("padding-right", "");
            }
        }

        delete window.webconf_master_bar;

        $(".webconf-toolbar").remove();
        this.send("hangup");

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
                $("#layout-frames").css("width", "");

            if (!this.webconf.is_framed())
            {
                if (querry.length > 0)
                    querry.css("padding-left", "");
            }
        }

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

        $(".webconf-frame").remove();
        $(".tiny-rocket-chat").css("display", "block");
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
    mute_demute(what)
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

                await mel_metapage.Functions.change_frame("stockage", true, true);
            }
        }

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
        this.webconf.minimize();
    }

    full_screen_ariane()
    {
        console.error("fsariane");
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

            if (rcmail.env.webconf.have_ariane())
            {
                await rcmail.env.webconf.go();

                rcmail.env.webconf.remove_selector();
            }
            else
            {
                rcmail.env.webconf.set_title();
                rcmail.env.webconf.show_selector();
            }
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


