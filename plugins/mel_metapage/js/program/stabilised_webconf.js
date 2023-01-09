/*****************************************************************/
/*                 SYSTEME DE VISIOCONFERENCE
/*
/* Le système de visioconférence gravite autour de plusieurs classes : 
/* Webconf => Qui gère la visioconférence
/* WebconfMasterBar => Qui gère la barre d'outil de la visio
/* ScreenManagers => Qui gèrent la disposition de l'écran
/* Dans toutes les classes, la liste des variables de la classe se trouve dans la fonction "_init".
/* Dans un premier temps, le script va créer tout ce qu'on a besoin pour que le système fonctionne
/* puis va créer les différents éléments.
/* Toutes les classes sont disposables pour utiliser le moins de mémoire possible à la fin de la visio.
/* En cas de modifications, essayez de respectez cette règle : 1 fonction => 1 classe
/* Les constantes se trouvent en premier.
/* Les classes ensuite.
/* Enfin les actions.
/* Pour rechercher les classes ou les points d'intérêts, faites une recherche sur "¤"
/* Dans la doc, le symbole "$" pour un type, signifie qu'il s'agit d'un élément jquery (ex : $('body'))
/*****************************************************************/
(() => {
//¤Constantes
//Nom des variables globales
const var_visio = 'mel.visio';
const var_global_screen_manager = 'mel.screen_manager.global';
const var_top_on_change_added = 'mel.onchange.state.added';
const var_top_webconf_started = 'mel.visio.started';
//Autres variables
const private_key = mel_metapage.Other.webconf.private;
const public_room = 'channel';
const private_room = 'group';
const right_item_size  = 340;
const class_to_add_to_top = 'webconf-started';
//Noms des enums
const enum_privacy_name = 'eprivacy';
const enum_created_state = 'ewstate';
const enum_screen_mode = 'ewsmode';
const enum_locks = 'enum_webconf_locks'
//¤Enums
/**
 * Enumerable lié à la confidentialité
 * @param {Symbol} public
 * @param {Symbol} private
 * @type {MelEnum}
 */
const eprivacy = MelEnum.createEnum(enum_privacy_name, {public:Symbol(), private:Symbol()});
/**
 * Enumerable lié à la checkbox "Etat".
 * @param {Symbol} chat
 * @param {Symbol} wsp
 * @type {MelEnum}
 */
const ewebconf_state = MelEnum.createEnum(enum_created_state, {chat:Symbol(), wsp:Symbol()});
/**
 * Enumerable des différentes dispositions de la visio
 * @param {number} fullscreen
 * @param {number} minimised
 * @param {number} fullscreen_w_chat
 * @param {number} minimised_w_chat
 * @param {number} chat
 * @type {MelEnum}
 */
const ewsmode = MelEnum.createEnum(enum_screen_mode, {fullscreen:0, minimised:1, fullscreen_w_chat:2, minimised_w_chat:3, chat:4});
/**
 * Enumerable des locks disponibles
 * @see {WebconfPageCreator}
 * @param {number} room (0) => Désactive l'input du nom de la room
 * @param {number} mode (1) => Désactive la checkbox du choix et les selects lié à l'espace et au chat
 * @type {MelEnum}
 */
const elocks = MelEnum.createEnum(enum_locks, {
    room:0,
    mode:1
});

//¤Globales
/**
 * Token qui permet de se connecter à la visio
 */
var jwt_token = undefined;

//¤Classes

//¤Abstraites
//¤AMelScreenManager
/**
 * Classe abstraite qui contient les variables et fonctiones de base pour gérer
 * la disposition de la visio
 */
class AMelScreenManager {
    /**
     * Constructeur de AMelScreenManager
     * @param {*} modes Modes de dispositions. (Facultatif)
     */
    constructor(modes = null)
    {
        /**
         * Modes de configuration d'écrans disponible
         */
        this.modes = modes || {};
        /**
         * Mode en cours
         * @type {MelEnum} Utilisez l'énumérable ewsmode
         */
        this.current_mode = null;
    }

    /**
     * Change la diposition de l'écran.
     * @param {MelEnum} mode Disposition de l'écran
     * @returns Chaîne
     */
    switchMode(mode) 
    {
        this.modes[mode](this.reinit());
        this.current_mode = mode;

        return this;
    }

    /**
     * Réinitialise la disposition de l'écran
     * @returns Chaîne
     */
    reinit() {
        return this;
    }
}

//Composants de la webconf
//¤WebconfChat
/**
 * Gère le chat de la visioconférence. Le chat est en 2 parties : une version de chargement et la frame de chat.
 * Tant que la frame de chat, la classe va travailler avec la div de chargement, ensuite, elle travaillera avec la frame de chat.
 */
class WebconfChat{
    /**
     * Constructeur de WebconfChat, appel "_init" et "_setup".
     * @param {$} frame_chat Jquery de la frame de chat
     * @param {$} $loading_chat Jquery de la div de chargement
     * @param {{room:string, privacy:MelEnum, hidden:boolean}} param2 Information de la room et du chat (Facultatif)
     */
    constructor(frame_chat, $loading_chat, {room='', privacy=eprivacy.public, hidden=true})
    {
        this._init()._setup(frame_chat, $loading_chat, room, privacy, hidden);
    }

    /**
     * Initialise les variables de la classe
     * @private Fonction privée, merci de ne pas l'appeler en dehord de cette classe
     * @returns Chaîne
     */
    _init(){
        /**
         * Jquery de la frame de chat
         * @type {$}
         */
        this.$frame_chat = null;
        /**
         * Jquery de la div de chargement
         * @type {$}
         */
        this.$loaging = null; 
        /**
         * Nom de la room
         */
        this.room = '';
        /**
         * Confidentialité de la room (publi ou privée).
         * Il faut utiliser l'énumérable eprivacy.
         * @type {MelEnum}
         */
        this.privacy = eprivacy.public;
        /**
         * Information de la visibilitée du chat
         */
        this.hidden = true;
        /**
         * Information de l'état de la frame de chat
         */
        this.is_loading = true;
        /**
         * Action à faire lorsque le chargement est fini
         * @type {Function}
         */
        this.onloading = null;
        return this;
    }

    /**
     * Assigne les variables aux paramètres passer dans le constructeur.
     * @param {$} frame_chat Jquery de la frame de chat
     * @param {$} $loading_chat Jquery de la div de chargement
     * @param {string} room Nom de la room
     * @param {MelEnum} privacy Public/privé
     * @param {boolean} hidden Chat caché au lancement ?
     * @private Fonction privée, merci de ne pas l'appeler en dehord de cette classe
     * @returns Chaîne
     */
    _setup(frame_chat, $loading_chat, room, privacy, hidden) {
        //Vérifie que la confidentialitée éxiste
        if (!this._check_privacy(privacy)) {
            console.error(`### [WebconfChat/setup]La confidentialitée donnée n'éxiste pas !`);
            throw privacy;
        }
        else {
            this.privacy = privacy;
            this.hidden = hidden;
            //Affectation de la frame + défini les actions à faire au chargement
            this.$frame_chat = frame_chat.on('load', () => {
                //A faire que si le chat n'est pas déjà chargé
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
            this.$loaging = $loading_chat.css('width', '');
            this.room = room;
        }
        return this;
    }

    /**
     * Vérifie si la confidentialitée éxiste.
     * @private Cette fonction est privée, évitez de l'utiliser hors de cette classe
     * @param {MelEnum} privacy Valeur de eprivacy
     * @returns Confidentialitée dans "eprivacy" ou si erreur de code.
     */
    _check_privacy(privacy) {
        for (const key in eprivacy) {
            if (Object.hasOwnProperty.call(eprivacy, key)) {
                const element = eprivacy[key];
                if (privacy === element) return true;
            }
        }

        return false;
    }

    /**
     * Vérifie si la room est public ou privée
     * @returns Vrai => public
     */
    is_public_room() {
        return this.privacy === eprivacy.public;
    }

    /**
     * Récupère le chemin de la room
     * @returns home si pas de room par défaut, confidentialité/room sinon
     */
    get_room(){
        if (this.room === '@home' || !(this.room || false)) return 'home';
        return `${(this.is_public_room() ? public_room : private_room)}/${this.room}`;
    }

    /**
     * Vérifie si le chat est visible ou non
     * @returns vrai => visible
     */
    chat_visible() {
        return (!!(this.room || false)) && !this.hidden;
    }

    /**
     * Effectue un postMessage sur la frame de chat pour aller dans une room précise.
     * @param {string | null} room Nom de la room (facultatif)
     * @param {MelEnum | null} privacy Confidentialitée de la room (facultatif)
     * @return Chaîne
     */
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

        return this;
    }

    /**
     * Si la frame de chat est chargé, on la récupère, sinon, on récupère la div de chargement.
     * @returns {$} Frame de chat ou div de chargement
     */
    getChatElement() {
        if (this.is_loading) return this.$loaging;
        else return this.$frame_chat;
    }

    /**
     * Cache le chat
     * @returns Chaîne
     */
    hide()
    {
        this.getChatElement().css('display', 'none');
        return this;
    }

    /**
     * Affiche le chat
     * @returns Chaîne
     */
    show()
    {
        this.getChatElement().css('display', '');
        return this;
    }

    /**
     * Attend que le chat est fini de charger.
     * @returns Vrai si le chat est chargé
     */
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

    /**
     *  Change le status sur ariane
     * @param {string} status busy/online/offline
     */
    async setStatus(status) {
        //Change le status dans le chat
        this.$frame_chat[0].contentWindow.postMessage({
            externalCommand: 'set-user-status',
            status: status
          }, '*');

          //Change le status dans le bnum
          top.ariane.update_status(status);
    }

    /**
     * Libère les variables
     * @returns /
     */
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

/**
 * Récupère les données de chat depuis une chaîne de charactères.
 * @param {string} str string sous la forme "bool:id_room"
 * @returns Données ou null si str vide
 */
WebconfChat.from_string = (str) => {

    if (!(str || false)) return null; 

    return {
        privacy:(str.includes(private_key) ? eprivacy.private : eprivacy.public),
        room_name:str.replaceAll(private_key, '')
    }
};

//¤WebconfWorkspaceManager
/**
 * Classe qui gère les données de l'espace de travail lié à la visio.
 */
class WebconfWorkspaceManager {
    /**
     * Constructeur de la classe
     * @param {*} wsp Objet récupérer depuis le php qui contient les données de l'espace. Peut être null.
     */
    constructor(wsp) {
        this._init()._setup(wsp);
    }

    /**
     * Initialise les variables de la classe
     * @private Cette fonction est privée, évitez de l'utiliser hors de cette classe
     * @returns Chaîne
     */
    _init(){
        /**
         * L'espace de travail a-t-il un chat ?
         * @type {boolean}
         */
        this.have_chat = false;
        /**
         * Couleur de l'espace
         * @type {string} couleur hexa ou nom
         */
        this.color = 'blue';
        /**
         * Confidentialité de l'espace
         * @type {MelEnum} Il faut utiliser l'énumerable eprivacy.
         */
        this.privacy = eprivacy.public;
        /**
         * Logo de l'espace
         * @type {string}
         */
        this.logo = '';
        /**
         * Titre de l'espace
         * @type {string}
         */
        this.title = '';
        /**
         * Identifiant de l'espace
         * @type {string}
         */
        this.uid = null;
        /**
         * Modules disponibles de l'espace
         */
        this.objects = null;
        /**
         * Données brutes de l'espace
         */
        this._original_datas = null;
        return this;
    }

    /**
     * Assigne les variables de l'espace
     * @param {*} wsp Objet récupérer depuis le php qui contient les données de l'espace. Peut être null.
     * @private Cette fonction est privée, évitez de l'utiliser hors de cette classe
     * @returns Chaîne
     */
    _setup(wsp) {
        /**
         * Données brut de l'espace, sans les modules
         */
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

    /**
     * Check si la classe contient les données d'un espace.
     * Si l'identifiant n'est pas défini, c'est que la visio n'est pas lié à un espace de travail
     * @returns 
     */
    have_workspace()
    {
        return !!this.uid;
    }

    /**
     * Vérifie si la classe possède un chat
     * @returns 
     */
    have_chatroom(){
        return this.have_chat && !!this.objects && !!this.objects.channel && !!this.objects.channel.name;
    }

    /**
     * Vérifie si la classe à un cloud
     * @returns 
     */
    have_cloud() {
        return !!this.objects && !!this.objects.doc;
    }

    /**
     * Créer un chat en fonction des informations de l'espace
     * @param {$} $framechat Frame de chat nécéssaire à la construction de l'objet WebconfChat
     * @param {$} $loading_chat Div de chargement nécéssaire à la construction de l'objet WebconfChat
     * @returns {WebconfChat | null} Si l'espace n'a pas de chat (ou si il n'y a pas d'espaces), renvoit null, sinon, renvoit WebconfChat
     */
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

    /**
     * Libère les variables
     * @returns /
     */
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

//¤WebconfPageCreator
/**
 * Classe qui gère le paramètragle de la visio
 */
class WebconfPageCreator {
    /**
     * Constructeur de la classe
     * @param {$} $page Div qui contient les paramètres
     * @param {$} $page_error_text Jquery du texte d'erreur du nom de la room
     * @param {$} $room Input du nom de la room
     * @param {$} $state Checkbox du choix entre chat ou espace de travail
     * @param {$} $chat Select du chat
     * @param {$} $wsp Select de l'espace de travail
     * @param {$} $start_button Bouton qui lance la visio
     * @param {{need_config:boolean | null | undefined, locks:Array<number> | null | undefined} | null | undefined} config Configuration diverses de la visio. Pour le moment il contient (ou pas), le paramètre need_config qui affiche la page des paramètres ainsi que locks qui désactive certains champs. 
     * @param {$} $startedMic [NOT IMPLEMENTED]Checkbox du choix d'entrer avec le micro ou non 
     * @param {$} $startedCam [NOT IMPLEMENTED]Checkbox du choix d'entrer avec la cam ou non 
     * @param {Function} callbackStart Action à faire lorsque l'on clique sur le bouton "entrer"
     */
    constructor($page, $page_error_text, $room, $state, $chat, $wsp, $start_button, config, $startedMic = null, $startedCam = null, callbackStart = null) {
        this._init()._setup($page, $page_error_text, $room, $state, $chat, $wsp, $start_button, config, $startedMic, $startedCam, callbackStart);
    }

    /**
     * Initialise les variables de la classe
     * @private Cette fonction est privée, évitez de l'utiliser hors de cette classe
     * @returns Chapine
     */
    _init() {
        /**
         * Jquery des paramètres
         * @type {$}
         */
        this.$page = null;
        /**
         * Jquery du texte d'erreur sur le nom de la room
         * @type {$}
         */
        this.$page_error_text = null;
        /**
         * Input du nom de la room
         * @type {$}
         */
        this.$room_key = null;
        /**
         * Checkbox du choix entre chat ou espace de travail
         * @type {$}
         */
        this.$state = null;
        /**
         * Select du chat
         * @type {$}
         */
        this.$chat = null;
        /**
         * Select de l'espace de travail
         * @type {$}
         */
        this.$wsp = null;
        /**
         * Bouton de lancement de la visio
         * @type {$}
         */
        this.$button_start = null;
        /**
         * Action à faire lorsque l'on clique sur le bouton de lancement de la visio
         * @type {function | null}
         */
        this.onstart = null;
        /**
         * Configuration des paramètres
         * @param {number | null | undefined} need_config Si 1, la page des paramètres s'affichera forcément
         * @param {Array<number> | null | undefined} locks Item à locks, voir l'enum elocks
         * @type {{need_config:number | null | undefined, locks:Array<number> | null | undefined} | null | undefined}
         */
        this.config = {
            need_config:1,
            locks:[]
        };
        return this;
    }

    /**
     * Assigne les variables de la classe
     * @param {$} $page Div qui contient les paramètres
     * @param {$} $page_error_text Jquery du texte d'erreur du nom de la room
     * @param {$} $room Input du nom de la room
     * @param {$} $state Checkbox du choix entre chat ou espace de travail
     * @param {$} $chat Select du chat
     * @param {$} $wsp Select de l'espace de travail
     * @param {$} $start_button Bouton qui lance la visio
     * @param {{need_config:boolean | null | undefined, locks:Array<number> | null | undefined} | null | undefined} config Configuration diverses de la visio. Pour le moment il contient (ou pas), le paramètre need_config qui affiche la page des paramètres ainsi que locks qui désactive certains champs. 
     * @param {$} $startedMic [NOT IMPLEMENTED]Checkbox du choix d'entrer avec le micro ou non 
     * @param {$} $startedCam [NOT IMPLEMENTED]Checkbox du choix d'entrer avec la cam ou non 
     * @param {Function} callbackStart Action à faire lorsque l'on clique sur le bouton "entrer"
     * @private Cette fonction est privée, évitez de l'utiliser hors de cette classe
     * @returns Chaîne
     */
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
        return this;
    }

    /**
     * Créer les actions des différents objets des formulaires (onchange, click etc....)
     * @returns Chaîne
     */
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

        return this;
    }

    /**
     * Désactive les champs à désactivé (si il y en a)
     */
    setLocks() {
        if (!!this.config.locks && this.config.locks.length > 0)
        {
            for (const iterator of this.config.locks) {
                switch (iterator) {
                    case elocks.room:
                        this.$room_key.addClass('disabled').attr('disabled', 'disabled');
                        break;
                    case elocks.mode:
                        this.$state.change();
                        this.$state.addClass('disabled').attr('disabled', 'disabled');
                        this.$chat.addClass('disabled').attr('disabled', 'disabled');
                        this.$wsp.addClass('disabled').attr('disabled', 'disabled');
                        break;
                    default:
                        break;
                }
            }
        }
    }

    /**
     * Page visible ?
     */
    enabled() {
        return this.$page.css('display') !== 'none';
    }

    /**
     * Affiche la page
     * @returns Chaîne
     */
    show() {
        this.$page.css('display', '');
        return this;
    }

    /**
     * Cache la page
     * @returns Chaîne
     */
    hide() {
        this.$page.css('display', 'none');
        return this;
    }

    /**
     * Génère un nom de room au hasard
     * @returns {string} >= 10 charactères, >=3 chiffres, alphanumérique seulement
     */
    generateRandomlyKey(){
        return mel_metapage.Functions.generateWebconfRoomName();
    }

    /**
     * Récupère la valeur de la room
     * @returns {string}
     */
    getRoomKey(){
        return this.$room_key.val();
    }

    /**
     * Récupère "l'état" de la checkbox
     * @returns {MelEnum} ewebconf_state
     */
    getState(){
        return this.$state[0].checked ? ewebconf_state.wsp : ewebconf_state.chat;
    }

    /**
     * Récupère la valeur du select en cours
     * @returns {string}
     */
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

    /**
     * Récupère une url traditionnel de la visio, et récupère le nom de la room inclut dans l'url
     * @param {string} url 
     * @returns Nom de la room
     */
    transformUrlIntoKey(url){
        return mel_metapage.Functions.webconf_url(url.toLowerCase());
    }

    /**
     * Vérifie si le nom de la room est valide
     * @param {string} val Nom de la room 
     * @returns 
     */
    checkKeyIsValid(val) {
        return val.length >= 10 && Enumerable.from(val).where(x => /\d/.test(x)).count() >= 3 && /^[0-9a-zA-Z]+$/.test(val);
    }

    /**
     * Vérifie si le nom de la room est valide
     * @param {string | null | undefined} val Nom de la room, si non défini, la valeur de l'input sera récupéré
     */
    checkFormAction(val = null) {
        val = val || this.getRoomKey();
        //Si il y a une url dans le champs, on récupère la clé contenue dans l'url
        {
            const detected = this.transformUrlIntoKey(val) || false;
            if (!!detected) val = detected;
            
        }

        //On met à jour la valeur si il y a besoin et on la capitalise
        this.$room_key.val(val.toUpperCase());

        //Si la clé est valide
        if (this.checkKeyIsValid(val))
        {
            const url = mel_metapage.Functions.url('webconf', '', {_key:val});
            mel_metapage.Functions.title(url.replace(`${rcmail.env.mel_metapage_const.key}=${rcmail.env.mel_metapage_const.value}`, ""));

            this.$button_start.removeClass("disabled").removeAttr("disabled", "disabled");
            this.$page_error_text.css("display", "none").css("color", "black");
        }
        else { //Sinon
            this.$button_start.addClass("disabled").attr("disabled", "disabled");
            this.$page_error_text.css("display", "").css("color", "red");
        }
    }
    
    /**
     * Libère les variables
     * @returns 
     */
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

//¤InternalWebconfScreenManager
/**
 * Gère la disposition de la visio avec le chat
 * @extends AMelScreenManager
 * @todo Faire en sorte que ariane size soit une fonction et que ariane size s'adapte au menu bienvenue (Avec une width minimum)
 */
class InternalWebconfScreenManager extends AMelScreenManager {
    /**
     * Constructeur de la classe
     * @param {WebconfChat} chat Chat de la visio
     * @param {$} $frame_webconf Frame de la visio
     * @param {{$maximise:$, $minimize:$}} minimise_and_maximise_buttons Boutons minimiser et maximiser
     * @param {number} ariane_size Taille du chat en pixel
     * @param {boolean} is_framed [DEPRECATED]
     * @param {JSON | null} modes Modes additionnels
     */
    constructor(chat, $frame_webconf, minimise_and_maximise_buttons, ariane_size, is_framed, modes = null)
    {
        super(modes);
        this._init()._setup(chat, $frame_webconf, minimise_and_maximise_buttons, ariane_size, is_framed);
    }

    /**
     * Initialise le chat
     * @private Cette fonction est privée, évitez de l'utiliser hors de cette classe
     * @returns Chaîne
     */
    _init() {
        /**
         * Chat de la visio
         * @type {WebconfChat}
         */
        this.chat = null;
        /**
         * Frame de la visio
         * @type {$}
         */
        this.$frame_webconf = null;
        /**
         * Bouton "Minimiser"
         * @type {$}
         */
        this.$button_minimize = null;
        /**
         * Bouton "Maximiser"
         * @type {$}
         */
        this.$button_maximize = null;
        /**
         * Taille du chat lorsqu'il est visible
         * @constant Cette variable est costante, éviter de la changer hors de la classe "_setup"
         * @private Cette variable est privé, évitez de l'utiliser hors de cette classe
         * @type {number}
         */
        this._ariane_size = 0;
        /**
         * Mode en cours
         * @type {MelEnum} Utilisez l'enumerable ewsmode
         */
        this.current_mode = ewsmode.fullscreen;
        /**
         * [DEPRECATED]La webconf est en iframe ou non ?
         * @deprecated Cette variable est déprécié, évitez de l'utiliser
         * @private Cette variable est privé, évitez de l'utiliser hors de cette classe
         * @type {boolean}
         */
        this._is_framed = false;
        /**
         * Liste des mesures à ajouter au bouton "minimiser"
         * @private Cette variable est privé, évitez de l'utiliser hors de cette classe
         * @type {JSON}
         */
        this._button_size_correction = {};
        /**
         * Si vrai, ignore les corrections de "_button_size_correction"
         * @type {boolean}
         */
        this.ignore_correction = false;
        return this;
    }

    /**
     * Assigne les variables de la classe
     * @private Cette fonction est privée, évitez de l'utiliser hors de cette classe
     * @param {WebconfChat} chat Chat de la visio
     * @param {$} $frame_webconf Frame de la visio
     * @param {{$maximise:$, $minimize:$}} m_m_button Boutons minimiser et maximiser
     * @param {number} ariane_size Taille du chat en pixel
     * @param {boolean} is_framed [DEPRECATED]
     * @returns 
     */
    _setup(chat, $frame_webconf, m_m_button, ariane_size, is_framed)
    {
        this.chat = chat;
        this.chat.$loaging.css('width', `${ariane_size}px`).css('min-width', `${ariane_size}px`);
        this.$frame_webconf = $frame_webconf;
        this.$button_maximize = m_m_button.$maximise;
        this.$button_minimize = m_m_button.$minimize;
        this._ariane_size = ariane_size;
        this._is_framed = is_framed;
        return this;
    }

    /**
     * Change le mode de disposition de l'écran
     * @param {MelEnum} mode Utilisez ewsmode
     * @returns Chaîne
     */
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
            case ewsmode.chat: //Inverse le chat et la visio
                this.fullscreen_chat(!this.chat.hidden);
                break
            default:
                //Modes custom
                this.modes[mode](this.reinit());
                break;
        }

        this.current_mode = mode;

        return this;
    }

    /**
     * Récupère la frame de chat si elle est chargée, sinon, la div de chargement
     * @returns {$}
     */
    getChatElement() {
        if (this.chat.is_loading) return this.chat.$loaging;
        else return this.chat.$frame_chat;
    }

    /**
     * Met à jours le mode en fonction si le chat est actif ou non
     * @returns Chaîne
     */
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

    /**
     * [DEPRECATED]Permet de prendre en compte la taille de la barre de navigation.
     * @deprecated Cette fonction est dépréciée évitez de l'utiliser
     * @returns 
     */
    pixel_correction()
    {
        if (this._is_framed) return 0;
        else return 60;
    }

    /**
     * Réinitialise le css des différents éléments.
     * @returns 
     */
    reinit() {
        //Réinitialise le css de la frame de la visio
        this.$frame_webconf.css('left', '')
                           .css('right', '')
                           .css('width', '')
                           .css('height', '');
        //Réinitialise la frame de chat
        this.getChatElement().css('height', '').css('width', this._ariane_size + 'px').css('left', '').css('right', '');
        //Réinitialise les boutons minimiser et maximiser
        this.$button_minimize.css('display', 'none').css('top', '').css('right', '');
        this.$button_maximize.css('display', 'none'); //On effectue pas de transformation sur ce bouton
        return super.reinit();
    }

    /**
     * Passe la visio en plein écran : Visio en plein + le chat
     * @param {boolean} chat_enabled Pousse un peu la visio pour que le chat soit visible.
     */
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

    /**
     * Passe la visio à droite. Si la visio est active, elle sera en haut, à droite
     * @param {boolean} chat_enabled Pousse un peu la visio pour que le chat soit visible.
     */
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

    /**
     * Passe le chat en plein écran, avec la visio à côté
     * @param {true} chat_enabled [DEPRECATED]
     * @returns 
     */
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

    /**
     * Met à jour la position du bouton "Minimiser"
     * @returns Chaîne
     */
    update_button_size()
    {
        const str = `calc(${15 + (!this.chat.hidden ? this._ariane_size : 0)}px + ${this.get_button_size_correction()})`;
        this.$button_minimize.css('right', str);
        return this;
    }

    /**
     * Ajout un nouveau positionnement pour le bouton "Minimiser"
     * @param {string} key Clé de la position
     * @param {string} add format css (ex: XXpx, XX% etc...) 
     */
    button_size_correction(key, add) {
        this._button_size_correction[key] = add;
    }

    /**
     * Supprime un positionnement pour le bouton "Minimiser"
     * @param {string} key Clé à supprimer
     */
    delete_button_size_correction(key)
    {
        this._button_size_correction[key] = null;
    }

    /**
     * Récupère la position additionnel du bouton "Minimiser"
     * @private Cette fonction est privée, évitez de l'utiliser en dehors de cette classe
     * @returns {string | '0px'} format : xxY + xxY + 0px avec xx un chiffre et Y une unitée de mesure (px, %, etc...)
     */
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

    /**
     * Récupère la position additionnel du bouton "Minimiser"
     * @returns 
     */
    get_button_size_correction()
    {
        return this.ignore_correction ? '0px' : this._get_button_size_correction();
    }

    /**
     * Libère les variables
     * @returns /
     */
    dispose()
    {
        if (!!this.disposed) return;
        this.disposed = true;

        //Réinitialise le bouton "minimiser" pour l'utiliser plus tard
        this.$button_minimize.css('display', '').css('top', '').css('right', '');
        //On cache le bouton "maximiser", il ne servira plus
        this.$button_maximize.css('display', 'none'); 

        //On change la fonction du bouton "minimiser", il devient le bouton pour quitter la visio
        const parent = this.$button_minimize.parent();
        this.$button_minimize.remove();
        this.$button_minimize = $(this.$button_minimize[0].outerHTML).css('top', '15px').css('right', '15px').click(() => {
            mel_metapage.Frames.back();
        });
        this.$button_minimize.find('.icon-mel-undo').removeClass('icon-mel-undo').addClass('icon-mel-close');
        parent.append(this.$button_minimize);

        //Dispose du chat
        this.chat.dispose();
        //On libère le reste
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

//¤Webconf
/**
 * Gère la webconf, permet d'intéragir avec toute la frame de visio
 */
class Webconf{
    /**
     * Constructeur de la classe
     * @param {string} frameconf_id Id de la frame de la visio (sans le #)
     * @param {string} framechat_id  Id de la frame de chat (sans le #)
     * @param {$} $loading_chat Div de chargement
     * @param {{$maximise:$, $minimise:$}} size_buttons Boutons minimiser et maximiser
     * @param {{$page:$, $error:$, $room:$, $state:$, $chat:$,$wsp:$, $start:$,config:{need_config:boolean | null | undefined, locks:Array<number> | null | undefined} | null | undefined}} ask_datas Champs de la page de paramètres + données par défaut de la page de paramètres
     * @param {string | null} key Nom de la room
     * @param {string | null} ariane Salon de chat
     * @param {string | null} wsp Id de l'espace lié à cette visio
     * @param {number} ariane_size Taille de la frame de chat
     * @param {true} is_framed [DEPRECATED]
     * @param {Function} onstart Action à faire lorsque la visio commence
     */
    constructor(frameconf_id, framechat_id, $loading_chat, size_buttons, ask_datas, key, ariane, wsp, ariane_size = 323, is_framed=null, onstart = null){
        this._init()._setup(frameconf_id, framechat_id, $loading_chat, size_buttons, ask_datas, key, ariane, wsp, ariane_size, is_framed, onstart).startup();
    }

    /**
     * Initialise les variables de la classe
     * @returns Chaîne
     */
    _init() {
        /**
         * [DEPRECATED]Si la visio se trouve dans une frame ou non
         * @deprecated Cette variable est dépréciée, merci de ne pas l'utiliser
         * @private Cette variable est privée, merci de ne pas l'utiliser en dehord de cette classe
         * @type {boolean}
         */
        this._is_framed = false;
        /**
         * Données de l'espace de travail
         * @type {WebconfWorkspaceManager}
         */
        this.wsp = null;
        /**
         * Gestion du chat
         * @type {WebconfChat}
         */
        this.chat = null;
        /**
         * Frame de la visio
         * @type {$}
         */
        this.$frame_webconf = null;
        /**
         * Nom de la visio
         * @type {string}
         */
        this.key = '';
        /**
         * Gestionnaire des paramètres
         * @type {WebconfPageCreator}
         */
        this.webconf_page_creator = null;
        /**
         * Gestionnaire de dispositions
         * @type {InternalWebconfScreenManager}
         */
        this.screen_manager = null;
        /**
         * Action à faire lorsque l'on commence une visio
         * @type {Function | null}
         */
        this.onstart = null;
        /**
         * Besoin d'afficher la page de paramètrage ?
         * @type {boolean}
         */
        this._need_config = false;
        /**
         * Token JWT qui permet de lancer une visio.
         * @type {undefined | string}
         */
        this._jwt = undefined;
        return this;
    }

    /**
     * Assigne les variables de la classe
     * @param {string} frameconf_id Id de la frame de la visio (sans le #)
     * @param {string} framechat_id  Id de la frame de chat (sans le #)
     * @param {$} $loading_chat Div de chargement
     * @param {{$maximise:$, $minimise:$}} size_buttons Boutons minimiser et maximiser
     * @param {{$page:$, $error:$, $room:$, $state:$, $chat:$,$wsp:$, $start:$,config:{need_config:boolean | null | undefined, locks:Array<number> | null | undefined} | null | undefined}} ask_datas Champs de la page de paramètres + données par défaut de la page de paramètres
     * @param {string | null} key Nom de la room
     * @param {string | null} ariane Salon de chat
     * @param {string | null} wsp Id de l'espace lié à cette visio
     * @param {number} ariane_size Taille de la frame de chat
     * @param {true} is_framed [DEPRECATED]
     * @param {Function} onstart Action à faire lorsque la visio commence
     * @private Cette fonction est privée, évitez de l'utilisez en dehors de cette classe
     * @returns Chaîne
     */
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

        if (this.chat.room === "@home") this.chat.hidden = true;

        this.webconf_page_creator = new WebconfPageCreator(ask_datas?.$page, ask_datas?.$error, ask_datas?.$room, ask_datas?.$state, ask_datas?.$chat, ask_datas?.$wsp, ask_datas?.$start, ask_datas?.config ?? {});
        this.$frame_webconf = $(`#${frameconf_id}`);
        this.screen_manager = new InternalWebconfScreenManager(this.chat, this.$frame_webconf, size_buttons, ariane_size, this._is_framed);
        this.key = key || null;
        this.onstart = onstart;

        this._need_config = ask_datas?.config?.need_config == true;

        return this;
    }

    /**
     * Met en place la page de création ou la visioconférence
     */
    startup() {
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

            this.webconf_page_creator.setLocks();

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

                        this.chat.$loaging.css('width', `${this.screen_manager._ariane_size}px`);
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

    /**
     * Lance la visioconférence
     * @async
     */
    async start(){
        //Si la clé n'est pas bonne, en génrer une nouvelle (vraimment utile ? idk)
        this.key = this.key || this.webconf_page_creator.generateRandomlyKey();

        //Si on est sous ff, avertir que c'est pas ouf d'utiliser ff
        await this.navigatorWarning();

        //Démarrer le chat
        this.startChat();

        /**
         * Url de la visio
         * @type {string}
         */
        const domain = rcmail.env["webconf.base_url"].replace("http://", "").replace("https://", "");

        this.$frame_webconf.find('.loading-visio-text').html('Récupération du jeton...');

        /**
         * Action à faire lorsque la visio est chargée.
         * On la met hors du "onload" pour que ça fonctionne
         * @type {Function}
         */
        const global_on_start = this.onstart;

        /**
         * Eviter de démarrer 2 fois la visio
         * @type {boolean}
         */
        let alreadyStarted = false;

        const options = {
            jwt:await this.jwt(), //Récupère le token jwt pour pouvoir lancer la visio
            roomName: this.key,
            width: "100%",
            height: "100%",
            parentNode: document.querySelector('#mm-webconf'),
            onload(){
                if (!alreadyStarted)
                {
                    alreadyStarted = true;

                    if (!!global_on_start) global_on_start();

                    mel_metapage.Storage.set("webconf_token", true);
                    $('#mm-webconf').find('iframe').css('display', '').parent().find('.absolute-center').remove();
                }
                
            },
            configOverwrite: { 
                hideLobbyButton: true,
                startWithAudioMuted: false,
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

        //On attend que l'api soit disponible
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

        if (top.$('#layout-frames').css('display') === 'none') top.$('#layout-frames').css('display', '');
    }

    /**
     * Mettre les actions à faire lors du chargement du chat + mettre l'url du chat dans la frame
     * @returns Chaîne
     */
    startChat() {
        this.chat.onloading = () => {
            this.screen_manager.updateMode();
            this.chat.setStatus('busy');
        };
        this.chat.$frame_chat[0].src = rcmail.env.rocket_chat_url + this.chat.get_room();

        return this;
    }

    /**
     * Affiche un message si l'utilisateur est sous FF
     */
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

    /**
     * Récupère le token JWT
     * @returns {string} token JWT
     */
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

    /**
     * Ajoute une disposition d'écran
     * @param {string} key Clé de la disposition
     * @param {Function} callback Fonction de la disposition
     */
    addDisposition(key, callback) {
        if (!this.screen_manager.modes) this.screen_manager.modes = {};

        this.screen_manager.modes[key] = callback;
    }

    /**
     * Affiche le chat
     * @returns Chaîne
     */
    showChat() {
        this.chat.show().hidden = false;
        this.screen_manager.updateMode();
        return this;
    }

    /**
     * Cache le chat
     * @returns Chaîne
     */
    hideChat() {
        this.chat.hide().hidden = true;
        this.screen_manager.updateMode();
        return this;
    }

    /**
     * Bascule l'état du chat
     * @returns Chaîne
     */
    toggleChat(){
        return this.chat.chat_visible() ? this.hideChat() : this.showChat();
    }

    /**
     * Récupère l'url de la visio
     * @param {boolean} ispublic Si vrai, l'url "/public" sera renvoyé
     * @returns {string}
     */
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

    /**
     * Met à jours l'url de la page
     * @returns /
     */
    set_document_title()
    {
        if (!this.key) return; 
        
        top.mel_metapage.Functions.title(this.get_url());
    }

    /**
     * Libère les variables
     * @returns /
     */
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
    }
}

//¤WebconfScreenManager
/**
 * Gère la disposition de la visio avec les autres frames.
 * @extends AMelScreenManager
 */
class WebconfScreenManager extends AMelScreenManager {
    /**
     * Constructeur de la classe
     * @param {$} $webconf Frame de la visio
     * @param {$} $frames [DEPRECATED]
     * @param {Webconf} webconfitem Visioconférence
     * @param {number} webconf_size Taille de la visio
     * @param {JSON} modes Modes additionnels
     * @param {JSON} frameModes Modes additionnels
     */
    constructor($webconf, $frames, webconfitem, webconf_size = 423, modes = null, frameModes = null) {
        super(modes);
        this._init()._setup($webconf, $frames, webconfitem, webconf_size, frameModes);
    }

    /**
     * Initialise les variables de la classe
     * @private Cette fonction est privée, merci de ne pas l'utiliser en dehord de cette classe
     * @returns Chaîne
     */
    _init() {
        /**
         * Frame de la visio
         * @type {$}
         */
        this.$webconf = null;
        /**
         * [DEPRECATED]
         * @deprecated Cette fonction est dépréciée, merci de ne pas l'utiliser
         * @type {$}
         */
        this.$layout_frames = null;
        /**
         * Barre d'outil de la visio
         * @type {MasterWebconfBar}
         */
        this.master_bar = null;
        /**
         * Visioconférence
         * @type {Webconf}
         */
        this.webconf = null;
        /**
         * Modes custom, actions  à faires aux autres frames
         */
        this.frames_modes = null;
        /**
         * Taille de la visio quand elle partage son espace avec une autre frame
         * @constant Cette variable est constantes, évitez de la modifier en dehors de la fonction "_setup"
         * @private Cette variable est privée, évitez de l'utiliser en dehors de cette classe  
         * @type {number}
         */
        this._minified_size = 0;
        return this;
    }

    /**
     * Assigne les variables de la classe
     * @param {$} $webconf Frame de la visio
     * @param {$} $frames [DEPRECATED]
     * @param {Webconf} webconfitem Visioconférence
     * @param {number} webconf_size Taille de la visio
     * @param {JSON} frameModes Modes additionnels
     * @private Cette fonction est privée, évitez de l'utiliser en dehors de cette classe
     * @returns Chaîne
     */
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

    /**
     * Assigne une barre d'outil
     * @param {MasterWebconfBar} bar Barre d'outil
     * @returns Chaîne
     */
    setMasterBar(bar) {
        this.master_bar = bar;
        return this;
    }

    /**
     * Change la disposition de l'écran
     * @param {MelEnum} mode Utilisez ewsmode
     * @returns Chaîne
     */
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

    /**
     * Change la disposition de l'écran - actions liés aux frames
     */
    switchModeFrame() {
        /**
         * Mode en cours
         */
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

    /**
     * [DEPRECATED]Check si la visio est en iframe
     * @deprecated Cette fonction est dépréciée, évitez de l'utiliser
     * @private Cette fonction est privée, évitez de l'utiliser en dehord de cette classe 
     * @returns {boolean}
     */
    _is_visio_framed(){
        return this.$webconf[0].nodeName === 'iframe';
    }

    /**
     * Récupère la classe de la frame en cours
     * @private Cette fonction est privée, évitez de l'utiliser en dehord de cette classe 
     * @returns {string}
     */
    _getCurrentPage() {
        return top.rcmail.env.current_frame_name;
    }

    /**
     * Récupère la frame en cours
     * @private Cette fonction est privée, évitez de l'utiliser en dehord de cette classe 
     * @returns {$}
     */
    _getOtherPage() {
        return  top.$(`iframe.${this._getCurrentPage()}-frame`);
    }

    /**
     * Réinitialise le css de la visio
     * @returns Chaîne
     */
    reinit() {
        this.$webconf.css('width', '100%').css('position', '').css('left', '').css('right', '').css('top', '').css('padding-left', '');
        return this;
    }

    /**
     * Réinitialise le css des autres frames
     * @returns Chaîne
     */
    reinitFrame() {
        for (var iterator of top.$('.mm-frame')) {
            iterator = $(iterator);

            if (!iterator.hasClass('webconf-frame')) {
                iterator.css('width', '100%').css('position', '').css('left', '').css('right', '').css('top', '');
            }
        }
        return this;
    }

    /**
     * Passe la visio en plein écran
     * @param {boolean} chat Si vrai, le chat sera passé en plein écran
     */
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

    /**
     * Minimise la visio
     */
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

    /**
     * Passe les autres pages en plein écran
     */
    minimiseFrame() {
        this.reinitFrame()._getOtherPage().css('width', `calc(100% - ${this._minified_size}px)`)
                                          .css('position', 'absolute')
                                          .css('top', '0')
                                          .css('left', '0');
    }

    /**
     * [DEPRECATED]Cette fonction est dépréciée, évitez de l'utiliser
     * @deprecated Cette fonction est dépréciée, évitez de l'utiliser
     * @param {$} $item 
     * @param {boolean} use_margin_instead_right 
     * @returns Chaîne
     */
    fit_item_to_guest_screen($item, use_margin_instead_right = true)
    {
        const w = `calc(100% - ${this._minified_size}px)`;
        $item.css('width', w).css('max-width', w);
        $item.css(use_margin_instead_right ? 'mergin-right' : 'right', `${this._minified_size}px)`);
        return this;
    }

    /**
     * Libère les variables
     * @returns /
     */
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
//¤MasterWebconfBarItem
/**
 * Element de la barre d'outil de la visio
 */
class MasterWebconfBarItem {
    /**
     * Constructeur de la classe
     * @param {$} $item Element de la barre d'outil
     * @param {Function} action Action à faire au clique
     * @param {boolean} toggle Si vrai, l'élément possède 2 état, sinon, un clique simple sera fait
     */
    constructor($item, action, toggle = true)
    {
        this._init()._setup($item, action, toggle);
    }

    /**
     * Intialise les variables de la classe
     * @private Cette fonction est privée, évitez de l'utiliser en dehors de cette classe
     * @returns Chaîne
     */
    _init() {
        /**
         * Elément cliquable
         * @type {$}
         */
        this.$item = null;
        /**
         * Action à faire au clique
         * @type {function}
         */
        this.action = null;
        /**
         * Action à faire lorsque l'on passe l'élément dans l'état "actif"
         * @type {function}
         */
        this.onactive = null;
        /**
         * Action à faire lorsque l'on passe l'élément dans l'état "inactif"
         * @type {function}
         */
        this.ondisable = null;
        /**
         * Etat de l'élément
         * @type {boolean}
         */
        this.state = false;
        /**
         * Autres éléments liés à cet élement.
         * @type {Array<MasterWebconfBarItem>}
         */
        this._linkedItems = null;
        return this;
    }

    /**
     * Assigne les variables de la classe
     * @param {$} $item Element de la barre d'outil
     * @param {Function} action Action à faire au clique
     * @param {boolean} toggle Si vrai, l'élément possède 2 état, sinon, un clique simple sera fait
     * @private Cette fonction est privée, évitez de l'utiliser en dehors de cette classe
     * @returns Chaîne
     */
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

    /**
     * Execute l'action de l'élément
     * @param  {...any} args Arguments de l'action
     * @returns 
     */
    _execute_action(...args)
    {
        return this.action.caller[this.action.func].call(this.action.caller, ...args);
    }

    /**
     * Element actif ?
     * @returns 
     */
    is_active() {
        return this.state;
    }

    /**
     * Active l'élement
     * @returns Chaîne
     */
    active() {
        this.state = true;
        this.$item.addClass('active');
        this._execute_action(true, this);
        
        if (!!this.onactive) this.onactive(this);
        return this;
    }

    /**
     * Désactive l'élement
     * @returns Chaîne
     */
    disable() {
        this.state = false;
        this.$item.removeClass('active');
        this._execute_action(false, this);
        
        if (!!this.ondisable) this.ondisable(this);
        return this;
    }

    /**
     * Bascule l'élément
     * @returns Chaîne
     */
    toggle() {
        if (this.state) this.disable();
        else this.active();

        return this;
    }

    /**
     * Execute l'action de l'élément, sans l'activer ou le désactiver
     * @returns Chaîne
     */
    click() {
        this._execute_action(true, this);

        return this;
    }

    /**
     * Cache l'élement
     */
    hide() {
        this.$item.css('display', 'none');
    }

    /**
     * Affiche l'élement
     */
    show() {
        this.$item.css('display', '');
    }

    /**
     * Lie un élément
     * @param {string} key Clé pour retrouver l'élément 
     * @param {MasterWebconfBarItem} item Elément lié
     * @param {string} selfKeyLink Clé pour cette élément, si défini, lie automatiquement cet élément à l'autre élément
     * @returns Chaîne
     */
    addLink(key, item, selfKeyLink = null) {
        if (!this._linkedItems) this._linkedItems = {};

        this._linkedItems[key] = item;

        if (!!selfKeyLink) {
            this._linkedItems[key].addLink(selfKeyLink, this);
        }

        return this;
    }

    /**
     * Récupère un lien
     * @param {string} key Clé du lien à récupérer
     * @returns {MasterWebconfBarItem | null}
     */
    getLink(key) {
        if (!!this._linkedItems) return this._linkedItems[key];
        return null;
    }

    /**
     * Récupère tout les liens
     * @returns {Array<MasterWebconfBarItem> | {}}
     */
    getAllLinks() {
        return this._linkedItems ?? {};
    }

    /**
     * Libère les variables
     * @returns /
     */
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
        this.$pannel = this.$pannel.appendTo(window.top.$('#layout'));
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
var MasterWebconfBar = (() => {
    let _$ = top.$;
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
            _$("body").append(rawbar);
    
            for (var iterator of Enumerable.from(_$('.wsp-toolbar.webconf-toolbar button')).concat(more_actions.$buttons)) {
                iterator = _$(iterator);
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
    
            this.$bar = _$('.wsp-toolbar.webconf-toolbar');
            this.popup = new MasterWebconfBarPopup(this.$bar.find('.toolbar-popup'));
    
            this.popup.$popup.addClass('large-toolbar').css('height', `${window.innerHeight / 2}px`).css('min-height', '250px');
    
            this._$more_actions = more_actions.$button.css('display', '').removeClass('hidden').removeClass('active').appendTo(this.$bar);
            
            if (!top.webconf_resize_set)
            {
                top.webconf_resize_set = true;
                top.eval(`
                    top.$(window).resize(() => {
                        if (!!top && !!top.masterbar && !!top.masterbar.popup) top.masterbar.popup.$popup.css('height', (window.innerHeight / 2)+'px');     
                    });
                `);
            }

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
            this.popup.$popup.addClass('large-toolbar').css('height', `${window.innerHeight / 2}px`);
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
    
        update_popup_devices(devices, click) {
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
                        html.append(_$(`<button data-deviceid="${element.deviceId}" data-devicekind="${element.kind}" data-devicelabel="${element.label}" title="${element.label}" class="mel-ui-button btn btn-primary btn-block ${disabled}" ${disabled}>${element.label}</button>`).click((e) => {
                            e = $(e.currentTarget);
                            click(e.data('deviceid'), e.data('devicekind'), e.data('devicelabel'));
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
                    this.update_item_icon(state, item, [_$('.jitsi-select .mel-icon')]).popup.loading().show();
                    this.update_popup_devices(await this.listener.get_micro_and_audio_devices(), (id, kind, label) => {
                        if (kind === 'audioinput') this.listener.set_micro_device(label, id);
                        else this.listener.set_audio_device(label, id);
                        this.update_item_icon(state, item, null).popup.empty().hidden();
                    });
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
                    this.update_item_icon(state, item, [_$('.jitsi-select .mel-icon')]).popup.loading().show();
                    this.update_popup_devices(await this.listener.get_video_devices(), (id, kind, label) => {
                        this.listener.set_video_device(label, id);
                        this.update_item_icon(state, item, null).popup.empty().hidden();
                    });
                }
                else {
                    this.update_item_icon(state, item, null).popup.empty().hidden();
                }
            }
        }
    
        nextcloud()
        {
            let task = 'stockage'
            let config = {};
    
            try{
                if (this.webconfManager.wsp !== undefined && this.webconfManager.wsp.uid !== undefined)
                {
                    config = {
                        _params: `/apps/files?dir=/dossiers-${this.webconfManager.wsp.uid}`,
                        _is_from:"iframe",
                        // _action:'workspace',
                        // _uid:this.webconfManager.wsp.uid,
                        // _page:'stockage'
                    };
                    //task = 'workspace';
                }
            }catch (er)
            {}
    
            mel_metapage.Functions.change_page(task, null, config);
        }
    
        copyUrl()
        {
            //TODO => Ajouter les infos d'ariane de d'espaces de travail
            mel_metapage.Functions.copy(this.webconfManager.get_url(true));
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
                let $html = _$('<div></div>');
                const users = await this.listener.get_room_infos();
    
                let html_icon = null;
                for (const user of users) {
    
                    if (!!user.avatarURL) html_icon = `<div class="dwp-round" style="width:32px;height:32px;"><img src="${user.avatarURL}" style="width:100%" /></div>`;
                    else html_icon = '';
    
                    _$(`<div tabindex="0" class="mel-selectable mel-focus with-separator row" data-id="${user.participantId}" role="button" aria-pressed="false"><div class="${!!(html_icon || false) ? 'col-2' : 'hidden'}">${html_icon}</div><div class="${!!(html_icon || false) ? 'col-10' : 'col-12'}">${user.formattedDisplayName}</div></div>`).on('click',(e) => {
                        e = _$(e.currentTarget);
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

        // tileViewUpdated(state){

        // }
    
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
    
            this.toggleChat(false);
            
            _$("html").removeClass("webconf-started");
            
            this.listener.hangup();
            this.$bar.remove();

            let $guest_bar = _$(".wsp-toolbar-edited");
            if ($guest_bar.length > 0)
            {
                $guest_bar.removeClass('webconfstarted').css('max-width', '');
            }

            this.dispose();

            if (!rcmail.env['webconf.have_feed_back'])
            {
                mel_metapage.Frames.back();
            }
        }

        minify_item($item)
        {
            this.globalScreenManager.fit_item_to_guest_screen($item);
            return this;
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
    return MasterWebconfBar;    
})();
class ListenerWebConfBar {
    constructor(webconf = new Webconf(), masterBar = new MasterWebconfBar())
    {
        this.webconf = webconf;
        this.masterBar = masterBar;
        this.alreadyListening = false;
        this.participantPan = false;
        this.chatOpen = false;
        this._intervals = {};
        this.filmstrip_visible = true;
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
                this.filmstrip_visible = datas.visible;
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

            this.webconf.jitsii.addEventListener("tileViewChanged", (datas) => {
                const enabled = datas.enabled;

                this.tileViewChanged(enabled);
            });

            // this.webconf.jitsii.addEventListener("errorOccurred", (datas) =>{
            //     console.error('###[VISIO]', datas);
            // });

            
            this.webconf.jitsii.addEventListener("readyToClose", () =>{
                console.log("[VISIO]La visio est prête à être fermée !");
            });
        }
    }

    tileViewChanged(enabled) {
        if (enabled) {
            this.webconf.screen_manager.delete_button_size_correction('strip');
        }
        else if (this.filmstrip_visible){
            this.webconf.screen_manager.button_size_correction('strip', '129px');
        }
        else 
        {
            this.webconf.screen_manager.delete_button_size_correction('strip');
        }

        this.webconf.screen_manager.update_button_size();
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
// top.WebconfScreenManager = top.WebconfScreenManager || WebconfScreenManager;
// top.MasterWebconfBar = top.MasterWebconfBar || MasterWebconfBar;


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
        let interval1 = setInterval(() => {
            console.log('interval1', top.masterbar, !!top.masterbar, interval1);
            if (!!top.masterbar) {
                clearInterval(interval1);
                top.masterbar.show();
                top.masterbar.webconfManager.chat.hidden = window[webconf_var_name].chat.hidden;
                top.masterbar.updateLogo().updateBarAtStartup();
            }
        }, 10);

        let interval = setInterval(() => {
            console.log('interval2', window.listener, !!window.listener, interval);
            if (!!window.listener) {
                clearInterval(interval);
                window.listener.start();
            }
        }, 10);
    });

    top[screen_manager_var_name] = new WebconfScreenManager(top.$('.webconf-frame'), top.$('#layout-frames'), window[webconf_var_name], right_item_size);
    top.masterbar = new MasterWebconfBar(top[screen_manager_var_name], window[webconf_var_name], $('#visio-right-pannel-util'),{
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

    window.addEventListener('message', (e) => {
		if (e.data.eventName === undefined)
			return;

		if (top.ariane !== undefined)
		{
			if (e.data.eventName === "status-changed" || e.data.eventName === "user-status-manually-set")
			{
				const value = e.data.data;
				top.ariane.update_status(value?.id ?? value);
				rcmail.env.ariane_have_calls = true;
			}
		}
	});
}

function create_on_page_change(var_name, var_webconf_started_name, var_webconf_screen_manager_name) {
    if (!top[var_name]) {
        top[var_name] = true;
        top.var_webconf_started_name = var_webconf_started_name;
        top.var_webconf_screen_manager_name = var_webconf_screen_manager_name;
        top.ewsmode = ewsmode;

        top.metapage_frames.addEvent('before', (eClass) => {
            try {
                if (!top.masterbar && top[var_webconf_started_name] === true) top[var_webconf_started_name] = false; 
                if (top[var_webconf_started_name] === true)
                {
                    eClass = top.mm_st_ClassContract(eClass);
                    let $selector = top.$(`iframe.${eClass}-frame`);
    
                    if ($selector.length === 0 && top.$(`.${eClass}-frame`).length > 0) {
                        top.$(`.${eClass}-frame`).remove();//.removeClass(`${eClass}-frame`).addClass('visio-temp-frame').data('start', eClass);
                    }
                }
            } catch (error) {
                
            }
        }, true);

        top.metapage_frames.addEvent('before.after', (eClass, changepage, isAriane, querry, id) => {
            try {
                //Si webconf
                if (top[var_webconf_started_name] === true)
                {
                    top.masterbar.maximise().listener.webconf.screen_manager.update_button_size();
                    top[var_webconf_screen_manager_name].$webconf.css('display', '');
                    
                    if (top[var_webconf_screen_manager_name].$layout_frames.length === 0) top[var_webconf_screen_manager_name].$layout_frames = top.$('#layout-frames');
                    //Cas 1 => Changement de page
                    if (eClass !== 'webconf' && !isAriane){
                        top[var_webconf_screen_manager_name].switchMode(ewsmode.minimised);

                        let $toolbaredited = top.$('.wsp-toolbar-edited.melw-wsp');
                        if (eClass === 'workspace' || $toolbaredited.length > 0){
                            top.masterbar.minify();

                            // if ($toolbaredited.length > 0)
                            // {
                            //     top.masterbar.minify_item($toolbaredited);
                            // }
                        }
                    }
                    //Cas 2 => Chat
                    else if (isAriane) {
                        try {
                            mel_metapage.PopUp.ariane.is_show = false;
                        } catch (error) {
                            
                        }
                        top[var_webconf_screen_manager_name].switchMode(ewsmode.chat);
                        return "break";
                    }
                    //Cas 3 => Retour à la visio
                    else {
                        top[var_webconf_screen_manager_name].switchMode(ewsmode.fullscreen);
                    }
                }
            } catch (error) {
                //console.error(error, 'rotomeca');
            }
        }, true);

        top.metapage_frames.addEvent('after', () => {
            try {
                //Si webconf
                if (top[var_webconf_started_name] === true)
                {
                    top[var_webconf_screen_manager_name].switchModeFrame();
                }
            } catch (error) {
                
            }
        }, true);

        const ignoreChat = (eClass, changepage, isAriane, querry, id) => {
            try {
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
    
                    top[var_webconf_screen_manager_name].webconf.set_document_title();
                    document.title = 'Visioconférence';
                }
            } catch (error) {
                
            }
        };

        top.metapage_frames.addEvent('after', ignoreChat, true);
        top.metapage_frames.addEvent('onload.after', () => {
            try {
                //Si webconf
                if (top[var_webconf_started_name] === true)
                {
                    top[var_webconf_screen_manager_name].webconf.set_document_title();
                    document.title = 'Visioconférence';
                }
            } catch (error) {
                
            }
        }, true);
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
        console.log('on dispose starting...');
        window[var_visio].chat.setStatus('online');
        top[var_top_webconf_started] = undefined;
        top[var_global_screen_manager] = undefined;

        try {
            delete top[var_top_webconf_started];
            delete top[var_global_screen_manager];
        } catch (error) {
            console.error('error', error);
        }

        console.log('on dispose finished !');
    });

    $('.footer').css('display', "none");

});

})();