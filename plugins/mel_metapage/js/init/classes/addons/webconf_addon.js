(() => {

    function webconf_is_active()
    {
        return window.webconf_master_bar !== undefined || parent.webconf_master_bar !== undefined;
    }

    async function go_to_webconf(key = null, wsp = null, ariane = null)
    {
        if (!webconf_is_active())
        {
            if ($(".webconf-frame").length > 0)
                $(".webconf-frame").remove();

            let config = null;
            if (key != null || wsp !== null || ariane !== null)
            {
                config = {};
                if (key !== null)
                    config["_key"] = key;
                if (wsp !== null)
                    config["_wsp"] = wsp;
                else if (ariane !== null)
                    config["_ariane"] = ariane;

                config[rcmail.env.mel_metapage_const.key] = rcmail.env.mel_metapage_const.value;
            }
            mel_metapage.Functions.call("ArianeButton.default().hide_button()", false);
            mel_metapage.Functions.call(() => {
                if (window.create_popUp !== undefined)
                    window.create_popUp.close();
            }, false);
            await mel_metapage.Functions.change_frame('webconf', true, true, config);
        }
        else {
            rcmail.display_message("Une visioconférence est déja en cours, finissez celle en cours avant d'en démarrer une nouvelle !", "warning");
        }
    }

    async function notify(key, uid)
    {
        return mel_metapage.Functions.post(
            mel_metapage.Functions.url("workspace", "notify_chat"),
            {
                _uid:uid,
                _text:`@all\r\nUne webconference a débuté :\r\n- WebMail => ${mel_metapage.Functions.url("webconf", "", {
                    _key:key,
                    _wsp:uid
                }).replace(`&${rcmail.env.mel_metapage_const.key}=${rcmail.env.mel_metapage_const.value}`, '')}\r\n- Lien Classique => ${rcmail.env["webconf.base_url"] + "/" + key}`,
                _path:(window.location.origin + window.location.pathname).slice(0, (window.location.origin + window.location.pathname).length-1)
            }
        );
    }

    if (window.Webconf !== undefined)
        window.Webconf.helpers = {
            go:go_to_webconf,
            already:webconf_is_active,
            notify:notify
        };
    window.webconf_helper = {
        go:go_to_webconf,
        already:webconf_is_active,
        notify:notify
    };

})();