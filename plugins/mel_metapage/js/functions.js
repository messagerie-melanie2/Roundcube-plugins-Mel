/**
 * Met en pause une fonction asynchrone.
 * @param {number} ms 
 */
const delay = ms => new Promise(res => setTimeout(res, ms));
/**
 * Affiche la modale du bouton "créer".
 */
function m_mp_Create()
{
    if (window.create_popUp === undefined)
    {
        let button = function (txt, font, click = "")
        {
            let disabled = click ==="" ? "disabled" : "";
            return '<button class="btn btn-block btn-secondary btn-mel ' + disabled + '" onclick="'+click+'"'+disabled+'><span class="'+font+'"></span>'+ txt +'</button>';
        }
        let html = "";
        let workspace = '<div class="col-12">' + button("Un espace de travail", "icofont-monitor") + '</div>'
        let mail = '<div class="col-3">' + button("Un email", "icofont-email block", "rcmail.open_compose_step()") + "</div>";
        let tache = '<div class="col-3">' + button("Une tâche", "icofont-tasks block", "m_mp_CreateOrOpenFrame('tasklist', () => m_mp_set_storage('task_create'), () => m_mp_action_from_storage('task_create', m_mp_OpenTask))") + "</div>";
        let reu = '<div class="col-3">' + button("Une réunion", "icofont-calendar block", 'm_mp_CreateOrOpenFrame(`calendar`, m_mp_CreateEvent, m_mp_CreateEvent_inpage)') + "</div>";
        let viso = '<div class="col-3">' + button("Une visio-conférence", "icofont-slidshare block") + "</div>";
        let document = '<div class="col-4">' + button("Un document", "icofont-file-document block") + "</div>";
        let blocnote = '<div class="col-4">' + button("Un bloc-note", "icofont-ui-note block") + "</div>";
        let pega = '<div class="col-4">' + button("Un sondage pégaze", "icofont-letter block") + "</div>";
        html = '<div class="row">' + workspace + mail + tache + reu + viso + document + blocnote + pega + '</div>';
        let config = new GlobalModalConfig("Que souhaitez-vous créer ?", "default", html, '   ');
        create_popUp = new GlobalModal("globalModal", config, true);
    }
    else
        window.create_popUp.show();
}

function m_mp_Help()
{
    rcmail.mel_metapage_url_info = m_mp_DecodeUrl();
    rcmail.command("help_open_dialog");
}

function m_mp_DecodeUrl()
{
    let url;// = $("#" + rcmail.env.current_frame)[0].contentDocument.location.href;
    if (rcmail.env.current_frame === undefined || rcmail.env.current_frame == "default")
        url = window.location.href;
    else
        url = $("#" + rcmail.env.current_frame)[0].contentDocument.location.href;
    
    let text = "";
    let hasTask = false;
    let task = null;
    let action = null;
    for (let index = 0; index < url.length; ++index) {
        const element = url[index];
        if (element === "/")
            text = "";
        else if (element === "&" || index == url.length-1)
        {
            if (index == url.length-1)
                text += element;
            if (hasTask && text.includes("_action"))
            {
                action = text.replace("&", "").replace("?", "").replace("_action=", "");
                break;
            }
            else if (!hasTask && text.includes("_task")){
                hasTask = true;
                task = text.replace("?", "").replace("&", "").replace("_task=", "");
                text = ";"
            }
            else
                text = "";
        }
        else
            text += element;
    }
    console.log("url decode", {
        task:task,
        action:action
    });
    return {
        task:task,
        action:action
    };
}

/**
 * Ouvre ou créer une frame.
 * @param {string} frameClasse Frame à ouvrir
 * @param {function} funcBefore Fonction à appelé avant d'ouvrir.
 * @param {function} func Fonction à appelé une fois ouvert.
 */
function m_mp_CreateOrOpenFrame(frameClasse, funcBefore, func = () => {}){
    if (funcBefore !== null)
        funcBefore();
    mm_st_CreateOrOpenModal(frameClasse);
    new Promise(async (a,b) => {
        while (parent.rcmail.env.frame_created === false) {
            await delay(1000);
        }
        if (func !== null)
            func();
    });
}

/**
 * Action de créer un évènement.
 */
function m_mp_CreateEvent()
{
    window.create_popUp.close();
    const action = () => {
        m_mp_set_storage("calendar_create");
    };
    const calendar = 'calendar';
    //console.log(window.rcube_calendar_ui, rcmail.env.current_frame_name, rcmail.env.task);
    if (parent.child_cal === undefined)
        action();
    else{       
        if (rcmail.env.current_frame_name !== undefined)
        {
            if (rcmail.env.current_frame_name === calendar)
                parent.child_cal.add_event("")
            else
                action();
        }
        else if (rcmail.env.task === calendar)
            parent.child_cal.add_event("")
        else
            action();
    }
}

/**
 * Action de créer un évènement après affichage de la frame.
 */
function m_mp_CreateEvent_inpage()
{
    let event = rcmail.local_storage_get_item("calendar_create");
    if(event !== null)
    {
        if (event === true)
            parent.child_cal.add_event("")
        rcmail.local_storage_remove_item("calendar_create");
    }   
}

/**
 * Sauvegarde une donnée et ferme la fenêtre de création.
 * @param {string} key Clé à sauvegarder.
 * @param {boolean} item Données à sauvegarder. "true" par défaut.
 * @param {boolean} close Ferme la fenêtre de création. "true" par défaut.
 */
function m_mp_set_storage(key, item = true, close = true)
{
    rcmail.local_storage_set_item(key, item);
    if (close)
        window.create_popUp.close();
}

/**
 * Effectue une action à faire si il y a des données dans le stockage local.
 * @param {string} storage_key Clé de la donnée à réupérer.
 * @param {function} action Action à faire si la donnée existe.
 * @param {boolean} remove Supprimer la données après avoir fait l'action. "true" par défaut.
 * @param {*} eventValue La valeur du stockage pour faire l'action. "true" par défaut. Si "¤avoid", l'action est toujours faite.
 */
function m_mp_action_from_storage(storage_key, action, remove = true, eventValue = true)
{
    let event = rcmail.local_storage_get_item(storage_key);
    if(event !== null)
    {
        if (eventValue === "¤avoid")
            action(event);
        else{
            if (event === eventValue)
                action(event);
        }
        if (remove)
            rcmail.local_storage_remove_item(storage_key);
    }  
}

/**
 * Ouvre une nouvelle tâche.
 */
function m_mp_OpenTask()
{
    let navigator = window.child_rcmail === undefined ? rcmail : child_rcmail;
    new Promise(async (a,b) => {
        while(navigator.busy || rcmail.busy)
        {
            await delay(100);
        }
        navigator.command('newtask','',this, event);
    });
}

//Action à faire après certains actions des mails.
rcmail.addEventListener('responseafter', function(props) {
    if (props.response && (props.response.action == 'mark' || props.response.action=='getunread')) {
     parent.rcmail.triggerEvent(mel_metapage.EventListeners.mails_updated.get);
    }

});

function m_mp_close_ariane()
{
    event.preventDefault();
    if (parent.mel_metapage.PopUp.ariane !== undefined)
        parent.mel_metapage.PopUp.ariane.hide();
}