const enable_custom_uid = false;
jQuery.fn.swap = function(b){ 
    b = jQuery(b)[0]; 
    var a = this[0]; 
    var t = a.parentNode.insertBefore(document.createTextNode(''), a); 
    b.parentNode.insertBefore(a, b); 
    t.parentNode.insertBefore(b, t); 
    t.parentNode.removeChild(t); 
    return this; 
};
/**
 * Affiche la modale du bouton "créer".
 */
function m_mp_Create()
{
    FullscreenItem.close_if_exist();

    //Si problème de configuration, on gère.
    try {
        // if (rcmail.env.nextcloud_pinged === false || rcmail.env.nextcloud_username === undefined || rcmail.env.nextcloud_url === undefined || rcmail.env.nextcloud_url === "")
        //     window.mel_metapage_tmp = null;
        // else
            window.mel_metapage_tmp = true;//new Nextcloud(rcmail.env.nextcloud_username).getAllFolders();
    } catch (error) {
        window.mel_metapage_tmp = null;
        console.error(rcmail.gettext("mel_metapage.nextcloud_connection_error"));
    }

    //Si la popup n'existe pas, on la créer.
    if (window.create_popUp === undefined)
    {
        let haveNextcloud = {
            style:(window.mel_metapage_tmp===null?"display:none":""),
            col:(window.mel_metapage_tmp===null)?"4":"3"
        };
        let button = function (txt, font, click = "")
        {
            let disabled = click ==="" ? "disabled" : "";
            return '<button class="btn btn-block btn-secondary btn-mel ' + disabled + '" onclick="'+click+'"'+disabled+'><span class="'+font+'"></span>'+ txt +'</button>';
        }
        let html = "";
        let workspace = `<div role="listitem" class="col-12" title="${rcmail.gettext("mel_metapage.menu_create_help_workspace")}">` + button(rcmail.gettext("mel_metapage.a_worspace"), "icon-mel-workplace", "m_mp_createworkspace()") + '</div>'
        let mail = `<div role="listitem" class="col-sd-4 col-md-4" title="${rcmail.gettext("mel_metapage.menu_create_help_email")}">` + button(rcmail.gettext("mel_metapage.a_mail"), "icon-mel-mail block", "window.create_popUp.close();rcmail.command('compose','',this,event)") + "</div>";
        let reu = `<div role="listitem" class="col-sd-4 col-md-4" title="${rcmail.gettext("mel_metapage.menu_create_help_event")}">` + button(rcmail.gettext("mel_metapage.a_meeting"), "icon-mel-calendar block", 'mm_create_calendar(this);//rcube_calendar.mel_create_event()//m_mp_CreateOrOpenFrame(`calendar`, m_mp_CreateEvent, m_mp_CreateEvent_inpage)') + "</div>";
        let viso = `<div role="listitem" class="col-sd-4 col-md-4" title="${rcmail.gettext("mel_metapage.menu_create_help_webconf")}">` + button(rcmail.gettext("mel_metapage.a_web_conf"), "icon-mel-videoconference block", `window.webconf_helper.go()`) + "</div>";
        let tache = `<div role="listitem" class="col-${haveNextcloud.col}" title="${rcmail.gettext("mel_metapage.menu_create_help_task")}">` + button(rcmail.gettext("mel_metapage.a_task"), "icon-mel-survey block", "m_mp_CreateOrOpenFrame('tasklist', () => m_mp_set_storage('task_create'), m_mp_NewTask)") + "</div>";
        let document = `<div role="listitem" class="col-3" style="${haveNextcloud.style}" title="${rcmail.gettext("mel_metapage.menu_create_help_doc")}">` + button(rcmail.gettext("mel_metapage.a_document"), "icon-mel-folder block", (window.mel_metapage_tmp === null ? "":"m_mp_InitializeDocument()")) + "</div>";
        let blocnote = `<div role="listitem" class="col-${haveNextcloud.col}" title="${rcmail.gettext("mel_metapage.menu_create_help_note")}">` + button(rcmail.gettext("mel_metapage.a_wordpad"), "icon-mel-notes block") + "</div>";
        let pega = `<div role="listitem" class="col-${haveNextcloud.col}" title="${rcmail.gettext("mel_metapage.menu_create_help_survey")}">` + button(rcmail.gettext("mel_metapage.a_survey"), "icon-mel-sondage block", "m_mp_CreateOrOpenFrame('sondage', () => {$('.modal-close ').click();}, () => {$('.sondage-frame')[0].src=rcmail.env.sondage_create_sondage_url;})") + "</div>";
        html = '<section role="list"><div class="row">' + workspace + mail + reu + viso + tache + document + blocnote + pega + '</div></section>';
        let config = new GlobalModalConfig(rcmail.gettext("mel_metapage.what_do_you_want_create"), "default", html, '   ');
        create_popUp = new GlobalModal("globalModal", config, true);
    }
    else //Si elle existe, on l'affiche.
        window.create_popUp.show();
}

function m_mp_createworskpace_steps()
{
    return {
        init:()=>{
            const tmp = (img) =>
            {
                img = img.split(".");
                if (img.length > 1)
                    img[img.length-1] = "";
                img = img.join(".");
                img = img.slice(0, img.length-1);
                return img;
            };
            let html = "";
            if (rcmail.env.mel_metapage_workspace_logos.length > 0)
            {
                html += `<li role="menuitem"><a title="" class="" id="" role="button" href="#" onclick="m_mp_change_picture(null)"><img src="`+rcmail.env.mel_metapage_workspace_logos[0].path+`" class="menu-image invisible">Aucune image</a></li>`;
                for (let index = 0; index < rcmail.env.mel_metapage_workspace_logos.length; index++) {
                    const element = rcmail.env.mel_metapage_workspace_logos[index];
                    html += `<li role="menuitem"><a title="" class="" id="" role="button" href="#" onclick="m_mp_change_picture('`+element.path+`')"><img src="`+element.path+`" class=menu-image>`+tmp(element.name)+`</a></li>`;
                }
            }
            $("#ul-wsp").html(html);

            return "";
        },
        // step1:() => {
        //     let html = "<div class=row>";
        //     html += '<div class=col-2>';
        //     html += "Avatar<br/>"
        //     html += '<span id=tmpavatar></span>'
        //     html += "</div><div class=col-"+(enable_custom_uid ? "5" : "10")+">"
        //     html += "Titre<span class=red-star></span><br/>"
        //     html += '<input oninput="m_mp_input(this)" onchange="m_mp_input_change(this)" id=workspace-title class="form-control required" maxlength=40 placeholder="Titre de l\'espace"/>';
        //     html += '</div>';
        //     html += "<div class=col-5 "+(!enable_custom_uid ? 'style=display:none;' : "")+" >";
        //     html += "Id<span class=red-star></span><br/>"
        //     html += '<input maxlength=37 oninput="m_mp_input_uid_change(this)" id=workspace-uid class="form-control required" placeholder="Id unique de l\'espace"/>';
        //     html += "</div></div>";
        //     html += "<div class=row style=margin-top:5px><div class=col-12>";
        //     html += '<span style=margin-top:5px>Description</span><br/>'
        //     html += '<textarea id=workspace-desc class=form-control placeholder="Description de l\'espace"></textarea>';
        //     html += "</div></div>"
        //     html += "<div class=row style=margin-top:5px><div class=col-4>";
        //     html += '<span style=margin-top:5px>Date de fin</span><br/>'
        //     html += '<input class=form-control id=workspace-date-end type=datetime-local />';
        //     html += "</div><div class=col-5>";
        //     html += '<span style=margin-top:5px>Thématique</span><br/>'
        //     html += '<input class=form-control id=workspace-hashtag type=text placeholder="Thématique de l\'espace." />';
        //     html += "</div>"
        //     html += "<div class=col-3>";
        //     html += '<span class=red-star-after style=margin-top:5px>Couleur</span><br/>'
        //     html += '<input id="workspace-color" class=form-control type=color value='+MEL_ELASTIC_UI.getRandomColor()+" />"
        //     html += "</div>"
        //     html += "</div>";
        //     html += '<div class=row style=margin-top:5px><div class=col-12>';
        //     html += '<span class=red-star-after>Accès</span><br/>'
        //     html += '<div class="custom-control custom-radio">';
        //     html += '<input type="radio" checked id="workspace-private" name="customRadio" class="custom-control-input required">';
        //     html += '<label class="custom-control-label" for="workspace-private">Restreint</label>';
        //     html += '</div>';
        //     html += '<div class="custom-control custom-radio">'
        //     html += '<input type="radio" id="workspace-public" name="customRadio" class="custom-control-input required">';
        //     html += '<label class="custom-control-label" for="workspace-public">Public</label>';
        //     html += '</div></div></div>';
        //     html += '<div style=margin:15px></div>'
        //     html += '<button style="float:left;display:none;" class="btn btn-warning btn-workspace-left" onclick=m_mp_reinitialize_popup()>Retour</button><button onclick="m_mp_check_w(1,`workspace-step2`)" style=float:right; class="btn btn-primary btn-workspace-right">Suivant</button>';
        //     return html;
        // },
        // step2:() => {
        //     let html = "Participants<span class=red-star></span>";
        //     html += '<div class="input-group">';
		//     html += '<textarea name="_to_workspace" spellcheck="false" id="to-workspace" tabindex="-1" data-recipient-input="true" style="position: absolute; opacity: 0; left: -5000px; width: 10px;" autocomplete="off" aria-autocomplete="list" aria-expanded="false" role="combobox"></textarea>';
        //     html += '<ul id="wspf" class="form-control recipient-input ac-input rounded-left">'
        //                         /* <li class="recipient">
        //                             <span class="name">delphin.tommy@gmail.com</span>
        //                             <span class="email">,</span>
        //                             <a class="button icon remove"></a></li> */
        //     html += '<li class="input"><input id="workspace-user-list" onchange="m_mp_autocoplete(this)" oninput="m_mp_autocoplete(this)" type="text" tabindex="1" autocomplete="off" aria-autocomplete="list" aria-expanded="false" role="combobox"></li></ul>';
		// 	html += '<span class="input-group-append">';
		//     html += `<a href="#add-contact" onclick="m_mp_openTo()" class="input-group-text icon add recipient" title="Ajouter un contact" tabindex="1"><span class="inner">Ajouter un contact</span></a>`;
		// 	html +=	'			</span>';
		// 	html += '			</div>';
        //     html += '<div style=margin:15px></div>'
        //     html += '<button style="float:left" class="btn btn-warning btn-workspace-left" onclick=m_mp_switch_step(`workspace-step1`)>Retour</button><button onclick="m_mp_check_w(2, `workspace-step3`)" style=float:right; class="btn btn-primary btn-workspace-right">Suivant</button>';
        //     return html;
        // },
        step3:()=> {
            let html = "";
            html += `<span class="span-mel t1 first">Sélectionner les services à intégrer à l’espace de travail</span>`;
            html += "<div class=row>";
            const mel_metapage_templates_services = rcmail.env.mel_metapage_templates_services;
            for (let index = 0; index < mel_metapage_templates_services.length; ++index) {
                const element = mel_metapage_templates_services[index];
                html += "<div class=col-md-4>";
                html += '<button type=button data-type="'+element.type+'" class="doc-'+element.type+' btn-template-doc btn btn-block btn-secondary btn-mel" onclick="m_mp_UpdateWorkspace_type(this, `'+JSON.stringify(element).replace(/"/g, "¤¤¤")+'`)"><span style="display:block;margin-right:0px" class="'+m_mp_CreateDocumentIconContract(element.icon)+'"></span>'+ rcmail.gettext(element.name) +'</button>';
                html += "</div>"
            }
            html += "</div>";
            html += '<div style=margin:15px></div>'
            html += '<div class="row"><div class="col-12" style="text-align: center;"><span id="wspsse" style="color: red;display:none;"></span></div></div>'
            //html += '<button style="float:left" class="btn btn-warning btn-workspace-left" onclick=m_mp_switch_step(`workspace-step2`)>Retour</button><button onclick="m_mp_check_w(3, null)" style=float:right; class="btn btn-primary btn-workspace-right">Suivant</button>';
            html += '    <div style="margin-top: 30px;float: left;" class="mel-button invite-button create btn-workspace-left" onclick="m_mp_switch_step(`workspace-step2`)"><span>Retour</span><span class="icon-mel-undo  plus" style="margin-left: 15px;"></span></div>';
            html += '    <div style="margin-top: 30px;float: right;" class="mel-button invite-button create btn-workspace-right" onclick="m_mp_check_w(3, null)"><span>Continuer</span><span class="icon-mel-arrow-right  plus" style="margin-left: 15px;"></span></div>';
            return html;
        }
    }
}

function m_mp_input_change(event)
{
    if ($("#workspace-uid").data("edited") || !enable_custom_uid)
        return;
    if ($(".btn-workspace-right").find("span").length === 0)
        $(".btn-workspace-right").html("<span>"+$(".btn-workspace-right").html()+"</span>");
    const tmp_html = $(".btn-workspace-right").find("span").html();
    $(".btn-workspace-right").addClass("disabled").find("span").addClass("spinner-border").html("");
    $.ajax({ // fonction permettant de faire de l'ajax
    type: "POST", // methode de transmission des données au fichier php
    data: {
        "_title":event.value,
    },
    url: "/?_task=workspace&_action=get_uid",
    success: function (ariane) {
        //console.log("uid", ariane);
        $("#workspace-uid").val(ariane);
    },
    error: function (xhr, ajaxOptions, thrownError) { // Add these parameters to display the required response
        console.error(xhr, ajaxOptions, thrownError);
    },
    }).always(() => {
        $(".btn-workspace-right").removeClass("disabled").find("span").removeClass("spinner-border").html(tmp_html);
    });
}

function m_mp_input_uid_change(params) {
    if (params.value === "")
    {
        $(params).data("edited", false);
        m_mp_input_change($("#workspace-title")[0]);
    }
    else
        $(params).data("edited", true);
}

function m_mp_createworkspace()
{


    let html = "";
    const object = m_mp_createworskpace_steps();
    for (const key in object) {
        if (Object.hasOwnProperty.call(object, key)) {
            const element = object[key];
            if (key === "init")
                html += element();
            else
                continue;//html += '<div style="display:none;" class=step id="workspace-' + key + '">' + element() + "</div>";
        }
    }
    create_popUp.contents.html('<center><span class="spinner-border"></span></center>');
    mel_metapage.Functions.get(mel_metapage.Functions.url("mel_metapage", "get_create_workspace"),{}, 
    (datas) => {
        create_popUp.contents.html(html + datas + `<div style=display:none class=step id=workspace-step3>${object.step3()}</div>`);
        if ($("#tmpavatar").find("a").length === 0)
        $("#worspace-avatar-a").css("display", "").appendTo($("#tmpavatar"));
    m_mp_switch_step("workspace-step1");
    rcmail.init_address_input_events($("#workspace-user-list"));
    $(".global-modal-body").css("height", `${window.innerHeight - 200}px`).css("overflow-y", "auto").css("overflow-x", "hidden");
        setTimeout(() => {
            $('#workspace-color').val(MEL_ELASTIC_UI.getRandomColor()); 
            $("#workspace-date-end").datetimepicker({
                format: 'd/m/Y H:i'});
            MEL_ELASTIC_UI.redStars();
        }, 10);
});

    //create_popUp.contents.html(html);
    //create_popUp.editTitle();
    create_popUp.editTitleAndSetBeforeTitle('<a title="Retour" href="#" class="icon-mel-undo mel-return mel-focus focus-text mel-not-link" onclick="m_mp_reinitialize_popup(() => {$(`#worspace-avatar-a`).css(`display`, `none`).appendTo($(`#layout`));})"><span class=sr-only>Retour à la modale de création</span></a>',
    'Création d\'un espace de travail');
    // $.ajax({ // fonction permettant de faire de l'ajax
    //     type: "GET", // methode de transmission des données au fichier php
    //     url: "/?_task=discussion&_action=chanel_create",
    //     success: function (data) {
    //         console.log("yeay", data);
    //     },
    //     error: function (xhr, ajaxOptions, thrownError) { // Add these parameters to display the required response
    //         console.error(xhr, ajaxOptions, thrownError);
    //     },
    // });//}); 
}

function m_mp_change_picture(img)
{
    //console.log(img, $("#worspace-avatar-a"));
    if (img === null)
    {
        $("#worspace-avatar-a").html("");
        m_mp_input($("#workspace-title")[0]);
    }
    else
        $("#worspace-avatar-a").html(`<img alt="${Enumerable.from(img.replace(".png", "").replace(".PNG", "").split("/")).last()}" src="${img}" /><p class="sr-only"> - Changer d'avatar</p>`);
}

function m_mp_input(element)
{
    //a.slice(0,8)
    if ($("#worspace-avatar-a").find("img").length === 0)
        $("#worspace-avatar-a").html("<span>"+ element.value.slice(0,3).toUpperCase() + "</span>");
}

async function m_mp_check_w(step, next)
{
    let stop = false;
    switch (step) {
        case 1:
            if ($("#workspace-title").val() === "")
            {
                $("#workspace-title").css("border-color", "red");
                if ($("#wspte").length === 0)
                    $("#workspace-title").parent().append('<span id=wspte class=input-error-r style=color:red></span>');
                $("#wspte").html("* L'espace de travail doit avoir un titre !");
                $("#wspte").css("display", "");
                stop = true;
            } 
            else
            {
                $("#wspte").css("display", "none");
                $("#workspace-title").css("border-color", "");
            }
            if ($("#workspace-private")[0].checked === false && $("#workspace-public")[0].checked === false)
            {
                $("#workspace-private").parent().css("color", "red");
                $("#workspace-public").parent().css("color", "red");
                if ($("#wspae").length === 0)
                    $("#workspace-private").parent().parent().append('<span id=wspae class=input-error-r style=color:red></span>');
                $("#wspae").html("* L'espace de travail doit avoir un accès de défini !");
                $("#wspae").css("display", "");
                stop = true;
            }
            else {
                $("#wspae").css("display", "none");
                $("#workspace-private").parent().css("color", "");
                $("#workspace-public").parent().css("color", "");
            }
            if (enable_custom_uid)
            {
                if ($(".btn-workspace-right").find("span").length === 0)
                $(".btn-workspace-right").html("<span>"+$(".btn-workspace-right").html()+"</span>");
                const tmp_html = $(".btn-workspace-right").find("span").html();
                $(".btn-workspace-right").addClass("disabled").find("span").addClass("spinner-border").html("");
                await $.ajax({ // fonction permettant de faire de l'ajax
                type: "POST", // methode de transmission des données au fichier php
                data: {
                    "_uid":$("#workspace-uid").val(),
                },
                url: "/?_task=workspace&_action=check_uid",
                success: function (ariane) {
                    if (ariane !== "uid_ok")
                    {
                        stop = true;
                        $("#workspace-uid").css("border-color", "red");
                        if ($("#wsptuid").length === 0)
                            $("#workspace-uid").parent().append('<span id=wsptuid class=input-error-r style=color:red></span>');
                        if (ariane === "uid_exists")
                            $("#wsptuid").html("* L'id existe déjà !");
                        else if (ariane === "uid_not_ok")
                            $("#wsptuid").html("* L'id n'est pas valide !");
                        else if (ariane === "ui_empty")
                            $("#wsptuid").html("* L'id ne doit pas être vide !");
                        else
                            $("#wsptuid").html("* Erreur inconnue !");
                        $("#wsptuid").css("display", "");
                    }
                    else
                        $("#wsptuid").css("display", "none");
                },
                error: function (xhr, ajaxOptions, thrownError) { // Add these parameters to display the required response
                    console.error(xhr, ajaxOptions, thrownError);
                },
                }).always(() => {
                    $("#workspace-uid").css("border-color", "");
                    $(".btn-workspace-right").removeClass("disabled").find("span").removeClass("spinner-border").html(tmp_html);
                });
            }

            break;
        case 2:
            // if ($("#wspf").children().length === 1  && $("#workspace-user-list").val() === "")
            // {
            //     $("#wspf").css("border-color", "red");
            //     if ($("#wspfe").length === 0)   
            //         $("#wspf").parent().parent().append('<span id=wspfe class=input-error-r style=color:red></span>');
            //     $("#wspfe").html("* Il faut avoir au moins un participant !")
            //     $("#wspfe").css("display", "");
            //     stop = true;
            // }
            // else
            // {
            //     $("#wspf").css("border-color", "");
            //     $("#wspfe").css("display", "none");
            //     if($("#workspace-user-list").val() !== "")
            //     {
            //         $("#workspace-user-list").val($("#workspace-user-list").val() + ",");
            //         console.log("auto", $("#workspace-user-list"), $("#workspace-user-list").val());
            //         m_mp_autocoplete($("#workspace-user-list"));
            //     }
            // }
            let users = [];
            $("#wspf .workspace-recipient").each((i,e) => {
                users.push($(e).find(".email").html());
            });
            let input = $("#workspace-user-list");
            if (input.val().length > 0)
                users.push(input.val());
            if (users.length > 0)
            {
                if (confirm("Ajouter les utilisateurs qui n'ont pas été ajouter ?"))
                {
                    await m_mp_add_users();
                }
                else
                    stop = true;
            }
            break;
        case 3:
            //wspsse
            // if ($(".btn-template-doc.active").length === 0)
            //     $("#wspsse").css("display", "").html("* Il vous faut au moins un service !");
            // else
            //     $("#wspsse").css("display", "none")
            break;
        default:
            break;
    }

    if (!stop)
    {
        if (next !== null)
            m_mp_switch_step(next);
        else
            m_mp_CreateWorkSpace()
    }
}

function m_mp_CreateWorkSpace()
{
    /* 
                    rcmail.set_busy(false);
                rcmail.clear_messages();
    */
    rcmail.set_busy(true);
    rcmail.display_message("Création d'un espace de travail...", "loading");
    let datas = {
        avatar:($("#worspace-avatar-a").find("img").length === 0 ? false : $("#worspace-avatar-a").find("img")[0].src.replace(window.location.origin, "")),
        title:$("#workspace-title").val(),
        desc:$("#workspace-desc").val(),
        end_date:$("#workspace-date-end").val(),
        hashtag:$("#workspace-hashtag").val(),
        visibility:$("#workspace-private")[0].checked ? "private" : "public",
        custom_uid: enable_custom_uid ? $("#workspace-uid").val() : "",
        color:$("#workspace-color").val(),
        users:[],
        services:[]
    };

    $("#mm-cw-participants").find(".workspace-users-added").each((i,e) => {
        datas.users.push($(e).find(".email").html());
    });
    $(".btn-template-doc.active").each((i,e) => {
        datas.services.push($(e).data("type"));
    });
    $(`#worspace-avatar-a`).css(`display`, `none`).appendTo($(`#layout`));
    create_popUp.contents.html('<span class=spinner-border></span>');
    create_popUp.editTitle('<h2 class=""><span>Chargement...</span></h2>');
    $.ajax({ // fonction permettant de faire de l'ajax
        type: "POST", // methode de transmission des données au fichier php
        data: datas,
        url: mel_metapage.Functions.url("workspace", "create"),//"/?_task=workspace&_action=create",
        success: function (data) {
            data = JSON.parse(data);

            rcmail.set_busy(false);
            rcmail.clear_messages();

            for (let it = 0; it < data.errored_user.length; it++) {
                const element = data.errored_user[it];
                rcmail.display_message("impossible d'ajouter " + element + " à l'espace de travail !");
            }


            const action = {
                func:mel_metapage.Functions.call,
                args:[true, {
                    _uid:data.workspace_uid,
                   _integrated:true 
                }],
                url:mel_metapage.Functions.url("workspace", "workspace", {
                    "_uid":data.workspace_uid
                })
            };

            window.create_popUp.close();
            delete window.create_popUp;

            if ($(".workspace-frame").length > 0 && $("iframe.workspace-frame").length === 0)
                window.location.href = action.url;
            else if ($("iframe.workspace-frame").length === 0)
            {
                mel_metapage.Functions.change_frame("wsp", true, true, {
                    _action:"workspace",
                    _uid:data.workspace_uid,

                });
            }
            else if ($("iframe.workspace-frame").length === 1) {
                mel_metapage.Functions.change_frame("wsp", true, true).then(() => {
                    let config = {
                        "_uid":data.workspace_uid
                    };
                    config[rcmail.env.mel_metapage_const.key] = rcmail.env.mel_metapage_const.value;

                    $("iframe.workspace-frame")[0].src = mel_metapage.Functions.url("workspace", "workspace", config);
                });
            }
            else
                window.location.href = action.url;

            // if ($(".bureau-frame").length > 0)
            // {
            //     mel_metapage.Functions.call("update_workspaces", true, {
            //         _uid:workspace_uid,
            //         _integrated:true 
            //     });
            // }

            // new Promise(async (i, e) => {
            //     let finished_max = 1;
            //     let finished = 0;
            //     let itemsToSave = {};
            //     data.uncreated_services = Enumerable.from(data.uncreated_services).select( x => x.value).toArray();
            //     for (let index = 0; index < data.uncreated_services.length; index++) {
            //         const element = data.uncreated_services[index];
            //         switch (element) {
            //             case "channel":
            //                 $.ajax({ // fonction permettant de faire de l'ajax
            //                     type: "POST", // methode de transmission des données au fichier php
            //                     data: {
            //                         "_roomname":data.workspace_uid,
            //                         "_public":(datas.visibility === "public" ? true:false),
            //                         "_users":data.existing_users
            //                     },
            //                     url: "/?_task=discussion&_action=create_chanel",
            //                     success: function (ariane) {
            //                         console.log("datas2", ariane);
            //                         console.log("datas2", JSON.parse(ariane));
            //                         ariane = JSON.parse(ariane);
            //                         ariane.content = JSON.parse(ariane.content);
            //                         console.log("all datas", ariane, data, datas);
            //                         itemsToSave["ariane"] = {
            //                             id:ariane.content.channel._id,
            //                             name:ariane.content.channel.name
            //                         };
            //                         ++finished;
            //                     },
            //                     error: function (xhr, ajaxOptions, thrownError) { // Add these parameters to display the required response
            //                         console.error(xhr, ajaxOptions, thrownError);
            //                         ++finished;
            //                     },
            //                 });
            //                 break;
                    
            //             default:
            //                 break;
            //         }
            //     }

            //     await wait(() => { return finished !== finished_max;});
            //     $.ajax({ // fonction permettant de faire de l'ajax
            //         type: "POST", // methode de transmission des données au fichier php
            //         data: {
            //             "_uid":data.workspace_uid,
            //             "_items":itemsToSave
            //         },
            //         url: "/?_task=workspace&_action=save_objects",
            //         success: function (savedStates) {
            //             savedStates = JSON.parse(savedStates);
            //             console.log("savedStates", savedStates);
            //             rcmail.set_busy(false);
            //             rcmail.clear_messages();
            //             rcmail.display_message("Espace de travail créer avec succès !", "confirmation")
            //         },
            //         error: function (xhr, ajaxOptions, thrownError) { // Add these parameters to display the required response
            //             console.error(xhr, ajaxOptions, thrownError);
            //             rcmail.display_message("Error lors de la création d'un espace de travail !", "error");

            //         },
            //     }).always(() => {
            //         //Solution temporaire
            //         window.location.reload();
            //     });

                

            // }).always(() => {
            //     window.create_popUp.close();
            //     window.create_popUp = undefined;
            // });
            //rcmail.clear_messages();
            // rcmail.display_message("Création d'un canal de discussion...", "loading");
            // $.ajax({ // fonction permettant de faire de l'ajax
            //     type: "POST", // methode de transmission des données au fichier php
            //     data: datas,
            //     url: "/?_task=discussion&_action=create_chanel",
            //     success: function (data) {
            //         console.log("datas2", data);
            //         rcmail.clear_messages();
            //     },
            //     error: function (xhr, ajaxOptions, thrownError) { // Add these parameters to display the required response
            //         console.error(xhr, ajaxOptions, thrownError);
            //     },
            // });
        },
        error: function (xhr, ajaxOptions, thrownError) { // Add these parameters to display the required response
            console.error(xhr, ajaxOptions, thrownError);
            rcmail.clear_messages();
            rcmail.display_message(xhr, "error")
            window.create_popUp.close();
            window.create_popUp = undefined;
        },
    });
    
}

function m_mp_UpdateWorkspace_type(event, element)
{
    //console.log("m_mp_UpdateWorkspace_type", event, element);
    event = $(event);
    //console.log(event, event.hasClass("active"));
    if (event.hasClass("active"))
        event.removeClass("active");
    else 
        event.addClass("active");
    document.activeElement.blur();
}

function m_mp_affiche_hashtag_if_exists()
{
    let querry = $("#list-of-all-hashtag");
    if (querry.find("button").length > 0)
        querry.css("display", "");
}

async function m_mp_get_all_hashtag()
{
    const val = $("#workspace-hashtag").val();
    if (val.length > 0)
    {
        let querry = $("#list-of-all-hashtag").css("display", "");
        querry.html("<center><span class=spinner-border></span></center>");

        await mel_metapage.Functions.get(
            mel_metapage.Functions.url("workspace", "hashtag"), {
                _hashtag:val
            },(datas) => {
                try {
                    datas = JSON.parse(datas);
                    if (datas.length > 0)
                    {
                        html = "<div class=btn-group-vertical style=width:100%>";
                        
                        for (let index = 0; index < datas.length; ++index) {
                            const element = datas[index];
                            html += `<button onclick=m_mp_hashtag_select(this) class="btn-block metapage-wsp-button btn btn-primary"><span class=icon-mel-pin style=margin-right:15px></span><text>${element}</text></button>`;
                        }

                        html += "</div>";
                        querry.html(html);
                    }
                    else
                        querry.html(`La thématique "${val}" n'existe pas.</br>Elle sera créée lors de la création de l'espace de travail.`);
                    
                } catch (error) {
                    
                }
            }
        );
    }
    else
        $("#list-of-all-hashtag").css("display", "none");

    if (!mel_metapage.Functions.handlerExist($("body"), m_mp_hashtag_on_click))
        $("body").click(m_mp_hashtag_on_click);
}

function m_mp_hashtag_select(e)
{
    $("#workspace-hashtag").val($(e).find("text").html());
    $("#list-of-all-hashtag").css("display", "none");
}

function m_mp_hashtag_on_click(event)
{
    const id = "list-of-all-hashtag";
    querry = $("#list-of-all-hashtag");
    if (querry.css("display") !== "none" && querry.find(".spinner-border").length === 0)
    {
        let target = event.target;
        while (target.nodeName !== "BODY") {
            if (target.id === id || target.id === "workspace-hashtag")
                return;
            else
                target = target.parentElement;
        }
        querry.css("display", "none");
    }
}

function m_mp_autocoplete(element)
{
    // element = element.val === undefined ? $("#" + element.id) : $("#"+element[0].id);
    // const val = element.val();
    // if (val.length > 0)
    // {
    //     mel_metapage.Functions.post(
    //         mel_metapage.Functions.url("mel_metapage", "check_users"),
    //         {
    //             _users:val.split(",")
    //         },
    //         (datas) => {
    //             console.log("m_mp_autocoplete", datas);
    //         }
    //     );
    // }

    //<span class="name">delphin.tommy@gmail.com</span>
   element = element.val === undefined ? ("#" + element.id) : ("#"+element[0].id);
   //console.log("auto", element, $(element));
   let val = $(element).val();
   if (val.includes(',')) 
   {
       val = val.replace(",", "");
       let html = '<li class="recipient workspace-recipient">';
       if (val.includes("<") && val.includes(">"))
       {
           let _enum = Enumerable.from(val);
           let index1 = val.indexOf("<");
           let index2 = val.indexOf(">");
           //console.log(val, _enum);
           //.where((x, i) => i > index2).toArray().splice(1).join("").replace(",", "")
           html += '<span class="email">'+_enum.where((x, i) => index1<i && i < index2).toArray().join("")+'</span>';//.join("")
           html += '<span class="name">'+_enum.where((x, i) => i < index1).toArray().splice(1).join("").replace(",", "")+'</span>';

        }
        else {
            html += '<span class="name">'+val+'</span>';
            html += '<span class="email">'+val+'</span>'
        }
        html += '<a class="button icon remove" onclick=m_mp_remove_li(this)></a>';
    html += "</li>";
    $("#wspf").append(html);
    $(element).val("");
    //console.log("html", $($("#wspf").children()[$("#wspf").children().length-1])[0].outerHTML,     $(element).parent()[0].outerHTML);
    html = $(element).parent()[0].outerHTML;
    $(element).parent().remove();
    $("#wspf").append(html);
    rcmail.init_address_input_events($(element));
    $(element).focus();
   }
}

function m_mp_add_users()
{
    let users = [];
    $("#wspf .workspace-recipient").each((i,e) => {
        users.push($(e).find(".email").html());
    });
    let input = $("#workspace-user-list");
    if (input.val().length > 0)
        users.push(input.val());
    input.val("");
    $("#wspf .workspace-recipient").each((i,e) => {
        $(e).remove();
    });
    if (users.length > 0)
    {
        $("#mm-wsp-loading").css("display", "");
        return mel_metapage.Functions.post(
            mel_metapage.Functions.url("mel_metapage", "check_users"),
            {
                _users:users
            },
            (datas) => {
                datas = JSON.parse(datas);
                let html;
                let querry = $("#mm-cw-participants").css("height", `${window.innerHeight - 442}`);
                for (let index = 0; index < datas.added.length; ++index) {
                    const element = datas.added[index];
                    html = "";
                    html += "<div class=row style=margin-top:15px>";
                    html += '<div class="col-2">';
                    html += `<div class="dwp-round" style="background-color:transparent"><img src="${rcmail.env.rocket_chat_url}avatar/${element.uid}" /></div>`;
                    html += "</div>";
                    html += '<div class="col-10 workspace-users-added">';
                    html += `<span class="name">${element.name}</span><br/>`;
                    html += `<span class="email">${element.email}</span>`;
                    html += `<span onclick=m_mp_remove_user(this) class="mel-return" style="float:right;margin-top:-10px;display:block;">Retirer <span class=icon-mel-minus></span></span>`;
                    html += "</div>";
                    html += "</div>";
                    querry.append(html);
                }
                for (let it = 0; it < datas.unexist.length; it++) {
                    const element = datas.unexist[it];
                    rcmail.display_message("impossible d'ajouter " + element + " à l'espace de travail !");
                }
            }
        ).always(() => {
            $("#mm-wsp-loading").css("display", "none");
        });
    }
    else
        return new Promise((a, b) => {});
}

function m_mp_remove_user(e)
{
    $(e).parent().parent().remove();
}

function m_mp_remove_li(event)
{
    $(event).parent().remove();
    $("#workspace-user-list").focus();
}

function m_mp_openTo()
{
    UI.recipient_selector('to');
    $(".popup.ui-dialog-content").css("max-height", (window.innerHeight-120) + "px")
    .parent().css("top", "60px");
    
}

function m_mp_reinitialize_popup(funcBefore = null, funcAfter = null)
{
    if (funcBefore !== null)
        funcBefore();
    if (window.create_popUp !== undefined)
        window.create_popUp.removeBeforeTitle()
    delete window.create_popUp;// = undefined;
    $(".global-modal-body").css("height", "");
    m_mp_Create();
    if (funcAfter !== null)
        funcAfter();
}

function m_mp_switch_step(id)
{
    $(".step").css("display", "none");
    $("#" + id).css("display", "");
}

/**
 * Ouvre la fenêtre d'aide.
 */
function m_mp_Help()
{
    FullscreenItem.close_if_exist();
    
    rcmail.mel_metapage_url_info = m_mp_DecodeUrl();
    rcmail.command("help_open_dialog");

    setTimeout(async () => {
        let it = 0;

        await wait(() => 
        {
            return $(".ui-widget-overlay.ui-front").length === 0 && it++ < 5; // ~2,5s
        });

        if ($(".ui-widget-overlay.ui-front").length > 0)
        {
            $(".ui-widget-overlay.ui-front").on("click", () => {
                $(".ui-dialog-titlebar-close ").click();
            });
        }
    }, 10);
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
    create_popUp.editTitleAndSetBeforeTitle('<a title="Retour" href=# class="icon-mel-undo mel-return mel-focus focus-text mel-not-link" onclick="m_mp_reinitialize_popup(() => {})"><span class=sr-only>Retour à la modale de création</span></a>','Création d\'un nouveau document');
    create_popUp.contents.html('<center><span class="spinner-border"></span></center>');

    let url_config ={
        "_send":true
    };
    url_config[rcmail.env.mel_metapage_const.key] = rcmail.env.mel_metapage_const.value;

    $(`<iframe style="display:none;width:100%;height:100%" src="${mel_metapage.Functions.url("roundrive", "files_create", 
    )}"></iframe>`).on("load", () => {
        create_popUp.contents.find(".spinner-border").parent().remove();
        create_popUp.contents.find("iframe").css("display", "");
        $(".global-modal-body").css("height", `${window.innerHeight - 200}px`).css("overflow-y", "auto").css("overflow-x", "hidden");
    }).appendTo(create_popUp.contents);
    // mel_metapage.Functions.get(
    //     mel_metapage.Functions.url("roundrive", "files_create"),
    //     {
    //         _send:false
    //     },(datas) => {
    //         create_popUp.contents.html(datas);
    //     }
    // )

    return;
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
    //console.log("vall", val, href,$("#" + mel_metapage.Ids.create.doc_input_path).val());
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
        //console.log(doc, "doc");
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

    querry.contents().find(".button.new")[0].click();

    querry.contents().find(".menuitem").each((i,e) => {
        if (e.dataset.filetype !== undefined && e.dataset.filetype === "file")
           e.click();
    });
    rcmail.set_busy(true, "loading");
    while (!Enumerable.from(querry.contents().find("input")).select(x => x.id).where(x => x.includes("input-file")).any()) {
        await delay(500);
    }

    let id = Enumerable.from(querry.contents().find("input")).select(x => x.id).where(x => x.includes("input-file")).first();
    querry.contents().find("#" + id).val(val+ (val.includes(".") ? "" : ".txt"));
    await delay(500);
    rcmail.set_busy(true, "loading");
    if (!Enumerable.from(querry.contents().find("div")).where(x => Enumerable.from(x.classList).where(s => s.includes("tooltip").any()) && x.innerHTML.includes(val) && $(x).parent().hasClass("tooltip")  ).any())
        querry.contents().find("#" + id).parent().find(".icon-confirm").click();
    //window.querry = querry;

    let it = 2;
    let bool = false;
    let tmpval = val;
    while (!Enumerable.from(querry.contents().find("input")).where(x => x.attributes.type !== undefined && x.attributes.type.value === "submit" && x.classList.contains("primary")).any()) {
        await delay(500);
        if (Enumerable.from(querry.contents().find("div")).where(x => Enumerable.from(x.classList).where(s => s.includes("tooltip").any()) && x.innerHTML.includes(val) && $(x).parent().hasClass("tooltip")  ).any())
        {

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
    Enumerable.from(querry.contents().find("input")).where(x => x.attributes.type !== undefined && x.attributes.type.value === "submit" && x.classList.contains("primary")).first().click();

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

        new Promise(async (a, b) => {
            await m_mp_CreateDocCurrent(val, false);
        });
    }, false);
}

function m_mp_DecodeUrl()
{
    let url;// = $("#" + rcmail.env.current_frame)[0].contentDocument.location.href;
    if (rcmail.env.current_frame === undefined || rcmail.env.current_frame == "default" || rcmail.env.current_frame_name === "discussion")
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
    // console.log("url decode", {
    //     task:task,
    //     action:action
    // });
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
async function m_mp_CreateOrOpenFrame(frameClasse, funcBefore, func = () => {}, changepage = true){
    if (funcBefore !== null)
        funcBefore();

    //mm_st_CreateOrOpenModal(frameClasse, changepage);
    await mel_metapage.Functions.change_frame(frameClasse, changepage, true);

    if (func !== null)
        func();
    // new Promise(async (a,b) => {
    //     while (parent.rcmail.env.frame_created === false) {
    //         await delay(1000);
    //     }
    //     if (func !== null)
    //         func();
    // });
}

/**
 * Action de créer un évènement.
 */
function m_mp_CreateEvent(_action = null)
{
    if (window.create_popUp !== undefined)
        window.create_popUp.close();
    const action = _action === null ? () => {
        m_mp_set_storage("calendar_create");
    } : _action;
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
    let category = rcmail.local_storage_get_item("calendar_category");
    if(event !== null)
    {
        config = {};
        if (category != null)
            config["categories"] = ["ws#apitech-1"];
        
        if (event === true)
            parent.child_cal.add_event(config)
        rcmail.local_storage_remove_item("calendar_create");
        rcmail.local_storage_remove_item("calendar_category");
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
    if (close && window.create_popUp !== undefined)
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

async function m_mp_shortcuts()
{
    if (window.shortcuts === undefined)
    {
        const tab_tasks = {
            left:"",
            right:"Toute les tâches"
        };
        const config = {
            add_day_navigation:true,
            add_create:true,
            add_see_all:true
        };
        let shortcuts = new FullscreenItem("body", true);
        shortcuts.generate_flex();
        html = "<div class=mm-shortcuts>";
        html += html_helper(html_helper.options.block, await html_helper.TasksAsync(tab_tasks, null, null, "Toutes mes tâches"), "shortcut-task");
        html += html_helper(html_helper.options.block, await html_helper.CalendarsAsync(config), "shortcut-task shorcut-calendar");
        html += "</div>";
        shortcuts.add_app("items", html);
        window.shortcuts = shortcuts;
    }
    else
    {
        if (window.shortcuts.is_open)
            window.shortcuts.close();
        else
            window.shortcuts.open();
    }
}

function mm_create_calendar(e, existingEvent = null)
{
    if (window.create_popUp !== undefined)
    {
        //window.create_popUp.close();
        window.create_popUp = undefined;
    }

    let event;

    if (existingEvent === null || existingEvent === undefined)
        event = {
            // categories:["ws#" + id],
            // calendar_blocked:true,
            start:moment(),
            end:moment().add(1, "h"),
            from:"barup"
        }
    else
    {
        event = existingEvent;
        event.completeEvent = true;
    }

    rcmail.local_storage_set_item("tmp_calendar_event", event);
    return rcmail.commands['add-event-from-shortcut'] ? rcmail.command('add-event-from-shortcut', '', e.target, e) : rcmail.command('addevent', '', e.target, e);
    // m_mp_CreateOrOpenFrame(`calendar`, 
    // () => {
    //     m_mp_CreateEvent();
    //     m_mp_CreateEvent(() => {
    //         m_mp_set_storage("calendar_category", "ws#" + id, false);
    //     })
    // }
    // , m_mp_CreateEvent_inpage)
}

function m_mp_NewTask()
{
    let func = () => {

        if (rcmail._events["pamella.tasks.afterinit"] !== undefined)
            rcmail.triggerEvent("pamella.tasks.afterinit", undefined);

    };

    mel_metapage.Functions.call(func, true);
}