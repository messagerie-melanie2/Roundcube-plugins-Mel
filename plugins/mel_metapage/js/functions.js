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
        let tache = '<div class="col-3">' + button("Une tâche", "icofont-tasks block") + "</div>";
        let reu = '<div class="col-3">' + button("Une réunion", "icofont-calendar block", "m_mp_CreateEvent()") + "</div>";
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

function m_mp_CreateEvent()
{
    rcmail.local_storage_set_item("calendar_create", true);
    window.location.href = rcmail.get_task_url("calendar");
}

