(() => {
//Constantes
const var_visio = 'mel.visio';
const var_global_screen_manager = 'mel.screen_manager.global';
const var_top_on_change_added = 'mel.onchange.state.added';
const var_top_webconf_started = 'mel.visio.started';
const private_key = mel_metapage.Other.webconf.private;
const public_room = 'channel';
const private_room = 'group';
const enum_privacy_name = 'eprivacy';
const enum_created_state = 'ewstate';
const enum_screen_mode = 'ewsmode';
const enum_locks = 'enum_webconf_locks'
const eprivacy = MelEnum.createEnum(enum_privacy_name, {public:Symbol(), private:Symbol()});
const ewebconf_state = MelEnum.createEnum(enum_created_state, {chat:Symbol(), wsp:Symbol()});
const ewsmode = MelEnum.createEnum(enum_screen_mode, {fullscreen:Symbol(), minimised:Symbol(), fullscreen_w_chat:Symbol(), minimised_w_chat:Symbol(), chat:Symbol()});
const elocks = MelEnum.createEnum(enum_locks, {
    room:0,
    mode:1
});
const right_item_size  = 340;
const class_to_add_to_top = 'webconf-started';

//Globales
var jwt_token = undefined;

//Classes

//Abstraites
class AMelScreenManager {
    constructor(modes = null)
    {
        this.modes = modes || {};
        this.current_mode = null;
    }

    switchMode(mode) 
    {
        this.modes[mode](this.reinit());
        this.current_mode = mode;

        return this;
    }

    reinit() {
        return this;
    }
}

//Composants de la webconf
class WebconfChat{
    constructor(frame_chat, $loading_chat, {room='', privacy=eprivacy.public, hidden=true})
    {
        this._init()._setup(frame_chat, $loading_chat, room, privacy, hidden);
    }

    _init(){
        this.$frame_chat = null;
        this.$loaging = null; 
        this.room = '';
        this.privacy = eprivacy.public;
        this.hidden = true;
        this.is_loading = true;
        this.onloading = null;
        return this;
    }

    _setup(frame_chat, $loading_chat, room, privacy, hidden) {
        if (!this._check_privacy(privacy)) {
            console.error(`### [WebconfChat/setup]La confidencialitée donnée n'éxiste pas !`);
            throw privacy;
        }
        else {
            this.privacy = privacy;
            this.hidden = hidden;
            this.$frame_chat = frame_chat.on('load', () => {
                if (this.is_loading)
                {
                    this.is_loading = false;
                    if (!this.hidden) {
                        this.$loaging.css('display', 'none');
                        this.$frame_chat.css('display', '');
                    }
                    if (!!this.onloading) this.onloading(this);
                }

                rcmail.triggerEvent("init_ariane", "mm-ariane");
            });
            this.$loaging = $loading_chat;
            this.room = room;
        }
        return this;
    }

    _check_privacy(privacy) {
        for (const key in eprivacy) {
            if (Object.hasOwnProperty.call(eprivacy, key)) {
                const element = eprivacy[key];
                if (privacy === element) return true;
            }
        }

        return false;
    }

    is_public_room() {
        return this.privacy === eprivacy.public;
    }

    get_room(){
        if (this.room === '@home' || !(this.room || false)) return 'home';
        return `${(this.is_public_room() ? public_room : private_room)}/${this.room}`;
    }

    chat_visible() {
        return (!!(this.room || false)) && !this.hidden;
    }

    go_to_room(room = null, privacy = null)
    {

        if (!!room) this.room = room;
        if (!!privacy) {
            if (this._check_privacy(privacy)) this.privacy = privacy;
            else {
                console.warn(`/!\\ [WebconfChat/go_to_room]La confidencialitée donnée n'éxiste pas, cela va provoquer des disfonctionnement !`, privacy);
            }
        }

        this.$frame_chat[0].contentWindow.postMessage({
            externalCommand: 'go',
            path: `/${this.get_room()}`
        }, '*')
    }

    getChatElement() {
        if (this.is_loading) return this.$loaging;
        else return this.$frame_chat;
    }

    hide()
    {
        this.getChatElement().css('display', 'none');
        return this;
    }

    show()
    {
        this.getChatElement().css('display', '');
        return this;
    }

    async waitLoading(){
        if (!this.is_loading) return true;
        else {
            return await new Promise((ok, nok) => {
                const tmp = () => {
                    if (!this.is_loading) ok(true);
                    else setTimeout(tmp, 50);
                }
            });
        }
    }

    dispose() {
        if (!!this.disposed) return;
        this.disposed = true;

        this.$frame_chat = null;
        this.$loaging = null; 
        this.room = null;
        this.privacy = null;
        this.hidden = null;
        this.is_loading = null;
        this.onloading = null;
    }

}

WebconfChat.from_string = (str) => {

    if (!(str || false)) return null; 

    return {
        privacy:(str.includes(private_key) ? eprivacy.private : eprivacy.public),
        room_name:str.replaceAll(private_key, '')
    }
};

class WebconfWorkspaceManager {
    constructor(wsp) {
        return this._init()._setup(wsp);
    }

    _init(){
        this.have_chat = false;
        this.color = 'blue';
        this.privacy = eprivacy.public;
        this.logo = '';
        this.title = '';
        this.uid = null;
        this.objects = null;
        this._original_datas = null;
        return this;
    }

    _setup(wsp) {
        const datas = wsp?.datas;
        this.have_chat = datas?.allow_ariane;
        this.color = datas?.color;
        this.privacy = datas?.ispublic == 0 ? eprivacy.private : eprivacy.public;
        this.logo = datas?.logo;
        this.title = datas?.title;
        this.uid = datas?.uid;
        this.objects = wsp?.objects;
        this._original_datas = wsp;
        return this;
    }

    have_workspace()
    {
        return !!this.uid;
    }

    have_chatroom(){
        return this.have_chat && !!this.objects && !!this.objects.channel && !!this.objects.channel.name;
    }

    have_cloud() {
        return !!this.objects && !!this.objects.doc;
    }

    create_chat($framechat, $loading_chat){
        let chat = null;

        if (this.have_workspace() && this.have_chatroom()){
            chat = new WebconfChat($framechat, $loading_chat, {
                room:this.objects.channel.name,
                privacy:this.privacy,
                hidden:false
            });
        }

        return chat;
    }

    dispose()
    {
        if (!!this.disposed) return;
        this.disposed = true;

        this.have_chat = null;
        this.color = null;
        this.privacy = null;
        this.logo = null;
        this.title = null;
        this.uid = null;
        this.objects = null;
        this._original_datas = null;
    }
}

class WebconfPageCreator {
    constructor($page, $page_error_text, $room, $state, $chat, $wsp, $start_button, config, $startedMic = null, $startedCam = null, callbackStart = null) {
        this._init()._setup($page, $page_error_text, $room, $state, $chat, $wsp, $start_button, config, $startedMic, $startedCam, callbackStart);
    }

    _init() {
        this.$page = null;
        this.$page_error_text = null;
        this.$room_key = null;
        this.$state = null;
        this.$chat = null;
        this.$wsp = null;
        this.$button_start = null;
        this.onstart = null;
        this.config = {
            need_config:1,
            locks:[]
        };
        return this;
    }

    _setup($page, $page_error_text, $room, $state, $chat, $wsp, $start_button, config, $startedMic = null, $startedCam = null, callbackStart = null) {
        this.$page = $page;
        this.$page_error_text = $page_error_text;
        this.$room_key = $room;
        this.$state = $state;
        this.$chat = $chat;
        this.$wsp = $wsp;
        this.$button_start = $start_button;
        this.onstart = callbackStart;
        this.config = config;
        return null;
    }

    startup() {
        this.$room_key.val(this.generateRandomlyKey());
        this.$room_key.on('input', (e) => {
            this.checkFormAction();
        });
        this.$state.on('change', (e) => {
            if (this.$state[0].checked) {
                this.$chat.parent().css('display', 'none');
                this.$wsp.parent().css('display', '');
            }
            else {
                this.$chat.parent().css('display', '');
                this.$wsp.parent().css('display', 'none');
            }
        });
        this.$button_start.on('click', () => {
            this.onstart(this);
        });

        if (!!this.config.locks && this.config.locks.length > 0)
        {
            for (const iterator of this.config.locks) {
                switch (iterator) {
                    case elocks.room:
                        this.$room_key.addClass('disabled').attr('disabled', 'disabled');
                        break;
                    case elocks.mode:
                        this.$state.addClass('disabled').attr('disabled', 'disabled');
                        this.$chat.addClass('disabled').attr('disabled', 'disabled');
                        this.$wsp.addClass('disabled').attr('disabled', 'disabled');
                        break;
                    default:
                        break;
                }
            }
        }

        return this;
    }

    enabled() {
        return this.$page.css('display') !== 'none';
    }

    show() {
        this.$page.css('display', '');
        return this;
    }

    hide() {
        this.$page.css('display', 'none');
        return this;
    }

    generateRandomlyKey(){
        return mel_metapage.Functions.generateWebconfRoomName();
    }

    getRoomKey(){
        return this.$room_key.val();
    }

    getState(){
        return this.$state[0].checked ? ewebconf_state.wsp : ewebconf_state.chat;
    }

    getStateValue() {
        switch (this.getState()) {
            case ewebconf_state.wsp:
                return this.$wsp.val();
            case ewebconf_state.chat:
                return this.$chat.val();
        
            default:
                throw 'error';
        }
    }

    transformUrlIntoKey(url){
        return mel_metapage.Functions.webconf_url(url.toLowerCase());
    }

    checkKeyIsValid(val) {
        return val.length >= 10 && Enumerable.from(val).where(x => /\d/.test(x)).count() >= 3 && /^[0-9a-zA-Z]+$/.test(val);
    }

    checkFormAction(val = null) {
        val = val || this.getRoomKey();
        {
            const detected = this.transformUrlIntoKey(val) || false;
            if (!!detected) val = detected;
            
        }

        this.$room_key.val(val.toUpperCase());

        if (this.checkKeyIsValid(val))
        {
            const url = mel_metapage.Functions.url('webconf', '', {_key:val});
            mel_metapage.Functions.title(url.replace(`${rcmail.env.mel_metapage_const.key}=${rcmail.env.mel_metapage_const.value}`, ""));

            this.$button_start.removeClass("disabled").removeAttr("disabled", "disabled");
            this.$page_error_text.css("display", "none").css("color", "black");
        }
        else {
            this.$button_start.addClass("disabled").attr("disabled", "disabled");
            this.$page_error_text.css("display", "").css("color", "red");
        }
    }

    dispose()
    {
        if (!!this.disposed) return;
        this.disposed = true;

        this.$page = null;
        this.$page_error_text = null;
        this.$room_key = null;
        this.$state = null;
        this.$chat = null;
        this.$wsp = null;
        this.$button_start = null;
        this.onstart = null;
    }
}

class InternalWebconfScreenManager extends AMelScreenManager {
    constructor(chat, $frame_webconf, minimise_and_maximise_buttons, ariane_size, is_framed, modes = null)
    {
        super(modes);
        this._init()._setup(chat, $frame_webconf, minimise_and_maximise_buttons, ariane_size, is_framed);
    }

    _init() {
        this.chat = null;
        this.$frame_webconf = null;
        this.$button_minimize = null;
        this.$button_maximize = null;
        this._ariane_size = 0;
        this.modes = null;
        this.current_mode = ewsmode.fullscreen;
        this._is_framed = false;
        this._button_size_correction = {};
        this.ignore_correction = false;
        return this;
    }

    _setup(chat, $frame_webconf, m_m_button, ariane_size, is_framed)
    {
        this.chat = chat;
        this.$frame_webconf = $frame_webconf;
        this.$button_maximize = m_m_button.$maximise;
        this.$button_minimize = m_m_button.$minimize;
        this._ariane_size = ariane_size;
        this._is_framed = is_framed;
        return this;
    }

    switchMode(mode) 
    {
        switch (mode) {
            case ewsmode.fullscreen:
                this.fullscreen(false);
                break;
            case ewsmode.minimised:
                this.minimise(false);
                break;
            case ewsmode.fullscreen_w_chat:
                this.fullscreen(true);
                break;
            case ewsmode.minimised_w_chat:
                this.minimise(true);
                break;
            case ewsmode.chat:
                this.fullscreen_chat(!this.chat.hidden);
                break
            default:
                this.modes[mode](this.reinit());
                break;
        }

        this.current_mode = mode;

        return this;
    }

    getChatElement() {
        if (this.chat.is_loading) return this.chat.$loaging;
        else return this.chat.$frame_chat;
    }

    updateMode()
    {
        switch (this.current_mode) {
            case ewsmode.fullscreen:
                this.fullscreen(!this.chat.hidden);
                break;
            case ewsmode.minimised:
                this.minimise(!this.chat.hidden);
                break;
            case ewsmode.fullscreen_w_chat:
                this.fullscreen(!this.chat.hidden);
                break;
            case ewsmode.minimised_w_chat:
                this.minimise(!this.chat.hidden);
                break;
            case ewsmode.chat:
                this.fullscreen_chat(!this.chat.hidden);
                break
            default:
                this.modes[mode](this.reinit());
                break;
        }

        return this;
    }

    pixel_correction()
    {
        if (this._is_framed) return 0;
        else return 60;
    }

    reinit() {
        this.$frame_webconf.css('left', '')
                           .css('right', '')
                           .css('width', '')
                           .css('height', '');
        this.getChatElement().css('height', '').css('width', this._ariane_size + 'px').css('left', '').css('right', '');
        this.$button_minimize.css('display', 'none').css('top', '').css('right', '');
        this.$button_maximize.css('display', 'none');
        return super.reinit();
    }

    fullscreen(chat_enabled) {
        this.reinit().$button_minimize.css('display', '')
                                      .css('top', '15px')
                                      .css('right', `calc(${15 + (chat_enabled ? this._ariane_size : 0)}px + ${this.get_button_size_correction()})`);
        this.$frame_webconf.css('width', `calc(100% - ${(chat_enabled ? this._ariane_size : 0) + this.pixel_correction()}px)`)
                           .css('height', `calc(100% - ${this.pixel_correction()}px)`);
        this.getChatElement().css('display', chat_enabled ? '' : 'none')
                             .css('height', `calc(100% - ${this.pixel_correction()}px)`);
        this.chat.hidden = !chat_enabled;
    }

    minimise(chat_enabled){
        this.reinit();
        this.$button_maximize.css('display', '').css('top', '15px').css('right', '15px');
        this.$frame_webconf.css('left', 'unset')
                           .css('right', '0')
                           .css('width', `${this._ariane_size}px`)
                           .css('height', (chat_enabled ? '25%' : `calc(100% - ${this.pixel_correction()}px)`));
        this.getChatElement().css('display', chat_enabled ? '' : 'none')
                             .css('height', `calc(${chat_enabled ? '75' : '100'}% - ${this.pixel_correction()}px)`);
        this.chat.hidden = !chat_enabled;

    }

    fullscreen_chat(chat_enabled) {
        chat_enabled = true;
        if (chat_enabled) {
            this.reinit().minimise(false);
            this.getChatElement().css('display', '')
                                 .css('width', `calc(100% - ${this.pixel_correction() + this._ariane_size}px)`)
                                 .css('right', 'unset')
                                 .css('left', this.pixel_correction() + 'px');

        }   
        else return this.fullscreen(false);
    }

    update_button_size()
    {
        const str = `calc(${15 + (!this.chat.hidden ? this._ariane_size : 0)}px + ${this.get_button_size_correction()})`;
        console.log('size', str);
        this.$button_minimize.css('right', str);
        return this;
    }

    button_size_correction(key, add) {
        this._button_size_correction[key] = add;
    }

    delete_button_size_correction(key)
    {
        this._button_size_correction[key] = null;
    }

    _get_button_size_correction()
    {
        let correction = '';

        for (const key in this._button_size_correction) {
            if (Object.hasOwnProperty.call(this._button_size_correction, key)) {
                const element = this._button_size_correction[key];
                if (!!element)
                {
                    correction += element + ' + ';
                }
            }
        }

        if ((correction || false) !== false) correction += '0px';

        return correction || '0px';
    }

    get_button_size_correction()
    {
        return this.ignore_correction ? 0 : this._get_button_size_correction();
    }

    dispose()
    {
        if (!!this.disposed) return;
        this.disposed = true;

        this.$button_minimize.css('display', '').css('top', '').css('right', '');
        this.$button_maximize.css('display', 'none');

        const parent = this.$button_minimize.parent();
        this.$button_minimize.remove();
        this.$button_minimize = $(this.$button_minimize[0].outerHTML).css('top', '15px').css('right', '15px').click(() => {
            mel_metapage.Frames.back();
        });
        this.$button_minimize.find('.icon-mel-undo').removeClass('icon-mel-undo').addClass('icon-mel-close');
        parent.append(this.$button_minimize);

        this.chat.dispose();
        this.chat = null;
        this.$frame_webconf = null;
        this.$button_minimize = null;
        this.$button_maximize = null;
        this._ariane_size = null;
        this.modes = null;
        this.current_mode = null;
        this._is_framed = null;
        this._button_size_correction = null;
        this.ignore_correction = null;
    }

}

//Webconf
class Webconf{
    constructor(frameconf_id, framechat_id, $loading_chat, size_buttons, ask_datas, key, ariane, wsp, ariane_size = 323, is_framed=null, onstart = null){
        this._init()._setup(frameconf_id, framechat_id, $loading_chat, size_buttons, ask_datas, key, ariane, wsp, ariane_size, is_framed, onstart).startup();
    }

    _init() {
        this._is_framed = false;
        this.wsp = null;
        this.chat = null;
        this.$frame_webconf = null;
        this.key = '';
        this.webconf_page_creator = null;
        this.screen_manager = null;
        this.onstart = null;
        this._need_config = false;
        return this;
    }

    _setup(frameconf_id, framechat_id, $loading_chat, size_buttons, ask_datas, key, ariane, wsp, ariane_size = 323, is_framed=null, onstart = null){
        const $chat = $(`#${framechat_id}`);

        if (is_framed === null && parent !== window) this._is_framed = true;
        else if (is_framed === null) this._is_framed = false;
        else this._is_framed = is_framed

        this.wsp = new WebconfWorkspaceManager(wsp);
        this.chat = this.wsp.create_chat($chat, $loading_chat);

        if (!this.chat) {
            const tmp = WebconfChat.from_string(ariane);
            this.chat = new WebconfChat($chat, $loading_chat, {
                room:tmp?.room_name,
                privacy:tmp?.privacy,
                hidden:!tmp
            })
        }

        this.webconf_page_creator = new WebconfPageCreator(ask_datas?.$page, ask_datas?.$error, ask_datas?.$room, ask_datas?.$state, ask_datas?.$chat, ask_datas?.$wsp, ask_datas?.$start, ask_datas?.config ?? {});
        this.$frame_webconf = $(`#${frameconf_id}`);
        this.screen_manager = new InternalWebconfScreenManager(this.chat, this.$frame_webconf, size_buttons, ariane_size, this._is_framed);
        this.key = key || null;
        this.onstart = onstart;

        this._need_config = ask_datas?.config?.need_config == true;

        return this;
    }

    startup() {
        //this.$frame_webconf.css('background', 'url(https://img.freepik.com/free-vector/night-ocean-landscape-full-moon-stars-shine_107791-7397.jpg?w=2000)').css('display', '').css('background-size', 'contain');
        //this.chat.$frame_chat.css('background-color', 'blue');
        //this.screen_manager.fullscreen(!this.chat.hidden);
        if (!this.key || this._need_config) {
            this._need_config = false;
            this.webconf_page_creator.startup().show();

            if (this.wsp.have_workspace())
            {
                this.webconf_page_creator.$state[0].checked = true;
                this.webconf_page_creator.$wsp.val(this.wsp.uid);
            }
            else if (this.chat.chat_visible() && this.chat.room !== '@home' && this.chat.room !== 'home')
            {
                this.webconf_page_creator.$state[0].checked = false;
                this.webconf_page_creator.$chat.val(this.chat.room);
            }

            this.webconf_page_creator.onstart = async (webconf_page_creator) => {
                this.key = webconf_page_creator.getRoomKey();

                switch (webconf_page_creator.getState()) {
                    case ewebconf_state.chat:
                    {
                        const chat = webconf_page_creator.getStateValue();
                        if (chat === 'home' || chat === '@home'){
                            this.chat.room = '@home';
                            this.chat.hidden = true;
                        }
                        else {
                            const splited = chat.split(':');
                            this.chat.privacy = splited[0] === 'true' ? eprivacy.public : eprivacy.private;
                            this.chat.room = splited[1];
                            this.chat.hidden = false;
                        }
                    }
                    break;
                    case ewebconf_state.wsp:
                        {
                            top.rcmail.display_message('Chargement de l\'espace....', 'loading');
                            await         mel_metapage.Functions.post(
                                mel_metapage.Functions.url("webconf", "get_workspace_datas"),
                                {
                                    _uid:webconf_page_creator.$wsp.val()
                                },
                                (datas) => {
                                    const wsp = JSON.parse(datas);
                                    this.wsp = new WebconfWorkspaceManager(wsp);
                                    this.chat.privacy = this.wsp?.privacy;
                                    this.chat.room = this.wsp.objects?.channel?.name || '@home'
                                    this.chat.hidden = !this.wsp.have_chatroom()
                                    top.rcmail.clear_messages();
                                }
                            );
                        }
                    default:
                        break;
                }

                this.startup();
            };
        }
        else {
            if (this.webconf_page_creator.checkKeyIsValid(this.key))
            {
                this.webconf_page_creator.hide();
                this.$frame_webconf.css('display', '');
                this.screen_manager.fullscreen(!this.chat.hidden);
                this.screen_manager.$button_minimize.addClass('disabled').attr('disabled', 'disabled');
                this.start().then(() => {
                    this.screen_manager.$button_minimize.removeClass('disabled').removeAttr('disabled');
                    this.set_document_title();
                });
            }
            else {
                const key = this.key || '';
                top.rcmail.display_message('Impossible de lancer le visio !', 'error');
                alert(`Le nom de la conférence est incorrecte, ${this.key} n'est pas un nom valide !\r\nIl faut au moins 10 lettres et 3 chiffres, alphanumérique seulement.`);
                top.rcmail.display_message('Merci de mettre un bon nom de salon.');
                this.webconf_page_creator.show();
                this.key = null;
                this.startup();
                this.webconf_page_creator.$room_key.val(key.toUpperCase());
                this.webconf_page_creator.checkFormAction(key);
            }
        }

    }

    async start(){
        this.key = this.key || this.webconf_page_creator.generateRandomlyKey();

        await this.navigatorWarning();

        this.startChat();

        const domain = rcmail.env["webconf.base_url"].replace("http://", "").replace("https://", "");

        this.$frame_webconf.find('.loading-visio-text').html('Récupération du jeton...');

        const global_on_start = this.onstart;

        const options = {
            jwt:await this.jwt(),
            roomName: this.key,
            width: "100%",
            height: "100%",
            parentNode: document.querySelector('#mm-webconf'),
            onload(){
                //if (this._frame_loaded !== true)  mel_metapage.Storage.set("webconf_token", true);
                if (!!global_on_start) global_on_start();
                mel_metapage.Storage.set("webconf_token", true);
                $('#mm-webconf').find('iframe').css('display', '').parent().find('.absolute-center').remove();
                
            },
            configOverwrite: { 
                hideLobbyButton: true,
                startWithAudioMuted: true,
                startWithVideoMuted:true,
                prejoinConfig: {
                    enabled:false,
                },
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
                //TOOLBAR_BUTTONS : [""]
            },
            userInfo: {
                email: rcmail.env["webconf.user_datas"].email,
                displayName: (rcmail.env["webconf.user_datas"].name === null ? (rcmail.env["webconf.user_datas"].email ? rcmail.env["webconf.user_datas"].email : 'Bnum user') : rcmail.env["webconf.user_datas"].name)//.split("(")[0].split("-")[0]
            }
        };

        this.$frame_webconf.find('.loading-visio-text').html('Connexion à la visioconférence...')

        await wait(() => window.JitsiMeetExternalAPI === undefined);
        console.log('Connexion...')
        this.jitsii = new JitsiMeetExternalAPI(domain, options);
        this.$frame_webconf.find('iframe').css('display', 'none');

        this.$frame_webconf.find('.loading-visio-text').html('Chargement de la visioconférence...')

        await wait(() => mel_metapage.Storage.get("webconf_token") === null); //Attente que la frame soit chargée
        mel_metapage.Storage.remove("webconf_token");

        this.jitsii.executeCommand('avatarUrl', `${rcmail.env.rocket_chat_url}avatar/${rcmail.env.username}`);

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

    startChat() {
        this.chat.onloading = () => {
            this.screen_manager.updateMode();
        };
        this.chat.$frame_chat[0].src = rcmail.env.rocket_chat_url + this.chat.get_room();
        return this;
    }

    async navigatorWarning()
    {
        
        if (MasterWebconfBar.isFirefox())
        {
            let misc_urls = {
                _key:this.key
            };

            if (!!this.wsp) misc_urls['_wsp'] = this.wsp.uid;
            else if (!!ariane) misc_urls['_ariane'] = this.chat.room;

            //Création de l'alerte
            let $ff = $(`
            <div class="alert alert-warning" role="alert" style="
                position: absolute;
                z-index:9999;
                text-align: center;">
                Attention ! Vous utilisez un navigateur qui dégrade la qualité de la visioconférence. 
                <br/>
                Nous vous conseillons d'utiliser un autre <a href="microsoft-edge:${mel_metapage.Functions.url('webconf', null, misc_urls)}">navigateur</a> ou rejoignez depuis votre <a href="tel:${this.key};${(await window.webconf_helper.phone.pin(this.key))}#">téléphone</a>. 
                <button style="margin-top:-12px" type="button" class="close" data-dismiss="alert" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
                <div class="progress" style="    position: absolute;
                    bottom: 0;
                    width: 100%;
                    left: 0;
                    height: 0.3rem;
                ">
                    <div class="progress-bar bg-warning" role="progressbar" style="width: 100%" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
            </div>`);

            //Gestion des attributs css
            let width = '100%';
            let top = 0;
            let left = 0;

            if (parent === window) //Prendre en compte les barres de navigatios
            {
                top = left = '60px';
                width = `calc(100% - ${left})`;
            }

            $ff.css('width', width).css('top', top).css('left', left); //Ajout des attributs css

            $('body').append($ff); //Ajout au body

            let value = 100; //La barre disparaît après ~10 secondes
            const inter = setInterval(() => {
                try {
                    value -= 2;
                    $ff.find('.progress-bar').css('width', `${value}%`).attr('aria-valuenow', value);
    
                    if (value <= 0) {
                        clearInterval(inter);
                        setTimeout(() => { // Laisser la barre finir
                            try {
                                $ff.remove();
                            } catch (error) {
                                
                            }
                        }, 200);
                    }
                } catch (error) {
                    clearInterval(inter);
                }
            }, 100);
        } //Fin si firefox
    }

    async jwt()
    {
        if (this._jwt === undefined)
        {
            rcmail.http_get('webconf/jwt', {
				_room : this.key,
			}, rcmail.display_message(rcmail.get_label('loading'), 'loading'));
            while (jwt_token === undefined) {
                await delay(100);
            }
            this._jwt = jwt_token;
        }
        return this._jwt;
    }

    addDisposition(key, callback) {
        if (!this.screen_manager.modes) this.screen_manager.modes = {};

        this.screen_manager.modes[key] = callback;
    }

    showChat() {
        this.chat.show().hidden = false;
        this.screen_manager.updateMode();
        return this;
    }

    hideChat() {
        this.chat.hide().hidden = true;
        this.screen_manager.updateMode();
        return this;
    }

    toggleChat(){
        return this.chat.chat_visible() ? this.hideChat() : this.showChat();
    }

    get_url(ispublic = false)
    {
        let config = {
            _key:this.key
        };

        if (this.wsp.have_workspace())
            config["_wsp"] = this.wsp.uid;
        else if (this.chat.chat_visible())
            config["_ariane"] = (`${this.chat.room}${(this.chat.privacy === eprivacy.private ? private_key : "")}`);
        
        const url = ispublic ? mel_metapage.Functions.public_url('webconf', config) : MEL_ELASTIC_UI.url("webconf", "", config);
        return url.replace(`${rcmail.env.mel_metapage_const.key}=${rcmail.env.mel_metapage_const.value}`, "");
    }

    set_document_title()
    {
        if (!this.key) return; 
        
        top.mel_metapage.Functions.title(this.get_url());
    }

    dispose()
    {
        if (!!this.disposed) return;
        this.disposed = true;

        this._is_framed = false;
        this.wsp.dispose();
        this.wsp = null;
        this.chat.dispose();
        this.chat = null;
        this.$frame_webconf = null;
        this.key = '';
        this.webconf_page_creator.dispose();
        this.webconf_page_creator = null;
        this.screen_manager.dispose();
        this.screen_manager = null;
        this.onstart = null;

        // try {
        //     this.jitsii.dispose();
        // } catch (error) {
            
        // }
    }
}

class WebconfScreenManager extends AMelScreenManager {
    constructor($webconf, $frames, webconfitem, webconf_size = 423, modes = null, frameModes = null) {
        super(modes);
        this._init()._setup($webconf, $frames, webconfitem, webconf_size);
    }

    _init() {
        this.$webconf = null;
        this.$layout_frames = null;
        this.master_bar = null;
        this._minified_size = 0;
        this.webconf = null;
        this.frames_modes = null;
        return this;
    }

    _setup($webconf, $frames, webconfitem, webconf_size, frameModes) {
        this.$webconf = $webconf;
        this.$layout_frames = $frames;
        this._minified_size = webconf_size;
        this.webconf = webconfitem;
        this.frames_modes = frameModes || {};

        this.webconf.screen_manager.$button_maximize.click(() => {
            mel_metapage.Functions.change_frame('webconf', true, true).then(() => {
                top.rcmail.clear_messages();
            });
        });

        this.webconf.screen_manager.$button_minimize.click(() => {
            if (top.$("#taskmenu .menu-last-frame").hasClass("disabled")) mel_metapage.Functions.change_frame('home', true, true).then(() => {
                top.rcmail.clear_messages();
            });
            else top.rcmail.command('last_frame');
        });

        return this;
    }

    setMasterBar(bar) {
        this.master_bar = bar;
        return this;
    }

    switchMode(mode) 
    {
        let is_fullscreen_chat = false;
        switch (mode) {
            case ewsmode.chat:
                is_fullscreen_chat = true;
            case ewsmode.fullscreen_w_chat:
            case ewsmode.fullscreen:
                this.fullscreen(is_fullscreen_chat);
                break;
            case ewsmode.minimised_w_chat:
            case ewsmode.minimised:
                this.minimise();
                break;
            default:
                this.modes[mode](this.reinit());
                break;
        }

        this.current_mode = mode;

        return this;
    }

    switchModeFrame() {
        const mode = this.current_mode;

        switch (mode) {
            case ewsmode.fullscreen_chat:
                break;
            case ewsmode.fullscreen_w_chat:
            case ewsmode.fullscreen:
                this.fullscreenFrame();
                break;
            case ewsmode.minimised_w_chat:
            case ewsmode.minimised:
                this.minimiseFrame();
                break;
            default:
                this.frames_modes[mode](this.reinit());
                break;
        }
    }

    _is_visio_framed(){
        return this.$webconf[0].nodeName === 'iframe';
    }

    _getCurrentPage() {
        return top.rcmail.env.current_frame_name;
    }

    _getOtherPage() {
        return  top.$(`iframe.${this._getCurrentPage()}-frame`);
    }

    reinit() {
        this.$webconf.css('width', '100%').css('position', '').css('left', '').css('right', '').css('top', '').css('padding-left', '');
        return this;
    }

    reinitFrame() {
        for (var iterator of top.$('.mm-frame')) {
            iterator = $(iterator);

            if (!iterator.hasClass('webconf-frame')) {
                iterator.css('width', '100%').css('position', '').css('left', '').css('right', '').css('top', '');
            }
        }
        return this;
    }

    fullscreen(chat = false) {
        const chat_hidden = this.webconf.chat.hidden;
        this.reinit();
        this.webconf.screen_manager.switchMode(chat ? ewsmode.chat : ewsmode.fullscreen);

        this.master_bar.right_pannel.cannot_be_disabled = false;
        if (chat_hidden) 
        {
            this.webconf.hideChat();
            if (!!this.master_bar) this.master_bar.right_pannel.disable_right_mode();
        }
        else 
        {
            this.webconf.showChat();

            if (!!this.master_bar) this.master_bar.right_pannel.enable_right_mode();
        }
        this.webconf.chat.hidden = chat_hidden;
    }

    minimise() {
        const chat_hidden = this.webconf.chat.hidden;
        this.reinit().$webconf.css('position', 'absolute')
                              .css('top', '0')
                              .css('right', '0')
                              .css('padding-left', '0')
                              .css('width', this._minified_size);
        this.webconf.screen_manager.switchMode(ewsmode.minimised);

        if (!!this.master_bar) 
        {
            this.master_bar.right_pannel.enable_right_mode();
            this.master_bar.right_pannel.cannot_be_disabled = true;
        }
        if (chat_hidden) this.webconf.hideChat();
        else this.webconf.showChat();
    }

    fullscreenFrame() {
        this.reinitFrame();
    }

    minimiseFrame() {
        this.reinitFrame()._getOtherPage().css('width', `calc(100% - ${this._minified_size}px)`)
                                          .css('position', 'absolute')
                                          .css('top', '0')
                                          .css('left', '0');
    }

    dispose()
    {
        if (!!this.disposed) return;
        this.disposed = true;

        this.$webconf = null;
        this.$layout_frames = null;
        if (!!this.master_bar)
        {
            this.master_bar.dispose();
            this.master_bar = null;
        }
        this._minified_size = null;
        this.webconf.dispose();
        this.frames_modes = null;
    }
    
}

//MasterWebconfBarElement
class MasterWebconfBarItem {
    constructor($item, action, toggle = true)
    {
        this._init()._setup($item, action, toggle);
    }

    _init() {
        this.$item = null;
        this.action = null;
        this.onactive = null;
        this.ondisable = null;
        this.state = false;
        this._linkedItems = null;
        return this;
    }

    _setup($item, action, toggle) {
        this.$item = $item;
        this.action = action;

        if (toggle) this.$item.click(() => {
            this.toggle();
        });
        else {
            this.$item.click(() => {
                this.click();
            });
        }

        return this;
    }

    _execute_action(...args)
    {
        return this.action.caller[this.action.func].call(this.action.caller, ...args);
    }

    is_active() {
        return this.state;
    }

    active() {
        this.state = true;
        this.$item.addClass('active');
        this._execute_action(true, this);
        
        if (!!this.onactive) this.onactive(this);
        return this;
    }

    disable() {
        this.state = false;
        this.$item.removeClass('active');
        this._execute_action(false, this);
        
        if (!!this.ondisable) this.ondisable(this);
        return this;
    }

    toggle() {
        if (this.state) this.disable();
        else this.active();

        return this;
    }

    click() {
        this._execute_action(true, this);

        return this;
    }

    hide() {
        this.$item.css('display', 'none');
    }

    show() {
        this.$item.css('display', '');
    }

    addLink(key, item, selfKeyLink = null) {
        if (!this._linkedItems) this._linkedItems = {};

        this._linkedItems[key] = item;

        if (!!selfKeyLink) {
            this._linkedItems[key].addLink(selfKeyLink, this);
        }

        return this;
    }

    getLink(key) {
        if (!!this._linkedItems) return this._linkedItems[key];
        return null;
    }

    getAllLinks() {
        return this._linkedItems ?? {};
    }

    dispose() {
        if (!!this.disposed) return;
        this.disposed = true;

        if (!!this._linkedItems)
        {
            for (const key in this._linkedItems) {
                if (Object.hasOwnProperty.call(this._linkedItems, key)) {
                    const element = this._linkedItems[key];
                    element.dispose();
                }
            }
            this._linkedItems = null;
        }

        this.$item = null;
        this.action = null;
        this.onactive = null;
        this.ondisable = null;

        return null;
    }
}

class MasterWebconfBarPopup {
    constructor($popup)
    {
        this._init()._setup($popup);
    }

    _init() {
        this.$popup = null;
        this.$contents = null;
        this.last_state = 'hidden';
        return this;
    }

    _setup($popup)
    {
        this.$popup = $popup;
        this.$contents = this.$popup.find('.toolbar-datas');
        return this;
    }

    empty() {
        this.$contents.html('');
        return this;
    }

    show() {
        this.$popup.css('display', '');
        return this;
    }

    hidden() {
        this.$popup.css('display', 'none');
        return this;
    }

    update_content(datas) {
        this.$contents.html(datas);
        return this;
    }

    loading(text = 'Chargement des données...') {
        this.$contents.html(`<div><p>${text}</p><span class=spinner-grow></span></div>`);
        return this;
    }

    dispose(){
        if (!!this.disposed) return;
        this.disposed = true;

        this.$popup = null;
        this.$contents = null;
        this.last_state = null;
    }
}

class RightPannel
{
    constructor($pannel)
    {
        this.$pannel = $pannel;
        this.CONST_VISIBLE_MODE = 'visible-mode';
        this.CONST_RIGHT_MODE = 'right-mode';
    }

    toTop() {
        this.$pannel = this.$pannel.appendTo(top.$('#layout'));
        return this;
    }

    open() {
        if (!this.is_open()) this.$pannel.addClass(this.CONST_VISIBLE_MODE);
        return this;
    }

    close()
    {
        this.$pannel.removeClass(this.CONST_VISIBLE_MODE);
        return this;
    }

    is_open()
    {
        return this.$pannel.hasClass(this.CONST_VISIBLE_MODE);
    }

    set_title(title)
    {
        this.$pannel.find('.title').html(title);
        return this;
    }

    enable_right_mode()
    {
        if (!this.$pannel.hasClass(this.CONST_RIGHT_MODE)) this.$pannel.addClass(this.CONST_RIGHT_MODE);
        return this;
    }

    disable_right_mode()
    {
        if (!this.cannot_be_disabled) this.$pannel.removeClass(this.CONST_RIGHT_MODE);
        return this;
    }

    set_content(content, callback = null)
    {
        this.$pannel.find('#html-pannel').html(content);

        if (!!callback)
        {
            callback(this.$pannel);
        }

        return this;
    }

    dispose() {
        if (!!this.disposed) return;
        this.disposed = true;

        this.$pannel.remove();
        this.$pannel = null;
        return null;
    }
}

//MasterWebconfBar
class MasterWebconfBar {
    /**
     * 
    * @param {Webconf} webconfManager Id de l'iframe qui contient la webconf
    * @param {string} framechat_id Id de l frame qui contient rocket.chat
    * @param {string} ask_id Id de la div qui permet de configurer la webconf
    * @param {string} key Room de la webconf 
    * @param {string} ariane Room ariane
    * @param {JSON} wsp Infos de l'espace de travail si il y en a
    * @param {int} ariane_size Taille en largeur et en pixel de la frale ariane 
    * @param {boolean} is_framed Si la webconf est dans une frame ou non 
     */
    constructor(globalScreenManager, webconfManager, $right_pannel, more_actions, rawbar, bar_visible = true) {
        this._init()._setup(globalScreenManager, webconfManager, $right_pannel)._create_bar(rawbar, more_actions);

        if (!bar_visible) this.$bar.css('display', 'none');
        else this.launch_timeout();
    }

    _init() {
        this.globalScreenManager = null;
        this.webconfManager = null;
        this.$bar = null;
        this.items = {};
        this.ignore_send = false;
        this.listener = null;
        this.popup = null;
        this.right_pannel = null;
        this.ondispose = null;
        return this;
    }

    /**
     * 
     * @param {Webconf} globalScreenManager 
     * @param {*} webconfManager 
     * @param {*} $right_pannel 
     * @returns 
     */
    _setup(globalScreenManager, webconfManager, $right_pannel) {
        this.globalScreenManager = globalScreenManager.setMasterBar(this);
        this.webconfManager = webconfManager;
        this.right_pannel = new RightPannel($right_pannel).toTop();
        return this;
    }
  
    _create_bar(rawbar, more_actions) {
        const isff = MasterWebconfBar.isFirefox();
        $("body").append(rawbar);

        for (var iterator of Enumerable.from($('.wsp-toolbar.webconf-toolbar button')).concat(more_actions.$buttons)) {
            iterator = $(iterator);
             if (!!iterator.data('witem')) {
                this.items[iterator.data('witem')] = new MasterWebconfBarItem(iterator, {
                    caller:this,
                    func:iterator.data('function')
                }, !iterator.data('click'));

                if (!!iterator.data('noff') && isff) this.items[iterator.data('witem')].hide();
             }
        }

        //Link
        if (!!this.items['popup_mic'] && !!this.items['popup_cam'])
        {
            this.items['popup_mic'].addLink('other', this.items['popup_cam'], 'other');
        }

        this.$bar = $('.wsp-toolbar.webconf-toolbar');
        this.popup = new MasterWebconfBarPopup(this.$bar.find('.toolbar-popup'));

        this.popup.$popup.addClass('large-toolbar').css('height', `${window.innerHeight / 2}px`);

        this._$more_actions = more_actions.$button.css('display', '').removeClass('hidden').removeClass('active').appendTo(this.$bar);
        
        $(window).resize(() => {
            this.popup.$popup.css('height', `${window.innerHeight / 2}px`);
        });
        return this;
    }

    updateLogo()
    {
        const wsp = this.webconfManager.wsp;

        if (wsp.have_workspace()) {
            if (wsp.logo != "false") this.items['round'].$item.html(`<img src="${wsp.logo}" />`).css("background-color", wsp.color);
            else this.items['round'].$item.html(`<span>${wsp.title.slice(0,3).toUpperCase()}</span>`).css("background-color", wsp.color);
        }
        else if (!!this.items['round']) {
            this.items['round'].$item.append('<span class="icon-mel-videoconference"></span>');
        }
        return this;
    }

    updateBarAtStartup()
    {
        const wsp = this.webconfManager.wsp;

        if (!!this.items['chat'] && this.webconfManager.chat.chat_visible()) {
            this.items['chat'].active();
        }

        if (!(!!this.items['document'] && !!wsp.objects && wsp.objects.doc))
        {
            this.items['document'].$item.remove();
            delete this.items['document'];
        }
        return this;
    }

    setListener(listener) {
        this.listener = listener;
    }

    setOnDipose(callback) {
        this.ondispose = callback;
    }

    show() {
        this.$bar.css('display', '');
    }

    toggle_mic_or_cam(state, item, on, off, listener_func)
    {
        const FOR = item;
        const class_on = `.${on}`;
        const class_off = `.${off}`;

        if (!!this.items && this.items[FOR])
        {
            if (state) {
                this.items[FOR].$item.find(class_off).removeClass(off).addClass(on);
            }
            else {
                this.items[FOR].$item.find(class_on).removeClass(on).addClass(off);
            }

            if (!this.ignore_send) {
                this.listener[listener_func]();
            }
        }

        return this;
    }

    toggle_mic(state)
    {
        return this.toggle_mic_or_cam(state, 'mic', 'icon-mel-micro', 'icon-mel-micro-off', 'toggle_micro');
    }

    toggle_cam(state)
    {
        return this.toggle_mic_or_cam(state, 'cam', 'icon-mel-camera', 'icon-mel-camera-off', 'toggle_video');
    }

    update_item_icon(state, item, debug, active_symbol = 'icon-mel-close', inactive_symbol = 'icon-chevron-down')
    {
        console.log('update_item_icon', item, state);
        if (state) {
            const links = item.getAllLinks()
            let element;
            for (const key in links) {
                if (Object.hasOwnProperty.call(links, key)) {
                    element = links[key];
                    if (element.state) element.disable();
                }
            }

            item.$item.find('.mel-icon').addClass(active_symbol).removeClass(inactive_symbol);
        }
        else {
            item.$item.find('.mel-icon').removeClass(active_symbol).addClass(inactive_symbol);
        }

        return this;
    }

    update_popup_devices(devices) {
        let devices_by_kind = {};

        for (let index = 0; index < devices.length; ++index) {
            const element = devices[index];
            if (devices_by_kind[element.kind] === undefined)
                devices_by_kind[element.kind] = [];
            devices_by_kind[element.kind].push(element);
        }

        let html = this.popup.$contents.html('');

        for (const key in devices_by_kind) {
            if (Object.hasOwnProperty.call(devices_by_kind, key)) {
                const array = devices_by_kind[key];
                html.append(`<span class=toolbar-title>${rcmail.gettext(key, "mel_metapage")}</span><div class="btn-group-vertical" style=width:100% role="group" aria-label="groupe des ${key}">`);
                for (let index = 0; index < array.length; ++index) {
                    const element = array[index];
                    const disabled = element.isCurrent === true ? "disabled" : "";
                    html.append($(`<button title="${element.label}" class="mel-ui-button btn btn-primary btn-block ${disabled}" ${disabled}>${element.label}</button>`).click(() => {

                    }));
                }

                if (true) html.append('<separate class="device"></separate>');
            }
        }

        html.find('separate').last().remove();

        return this;
    }

    async togglePopUpMic(state, item) {
        const FOR = 'popup_mic';

        if (!!this.items && this.items[FOR])
        {
            if (state) {
                const hangup = this.items['hangup'].$item[0];
                this.popup.$popup.css('left', `${hangup.offsetLeft + (hangup.offsetWidth/2)}px`);
                this.update_item_icon(state, item, [$('.jitsi-select .mel-icon')]).popup.loading().show();
                this.update_popup_devices(await this.listener.get_micro_and_audio_devices());
            }
            else {
                this.update_item_icon(state, item, null).popup.empty().hidden();
            }
        }
    }

    async togglePopUpCam(state, item) {
        const FOR = 'popup_cam';

        if (!!this.items && this.items[FOR])
        {
            if (state) {
                const hangup = this.items['hangup'].$item[0];
                this.popup.$popup.css('left', `${hangup.offsetLeft + (hangup.offsetWidth/2)}px`);
                this.update_item_icon(state, item, [$('.jitsi-select .mel-icon')]).popup.loading().show();
                this.update_popup_devices(await this.listener.get_video_devices());
            }
            else {
                this.update_item_icon(state, item, null).popup.empty().hidden();
            }
        }
    }

    nextcloud()
    {
        let config = {};

        try{
            if (this.webconf.wsp !== undefined && this.webconf.wsp.datas !== undefined && this.webconf.wsp.datas.uid !== undefined)
            {
                config = {_params: `/apps/files?dir=/dossiers-${this.webconfManager.wsp.uid}`,
                _is_from:"iframe"
                };
            }
        }catch (er)
        {}

        mel_metapage.Functions.change_page("stockage", null, config);
    }

    copyUrl()
    {
        //TODO => Ajouter les infos d'ariane de d'espaces de travail
        mel_metapage.Functions.copy(mel_metapage.Functions.public_url(this.webconfManager.get_url(true)));
    }

    async get_phone_datas()
    {   
        if (!this._phone_datas) 
        {
            this._phone_datas = await webconf_helper.phone.getAll();
        }


        const copy_value = `Numéro : ${this._phone_datas.number} - PIN : ${this._phone_datas.pin}`;
        mel_metapage.Functions.copy(copy_value);
    }

    toggleChat(state) {
        this.globalScreenManager.webconf.chat.hidden = !state;
        this.listener.switchAriane(state);
        
        if (state) this.right_pannel.enable_right_mode();
        else this.right_pannel.disable_right_mode();
    }

    toggleInternalChat()
    {
        this.listener.toggle_chat();
    }

    async toggle_mp()
    {
        if (this.right_pannel.is_open()) {
            this.right_pannel.close();
        }
        else {
            this.right_pannel.$pannel.find('.back-button').css('display', '');
            let $html = $('<div></div>');
            const users = await this.listener.get_room_infos();

            let html_icon = null;
            for (const user of users) {

                if (!!user.avatarURL) html_icon = `<div class="dwp-round" style="width:32px;height:32px;"><img src="${user.avatarURL}" style="width:100%" /></div>`;
                else html_icon = '';

                $(`<div tabindex="0" class="mel-selectable mel-focus with-separator row" data-id="${user.participantId}" role="button" aria-pressed="false"><div class="${!!(html_icon || false) ? 'col-2' : 'hidden'}">${html_icon}</div><div class="${!!(html_icon || false) ? 'col-10' : 'col-12'}">${user.formattedDisplayName}</div></div>`).on('click',(e) => {
                    e = $(e.currentTarget);
                    //this.send('initiatePrivateChat', `"${e.data('id')}"`);
                    this.listener.initiatePrivateChat(e.data('id'));
                    this.right_pannel.close();
                }).appendTo($html);
            }

            return this.right_pannel.set_title('A qui envoyer un message privé ?')
            .open()
            .set_content($html, (pannel) => {
                let $tmp = pannel.find('.mel-selectable');
                if ($tmp.length > 0) $tmp.first()[0].focus();
                else pannel.find('button').first()[0].focus();
            });
        }
    }

    toggle_participantspane()
    {
        this.listener.toggle_participantspane();
    }

    open_virtual_background()
    {
        this.listener.open_virtual_background();
    }

    /**
     * Affiche ou cache la toolbar
     */
    update_toolbar(state)
    {
        const FOR = 'round';

        if (!!this.items && this.items[FOR])
        {
            if (state) //On cache
            {
                for (const key in this.items) {
                    if (Object.hasOwnProperty.call(this.items, key)) {
                        const element = this.items[key];
                        if (key === FOR) element.$item.removeClass('active');
                        else {
                            element.hide();
                        }
                    }
                }

                this._$more_actions.hide();
                this.$bar.css('background-color', 'var(--invisible)').css('border-color', 'var(--invisible)').find('v_separate').css('display', 'none');
            }
            else {
                for (const key in this.items) {
                    if (Object.hasOwnProperty.call(this.items, key)) {
                        const element = this.items[key];
                        if (key === FOR) continue;
                        else {
                            if (!!element.$item.data('noff') && MasterWebconfBar.isFirefox()) continue;
                            else element.show();
                        }
                    }
                }

                this.$bar.css('background-color', '').css('border-color', '').find('v_separate').css('display', '');
                this._$more_actions.show();
            }
        }

        return this;
    }

    toggleHand()
    {
        this.listener.toggleHand();
    }

    toggle_film_strip()
    {
        this.listener.toggle_film_strip();
    }

    share_screen()
    {
        this.listener.share_screen();
    }

    /**
     * Vérifie si on est sous firefox
     * @returns {boolean}
     */
    static isFirefox()
    {
        return window?.mel_metapage?.Functions?.isNavigator(mel_metapage?.Symbols?.navigator?.firefox) ?? (typeof InstallTrigger !== 'undefined');
    }

    async hangup()
    {
        this._$more_actions.addClass('hidden').appendTo('body');
        
        if (this.globalScreenManager.current_mode !== ewsmode.fullscreen && rcmail.env.current_frame_name !== 'webconf') {
            await mel_metapage.Functions.change_frame('webconf', true, true).then(() => {
                top.rcmail.clear_messages();
              });
        }

        
        top.$("html").removeClass("webconf-started");
        
        this.listener.hangup();
        this.$bar.remove();
        this.dispose();
    }

    minify()
    {
        if (this.is_minimised) return this;
        
        const ignore = ['popup_cam', 'popup_mic', 'cam', 'mic', 'hangup'];
        for (const key in this.items) {
            if (Object.hasOwnProperty.call(this.items, key)) {
                //console.log('item', element, key, this.items[key].$item.parent()[0].nodeName, !ignore.includes(key), this.items[key].$item.parent()[0].nodeName !== 'LI');
                if (!ignore.includes(key) && this.items[key].$item.parent()[0].nodeName !== 'LI')
                {
                    this.items[key].hide();
                }
                
            }
        }

        this.$bar.find('v_separate').css('display', 'none');
        this.$bar.find('.empty').css('display', 'none');
        this.$bar.css('right', '60px').css('left', 'unset').css('transform', 'unset');
        this.is_minimised = true;

        return this;
    }

    maximise()
    {
        if (!this.is_minimised) return this;

        for (const key in this.items) {
            if (Object.hasOwnProperty.call(this.items, key)) {
                this.items[key].show();
            }
        }

        this.$bar.find('v_separate').css('display', '');
        this.$bar.find('.empty').css('display', '');
        this.$bar.css('right', '').css('left', '').css('transform', '');
        this.is_minimised = false;

        return this;
    }

    timeout_delay()
    {
        return 10;
    }

    show_masterbar() {
        if (this.$bar.css('display') === 'none') this.$bar.css('display', '');
        return this.launch_timeout();
    }

    hide_masterbar() 
    {
        if (this.$bar.css('display') !== 'none') this.$bar.css('display', 'none');

        if (this._timeout_id !== undefined) this._timeout_id = undefined;
        
        return this;
    }

    launch_timeout()
    {
        if (this._timeout_id !== undefined) clearTimeout(this._timeout_id);
        this._timeout_id = setTimeout(() => {
            this.hide_masterbar();
        }, this.timeout_delay() * 1000);
        return this;
    }

    dispose()
    {
        if (this._timeout_id !== undefined){
            clearTimeout(this._timeout_id);
            this._timeout_id = undefined
        };

        if (!!this.disposed) return;
        this.disposed = true;

        if (!!this.ondispose) this.ondispose();

        this.globalScreenManager.dispose();
        this.globalScreenManager = null;
        this.webconfManager.dispose();
        this.webconfManager = null;
        this.$bar = null;
        this.items = {};
        this.ignore_send = false;
        if (!!this.listener)
        {
            this.listener.dispose();
            this.listener = null;
        }
        this.popup.dispose();
        this.popup = null;
        this.right_pannel.dispose();
        this.right_pannel = null;
    }
}

class ListenerWebConfBar {
    constructor(webconf = new Webconf(), masterBar = new MasterWebconfBar())
    {
        this.webconf = webconf;
        this.masterBar = masterBar;
        this.alreadyListening = false;
        this.participantPan = false;
        this.chatOpen = false;
        this._intervals = {};
    }

    start()
    {
        this.isVideoMuted().then(muted => {
            this.mute_or_unmute('cam', muted);
        });

        this.isAudioMuted().then(muted => {
            this.mute_or_unmute('mic', muted);
        });

        this.listen();
    }

    switchAriane(state) {
        if (state)
        {
            this.webconf.showChat();
            if (!!this.webconf.chat.room && this.webconf.chat.room !== '@home') this.webconf.chat.go_to_room();
        }
        else this.webconf.hideChat();
    }

    mute_or_unmute(item, muted) {
        const FOR = item;

        if (!!this.masterBar.items && this.masterBar.items[FOR])
        {
            this.masterBar.ignore_send = true;
            if (muted) {
                this.masterBar.items[FOR].disable();
            }
            else {
                this.masterBar.items[FOR].active();
            }
            this.masterBar.ignore_send = false;
        }
    }

    addCustomListener(key, callback, ms = 500)
    {
        if (!!this._intervals[key]) clearInterval(this._intervals[key]);

        this._intervals[key] = setInterval(() => {
            callback();
        }, ms);
        return this;
    }

    removeCustomListener(key)
    {
        clearInterval(this._intervals[key]);
        return this;
    }

    listen()
    {
        if (!this.alreadyListening)
        {
            this.alreadyListening = true;

            this.webconf.jitsii.addEventListener("videoMuteStatusChanged", (muted) => {
                muted = muted.muted;
                this.mute_or_unmute('cam', muted);
            });

            this.webconf.jitsii.addEventListener("audioMuteStatusChanged", (muted) => {
                muted = muted.muted;
                this.mute_or_unmute('mic', muted);
            });

            this.webconf.jitsii.addEventListener('filmstripDisplayChanged', (datas) => {
                if (datas.visible) 
                {
                    this.webconf.screen_manager.button_size_correction('strip', '129px');
                    this.webconf.jitsii.executeCommand('resizeFilmStrip', {
                        width: 129 // The desired filmstrip width
                    });
                }
                else this.webconf.screen_manager.delete_button_size_correction('strip');
    
                this.webconf.screen_manager.update_button_size();
            });
            // this.webconf.jitsii.addEventListener("incomingMessage", (message) => {
            //     parent.rcmail.display_message(`${message.nick} : ${message.message}`, (message.privateMessage ? "notice private" : "notice notif"));
            // });

            this.webconf.jitsii.addEventListener("mouseMove", (MouseEvent) => {
                this.masterBar.show_masterbar();
            });

            this.webconf.jitsii.addEventListener("chatUpdated", (datas) => {
                this.chatOpen = datas.isOpen;
            });

            // this.webconf.jitsii.addEventListener("errorOccurred", (datas) =>{
            //     console.error('###[VISIO]', datas);
            // });

            
            this.webconf.jitsii.addEventListener("readyToClose", () =>{
                console.log("[VISIO]La visio est prête à être fermée !");
            });
        }
    }

    isParticipantPaneOpen() {

    }

    isFilmStripDisplay()
    {
        
    }

    isVideoMuted()
    {
        return this.webconf.jitsii.isVideoMuted();
    }

    isAudioMuted()
    {
        return this.webconf.jitsii.isAudioMuted();
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

    toggleHand(){
        this.webconf.jitsii.executeCommand('toggleRaiseHand');
    }

    toggle_chat()
    {
        this.webconf.jitsii.executeCommand('toggleChat');
    }

    async open_virtual_background()
    {
        this.webconf.jitsii.executeCommand('toggleVirtualBackgroundDialog');
    }

    initiatePrivateChat(id)
    {
        this.webconf.jitsii.executeCommand('initiatePrivateChat',id);
    }

    toggle_participantspane() {
        this.webconf.jitsii.isParticipantsPaneOpen().then(state => {
            this.participantPan = !state;
            this.webconf.jitsii.executeCommand('toggleParticipantsPane', this.participantPan);

            if (this.participantPan) 
            {
                this.webconf.screen_manager.button_size_correction('pane','315px');
                this.addCustomListener('ppt', () => {
                    this.webconf.jitsii.isParticipantsPaneOpen().then(state => {
                        if (this.participantPan != state)
                        {
                            this.participantPan = state;
                
                            if (this.participantPan) this.webconf.screen_manager.button_size_correction('pane','315px');
                            else this.webconf.screen_manager.delete_button_size_correction('pane');
                
                            this.webconf.screen_manager.update_button_size();
                            this.removeCustomListener('ppt');
                        }
                    });
                }, 100);
            }
            else 
            {
                this.webconf.screen_manager.delete_button_size_correction('pane');
                this.removeCustomListener('ppt');
            }

            this.webconf.screen_manager.update_button_size();
        });
    }

    share_screen()
    {
        this.webconf.jitsii.executeCommand('toggleShareScreen');
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

        return devices;
    }

    async get_room_infos()
    {
        return this.webconf.jitsii.getParticipantsInfo();
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

        return devices;
    }

    hangup()
    {
        this.webconf.jitsii.executeCommand('hangup');
    }

    dispose()
    {
        if (!!this.disposed) return;
        this.disposed = true;

        this.webconf.dispose();
        this.webconf = null;
        this.masterBar.dispose();
        this.masterBar = null;
        this.alreadyListening = null;
        this.participantPan = null;
        this.chatOpen = null;

        for (const key in this._intervals) {
            if (Object.hasOwnProperty.call(this._intervals, key)) {
                const element = this._intervals[key];
                clearInterval(element);
            }
        }
    }
}

window.Webconf = window.Webconf || Webconf;
window.WebconfScreenManager = window.WebconfScreenManager || WebconfScreenManager;
window.MasterWebconfBar = window.MasterWebconfBar || MasterWebconfBar;
top.WebconfScreenManager = top.WebconfScreenManager || WebconfScreenManager;
top.MasterWebconfBar = top.MasterWebconfBar || MasterWebconfBar;


function create_webconf(webconf_var_name, screen_manager_var_name, page_creator_config, onvisiostart = null, ondispose = null) {
    window[webconf_var_name] = new Webconf("mm-webconf", "mm-ariane", $('#mm-ariane-loading'), {
        $maximise:$('.webconf-fullscreen'),
        $minimize:$('.webconf-minimize')
    }, {
        $page:$('#room-selector'),
        $error:$('.webconf-error-text'),
        $room:$('#webconf-room-name'),
        $state:$('#wsp-yes'),
        $chat:$('.webconf-ariane select.ariane_select'),
        $wsp:$('.webconf-wsp select.wsp_select'),
        $start:$('#webconf-enter'),
        config:page_creator_config
    }, rcmail.env["webconf.key"], rcmail.env["webconf.ariane"], rcmail.env["webconf.wsp"], right_item_size, null, () => {
        onvisiostart();
        const interval1 = setInterval(() => {
            if (!!top.masterbar) {
                clearInterval(interval1);
                top.masterbar.show();
                top.masterbar.webconfManager.chat.hidden = window[webconf_var_name].chat.hidden;
                top.masterbar.updateLogo().updateBarAtStartup();
            }
        }, 10);

        const interval = setInterval(() => {
            if (!!window.listener) {
                clearInterval(interval);
                window.listener.start();
            }
        }, 10);
    });

    top[screen_manager_var_name] = new WebconfScreenManager(top.$('.webconf-frame'), top.$('#layout-frames'), window[webconf_var_name], right_item_size);
    top.masterbar = new top.MasterWebconfBar(top[screen_manager_var_name], window[webconf_var_name], $('#visio-right-pannel-util'),{
        $buttons:top.$('#webconfmoreactions a'),
        $button:top.$('#wmap')
    },rcmail.env["webconf.bar"], false);
    window.listener = new ListenerWebConfBar(window[webconf_var_name], top.masterbar);
    top.masterbar.setListener(window.listener);
    top.masterbar.setOnDipose(ondispose);
}

function create_listeners() {
    rcmail.addEventListener('responseafterjwt', function(evt) {
        if (evt.response.id) {
            jwt_token = evt.response.jwt;
        }
    });
}

function create_on_page_change(var_name, var_webconf_started_name, var_screen_manager_name) {
    if (!top[var_name]) {
        top[var_name] = true;

        top.metapage_frames.addEvent('before', (eClass) => {
            if (top[var_webconf_started_name] === true)
            {
                let $selector = top.$(`iframe.${eClass}-frame`);

                if ($selector.length === 0 && $(`.${eClass}-frame`).length > 0) {
                    top.$(`.${eClass}-frame`).remove();//.removeClass(`${eClass}-frame`).addClass('visio-temp-frame').data('start', eClass);
                }
            }
        });

        top.metapage_frames.addEvent('changepage', (eClass, changepage, isAriane, querry, id) => {
            //Si webconf
            if (top[var_webconf_started_name] === true)
            {
                top.masterbar.maximise().listener.webconf.screen_manager.update_button_size();
                top[var_screen_manager_name].$webconf.css('display', '');
                
                if (top[var_screen_manager_name].$layout_frames.length === 0) top[var_screen_manager_name].$layout_frames = top.$('#layout-frames');
                //Cas 1 => Changement de page
                if (eClass !== 'webconf' && !isAriane){
                    top[var_screen_manager_name].switchMode(ewsmode.minimised);

                    if (eClass === 'workspace') top.masterbar.minify();
                }
                //Cas 2 => Chat
                else if (isAriane) {
                    try {
                        mel_metapage.PopUp.ariane.is_show = false;
                    } catch (error) {
                        
                    }
                    top[var_screen_manager_name].switchMode(ewsmode.chat);
                    return "break";
                }
                //Cas 3 => Retour à la visio
                else {
                    top[var_screen_manager_name].switchMode(ewsmode.fullscreen);
                }
            }
        });

        top.metapage_frames.addEvent('changepage.after', () => {
            //Si webconf
            if (top[var_webconf_started_name] === true)
            {
                top[var_screen_manager_name].switchModeFrame();
            }
        });

        const ignoreChat = (eClass, changepage, isAriane, querry, id) => {
            if (top[var_webconf_started_name] === true)
            {
                if (isAriane) {
                    if (mel_metapage.PopUp.ariane !== null && mel_metapage.PopUp.ariane.is_show)
                    {
                        mel_metapage.PopUp.ariane.hide();
                        window.bnum_chat_hidden = true;
                    }

                    top.rcmail.set_busy(false);
                    top.rcmail.clear_messages();
                }

                top[var_screen_manager_name].webconf.set_document_title();
                document.title = 'Visioconférence';
            }
        };

        top.metapage_frames.addEvent('after', ignoreChat);
        top.metapage_frames.addEvent('onload.after', () => {
            //Si webconf
            if (top[var_webconf_started_name] === true)
            {
                top[var_screen_manager_name].webconf.set_document_title();
                document.title = 'Visioconférence';
            }
        });
    }
}

$(document).ready(() => {
    if (top === window) {
        $('.webconf-frame').remove();
        $('#layout-content').remove();

        let config = {};

        if (!!rcmail.env["webconf.key"]) config['_key'] = rcmail.env["webconf.key"];
        if (!!rcmail.env["webconf.ariane"]) config['_ariane'] = rcmail.env["webconf.ariane"];
        if (!!rcmail.env["webconf.wsp"]) config['_wsp'] = rcmail.env["webconf.wsp"].datas.uid;

        const interval = setInterval(() => {
            if ($('iframe.webconf-frame').length > 0) {
                clearInterval(interval);
                $('iframe.webconf-frame').css('display', '');
                $('#layout-frames').css('display', '');
            }
        }, 20);

        mel_metapage.Functions.change_frame('webconf', true, false, config);
        return;
    }

    $("head").append(`<script src='${rcmail.env["webconf.base_url"]}/external_api.js'></script>`);

    const page_creator_config = {
        need_config:rcmail.env['webconf.need_config'],
        locks:rcmail.env['webconf.locks']
    }

    create_on_page_change(var_top_on_change_added, var_top_webconf_started, var_global_screen_manager);
    create_listeners();
    create_webconf(var_visio, var_global_screen_manager, page_creator_config, () => {
        top[var_top_webconf_started] = true;
        top.$('html').addClass(class_to_add_to_top);
    }, () => {
        top[var_top_on_change_added] = undefined;
        top[var_top_webconf_started] = undefined;
        top[var_global_screen_manager] = undefined;
    });

    $('.footer').css('display', "none");

    top[var_top_webconf_started] = true;

    // window.debug_w.addDisposition('samsung_z', (screen_manager) => {
    //     const chat_enabled = !screen_manager.chat.hidden;
    //     screen_manager.$frame_webconf.css('width', `calc(100% - ${screen_manager.pixel_correction()}px)`)
    //                                  .css('height', `${chat_enabled ? '50' : '100'}%`);
    //                                  screen_manager.chat.$frame_chat.css('display', chat_enabled ? '' : 'none')
    //                          .css('height', `calc(${chat_enabled ? '50' : '100'}% - ${screen_manager.pixel_correction()}px)`)
    //                          .css('width', `calc(100% - ${screen_manager.pixel_correction()}px)`);
    // });


});

})();