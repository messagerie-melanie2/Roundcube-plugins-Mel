
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


if (rcmail)
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

    //Response after
    rcmail.addEventListener("responseafter", (props) => {
        if (props.response && props.response.action == 'plugin.alarms')
            rcmail.triggerEvent(mel_metapage.EventListeners.calendar_updated.get);


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

    rcmail.addEventListener("init", () => {
        $('[data-popup]').each((i,e) => {
            $(e).on("show.bs.popover", () => {
                $(e).attr("aria-expanded", "true");
            })
            .on("hide.bs.popover", () => {
                $(e).attr("aria-expanded", "false");
            })
        });
    })

    rcmail.addEventListener('contextmenu_init', function(menu) {
        // identify the folder list context menu
        if (menu.menu_name == 'messagelist') {

          // add a shortcut to the folder management screen to the end of the menu
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

      //$(window).on("resize", resize_mail);
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

      $(document).ready(async () => {
        if (rcmail.env.task === "mail" && (rcmail.env.action === "" || rcmail.env.action === "index"))
        {
            new ResizeObserver(resize_mail).observe($("#layout-content")[0]);
            resize_mail();
        }

      });
    

}

