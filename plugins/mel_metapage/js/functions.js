/**
 * Affiche la modale du bouton "créer".
 */
function m_mp_Create()
{
    //Si problème de configuration, on gère.
    try {
        if (rcmail.env.nextcloud_pinged === false || rcmail.env.nextcloud_username === undefined || rcmail.env.nextcloud_url === undefined || rcmail.env.nextcloud_url === "")
            window.mel_metapage_tmp = null;
        else
            window.mel_metapage_tmp = new Nextcloud(rcmail.env.nextcloud_username).getAllFolders();
    } catch (error) {
        window.mel_metapage_tmp = null;
        console.error(rcmail.gettext("mel_metapage.nextcloud_connection_error"));
    }

    //Si la popup n'existe pas, on la créer.
    if (window.create_popUp === undefined)
    {
        let haveNextcloud = {
            style:(window.mel_metapage_tmp===null?"display:none":""),
            col:(window.mel_metapage_tmp===null)?"6":"4"
        };
        let button = function (txt, font, click = "")
        {
            let disabled = click ==="" ? "disabled" : "";
            return '<button class="btn btn-block btn-secondary btn-mel ' + disabled + '" onclick="'+click+'"'+disabled+'><span class="'+font+'"></span>'+ txt +'</button>';
        }
        let html = "";
        let workspace = '<div class="col-12">' + button(rcmail.gettext("mel_metapage.a_worspace"), "icofont-monitor") + '</div>'
        let mail = '<div class="col-sd-3 col-md-3">' + button(rcmail.gettext("mel_metapage.a_mail"), "icofont-email block", "rcmail.open_compose_step()") + "</div>";
        let tache = '<div class="col-sd-3 col-md-3">' + button(rcmail.gettext("mel_metapage.a_task"), "icofont-tasks block", "m_mp_CreateOrOpenFrame('tasklist', () => m_mp_set_storage('task_create'), () => m_mp_action_from_storage('task_create', m_mp_OpenTask))") + "</div>";
        let reu = '<div class="col-sd-3 col-md-3">' + button(rcmail.gettext("mel_metapage.a_meeting"), "icofont-calendar block", 'm_mp_CreateOrOpenFrame(`calendar`, m_mp_CreateEvent, m_mp_CreateEvent_inpage)') + "</div>";
        let viso = '<div class="col-sd-3 col-md-3">' + button(rcmail.gettext("mel_metapage.a_web_conf"), "icofont-slidshare block") + "</div>";
        let document = '<div class="col-4" style="'+haveNextcloud.style+'">' + button(rcmail.gettext("mel_metapage.a_document"), "icofont-file-document block", (window.mel_metapage_tmp === null ? "":"m_mp_InitializeDocument()")) + "</div>";
        let blocnote = '<div class="col-'+haveNextcloud.col+'">' + button(rcmail.gettext("mel_metapage.a_wordpad"), "icofont-ui-note block") + "</div>";
        let pega = '<div class="col-'+haveNextcloud.col+'">' + button(rcmail.gettext("mel_metapage.a_survey"), "icofont-letter block", "m_mp_CreateOrOpenFrame('sondage', () => {$('.modal-close ').click();}, () => {$('.sondage-frame')[0].src=rcmail.env.sondage_create_sondage_url;})") + "</div>";
        html = '<div class="row">' + workspace + mail + tache + reu + viso + document + blocnote + pega + '</div>';
        let config = new GlobalModalConfig(rcmail.gettext("mel_metapage.what_do_you_want_create"), "default", html, '   ');
        create_popUp = new GlobalModal("globalModal", config, true);
    }
    else //Si elle existe, on l'affiche.
        window.create_popUp.show();
}

/**
 * Ouvre la fenêtre d'aide.
 */
function m_mp_Help()
{
    rcmail.mel_metapage_url_info = m_mp_DecodeUrl();
    rcmail.command("help_open_dialog");
}

/**
 * Change l'icône en classe en fonction du type.
 * @param {string} icon Icône à changer en classe.
 * @param {string} type Type du document.
 * @returns {string} Classe.
 */
function m_mp_CreateDocumentIconContract(icon, type)
{
    return nextcloud_document.getIcon(icon, type);
}

/**
 * @async
 * Affiche les données pour créer un document dans la modale de création.
 */
async function m_mp_InitializeDocument()
{
    //window.create_popUp = new GlobalModal("globalModal", config, true);
    //$this->rc->config->get('documents_types');
    let html = "<form>";
    html += "<label>"+rcmail.gettext("mel_metapage.choose_type_doc")+"</label>";
    html += "<div class=row>"
    let col = 0;//rcmail.env.mel_metapage_templates_doc.length/5;
    let ret = 0;
    for (let index = 0; index < rcmail.env.mel_metapage_templates_doc.length; index++) {
        const element = rcmail.env.mel_metapage_templates_doc[index];
        html += '<div class=col-3><button type=button class="doc-'+element.type+' btn-template-doc btn btn-block btn-secondary btn-mel" onclick="m_mp_UpdateCreateDoc(`'+JSON.stringify(element).replace(/"/g, "¤¤¤")+'`)"><span style="display:block;margin-right:0px" class="'+m_mp_CreateDocumentIconContract(element.icon)+'"></span>'+ rcmail.gettext("mel_metapage." + element.name) +'</button></div>';
    }
    html += "</div>";
    html += "<label>"+rcmail.gettext("mel_metapage.document_folder")+"</label>";
    html += '<div class=row><div class=col-12>';
    html += '<select id="' + mel_metapage.Ids.create.doc_input_path + '" class=form-control>';
    html += "<option value=default>---</option>";
    folders = await window.mel_metapage_tmp;
    window.mel_metapage_tmp = null;
    for (let index = 0; index < folders.length; index++) {
        const element = folders[index];
        html += '<option value="' + element.link + '">'+element.name+'</option>';
    }
    html += '</select>'
    html += "</div></div>";
    html += "<label>"+rcmail.gettext("mel_metapage.document_name")+"</label>";
    html += '<div class=row><div class=col-12><div class="input-group">';
    html += `<input type=hidden id=`+mel_metapage.Ids.create.doc_input_hidden+`>`;
    html += '<input class=form-control id="'+mel_metapage.Ids.create.doc_input+'" type=text placeholder="Nouveau document texte" />';
    html += '<div class="input-group-append">';
    html += '<span class=input-group-text>.</span>';
    html += '<input style="    border-left: initial;border-bottom-left-radius: 0;border-top-left-radius: 0" class="form-control input-group-input" id='+mel_metapage.Ids.create.doc_input_ext+' type=text placeholder="txt">';
    html += '</div></div></div></div>'
    html += '<div id='+mel_metapage.Ids.create.doc_input+'-div ></div>';
    html += '<button type=button style="margin-top:5px; margin-right:5px" class="btn btn-primary" onclick="m_mp_CreateDoc()">'+rcmail.gettext("mel_metapage.create_doc")+'</button>';
    html += '<button type=button style=margin-top:5px class="btn btn-warning" onclick="m_mp_CreateDocRetour()">'+rcmail.gettext("back")+'</button>'
    html += "</form>";
    create_popUp.contents.html(html);
    $(".doc-" + rcmail.env.mel_metapage_templates_doc[0].type)[0].click();
    /*
    POST https://mel.din.developpement-durable.gouv.fr/mdrive/index.php/apps/richdocuments/ajax/documents/create
mimetype	"application/vnd.oasis.opendocument.text"
filename	"Test.odt"
dir	"/"
*/
}

/**
 * Met à jours les boutons de la création d'un document.
 * @param {string} json Données à traité.
 */
function m_mp_UpdateCreateDoc(json)
{
    json = JSON.parse(json.replace(/¤¤¤/g, '"'));
    let querry = $(".doc-" + json.type);
    $(".btn-template-doc").removeClass("disabled").removeClass("active");
    querry.addClass("active").addClass("disabled");
    $("#" + mel_metapage.Ids.create.doc_input_hidden).val(JSON.stringify(json));
    $("#" + mel_metapage.Ids.create.doc_input).attr("placeholder", (json.tags !== undefined && json.tags.includes("f") ? rcmail.gettext("mel_metapage.new_f") : rcmail.gettext("mel_metapage.new_n"))+ " " + (rcmail.gettext("mel_metapage." + json.name)).toLowerCase());
    $("#" + mel_metapage.Ids.create.doc_input_ext).attr("placeholder", json.default_ext);
    if (json.tags !== undefined && json.tags.includes("l"))
        $("#" + mel_metapage.Ids.create.doc_input_ext).removeClass("disabled").removeAttr("disabled");
    else
        $("#" + mel_metapage.Ids.create.doc_input_ext).addClass("disabled").attr("disabled", "disabled");
}

function m_mp_CreateDocRetour()
{
    create_popUp = undefined;
    m_mp_Create();
}


async function m_mp_CreateDoc()
{
    let configModifier = function (type, value, path, modifiers = null)
    {
        return (config) => {
            if (path != null)
                path = Nextcloud_File.get_path(path);
            config.method = "POST";
            config.body = JSON.stringify({
                mimetype:'application/'+type,
                filename:value,
                dir:"/" + (path === null ? "" : path)
            });
            if (modifiers !== null && modifiers.length > 0)
            {
                if (modifiers.length === undefined)
                    config = modifiers(val, path, config);
                else if (modifiers.length === 1)
                    config = modifiers[0](val, path, config);
                else {
                    for (let j = 0; j < modifiers.length; j++) {
                        const element = modifiers[j];
                        config = element(val, path, config);
                    }
                }
            }
            //'mimetype="application/'+type+'"&filename="'+value+'"&dir="/'+(path === null ? "" : path)+'"';
            return config;
        };
    }
    let json = JSON.parse($("#" + mel_metapage.Ids.create.doc_input_hidden).val());
    //console.log(json);
    if ($("#" + mel_metapage.Ids.create.doc_input).val() === "")
        $("#" + mel_metapage.Ids.create.doc_input).val( (json.tags !== undefined && json.tags.includes("f") ? "Nouvelle" : "Nouveau")+ " " + json.name.toLowerCase());
    if ($("#" + mel_metapage.Ids.create.doc_input_ext).val() === "")
        $("#" + mel_metapage.Ids.create.doc_input_ext).val(json.default_ext);
    else if ($("#" + mel_metapage.Ids.create.doc_input_ext).val()[0] === ".")
        $("#" + mel_metapage.Ids.create.doc_input_ext).val($("#" + mel_metapage.Ids.create.doc_input_ext).val("txt").replace(".", ""));
    let val = $("#" + mel_metapage.Ids.create.doc_input).val() + "." + $("#" + mel_metapage.Ids.create.doc_input_ext).val();
    let href = $("#" + mel_metapage.Ids.create.doc_input_path).val();
    if (href === "default") href = null;
    console.log("vall", val, href,$("#" + mel_metapage.Ids.create.doc_input_path).val());
    let nextcloud = new Nextcloud(rcmail.env.nextcloud_username);
    if ((await nextcloud.searchDocument(val, null, href)) === undefined)
    {
        create_popUp.contents.html('<center><span class=spinner-border></span></center>');
        {
            let embed_datas = {
                val:val,
                href:href, 
                path:(href === null ? null: Nextcloud_File.get_path(href)),
                json:json
            }
            if (!await nextcloud_document.createDocument(json.type, nextcloud, embed_datas, configModifier))
            {
                console.error("Type de fichier inconnu !");
                throw "Type de fichier inconnu !";
            }
        }

        let doc = await nextcloud.searchDocument(val, null, href);
        window.create_popUp.close();
        window.create_popUp = undefined;
        console.log(doc, "doc");
        await nextcloud.go(doc);
    }
    else {
        window.create_popUp = undefined;
        $("#" + mel_metapage.Ids.create.doc_input).css("border-color", "red");
        $("#" + mel_metapage.Ids.create.doc_input + "-div").css("color", "red").html("Le nom " + val + " existe déjà dans ce dossier.");
    }
    //console.log("nc", await nextcloud.searchDocument(val), val);
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

/**
 * Ferme ariane.
 */
function m_mp_close_ariane()
{
    event.preventDefault();
    if (parent.mel_metapage.PopUp.ariane !== undefined)
        parent.mel_metapage.PopUp.ariane.hide();
}

/**
 * Ouvre la frame d'ariane.
 */
function m_mp_full_screen_ariane()
{
    event.preventDefault();
    parent.mm_st_CreateOrOpenModal('rocket');
}

/**
 * Ancre ariane.
 */
function m_mp_anchor_ariane()
{
    event.preventDefault();
    if (parent.mel_metapage.PopUp.ariane !== undefined)
        parent.mel_metapage.PopUp.ariane.anchor();
}