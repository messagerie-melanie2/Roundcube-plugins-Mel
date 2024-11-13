if (rcmail)
{
    (() => { //

         function module_loader() {
            return window?.loadJsModule ?? parent?.loadJsModule ?? top?.loadJsModule;
        }

        async function load_helper() {
            const loader = module_loader();
            return (await loader('mel_metapage', 'mel_object.js')).MelObject.Empty();
        }

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
          mel_metapage.Functions.change_page("settings",'plugin.mel_suggestion_box');
        }, true);
      
        rcmail.register_command("open_double_auth", () => {
          mel_metapage.Functions.change_page('settings','plugin.mel_doubleauth', true, true);
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

            rcmail.register_command('set_custom_abs', async () => {
                const reset = () => {
                    $('#user-dropdown .notifications-header').show();
                    $('#user-dropdown .page-abs').hide();
                    $('#user-dropdown .user-menu-items').show();
                };
                const open = async () => {
                    await new Promise((ok, nok) => {
                        setTimeout(() => {
                            $('#button-user').click();
                            ok();
                        }, 10);
                    });
                }
                let $dropdown = $('#user-dropdown');
                let $header = $dropdown.find('.notifications-header');
                let $items = $dropdown.find('.user-menu-items');
                let $abs = $dropdown.find('.page-abs');
                let $loader = $dropdown.find('#abs-loader');

                if ($abs.length <= 0) {

                    let input_start = new mel_label_input('abs-ponc-start', 'date', 'Démarre le : ');
                    let input_end = new mel_label_input('abs-ponc-end', 'date', 'Termine le : ');
                    let button = new mel_button({}, 'Enregistrer').addClass('abs-btn-save');
                    button.onclick.push(() => {
                        mel_metapage.Functions.post(
                            mel_metapage.Functions.url('bnum', 'plugin.abs.set_dates'),
                            {
                                absence_date_debut:moment($('#user-dropdown .div-first input').val()).format('DD/MM/YYYY'),
                                absence_date_fin:moment($('#user-dropdown .div-last input').val()).format('DD/MM/YYYY')
                            },
                            (datas) => {
                                console.log('valid', datas);
                                if (['false', false].includes(datas)) (top ?? parent ?? window).rcmail.display_message('Une erreur est survenue !', 'error');
                                else (top ?? parent ?? window).rcmail.display_message('Abscence enregistrée !', 'confirmation');
                            }
                        )
                        reset();
                    });

                    let button_back = new mel_button({}, 'Annuler').addClass('abs-btn-back');
                    button_back.onclick.push(() => {
                        reset();
                        open();
                    });

                    let flex_button = mel_html2.div({
                        attribs:{class:'abs-flex'},
                        contents:[button_back, button]
                    });

                    let see_more_link = new mel_html2('a', {
                        attribs:{class:'abs-link',href: mel_metapage.Functions.url('settings', 'plugin.mel_moncompte', {_open_section:'gestionnaireabsence'}) },
                        contents:[new mel_html('span', {}, 'Plus de configuration')]
                    });

                    see_more_link.onclick.push(reset);

                    let message = new mel_html('p', {style:'margin:0', class:'abs-message alert'});

                    let html_container = new mel_html2('div', {
                        attribs:{class:'page-abs'},
                        contents:[new mel_html('h3', {class:'abs-title'}, 'Absence ponctuelle'), message, input_start, input_end, flex_button, see_more_link]
                    });

                    $abs = html_container.create($dropdown);

                    let $inputs = $abs.find('input');
                    const len = $inputs.length - 1;

                    $inputs.each((i, e) => {
                        switch (i) {
                            case 0:
                                $(e).parent().addClass('div-first');
                                break;

                            case len:
                                $(e).parent().addClass('div-last');
                                break;
                        
                            default:
                                $(e).parent().addClass(`div-${i}`);
                                break;
                        }
                    });

                    $inputs = null;
                }

                if ($loader.length <= 0) {
                    $loader = MEL_ELASTIC_UI.create_loader('abs-loader', true, false).create($dropdown);
                }

                $abs.hide();
                $header.hide();
                $items.hide();
                $loader.show();

                open();

                mel_metapage.Functions.get(
                    mel_metapage.Functions.url('bnum', 'plugin.abs.get_dates'),
                    {},
                    (datas) => {
                        datas = JSON.parse(datas);

                        if (/*!!datas.message && EMPTY_STRING !== datas.message && */!!datas.start && EMPTY_STRING !== datas.start) {
                            $('#user-dropdown .div-first input').val(moment(datas.start, 'DD/MM/YYYY HH:mm:ss').format('YYYY-MM-DD'));
                            $('#user-dropdown .div-last input').val(moment(datas.end, 'DD/MM/YYYY HH:mm:ss').format('YYYY-MM-DD'));
                            $('#user-dropdown .abs-message').hide();
                            $('.page-abs div').show();
                        }
                        else {
                            $('#user-dropdown .abs-message').addClass('alert-warning').text("Vous n'avez pas encore d'absence, cliquez sur le bouton \"Plus de configuration\" pour en créer !")
                            
                            if ($('#user-dropdown .go_back').length <= 0) $('#user-dropdown').append($('<div class="back mel-button bckg true" style="position: absolute;top: 0;right: 0;"><bnum-icon>undo</bnum-icon></div>').click(() => {
                                reset();
                                open();
                            }));

                            $('#user-dropdown .abs-message')
                            $('.page-abs div').hide();
                        }

                        $loader.hide();
                        $abs.show();
                    }
                )

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
    

                await module_helper_mel.Look.SendTask('search');
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

                await module_helper_mel.Look.SendTask('search');
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
                    iframe[0].contentWindow.$("body").html(MEL_ELASTIC_UI.create_loader('refresh_loading'));
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


            rcmail.register_command("toggleAnimations", async () => {
                const busy = rcmail.set_busy(true, 'loading');
                await mel_metapage.Functions.post(
                    mel_metapage.Functions.url("mel_elastic", "plugin.toggle_animations"),
                    {},
                    (datas) => {
                        //debugger;
                        rcmail.env.animation_enabled = JSON.parse(datas);
                        let current = MEL_ELASTIC_UI.themes[MEL_ELASTIC_UI.theme];

                        //rcmail.env.animation_enabled = !(rcmail.env.animation_enabled ?? current.animation_enabled_by_default);

                        for (const key in MEL_ELASTIC_UI.themes) {
                            if (Object.hasOwnProperty.call(MEL_ELASTIC_UI.themes, key)) {
                                const element = MEL_ELASTIC_UI.themes[key];
        
                                if (!!element.animation_class) $('body').removeClass(element.animation_class);
                            }
                        }

                        if (!!current.animation_class){
                            if (rcmail.env.animation_enabled ?? current.animation_enabled_by_default) {
                                $('body').addClass(current.animation_class);
                                $('#rcmfd-toggle-anims')[0].checked = false;
                            }
                            else $('#rcmfd-toggle-anims')[0].checked = true;
                        }
                    }
                );

                rcmail.set_busy(false, 'loading', busy);
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
                            $('#rcmfd_hide_chat').prop("checked", true);
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
                            $('#rcmfd_hide_chat').prop("checked", false);
                        }
                    }
                );
            }, true);

            rcmail.register_command('chat-notification-action', async (args) => {
                const {url, id} = args;
                const Manager = await ChatHelper.Manager();

                await Manager.change_frame('discussion', {update:false});
                Manager.goToRoom(`/${url}/${id}`);

            }, true);

            rcmail.register_command('update_mail_css', (args) => {
                const {key, value} = args;

                MEL_ELASTIC_UI.update_mail_css_async({key, value});

                for (const iterator of top.$('iframe.mm-frame')) {
                    var $frame = $(iterator);

                    if (!$frame.hasClass('discussion-frame')) {
                        $frame = null;
                        if (!!iterator.contentWindow?.MEL_ELASTIC_UI) {
                            iterator.contentWindow.MEL_ELASTIC_UI.update_mail_css({key, value});
                        }
                    }

                    if (!!$frame) $frame = null;
                }


            }, true);

            rcmail.register_command('refresh_extwin', async args => {
                const {key, value} = args;
                const helper = await load_helper();

                rcmail.env.compose_extwin = value;

                let frame_mail = helper.select_frame('mail');
                if (frame_mail.length > 0) frame_mail[0].contentWindow.rcmail.env.compose_extwin = value;

            }, true);

            rcmail.register_command('set_font_size', async args => {
                const {key, value} = args;
                const helper = await load_helper();

                rcmail.env['font-size'] = value;

                MEL_ELASTIC_UI.set_font_size();


                for (const iterator of helper.select_frame_except('discussion')) {
                    if (!!iterator.contentWindow?.MEL_ELASTIC_UI) {
                        iterator.contentWindow.rcmail.env['font-size'] = value;
                        iterator.contentWindow.MEL_ELASTIC_UI.set_font_size();
                    }
                }
            }, true);

            rcmail.register_command('updateMainNavDep', async args => {
                if (top.$('#layout-menu').hasClass('main-nav-cannot-deploy')) top.rcmail.env.main_nav_can_deploy = true;
                else top.rcmail.env.main_nav_can_deploy = false;
                
                top.MEL_ELASTIC_UI.update_main_nav_meca();
            }, true);

            rcmail.register_command('updateScollBarMode', async args => {
                const {key, value} = args;
                const helper = await load_helper();

                rcmail.env.mel_metapage_mail_configs = value;

                MEL_ELASTIC_UI.updateScollBarMode();


                for (const iterator of helper.select_frame_except('discussion')) {
                    if (!!iterator.contentWindow?.MEL_ELASTIC_UI) {
                        iterator.contentWindow.rcmail.env.mel_metapage_mail_configs = value;
                        iterator.contentWindow.MEL_ELASTIC_UI.updateScollBarMode();
                    }
                }
            }, true);

            if ('calendar' === rcmail.env.task)
            {
                rcmail.register_command('redraw_aganda', async settings => {
                    const loader = module_loader();
                    const helper = await load_helper();
                    const MelCalendar = (await loader('mel_metapage', 'main.js', '/js/lib/calendar/')).MelCalendar;

                    rcmail.env.calendar_settings = settings;
                    await MelCalendar.rerender({
                        helper_object:helper,
                        action_list:[
                            MelCalendar.create_action('destroy'),
                        ]
                    });

                    cal = new rcube_calendar_ui($.extend(rcmail.env.calendar_settings, rcmail.env.libcal_settings));
                    CalendarPageInit(false);
                    cal_elastic_mod();

                    await MelCalendar.rerender({helper_object:helper});

                }, true);
            }
            else {
                rcmail.register_command('redraw_aganda', async args => {
                    const {key, value:settings} = args;
                    const helper = await load_helper();

                    helper.select_frame('calendar')[0].contentWindow.rcmail.command('redraw_aganda', settings);
                }, true);
            }

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


    })(); //
}