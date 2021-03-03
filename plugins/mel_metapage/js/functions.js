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
        let document = '<div class="col-4">' + button("Un document", "icofont-file-document block", "m_mp_InitializeDocument()") + "</div>";
        let blocnote = '<div class="col-4">' + button("Un bloc-note", "icofont-ui-note block") + "</div>";
        let pega = '<div class="col-4">' + button("Un sondage pégaze", "icofont-letter block", "m_mp_CreateOrOpenFrame('sondage', () => {$('.modal-close ').click();}, () => {$('.sondage-frame')[0].src=rcmail.env.sondage_create_sondage_url;})") + "</div>";
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

function m_mp_InitializeDocument()
{
    //window.create_popUp = new GlobalModal("globalModal", config, true);
    let html = "<div class=row><div class=col-12>";
    html += "<label>Nom du nouveau document :</label>";
    html += '<input class=form-control id="'+mel_metapage.Ids.create.doc_input+'" type=text placeholder="Nouveau document texte.txt" />';
    html += '<button style=margin-top:5px class="btn btn-primary" onclick="m_mp_CreateDoc()">Créer un document</button>';
    html += '<button style=margin-top:5px class="btn btn-warning" onclick="m_mp_CreateDocRetour()">Retour</button>'
    html += "</div></div>";
    create_popUp.contents.html(html);
}

function m_mp_CreateDocRetour()
{
    create_popUp = undefined;
    m_mp_Create();
}


async function m_mp_CreateDoc()
{
    fetch('http://localhost/nextcloud/mdrive/remote.php/dav/files/tommy.delphin.i/RotoTest.txt', {method: 'PUT', credentials: "same-origin"})
    .then(function(response) {
      return response.text();
    })
    .then(function(text) {
      console.log('Request successful', text);
    })
    .catch(function(error) {
      console.error('Request failed', error)
    });
  

    // $.ajax({
    //     async: true,
    //     type: 'PUT',
    //     // data: JSON.stringify({filePath: "/wolololo.txt"}),
    //     // contentType: "application/json; charset=utf-8",
    //     // dataType: "json",
    //     //https://mel.din.developpement-durable.gouv.fr/mdrive/remote.php/dav/files/thomas.payen/Test.txt
    //     url: "http://localhost/nextcloud/mdrive/remote.php/dav/files/tommy.delphin.i/RotoTest.txt",
    //     error: function(o, status, err) {
    //       console.error(o, status, err);
    //     },
    //     success: function(data) {
    //       console.log('oioioio', data);
    //     }
    //   });    
    // if (rcmail.env.current_frame !== undefined && $("#" + rcmail.env.current_frame)[0].classList.contains("stockage-frame") && $("#" + rcmail.env.current_frame).contents()[0].location.href.includes("files"))
    //     await m_mp_CreateDocCurrent();
    // else
    //     m_mp_CreateDocNotCurrent()
}

async function m_mp_CreateDocCurrent(val = null, close = true)
{
    let querry = $(".stockage-frame");
    if (val === null)
    {
        if ($("#" + mel_metapage.Ids.create.doc_input).val() === "")
            $("#" + mel_metapage.Ids.create.doc_input).val("Nouveau document texte.txt");
        val = $("#" + mel_metapage.Ids.create.doc_input).val();
    }
    if (close)
    {
        window.create_popUp.close();
        window.create_popUp = undefined;
    }
    rcmail.set_busy(true, "loading");
    while(querry.contents().find(".button.new").length === 0)
    {
        await delay(500);
    }
    rcmail.set_busy(true, "loading");
    console.log("2 click new");
    querry.contents().find(".button.new")[0].click();
    console.log("3 click doc");
    querry.contents().find(".menuitem").each((i,e) => {
        if (e.dataset.filetype !== undefined && e.dataset.filetype === "file")
           e.click();
    });
    rcmail.set_busy(true, "loading");
    while (!Enumerable.from(querry.contents().find("input")).select(x => x.id).where(x => x.includes("input-file")).any()) {
        await delay(500);
    }
    console.log("4 change value");
    let id = Enumerable.from(querry.contents().find("input")).select(x => x.id).where(x => x.includes("input-file")).first();
    querry.contents().find("#" + id).val(val+ (val.includes(".") ? "" : ".txt"));
    await delay(500);
    rcmail.set_busy(true, "loading");
    if (!Enumerable.from(querry.contents().find("div")).where(x => Enumerable.from(x.classList).where(s => s.includes("tooltip").any()) && x.innerHTML.includes(val) && $(x).parent().hasClass("tooltip")  ).any())
        querry.contents().find("#" + id).parent().find(".icon-confirm").click();
    //window.querry = querry;
    console.log("5 click val");
    let it = 2;
    let bool = false;
    let tmpval = val;
    while (!Enumerable.from(querry.contents().find("input")).where(x => x.attributes.type !== undefined && x.attributes.type.value === "submit" && x.classList.contains("primary")).any()) {
        await delay(500);
        if (Enumerable.from(querry.contents().find("div")).where(x => Enumerable.from(x.classList).where(s => s.includes("tooltip").any()) && x.innerHTML.includes(val) && $(x).parent().hasClass("tooltip")  ).any())
        {
            console.log("["+(it-1)+"]abort, change text + new click");
            // m_mp_Create();
            // m_mp_InitializeDocument();
            // $("#" + mel_metapage.Ids.create.doc_input).val(val).css("border-color", "red").parent().append("<br/><span style=color:red;>*Un fichier avec le même nom existe déjà !</span>");
            // rcmail.set_busy(false);
            // rcmail.clear_messages();
            // return;
            val = it + "-" + tmpval;
            ++it;
            querry.contents().find("#" + id).val(val);
            bool = true;
            //await delay(500);
            //querry.contents().find("#" + id).parent().find(".icon-confirm").click();
        } 
        else if (bool)
        {
            querry.contents().find("#" + id).parent().find(".icon-confirm").click();
            rcmail.display_message("Le nom " + tmpval + " existe déjà et sera remplacer par " + val);
        }
    }
    console.log("6 click item");
    Enumerable.from(querry.contents().find("input")).where(x => x.attributes.type !== undefined && x.attributes.type.value === "submit" && x.classList.contains("primary")).first().click();
    rcmail.set_busy(true, "loading");
    console.log("7 change page");
    m_mp_CreateOrOpenFrame("stockage", () => {}, () => {
        rcmail.set_busy(false);
        rcmail.clear_messages();
    });
}

function m_mp_CreateDocNotCurrent()
{
    if ($("#" + mel_metapage.Ids.create.doc_input).val() === "")
        $("#" + mel_metapage.Ids.create.doc_input).val("Nouveau document texte.txt");
    let val = $("#" + mel_metapage.Ids.create.doc_input).val();
    create_popUp.contents.html('<center><span class=spinner-border></span></center>');
    m_mp_CreateOrOpenFrame("stockage", () => {}, () => {
        rcmail.set_busy(true, "loading");
        $(".stockage-frame")[0].src = "http://localhost/nextcloud/index.php" + "/apps/files";
        let querry = $(".stockage-frame");
        window.create_popUp.close();
        window.create_popUp = undefined;
        querry.css("margin-top", "60px");
        console.log("1 create-promise");
        new Promise(async (a, b) => {
            await m_mp_CreateDocCurrent(val, false);
        });
    }, false);
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
function m_mp_CreateOrOpenFrame(frameClasse, funcBefore, func = () => {}, changepage = true){
    if (funcBefore !== null)
        funcBefore();
    mm_st_CreateOrOpenModal(frameClasse, changepage);
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

function m_mp_full_screen_ariane()
{
    event.preventDefault();
    parent.mm_st_CreateOrOpenModal('rocket');
}

function m_mp_anchor_ariane()
{
    event.preventDefault();
    if (parent.mel_metapage.PopUp.ariane !== undefined)
        parent.mel_metapage.PopUp.ariane.anchor();
}