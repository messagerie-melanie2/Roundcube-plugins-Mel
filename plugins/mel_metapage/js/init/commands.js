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

            rcmail.register_command("event-compose", () => {
                const event = ui_cal.selected_event;
                parent.rcmail.open_compose_step({to:Enumerable.from(event.attendees).select(x => x.email).toArray().join(',')});
            }, true);

            rcmail.register_command("event-self-invitation", () => {
                const event = ui_cal.selected_event;
                rcmail.env.uid = event.uid;
                rcube_libcalendaring.add_from_itip_mail('2:0', 'calendar', 'accepted', 'CFB1D9A7EC3F1B7C0E5CC3FAF2216EFF-5A655EB2FC8340E2')
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

            rcmail.register_command("event.click", (params, obj, event) => {
                rcmail.triggerEvent("event.click", {
                    params,
                    obj,
                    e:event
                });
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
                        const key = Enumerable.from($("#taskmenu .selected")[0].classList).where((x) => !_includes.includes(x) && !x.includes("icofont") && !x.includes("icon-mel-") && !x.includes("button")).first();
                        rcmail.env.current_frame_name = key;
                        parent = $(`.${mm_st_ClassContract(key)}-frame`);

                    }

                    parent.remove();

                    mel_metapage.Functions.change_frame(rcmail.env.current_frame_name, false, true).then(() => {  
                        const contract = mm_st_ClassContract(rcmail.env.current_frame_name);
                        //console.log("rcmail.env.current_frame_name", rcmail.env.current_frame_name, contract, $(`iframe.${contract}-frame`), `${url}${(url[url.length-1] === '&' ? '' : '&')}_is_from=iframe`);                     
                        $(`iframe.${contract}-frame`)[0].src = `${url}${(url[url.length-1] === '&' ? '' : '&')}_is_from=iframe`;
                        rcmail.set_busy(false);
                        rcmail.clear_messages();
                        mel_metapage.Functions.change_frame(rcmail.env.current_frame_name, true);
                    });
                    

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

                            $(".toggleChatCommand").html("Cacher la bulle de discussion");
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
                            $(".toggleChatCommand").html("Afficher la bulle de discussion");
                        }
                    }
                );
            }, true);

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