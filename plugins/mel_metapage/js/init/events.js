
function MetapageEventKey(key)
{
    return {
        key:key,
        trigger:function ()
        {
            if (rcmail)
                rcmail.triggerEvent(this.key);
            else
                console.warn("/!\\[MetapageEventKey::trigger]rcmail n'est pas défini !");
        }
    }
}


const event_keys = {
    init:{
        chat_button:MetapageEventKey("event.init.chat_button"),
    }
};


if (rcmail && window.mel_metapage)
{

    //Initialise le bouton de chat
    rcmail.addEventListener(event_keys.init.chat_button.key, () => {
        if (rcmail.env.last_frame_class !== undefined && parent === window)
        {
            let eClass = mm_st_ClassContract(rcmail.env.last_frame_class);
            let btn = ArianeButton.default();

            if (rcmail.env.mel_metapage_ariane_button_config[eClass] !== undefined)
            {
                if (rcmail.env.mel_metapage_ariane_button_config[eClass].hidden === true)
                    btn.hide_button();
                else {
                    btn.show_button();
                    btn.place_button(rcmail.env.mel_metapage_ariane_button_config[eClass].bottom, rcmail.env.mel_metapage_ariane_button_config[eClass].right);
                }
            }
            else {
                btn.show_button();
                btn.place_button(rcmail.env.mel_metapage_ariane_button_config["all"].bottom, rcmail.env.mel_metapage_ariane_button_config["all"].right);
            }
        }
    });

    rcmail.addEventListener("calendar.dismiss.after", (props) => {   
        let navigator = window;

        if (parent.rcmail.mel_metapage_fn !== undefined && parent.rcmail.mel_metapage_fn.calendar_updated !== undefined)
            navigator = parent;
        else if (top.rcmail.mel_metapage_fn !== undefined && top.rcmail.mel_metapage_fn.calendar_updated !== undefined)
            navigator = top;
        
        navigator.rcmail.triggerEvent(mel_metapage.EventListeners.calendar_updated.get);
    });

    //Après la mise à jours du calendrier
    rcmail.addEventListener(mel_metapage.EventListeners.calendar_updated.after, () => {
        if (window.alarm_managment !== undefined)
        {
            window.alarm_managment.clearTimeouts();
            const storage = mel_metapage.Storage.get(mel_metapage.Storage.calendar);
            if (storage !== null && storage !== undefined)
                window.alarm_managment.generate(storage);
        }
    });

    rcmail.addEventListener("mel_update", (args) => {

        if (args.type !== undefined)
        {
            let type = args.type;

            switch (type) {
                case "agendas":
                    type = "calendar";
                    break;
                case "contacts":
                    type = "addressbook";
                    break;
                case "tasks":
                    type = "tasks";
                    break;
                default:
                    type = null;
                    break;
            }

            if (type !== null)
                mel_metapage.Functions.update_frame(type);

        }

    });

    //Calencdrier initialisé
    rcmail.addEventListener("plugin.calendar.initialized", (cal) => {


        if (cal && rcmail.env.task === "mail")
        {
            cal.create_from_mail = function (uid) {
                if (!uid && !(uid = rcmail.get_single_uid())) {
                    return;
                  }

                  const event = {
                    mail_datas:{
                        mbox:rcmail.env.mailbox,
                        uid:uid
                    }
                  };

                    this.create_event_from_somewhere(event);
            }
            rcmail.register_command('calendar-create-from-mail', function() { cal.create_from_mail(); }, true);
        }

    });

    //Action à faire après certains actions des mails.
    rcmail.addEventListener('responsebefore', function(props) {
        if (props.response && (/*props.response.action == 'mark' ||*/ props.response.action=='getunread')) {
            parent.rcmail.triggerEvent(mel_metapage.EventListeners.mails_updated.get);
        }
    });

    rcmail.addEventListener('set_unread', function(props) {
        // //if (props.response && (props.response.action == 'mark' || props.response.action=='getunread')) {
         if (props.mbox === "INBOX")
         {
            parent.rcmail.triggerEvent(mel_metapage.EventListeners.mails_updated.get, {
                new_count:props.count
            });
         }
    });

    
    rcmail.addEventListener('calendar-delete-all', function() {
        mel_metapage.Storage.remove(mel_metapage.Storage.calendar);
        mel_metapage.Storage.remove(mel_metapage.Storage.last_calendar_update);
    });

    //Initialisation
    rcmail.addEventListener("init", () => {
        $('[data-popup]').each((i,e) => {
            $(e).on("show.bs.popover", () => {
                $(e).attr("aria-expanded", "true");
            })
            .on("hide.bs.popover", () => {
                $(e).attr("aria-expanded", "false");
            })
        });

        if (rcmail.env.task === "settings")
        {
            if (rcmail.env.mel_metapage_mail_configs["mel-chat-placement"] !== parent.parent.rcmail.env.mel_metapage_mail_configs["mel-chat-placement"])
            {
                parent.parent.rcmail.env.mel_metapage_mail_configs["mel-chat-placement"] = rcmail.env.mel_metapage_mail_configs["mel-chat-placement"];
                if (rcmail.env.mel_metapage_mail_configs["mel-chat-placement"] === rcmail.gettext("up", "mel_metapage"))
                    parent.parent.rcmail.command("chat.setupConfig");
                else
                    parent.parent.rcmail.command("chat.reinit");
            }
        }

        //tasklistsearch

        let initSearches = (selector) => {
            $(selector).on("focus", () => {//.mel-animated
                let $parent = $(selector).parent().parent();
    
                if (!$parent.hasClass("mel-animated"))
                    $parent.addClass("mel-animated");
                    
                $parent.addClass("mel-focus focused");
            }).on("focusout", () => {
                $(selector).parent().parent().removeClass("focused").removeClass("mel-focus");
            });

            return initSearches;
        };

        initSearches('#searchform')('#tasklistsearch');


    })

    //Lorsqu'il y a un redimentionnement.
    rcmail.addEventListener("skin-resize", (datas)    => { 

        if ($("html").hasClass("framed"))
            return;

        if ($("html").hasClass("touch") && $("html").hasClass("layout-normal"))
        {
            $("#barup-buttons").removeClass("col-6").addClass("col-3");
            $("#barup-search-col").removeClass("col-3").addClass("col-6").removeClass("col-7");
            $("#barup-search-col .col-12").removeClass("col-12").addClass("col-7");
        }
        else {
            if ($("html").hasClass("touch") && rcmail.env.mel_metapage_mail_configs !== undefined && rcmail.env.mel_metapage_mail_configs !== null && rcmail.env.mel_metapage_mail_configs["mel-chat-placement"] === rcmail.gettext("up", "mel_metapage"))
            {
                $("#barup-search-col .col-7").removeClass("col-7").addClass("col-12");
                $("#barup-buttons").removeClass("col-6").addClass("col-3");
                $("#barup-search-col").removeClass("col-3").addClass("col-7");

            }
            else if ($("html").hasClass("touch"))
            {
                $("#barup-search-col .col-7").removeClass("col-7").addClass("col-12");
                $("#barup-buttons").removeClass("col-6").addClass("col-3");
                $("#barup-search-col").removeClass("col-3").addClass("col-7");
            }
            else {
                $("#barup-buttons").removeClass("col-3").addClass("col-6");
                $("#barup-search-col .col-12").removeClass("col-12").addClass("col-7");
                $("#barup-search-col").removeClass("col-6").removeClass("col-7").addClass("col-3"); 
            }  
        }

        $("window").resize();
    });

    if (rcmail.env.task === 'calendar')
    {
        rcmail.addEventListener("calendar.renderEvent", (args) => {

            if ($("html").hasClass("mwsp"))
                return args.eventDatas.categories !== undefined && args.eventDatas.categories[0] === `ws#${mel_metapage.Storage.get("current_wsp")}`;

            return true;

        });
    }

    // au changement de couleur
    rcmail.addEventListener('switched_color_theme', (color_mode) => {
        on_switched_color_mode(color_mode);
    });

    function on_switched_color_mode(color_mode)
    {
        const dark_logo = 'skins/mel_elastic/images/taskbar-logo.svg';
        const element_data_name = 'initsrc';

        let $logo = $(".logo-mel");

        if (MEL_ELASTIC_UI.color_mode() === 'dark') 
        {
            $logo.data(element_data_name, $logo.attr('src')).attr("src", dark_logo);
        }
        else 
        {
            $logo.attr("src", $logo.data(element_data_name)).data(element_data_name, '');
        }

        if (window === parent)
        {
            $('iframe.mm-frame').each(async (i,e) => {
                let $frame;
                let contentWindow = e.contentWindow;
                const task = contentWindow.rcmail.env.task;

                switch (task) {
                    case 'settings':
                        $frame = contentWindow.$("iframe#preferences-frame")[0];
                        break;
                    case 'mail':
                        $frame = contentWindow.$('iframe#messagecontframe')[0];
                        break;
                    case 'addressbook':
                        $frame = contentWindow.$("iframe#contact-frame")[0];
                        break;

                    default:
                        $frame = null;
                        break;
                }


                try {
                    if ($frame !== null && MEL_ELASTIC_UI.color_mode() !== $frame.contentWindow.MEL_ELASTIC_UI.color_mode())
                    {
                        $frame.contentWindow.MEL_ELASTIC_UI.switch_color();
                    }
                } catch (error) {
                    
                }
            });
        }
    }
    
    $(document).ready(() => {
        on_switched_color_mode(MEL_ELASTIC_UI.color_mode());
    });

    rcmail.addEventListener('responseaftersearch', function() {
      $('#mail-search-icon').addClass("success-search");
      $('#mail-search-border').addClass("border-success-search");
    })
    rcmail.addEventListener('responseafterlist', function(){
      $('#mail-search-icon').removeClass("success-search");
      $('#mail-search-border').removeClass("border-success-search");
    })

    rcmail.addEventListener('storage.change', (datas) => {
        //debugger;
        rcmail.triggerEvent(`storage.change.${datas.key}`, datas.item);
    }, false);

    /*********AFFICHAGE D'UN EVENEMENT*************/
    rcmail.addEventListener("calendar.event_show_dialog.custom", (datas)    => { 

        if (datas.showed.start.format === undefined)
            datas.showed.start = moment(datas.showed.start);

        if (datas.showed.end.format === undefined)
            datas.showed.end = moment(datas.showed.end);

        const event = datas.showed;
        const isInvited = datas.show_rsvp;//event.attendees !== undefined && event.attendees.length > 0 && Enumerable.from(event.attendees).where(x => rcmail.env.mel_metapage_user_emails.includes(x.email)).first().status === "NEEDS-ACTION";

        rcmail.env.bnum_last_event_datas = datas;

        let html = "";
        html += "<div id=parenthtmlcalendar>";
        //Date / Horaire
        html += `<div class="row"><div class=col-6><b>${event.start.format("dddd D MMMM")}</b></div><div class="col-6"><span class="icon-mel-clock mel-cal-icon"></span>${event.allDay ? rcmail.gettext("all-day", "mel_metapage") : `${event.start.format("HH:mm")} - ${event.end.format("HH:mm")}`}</div></div>`;

        //Affichage de la récurrence puis de l'alarme
        let rec = event.recurrence_text === undefined ? null : event.recurrence_text;
        let alarm = event.alarms !== undefined ? (new Alarm(event.alarms)).toString() : null;

        html += `<div class=row style="margin-top:5px">${(rec !== null ? `<div class=col-6>${rec}</div>` : "")}${(alarm !== null ? `<div class=col-6><span class="icon-mel-notif mel-cal-icon"></span>Rappel : ${alarm}</div>` : "")}</div>`;

        //Affichage du lieu
        if (event.location !== undefined && event.location !== null && event.location !== "")
            html += `<div id="location-mel-edited-calendar" class=row style="margin-top:15px"><div class=col-12 style="overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;"><span class="icon-mel-pin-location mel-cal-icon"></span><span>${linkify(event.location.replaceAll("#visio:", "").replaceAll("@visio:", ""))}</span></div></div>`;


        if (event.categories !== undefined && event.categories.length > 0)
        {
            const isWsp = event.categories[0].includes("ws#");
            html += `<div class=row style="margin-top:5px"><div class=col-12><span ${isWsp ? "" : `style="color:#${rcmail.env.calendar_categories[event.categories[0]]}"`} class="${isWsp ? "icon-mel-workplace" : "icon-mel-label-full"} mel-cal-icon"></span><span ${!isWsp ? "" : `style="color:#${rcmail.env.calendar_categories[event.categories[0]]}"`} >${isWsp ?  event.categories[0].replace("ws#", "") : event.categories[0]}</span></div></div>`;
        }

        html += "<div style=font-size:1rem>";

        //Affichage de la description
        if (event.description !== undefined && event.description !== "")
            html += `<div class=row style="margin-top:15px;"><div class=col-12 style=white-space:nowrap;><span class="icon-mel-descri mel-cal-icon" style="display: inline-block;
            vertical-align: top;
            margin-top: 5px;"></span><p style="overflow:auto;display:inline-block;white-space: break-spaces;width:95%;">${linkify(event.description.replaceAll("\n", "<br/>"))}</p></div></div>`;

        //Affichage des invités
        if (event.attendees !== undefined && event.attendees.length > 1)
        {
            let tmp = Enumerable.from(event.attendees).orderBy(x => (x.role!=="ORGANIZER")).thenBy(x =>x.name).toArray();
            let attendeesHtml = "";
            for (let index = 0; index < tmp.length && index < 3; ++index) {
                const element = tmp[index];
                attendeesHtml += `<div class="attendee mel-ellipsis  ${element.status === undefined ? element.role.toLowerCase() : element.status.toLowerCase()}"><a href="mailto:${element.email}">${(element.name === undefined || element.name === "" ? element.email : element.name)}</a></div>`;
            }

            if (tmp.length > 3)
            {
                attendeesHtml += "<div id=mel-hidden-attendees class=hidden>";

                for (let index = 3; index < tmp.length; ++index) {
                    const element = tmp[index];
                    attendeesHtml += `<div class="attendee mel-ellipsis  ${element.status === undefined ? element.role.toLowerCase() : element.status.toLowerCase()}"><a href="mailto:${element.email}">${(element.name === undefined || element.name === "" ? element.email : element.name)}</a></div>`;
                }

                attendeesHtml += "</div>";

                attendeesHtml += `<b><a role="button" data-length=${tmp.length - 3} href=# onclick="event_calendar_show_all_something(this)">${tmp.length - 3} de plus...</a></b>`;
            }

            html += `<div class=row style="max-width:100%;${(event.description === undefined || event.description === "" ? "margin-top:15px;" : "")}"><div class="col-12 mel-calendar-col"><span class="mel-calendar-left-element icon-mel-user mel-cal-icon"></span><div class="mel-calendar-right-element" style="">${attendeesHtml}</div></div></div>`;
        
            //Affichage du status
            try {
                const me = Enumerable.from(event.attendees).where(x => x.email === rcmail.env.mel_metapage_user_emails[0]).first();
                if (me.status !== undefined)
                {
                    html += `<div class=row style="margin-top:15px"><div class=col-4><span style="margin-right:11px" class="mel-cal-icon attendee ${me.status === undefined ? me.role.toLowerCase() : me.status.toLowerCase()}"></span><span style=vertical-align:text-top><b>Ma réponse</b> : ${rcmail.gettext(`status${me.status.toLowerCase()}`, "libcalendaring")}</span>
                    ${me.status === "NEEDS-ACTION" || isInvited ? "" : '<button id="event-status-editor" class="btn btn-secondary dark-no-border-default mel-button" style="margin-top:0;margin-left:5px"><span class="icon-mel-pencil"></span></button>'}
                    </div>
                    </div>`;
                }
            } catch (error) {
                console.warn("/!\\[status]", error);
            }
        }



        //Affichage des pièces jointes
        if ($.isArray(event.attachments) && event.attachments.length > 0)
            html += `<div id=mel-event-attachments class="row" style=margin-top:15px><div class="col-12"><span class="icon-mel-pj mel-cal-icon mel-calendar-left-element"></span><span class="mel-event-text mel-calendar-right-element"></span></div></div>`;

        //Affichage du calendrier
        html += `<div class=row style="margin-top:15px"><div class=col-12><span class="icon-mel-calendar mel-cal-icon"></span><span style=vertical-align:text-top>${event["calendar-name"]}</span></div></div>`;

        //Affichage free_busy
        html += `<div class=row><div class=col-12 style="margin-top:10px"><span style="display: inline-block;
        width: 0.7rem;
        height: 0.7rem;
        background-color: ${event.free_busy === "free" ? "green" : "red"};
        border-radius: 100%;
        margin-bottom: -0.1rem;
        margin-left: 0.35rem;
        margin-right: 1rem;" class="mel-cal-icon"></span><span style=vertical-align:text-top><b>${rcmail.gettext("status", "calendar")}</b> : ${rcmail.gettext(event.free_busy, "calendar")}</span></div></div>`;

        //Affichage de la date de création
        const created = rcube_calendar.mel_metapage_misc.CapitalizeMonth(rcube_calendar.mel_metapage_misc.GetDateFr(moment(event.created).format("DD MMMM YYYY")));
        html += `<div class=row style="margin-top:10px"><div class=col-12><span class="icon-mel-pencil mel-cal-icon"></span><span style=vertical-align:text-top><b>Créé le : </b>${created}</span></div></div>`;

        //Affichage de la date de modification
        if (event.changed !== undefined)
        {
            const edited = rcube_calendar.mel_metapage_misc.CapitalizeMonth(rcube_calendar.mel_metapage_misc.GetDateFr(moment(event.changed).format("DD MMMM YYYY")));
            html += `<div class=row><div class=col-12><span style="opacity:0" class="icon-mel-pencil mel-cal-icon"></span><span style=vertical-align:text-top><b>Dernière modification le : </b>${created}</span></div></div>`;
        }
        //fin table
        html += "</div></div>";

        const cancelled = event.status === "CANCELLED";
        const title = event.sensitivity === "private" ? `<span class="icon-mel-lock mel-cal-icon"><span class="sr-only">Privé : </span></span>${cancelled ? `<span style="text-decoration-line: line-through;">${event.title}</span> (Annulé)` : event.title}` : (cancelled ? `<span style="text-decoration-line: line-through;">${event.title}</span> (Annulé)` : event.title);
        
        const config = new GlobalModalConfig(title, "default", html);
        let modal = new GlobalModal("globalModal", config, true);
        modal.modal.find(".modal-lg")/*.removeClass("modal-lg")*/.css("font-size", "1.2rem");
        
        //Gérer le titre
        modal.header.querry.css("position", "sticky")
        .css("top", "0")
        .css("background-color","white")
        .css("border-top-left-radius","15px")
        .css("border-top-right-radius","15px")
        .css("z-index", 1);

        //gérer les boutons du footer
        modal.footer.querry.css("position", "")
        .css("bottom", "0")
        .css("background-color", "white")
        .css("flex-direction", "row-reverse")
        .css("z-index", 1)
        .addClass("calendar-show-event");

        modal.footer.querry.html("")
        .append($(`<button class="mel-calendar-button" id="-mel-send-event"><span class="icon-mel-send"></span><span class=inner>Partager</span></button>`).click((e) => {
            datas.object.event_sendbymail(event, e);
        }));

        if (rcmail.env.calendars[event.calendar].editable)
        {
            modal.footer.querry.append($(`<button class="mel-calendar-button danger" id="-mel-delete-event"><span class="icon-mel-trash"></span><span class=inner>Supprimer</span></button>`).click(() => {
                datas.object.delete_event(event);
                modal.close();
            }))
            .append($(`<button class="mel-calendar-button" id="-mel-modify-event"><span class="icon-mel-pencil"></span><span class=inner>Modifier</span></button>`).click(() => {
                modal.close();
                datas.functions.event_edit_dialog('edit', event);
                // PAMELA - Actions à faire lorsque l'on appelle la fenêtre d'édition d'évènement
                rcmail.triggerEvent('edit-event', event);
            }))
            ;
        }

        //Options
      if (!datas.temp && !event.temporary && event.calendar != '_resource') {
        $('<button>')
          .attr({href: '#', 'class': 'dropdown-link mel-calendar-button ', 'data-popup-pos': 'top'})
          .append(`<span class="inner">${rcmail.gettext('eventoptions','calendar')}</span>`)
          .click(function(e) {
            return rcmail.command('menu-open','eventoptionsmenu', this, e);
          })
          .prepend(`<span style="transform: rotateZ(90deg);
          display: inline-block;" class="icon-mel-dots"></span>`)
          .prependTo(modal.footer.querry)
          .find("span")
          .click((e) => {
            $(e.currentTarget).parent().click();
          });;
        $("#eventoptionsmenu .send").css("display", "none");

        if (!$("#eventoptionsmenu .copy").hasClass("mel-edited"))
            $("#eventoptionsmenu .copy").addClass("mel-edited")
            .click(() => {
                modal.close();
            });

      }

    modal.footer.querry.prepend($(`<button style="position: absolute;
    right: 50px;
    bottom: 20px;" class="mel-button">Fermer<span class="plus icon-mel-close"></span></button>`).click(() => {
        modal.close();
    }))

    modal.contents.css("height", `${window.innerHeight - 250}px`).css("overflow-y", "auto").css("overflow-x", "hidden");//.css("height", "").css("overflow", "");

    modal.onClose(() => {
        modal.footer.querry.css("position", "")
        .css("bottom", "")
        .css("background-color", "")
        .css("flex-direction", "")
        .css("z-index", 1)
        .removeClass("calendar-show-event");

        if(window.create_popUp !== undefined)
            delete window.create_popUp;

    });

    //Gestion des liens
    setTimeout(() => {
        let querry = $("#location-mel-edited-calendar").find("a");
        if (querry.length > 0)
        {
            if (querry.attr("href").includes(rcmail.env["webconf.base_url"]))
            {
                querry.click((e) => {
                    e.preventDefault();
                    modal.close();
                    const categoryExist = event.categories !== undefined && event.categories !== null && event.categories.length > 0;
                    const ariane = categoryExist && event.categories[0].includes("ws#") ? null : "@home";
                    const wsp = categoryExist && event.categories[0].includes("ws#") ? event.categories[0].replace("ws#", "") : null;
                    console.log("test : ", querry.attr("href"), mel_metapage.Functions.webconf_url(querry.attr("href")), wsp, ariane);
                    setTimeout(() => {
                        window.webconf_helper.go(mel_metapage.Functions.webconf_url(querry.attr("href")), wsp, ariane);
                    }, 10);
                });

            }
        }

        function invited()
        {
            let a = $(`
                <div id="event-rsvp-cloned">
                    <div class="rsvp-buttons itip-buttons">
                        <input type="button" class="button btn btn-secondary" rel="accepted" value="Accepter">
                        <input type="button" class="button btn btn-secondary" rel="tentative" value="Peut-être">
                        <input type="button" class="button btn btn-secondary" rel="declined" value="Refuser">
                        <input type="button" class="button btn btn-secondary" rel="delegated" value="Déléguer">
                        <div class="itip-reply-controls">
                            <div class="custom-control custom-switch">
                                <input type="checkbox" id="noreply-event-rsvp" value="1" class="pretty-checkbox form-check-input custom-control-input">
                                <label class="custom-control-label" for="noreply-event-rsvp" title=""> Ne pas envoyer de réponse</label>
                            </div>
                            <a href="#toggle" class="reply-comment-toggle" onclick="$(this).hide().parent().find('textarea').show().focus()">Saisissez votre réponse</a>
                            <div class="itip-reply-comment">
                                <textarea id="reply-comment-event-rsvp" name="_comment" cols="40" rows="4" class="form-control" style="display:none" placeholder="Commentaire d’invitation ou de notification"></textarea>
                                </div>
                            </div>
                        </div>
                </div>
            `).appendTo($("#parenthtmlcalendar"))
            .find('input[rel=accepted]')
            .click((e) => {
                if (event.recurrence !== undefined) window.event_can_close = false;
                ui_cal.event_rsvp(e.currentTarget, null, null, e.originalEvent);
            })
            .parent().find('input[rel=tentative]')
            .click((e) => {
                if (event.recurrence !== undefined) window.event_can_close = false;
                ui_cal.event_rsvp(e.currentTarget, null, null, e.originalEvent);
            })
            .parent().find('input[rel=delegated]')
            .click((e) => {
                if (event.recurrence !== undefined) 
                {
                    window.event_can_close = false;
                    ui_cal.event_rsvp(e.currentTarget, null, null, e.originalEvent);
                }
                else 
                {
                    ui_cal.event_rsvp(e.currentTarget, null, null, e.originalEvent);
                    modal.close();
                }
            })
            .parent().find('input[rel=declined]')
            .click((e) => {
                if (event.recurrence !== undefined) window.event_can_close = false;
                ui_cal.event_rsvp(e.currentTarget, null, null, e.originalEvent);
            })
            ;
            return a;
        }

        //Gestion des invitations
        if (isInvited)
        {
            invited();
        }

        if (event.attendees === undefined) $(".mel-event-compose").css("display", "none");
        else $(".mel-event-compose").css("display", "");

        if (event.calendar === mceToRcId(rcmail.env.username) || event.attendees === undefined) $(".mel-event-self-invitation").css("display", "none");
        else $(".mel-event-self-invitation").css("display", "none"); /*TODO : Activer lorsque ça fonctoinnera*/


        //Button edit
        $("#event-status-editor").click(() => {
            const closed = 'closed';
            let $this = $("#event-status-editor");
            if ($this.data("state") !== closed)
            {
                invited().parent().parent().parent().parent().parent()
                .css("display", "")
                .find("input.button.btn").click(() => {
                    if (window.event_can_close !== false)
                    {
                        $("#event-status-editor").click();
                    }
                    else
                        window.event_can_close = true;

                    // modal.close();
                });
                $this.data("state", closed).find("span").removeClass("icon-mel-pencil").addClass("icon-mel-close");
            }
            else {
                $("#event-rsvp-cloned").remove();
                $this.data("state", '').find("span").addClass("icon-mel-pencil").removeClass("icon-mel-close");
            }
        });

    }, 1);

    //Gestion des attachements
        if ($.isArray(event.attachments)) {
            libkolab.list_attachments(event.attachments, $('#mel-event-attachments').find('.mel-event-text'), undefined, event,
                function(id) { rcmail.env.deleted_attachments.push(id); },
                function(data) { 
                    var event = data.record,
                    query = {_id: data.attachment.id, _event: event.recurrence_id || event.id, _cal: event.calendar};
            
                  if (event.rev)
                    query._rev = event.rev;
            
                  if (event.calendar == "--invitation--itip")
                    $.extend(query, {_uid: event._uid, _part: event._part, _mbox: event._mbox});
            
                  libkolab.load_attachment(query, data.attachment);

                 }
              );
            if (event.attachments.length > 0) {
                $('#mel-event-attachments').show();
                $('#mel-event-attachments').find("ul").css("background-color", "transparent").css("border-color", "transparent");
                $('#mel-event-attachments').find('.mel-event-text')/*.css("font-size", "1.2rem")*/.css("width","94%").find("li").each((i,e) => {
                    const txt = $(e).addClass("mel-before-remover").css("display", "block").find("a").find("span").html();
                    const splited = txt.split(".");
                    const ext = splited[splited.length-1];
                    const name = Enumerable.from(splited).where((x, i) => i < splited.length-1).toArray().join(".");
                    
                    $(e).prepend(`<div class=row><div class=col-8>${name}</div><div class=col-2>${ext}</div><div class="col-2 r-gm-col-temp" ></div></div>`);
                    $(e).find("a").addClass("mel-calendar-button mel-calendar-button-sm").appendTo($(".r-gm-col-temp").removeClass("r-gm-col-temp")).find("span").html("").addClass("icon-mel-download");
                    
                });
            }
        }
        //fin
    });

    async function deplace_popup_if_exist(rec)
    {
        //popover .show
        let it = -1;
        return wait(() => {
            ++it;
            if ($(".popover.show").length > 0 && $("#itip-rsvp-menu").length > 0)
                return false;
            else if ($(".popover.show").length > 0 && $("#itip-rsvp-menu").length == 0)
                return false;
            else if (it === 5)
                return false;
            else
                return true;
        }).then(() => {
            //$(".popover.show")
            const top = rec.top + (rec.height/2);
            const left = rec.left + rec.width;
            var popup = $(".popover.show")
            .css("top", `${top}px`)
            .css("left", `${left}px`)
            ;

            if (deplace_popup_if_exist.hasAlready === undefined)
            {
                popup.find("li a").each((i,e) => {
                    $(e).click(() => {
                        if (rcmail.env.bnum_itip_action !== undefined)
                        {
                            rcmail.env.bnum_itip_action(e);
                        }
                        // else {
                        //     rcmail.triggerEvent("calendar.event_show_dialog.custom", rcmail.env.bnum_last_event_datas);
                        // }
                    });
                });
                deplace_popup_if_exist.hasAlready = true;
            }
        });
    }

    function linkify(text, config = {style:""}) {
        var urlRegex =/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
        return text.replace(urlRegex, function(url) {
            return `<a target="_blank" href="${url}" ${(config !== undefined && config.style !== undefined && config.style !== "" ? `style="${config.style}"` : "")}>${url}</a>`;
        });
    }

    function event_calendar_show_all_something(element)
    {
        element = $(element);
        let querry = $("#mel-hidden-attendees");

        if (querry.hasClass("hidden"))
        {
            querry.removeClass("hidden");
            element.html("Voir moins...");
        }
        else {
            querry.addClass("hidden");
            element.html(`${element.data("length")}  de plus...`);
        }
    }

    rcmail.addEventListener('contextmenu_init', function(menu) {
        // identify the folder list context menu
        if (menu.menu_name == 'messagelist') {

          // add a shortcut to the folder management screen to the end of the menu
          //menu.menu_source.push({label: rcmail.gettext('new-mail-from', "mel_metapage"), command: 'new-mail-from', classes: 'compose mel-new-compose options'});
          menu.menu_source.push({label: 'Gérer les étiquettes', command: 'gestion_labels', classes: 'ct-tb'});
      
          menu.addEventListener("beforeactivate", (p) => {
            $(".ct-tb").on("mouseover", (e) => {
                
                let source = [];

                for (const key in rcmail.env.labels_translate) {
                    if (Object.hasOwnProperty.call(rcmail.env.labels_translate, key)) {
                        const element = rcmail.env.labels_translate[key];
                        const haveLabel = Enumerable.from(menu.selected_object.classList).toArray().includes("label_"+key);
                        //console.log("boucle", key, haveLabel, menu.selected_object.classList);
                        source.push({label: element, command: (haveLabel ? "remove_label" :'add_label'), props:{label:key, message:menu.selected_object}, classes: (haveLabel ? "selected" : "")+' label '+key+" label_"+key})
                    }
                }
                
                // if (menu.labels_submenu)
                // {
                //     menu.labels_submenu.destroy();
                //     delete menu.labels_submenu;
                // }
                // if (menu.submenus["undefined"] !== undefined && menu.submenus["undefined"] !== null)
                // {
                //     menu.submenus["undefined"].menu_source = source;
                //     menu.submenus["undefined"].show_menu(null, e);
                //     //console.log(menu, menu.submenus["gestion_labels"]);
                // }
                // else {

                    var a = rcmail.contextmenu.init(
                        {'menu_name': 'labellist', 'menu_source': source,
                    });
                    //menu.submenu($(".ct-tb"), e);
                    a.show_menu($(".ct-tb"), e);
                    menu.labels_submenu = a;
                    //console.log(menu, a);
                //}

          }).on("mouseout", (e) => {
              
            let target = $(e.relatedTarget);
            while (target[0].nodeName !== "BODY") {
                if (target[0].id == "rcm_labellist")
                    return;
                target = target.parent();
            }
            
            menu.labels_submenu.destroy();
            delete menu.labels_submenu;

          });



        });

          menu.addEventListener("hide_menu", (p) => {
          $(".ct-tb").off("mouseover").off("mouseout");

        });

          // make sure this new shortcut is always active
          menu.addEventListener('activate', function(p) {
            if (p.command == 'gestion_labels') {
              return true;
            }
          });
        }
        else if (menu.menu_name == 'labellist')
        {
            menu.addEventListener("beforeactivate", (p) => {
                rcm_tb_label_init_onclick($("#rcm_labellist li a"), () => {menu.triggerEvent("hide_menu"); menu.destroy();});
                $("#rcm_labellist").on("mouseout", (e) => {
                  
                let target = $(e.relatedTarget);
                while (target[0].nodeName !== "BODY") {
                    if (target[0].id == "rcm_labellist" || target.hasClass("ct-tb"))
                        return;
                    target = target.parent();
                }
                
                menu.destroy();
              });
    
    
    
            });
    
              menu.addEventListener("hide_menu", (p) => {
              $("#rcm_labellist").off("mouseout");
    
            });
        }
      });

    //   $(window).on("resize", (e) => {
    //     //console.log("e", window.innerHeight, !$("html").hasClass("layout-phone"), !$("html").hasClass("layout-small"));
    //     if (rcmail.env.task !== "calendar")
    //         return;

    //     if (!$("html").hasClass("layout-phone") && !$("html").hasClass("layout-small") && window.innerHeight <= 500)
    //     {
    //         $("#datepicker-onoff").remove();
    //         $("#datepicker").addClass("showed").css("margin-bottom", "");
    //         $("#datepicker").prepend(
    //             $(`<button class="btn btn-block" id=datepicker-onoff><span class="icon-mel-chevron-down"></span></button>`)
    //             .click(() => {
    //                 //console.log("clicked");
    //                 const size = $("#datepicker .ui-datepicker")[0].getClientRects()[0].height;
    //                 if ($("#datepicker").hasClass("showed")) //est pas affiché
    //                 {
    //                     $("#datepicker").css("margin-bottom", `-${size}px`).removeClass("showed");
    //                     $("#datepicker-onoff .icon-mel-chevron-down").removeClass("icon-mel-chevron-down").addClass("icon-mel-chevron-up")
    //                 }
    //                 else {
    //                     $("#datepicker").css("margin-bottom", ``).addClass("showed");
    //                     $("#datepicker-onoff .icon-mel-chevron-up").removeClass("icon-mel-chevron-up").addClass("icon-mel-chevron-down")
    //                 }
    //             })
    //         );

    //         setTimeout(() => {
    //             if ($("#datepicker").hasClass("showed"))
    //                 $("#datepicker-onoff").click();
    //         }, 1);
    //     }
    //     else {
    //         $("#datepicker-onoff").remove();
    //         $("#datepicker").addClass("showed").css("margin-bottom", "");
    //         // setTimeout(() => {
    //         //     $(window).resize();
    //         // }, 100);
    //     }
    //   });

      function resize_mail()
      {
        if (rcmail.env.task === "mail" && (rcmail.env.action === "" || rcmail.env.action === "index"))
        {

            if ($("#layout-content .header ul#toolbar-menu li.hidden-item-mt").length > 0)
            {
                $("#layout-content .header ul#toolbar-menu li.hidden-item-mt").removeClass("hidden-item-mt");//.css("display", "");
                $("#message-menu > ul.menu .moved-item-mt").remove();
            }

            if ($("#layout-content .header")[0].scrollWidth > $("#layout-content").width())
            {
                let array = $("#layout-content .header ul#toolbar-menu li");
                let it = array.length;

                while ($("#layout-content .header ul#toolbar-menu")[0].scrollWidth > $("#layout-content").width()) {
                    --it;

                    if (it <= 3)
                        break;
                    else if ($(array[it]).find(".tb_noclass").length > 0)//tb_label_popuplink
                    {
                        var tmp = $(array[it]).clone().addClass("moved-item-mt");
                        tmp.find("a").each((i,e) => {
                            e.id = `${e.id}-${i}`;
                            $(e).on("click", () => {
                                $("#tb_label_popuplink").click();
                            });
                        });
                        $("#message-menu > ul.menu").prepend(tmp);
                        $(array[it]).addClass("hidden-item-mt");
                    }
                    else if ($(array[it]).css("display") === "none" || $(array[it]).find("a").hasClass("more") || $(array[it]).find("a").attr("aria-haspopup") == "true" || $(array[it]).find("a").length > 1)//aria-haspopup
                        continue;
                    else
                    {
                        var tmp = $(array[it]).clone().addClass("moved-item-mt");
                        tmp.find("a").each((i,e) => {
                            e.id = `${e.id}-${i}`;
                            $(e).addClass("moved-item-mt");
                        });
                        $("#message-menu > ul.menu").prepend(tmp);
                        $(array[it]).addClass("hidden-item-mt");
                    }
                }
                
            }
        }
      }


    //   function resize_taskbar_wsp()
    //   {
    //       if ($(".layout-small").length > 0 && $(".layout-ultra-small").length === 0 && !$(".wsp-toolbar").hasClass("") && $(".wsp-toolbar"))
    //       {
    //         $(".wsp-toolbar")
    //       }
    //   }

      $(document).ready(async () => {
        if (rcmail.env.task === "mail" && (rcmail.env.action === "" || rcmail.env.action === "index"))
        {
            new ResizeObserver(resize_mail).observe($("#layout-content")[0]);
            resize_mail();
        }
      });

      if (parent === window)
      {
          switch (rcmail.env.task) {
              case "workspace":
                  rcmail.addEventListener("elastic.UI.screen_mode.tests", (datas) => {
                    if ($("html").hasClass("webconf-started"))
                    {
                        for (const key in datas.tests) {
                            if (Object.hasOwnProperty.call(datas.tests, key)) {
                                datas.tests[key] += 324;                            
                            }
                        }
                    }
                    else if ($("html").hasClass("ariane-started"))
                    {
                        for (const key in datas.tests) {
                            if (Object.hasOwnProperty.call(datas.tests, key)) {
                                datas.tests[key] += (datas.tests[key] * (25/100));                            
                            }
                        }
                    }
                    
                    return datas.tests;
                  });


                  rcmail.addEventListener("elastic.UI.screen_mode.customSize", (datas) => {
                    const size = $("html").hasClass("webconf-started") ? 597 + 324 : $("html").hasClass("ariane-started") ? 597 + (597*(25/100)) : 597;
                    if (datas.tests.phone <= datas.width && datas.width <= size )
                        $("html").addClass("layout-ultra-small");
                    else if ($("html").hasClass("layout-ultra-small"))
                        $("html").removeClass("layout-ultra-small");
                  })
                  break;
          
              default:
                  break;
          }
      }
    

}

//Gestion des liens internes
$(document).ready(() => {

    /**
     * Liste des exceptions
     */
    const plugins = {
        /**
         * Tâche lié au stockage
         */
        drive:"stockage",
        /**
         * Tâche lié à la discussion instantanée
         */
        chat:"discussion",
        /**
         * Tâche lié au sondage
         */
        sondage:"sondage",
        /**
         * Tâche lié au Trello
         */
        kanban:"kanban"
    }

    /**
     * Gère les interceptions de liens pour les exceptions de liens.
     * @param {string} top_selector Selecteur lié à la tâche choisie
     * @param {string} sub_frame_selector Selecteur de la frame qui contient le module externe
     * @param {string} url Nouveau lien
     * @returns Si vrai, une frame existe déjà
     */
    function intercept_exceptions(top_selector, sub_frame_selector, url)
    {
        let retour = true;
        let $iframe_querry = top.$(`iframe${top_selector}`);
        let $top_querry = top.$(top_selector);

        if ($iframe_querry.length > 0) $iframe_querry[0].contentWindow.$(sub_frame_selector)[0].src = url;                        
        else if ($top_querry > 0) top.$(sub_frame_selector)[0].src = url;
        else retour = false;

        return retour;
    }

    function intercept_click(event)
    {
        try {
            //Vérification si on intercetpe le lien ou non
            const intercept = $(event.target).data("spied");

            if (intercept !== undefined && intercept !== null && (intercept == "false" || intercept === false)) return;
            else if ($(event.target).attr("onclick") !== undefined && !$(event.target).attr("onclick").includes('event.click')) return;
            else if (Enumerable.from($(event.target).parent()[0].classList).any(x => x.includes('listitem'))) return;
            else if ($(event.target).parent().parent().parent().attr("id") === "taskmenu") return;

            /**
             * @constant
             * @type {JSON|Enumerator} Liste des exceptions
             */
            const spies = rcmail.env.enumerated_url_spies !== true ? Enumerable.from(rcmail.env.urls_spies) : rcmail.env.urls_spies;            
            /**
             * @constant
             * @type {string} Adresse du lien
             */
            const url = $(event.target).attr('href');

            //Changement des liens en enumerable (optimisation)
            if (rcmail.env.enumerated_url_spies !== true) 
            {
                rcmail.env.urls_spies = spies;
                rcmail.env.enumerated_url_spies = true;
            }

            if (url !== undefined && url !== null)
            {
                //Initialisation
                let $querry;
                let reloop;

                let task = null;
                let action = null;
                let othersParams = null;
                let after = null;
                let update = false;

                let _switch = (spies !== undefined && spies !== null ? spies : Enumerable.from([])).firstOrDefault(x => url.includes(x.key), null);

                do {
                    reloop = false;
                    switch ((_switch === null ? null : _switch.value)) {
                        case plugins.drive:

                            const stockage_url = _switch.url !== undefined ? decodeURIComponent(_switch.url) : decodeURIComponent(url);
                            task = "stockage";                                      

                            if (stockage_url.includes('/s/')) return;

                            if (!intercept_exceptions(".stockage-frame", "#mel_nextcloud_frame", stockage_url)) othersParams = { _params:stockage_url.replace(_switch.key, '') }
                            
                            break;
                        case plugins.chat:
                            $querry = top.$("iframe.discussion-frame");
                            task = "discussion";     
    
                            if ($querry.length > 0) {
                                $querry[0].contentWindow.postMessage({
                                    externalCommand: 'go',
                                    path: url.replace(_switch.key, '')
                                }, rcmail.env.rocket_chat_url);
                            }                
                            else {
                                after = () => {
                                    top.$("iframe.discussion-frame")[0].src = url;
                                };
                            }
    
                            break;
                        case plugins.sondage:
                            task = "sondage";                                      

                            if (!intercept_exceptions(".sondage-frame", "#mel_sondage_frame", url)) othersParams = { _url:url };
    
                            break;
                        case plugins.kanban:
                            task = "wekan";                                      

                            if (!intercept_exceptions(".wekan-frame", "#wekan-iframe", url)) othersParams = { _url:url };

                            break;
                    
                        default:
                            if (url.includes('/?_task='))
                            {
                                update = true;
                                task = url.split('/?_task=', 2)[1].split('&')[0];

                                if (["ariane", "discussion", "chat"].includes(task))
                                {
                                    _switch = spies.firstOrDefault(x => x.value == plugins.chat, null);
                                    
                                    if (_switch !== null)
                                    {
                                        reloop = true;
                                        break;
                                    }
                                }
    
                                othersParams = {};
    
                                try {
                                    let tmp_othersParams = url.split('/?_task=', 2)[1];

                                    if (tmp_othersParams.includes('&'))
                                    {
                                        othersParams = Enumerable.from(tmp_othersParams.split('&'))
                                        .where(x => x.includes('='))
                                        .toJsonDictionnary(x => x.split('=')[0], 
                                            x => x.split('=')[1]);
      
                                        if (task === "stockage" && othersParams["_params"] !== undefined)
                                        {

                                            _switch = spies.firstOrDefault(x => x.value == plugins.drive, null);

                                            if (_switch !== null)
                                            {
                                                action = null;
                                                _switch.url = _switch.key + othersParams["_params"];
                                                reloop = true;
                                                break;
                                            }
                                        }
                                    }
                                } catch (error) {
                                }
                            }
                            break;
                    }
                } while (reloop);

                if (task !== null)
                {
                    top.mel_metapage.Functions.change_page(task, action, othersParams === null ? {} : othersParams, update).then(() => {
                        if (after !== null)
                            after();
                    });
                    event.preventDefault();
                }
            }
        } catch (error) {
             //console.error("###[DEBUG][ONCLICK]", error);
        }
    }

    $(document).on("click", "a", (event) => {
        intercept_click(event);
    });

    rcmail.addEventListener("event.click", (params) => {
        intercept_click(params.e === undefined ? params.obj : params.e);
    })
})

