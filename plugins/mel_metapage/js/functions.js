const delay = ms => new Promise(res => setTimeout(res, ms));
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

function m_mp_CreateEvent()
{
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

function m_mp_set_storage(key, item = true, close = true)
{
    rcmail.local_storage_set_item(key, item);
    if (close)
        window.create_popUp.close();
}

function m_mp_action_from_storage(storage_key, action, remove = true)
{
    let event = rcmail.local_storage_get_item(storage_key);
    if(event !== null)
    {
        if (event === true)
            action();
        if (remove)
            rcmail.local_storage_remove_item(storage_key);
    }  
}

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
