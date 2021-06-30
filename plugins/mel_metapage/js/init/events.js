
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

}

