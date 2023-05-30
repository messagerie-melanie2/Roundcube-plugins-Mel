if (rcmail)
{
    (() => { //

        function change_frame(frame, args = null) {
            
            let config = {
                changeframe:true,
                wait:false,
                args:{},
                action:"update_location",
                action_args:[]
            }

            if (args !== null && args !== undefined)
            {
                for (const key in args) {
                    if (Object.hasOwnProperty.call(args, key)) {
                        const element = args[key];
                        config[key] = element;                        
                    }
                }
            }

            mel_metapage.Functions.change_frame(frame, config.changeframe, config.wait, config.args, [{
                action:config.action, 
                args:config.action_args,
                onlyExist:true
            }]);

        }

        rcmail.register_command("switch_theme", () => {
            MEL_ELASTIC_UI.switch_color();
        }, true);

        rcmail.register_command("open_suggestion", () => {
          mel_metapage.Functions.change_page("settings",'plugin.mel_suggestion_box')
        }, true);
        
        rcmail.register_command("custom_taskbar", () => {
          mel_metapage.Functions.change_page("settings",'', {'edit-prefs':'general','_open_section':'navigation'})
        }, true);

        rcmail.register_command("change_page", (args) => {
          const task = args.task;
          const action = args.action;
          const params = args.params;
          mel_metapage.Functions.change_page(task, action, params);
        }, true);
        
        rcmail.register_command("open_help", () => {
            m_mp_Help();
        }, true);

        rcmail.register_command('mel-compose', () => {
            rcmail.set_busy(false);
            if (parent.$(".wsp-toolbar.wsp-toolbar-edited.melw-wsp").length > 0  && parent.$(".wsp-toolbar.wsp-toolbar-edited.melw-wsp").css("display") !== "none")
            {
                parent.rcmail.open_compose_step({to:mel_metapage.Storage.get("current_wsp_mail")});
            }
            else parent.rcmail.command("compose");
            
        }, true);

        rcmail.register_command("manage_mailbox_folders",
            () => {

                let config = {};

                if (rcmail.env.mel_metapage_const !== undefined)
                    config[rcmail.env.mel_metapage_const.key] = rcmail.env.mel_metapage_const.value;

                change_frame("settings", {
                    args:{
                        "_action":"folders"
                    },
                    action_args:[mel_metapage.Functions.url("settings", "folders", config)]
                });

            }, true);

            rcmail.register_command("use_as_new",
            (a,b,c,d) => {
                rcmail.enable_command('edit', true);
                rcmail.command('edit','new', c, d);
            }, true);

            rcmail.register_command("edit_model",
            (a,b,c,d) => {
                melSetCookie('current_model_id', rcmail.get_single_uid(), 7);
                rcmail.command('use_as_new');
            }, true);

            rcmail.register_command("mel_metapage_manage_mail_box",
            () => {

                let config = {};

                if (rcmail.env.mel_metapage_const !== undefined)
                    config[rcmail.env.mel_metapage_const.key] = rcmail.env.mel_metapage_const.value;

                change_frame("settings", {
                    args:{
                        "_action":"plugin.mel_resources_bal"
                    },
                    action_args:[mel_metapage.Functions.url("settings", "plugin.mel_resources_bal", config)]
                });

            }, true);

            rcmail.register_command("mel_metapage_change_wsp_picture",
            (item) => {

                m_mp_change_picture(item);

            }, true);

            rcmail.register_command("gestion_labels", () => {show_rcube_manage_labels();}, true);

            rcmail.register_command("calendar-setting-resource", () => {
                //window.location.href = mel_metapage.Functions.url("settings", "plugin.mel_resources_agendas");
                //la page existe encore
                if (parent.$("iframe.settings-frame").length > 0)
                {
                    parent.$("iframe.settings-frame")[0].src = mel_metapage.Functions.url("settings", "plugin.mel_resources_agendas");
                    mel_metapage.Functions.change_frame("settings", true, false);
                }
                else if (parent.$(".settings-frame").length > 0)
                {
                    rcmail.set_busy(true, "loading");
                    window.location.href = mel_metapage.Functions.url("settings", "plugin.mel_resources_agendas");
                }
                else
                {
                    mel_metapage.Functions.change_frame("settings", true, true, {"_action":"plugin.mel_resources_agendas"}).then(() => {
                        parent.$("iframe.settings-frame")[0].contentWindow.location.reload();
                    });
                }
            });

            rcmail.register_command("mail-force-refresh", () => {
                rcmail.set_busy(true, "loading");
                window.location.href = mel_metapage.Functions.url("mail", null, {_nocache:true});
            }, true);

            rcmail.register_command("start_webconf", (args) => {

                if (top !== window) return top.rcmail.command("start_webconf", args);

                let datas = WebconfLink.create(args.current);
                window.webconf_helper.go(datas.key, datas.wsp, datas.ariane);
            }, true);

            rcmail.register_command("event-compose", () => {
                const event = ui_cal.selected_event;
                const title = `${event.title} - ${moment(event.start).format('DD/MM/YYYY HH:mm')}`;
                window.current_event_modal.close();
                parent.rcmail.open_compose_step({to:Enumerable.from(event.attendees).select(x => x.email).toArray().join(','),subject:title});
            }, true);

            rcmail.register_command("event-self-invitation", () => {
                let event = ui_cal.selected_event;
                delete event.source;
                event.start = cal.date2ISO8601(event.start.toDate());
                event.end = cal.date2ISO8601(event.end.toDate());

                if (!event.allDay) delete event.allDay;
                window.current_event_modal.close();
                let b = true;
                rcmail.set_busy(true, "loading");
                mel_metapage.Functions.post(
                    mel_metapage.Functions.url('calendar', 'event'),
                    {
                        e:event,
                        action:'invite-self'
                    },
                    () => {
                        rcmail.set_busy(false);
                        b = false;
                        rcmail.clear_messages();
                        rcmail.command('refreshcalendar');
                    }
                ).always(() => {
                    if (b) {
                        rcmail.set_busy(false);
                        rcmail.clear_messages();
                    }
                });

            }, true);

            rcmail.register_command("event-self-copy", () => {
                let event = $.extend(true, {}, ui_cal.selected_event);
                delete event.attendees;
                ui_cal.event_copy(event);
            }, true);

            rcmail.register_command("test_notify", () => {
                rcmail.http_post('plugin.notification_test', {

                });
            }, true);

            rcmail.register_command("new-mail-from", () => {
                let uid;
                if (rcmail.task == 'mail' && (uid = rcmail.get_single_uid())) {
                    url = { _mbox: rcmail.get_message_mailbox(uid) };
                    url[url._mbox == rcmail.env.drafts_mailbox && props != 'new' ? '_draft_uid' : '_uid'] = uid;
                    url["_option"] = "empty"; 
                    rcmail.open_compose_step(url);
                  }
            }, true);

            rcmail.register_command("mel.showMail", (datas) => {
                for (const key in datas) {
                    if (Object.hasOwnProperty.call(datas, key)) {
                        datas[key] = encodeURIComponent(datas[key]);
                    }
                }

                if (top.$(`iframe.mail-frame`).length > 0) {
                    top.$(`iframe.mail-frame`)[0].contentWindow.location.href = mel_metapage.Functions.url('mail', '', datas);
                } //frame déjà ouverte
                else if (top.$(`.mail-frame`).length > 0) {
                    top.$(`.mail-frame`).remove();
                } // top

                mel_metapage.Functions.change_frame('mail', true, false, datas);
            }, true);

            rcmail.register_command("mel.show_contact", (datas) => {
                for (const key in datas) {
                    if (Object.hasOwnProperty.call(datas, key)) {
                        datas[key] = encodeURIComponent(datas[key]);
                    }
                }

                if (top.$(`iframe.addressbook-frame`).length > 0) {
                    top.$(`iframe.addressbook-frame`)[0].contentWindow.location.href = mel_metapage.Functions.url('mel_metapage', 'contact', datas);
                } //frame déjà ouverte
                else if (top.$(`.addressbook-frame`).length > 0) {
                    top.$(`.addressbook-frame`).remove();
                } // top

                mel_metapage.Functions.change_frame('contacts', true, false, datas);
            }, true);

            rcmail.register_command("mel.metapage.contacts.back", () => {
                let $args = {
                    _source:rcmail.env.annuaire_source
                };

                $args[rcmail.env.mel_metapage_const.key] = rcmail.env.mel_metapage_const.value;
                rcmail.set_busy(true, 'loading');
                //console.log('test', mel_metapage.Functions.url("addressbook", "plugin.annuaire", $args), top.$('.addressbook-frame'));
                top.$('.addressbook-frame')[0].contentWindow.location.href = mel_metapage.Functions.url("addressbook", "plugin.annuaire", $args);
                // rcmail.set_busy(false);
                // rcmail.clear_messages();
            }, true);


            rcmail.register_command("event.click", (params, obj, event) => {
                rcmail.triggerEvent("event.click", {
                    params,
                    obj,
                    e:event
                });
            }, true);

            rcmail.register_command("mel.search.global", async (event) => {
                event = $(event);
                const word = event.val();

                event.addClass('disabled').attr('disabled', 'disabled');

                if ($('iframe.search-frame').length > 0)
                {
                    $('.a-frame').css('display', 'none');
                    $('.mm-frame').css('display', 'none');
                    $('#layout-frames').css('display', '');
                    $('iframe.search-frame').css('display', '')[0].contentWindow.rcmail.command('mel.search', {word});
                }
                else if ($('.search-frame').length > 0)
                {
                    $('.a-frame').css('display', 'none');
                    $('.mm-frame').css('display', 'none');
                    $('#layout-frames').css('display', 'none');
                    $('.search-frame').css('display', '');
                    rcmail.command('mel.search', {word});
                }
                else{
                    top.rcmail.set_busy(true, 'loading');
                    await mel_metapage.Functions.change_frame('search', false, true, {_word:word});
                    $('.a-frame').css('display', 'none');
                    $('.mm-frame').css('display', 'none');
                    $('#layout-frames').css('display', '');
                    $('iframe.search-frame').css('display', '');
                    //top.rcmail.set_busy(false);
                    //rcmail.clear_messages();
                }
                



            }, true);

            rcmail.register_command("mel.search.global.show", async (event) => {
                event = $(event);

                if ($('iframe.search-frame').length > 0)
                {
                    $('.a-frame').css('display', 'none');
                    $('.mm-frame').css('display', 'none');
                    $('#layout-frames').css('display', '');
                    $('iframe.search-frame').css('display', '');//[0].contentWindow.rcmail.command('mel.search', {word});
                }
                else if ($('.search-frame').length > 0)
                {
                    $('.a-frame').css('display', 'none');
                    $('.mm-frame').css('display', 'none');
                    $('#layout-frames').css('display', 'none');
                    $('.search-frame').css('display', '');
                }
            }, true);

            rcmail.register_command('message_send_error', (args) => {
                console.log("mm",args);
            }, true);

            rcmail.register_command("refreshFrame", () => {
                let iframe = $(`iframe.${rcmail.env.current_frame_name}-frame`);

                if (rcmail.env.current_frame_name === "discussion")
                {
                    iframe[0].src = iframe[0].src;
                    return;
                }

                let parent = $(`.${rcmail.env.current_frame_name}-frame`);

                // Frame déjà ouverte
                if (iframe.length > 0)
                {
                    iframe[0].contentWindow.$("body").html('<center><div title="Rechargement de la page" style="height: 20vw;width: 20vw;" class="spinner-grow"><span class="sr-only">Rechargement de la page...</span></div></center>')
                    if (!iframe[0].contentWindow.location.href.includes("_is_from"))
                        iframe.src = iframe[0].contentWindow.location.href + (iframe[0].contentWindow.location.href[iframe[0].contentWindow.location.href.length - 1] === '&' ? '' : '&') + '_is_from=iframe';
                    else
                        iframe[0].contentWindow.location.reload();
                }
                // Frame parent
                else if (rcmail.env.current_frame_name === undefined || parent.length > 0)
                {
                    const url = window.location.href;

                    if (rcmail.env.current_frame_name === undefined)
                    {
                        const _includes = ["mel-focus", "selected", "order1", "mel"];
                        console.log($("#taskmenu .selected")[0].classList);
                        const key = Enumerable.from($("#taskmenu .selected")[0].classList).where((x) => !_includes.includes(x) && !x.includes("icofont") && !x.includes("icon-mel-") && !x.includes("button")).first();
                        rcmail.env.current_frame_name = key;
                        parent = $(`.${mm_st_ClassContract(key)}-frame`);

                    }
                    else rcmail.env.current_frame_name = mm_st_ClassContract(rcmail.env.current_frame_name)

                    parent.remove();

                    let args = null;

                    try {
                        if (url.includes('&'))
                        {
                            args = Enumerable.from(url.split('&')).where(x => x.includes('=') && !x.includes('task')).toJsonDictionnary(x => x.split('=')[0], x => x.split('=')[1]);
                            args[rcmail.env.mel_metapage_const.key] = rcmail.env.mel_metapage_const.value;
                        }
                    } catch (error) {
                        
                    }

                    mel_metapage.Functions.change_frame(rcmail.env.current_frame_name, true, false, args)/*.then(() => {  
                        const contract = mm_st_ClassContract(rcmail.env.current_frame_name);
                        //console.log("rcmail.env.current_frame_name", rcmail.env.current_frame_name, contract, $(`iframe.${contract}-frame`), `${url}${(url[url.length-1] === '&' ? '' : '&')}_is_from=iframe`);                     
                        $(`iframe.${contract}-frame`)[0].src = `${url}${(url[url.length-1] === '&' ? '' : '&')}_is_from=iframe`;
                        rcmail.set_busy(false);
                        rcmail.clear_messages();
                        mel_metapage.Functions.change_frame(rcmail.env.current_frame_name, true);
                    })*/;
                    

                }

            }, true);

            rcmail.register_command("toggleChat", () => {
                mel_metapage.Functions.post(
                    mel_metapage.Functions.url("mel_metapage", "toggleChat"),
                    {},
                    (datas) => {
                        if (typeof datas === "string")
                            datas = datas == "true";

                        rcmail.env.mel_metapage_chat_visible = datas;

                        //On affiche
                        if (datas)
                        {
                            if (rcmail.env.mel_metapage_mail_configs["mel-chat-placement"] === rcmail.gettext("up", "mel_metapage"))
                                rcmail.command("chat.setupConfig");

                            $(".tiny-rocket-chat").removeClass("layout-hidden");
                        }
                        //On cache
                        else {
                            if (rcmail.env.mel_metapage_mail_configs["mel-chat-placement"] === rcmail.gettext("up", "mel_metapage"))
                            {
                                if (mel_metapage.PopUp.ariane !== null && mel_metapage.PopUp.ariane.is_show)
                                    mel_metapage.PopUp.ariane.hide();

                                $(".tiny-rocket-chat").appendTo(".barup").find(".disc").remove();
                                $("#barup-search-col .search").appendTo($("#barup-search-col"));
                                $("#barup-search-col .row").remove();
                            }

                            $(".tiny-rocket-chat").addClass("layout-hidden");
                        }
                    }
                );
            }, true);


            if (rcmail.env.task === 'mail')
            {
                rcmail.register_command('mel-comment-mail', async () => {
                    const uid = rcmail.get_single_uid();

                    if (!(uid || false)) return rcmail.display_message('Veuillez choisir un message !', 'error');

                    const current_mail_box =  $('.mailbox.selected a').first().attr('rel');
                    const current_subject = $(rcmail.message_list.rows[uid].obj).children().find('.subject a span').html();

                    rcmail.display_message('Ouverture...', 'loading');
                    await GlobalModal.resetModal();       
                    
                    let star = document.createElement('span');
                    star.setAttribute('style', 'color:red;');
                    star.append('*');
                    let main_div = document.createElement('DIV');
                    let fields_requireds = document.createElement('span');
                    fields_requireds.append(star);
                    fields_requireds.append(' Champs obligatoires');
                    main_div.append(fields_requireds);
                    let subject = document.createElement('INPUT');
                    subject.classList.add('form-control', 'input-mel', 'disabled');
                    subject.setAttribute('disabled', 'disabled');
                    subject.setAttribute('value', current_subject);

                    let title_subject = document.createElement('h3');
                    title_subject.classList.add('span-mel', 't1', 'first');
                    title_subject.append('Mail : ');
                    main_div.append(title_subject);
                    main_div.append(subject);

                    let title_comment = document.createElement('h3');
                    title_comment.classList.add('span-mel', 't1');
                    let comment_span = document.createElement('span');
                    comment_span.append('Commentaire');
                    comment_span.append(star);
                    comment_span.append(' :');
                    title_comment.append(comment_span);
                    main_div.append(title_comment);

                    let comment_area = document.createElement('textarea');
                    comment_area.classList.add('form-control', 'input-mel');
                    comment_area.setAttribute('placeholder', 'Ecrivez un commentaire...');
                    main_div.append(comment_area);

                    const config = new GlobalModalConfig('Commenter !', "default", ' ');
                    let modal = new GlobalModal('globalModal', config);
                    modal.contents.append(main_div);
                    modal.footer.buttons.save.click(async () => {
                        if (!(comment_area.value || false)) {
                            rcmail.display_message('Le commentaire ne peut pas être vide !', 'error');
                            return;
                        }

                        rcmail.set_busy(true, 'loading');
                        const new_uid = await mel_metapage.Functions.comment_mail(uid, comment_area.value, current_mail_box);
                        modal.close();
                        modal = null;
                        rcmail.clear_messages();
                        rcmail.set_busy(false);

                        if (new_uid === false)
                        {
                            rcmail.display_message('Une erreur est survenue ! Impossible de commenter le mail...', 'error');
                        }
                        else {
                            rcmail.env.list_uid_to_select = new_uid;
                            rcmail.display_message('Mail commenté avec succès !', 'confirmation');
                            rcmail.command('checkmail');
                        }
                    })
                    modal.show();
                    rcmail.clear_messages();
                }, true);
            }

            // rcmail.drag_menu_action = function(action)
            // {
            //   var menu = this.gui_objects.dragmenu;
            //   if (menu) {
            //     //   if ($(menu).show)
            //     //     $(menu).show();
            //     //   else
            //         $(menu).removeClass("hidden").css("display", "block");

            //   }
          
            //   this.command(action, this.env.drag_target);
            //   this.env.drag_target = null;
            // };

    })(); //
}