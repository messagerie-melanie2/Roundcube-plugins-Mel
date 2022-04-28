(() => {

    function webconf_is_active()
    {
        return window.webconf_master_bar !== undefined || parent.webconf_master_bar !== undefined;
    }

    async function go_to_webconf(key = null, wsp = null, ariane = null, show_config_popup = false)
    {
        if (!webconf_is_active())
        {
            if ((parent !== window ? parent : window).$(".webconf-frame").length > 0)
                (parent !== window ? parent : window).$(".webconf-frame").remove();

            let config = null;
            if (key != null || wsp !== null || ariane !== null || show_config_popup)
            {
                config = {};
                if (key !== null) config["_key"] = key;

                if (wsp !== null) config["_wsp"] = wsp;
                else if (ariane !== null) config["_ariane"] = ariane;
                
                if (show_config_popup) config['_need_config'] = 1;

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
            rcmail.display_message(rcmail.gettext('webconf_already_running', 'mel_metapage'), "warning");
        }
    }

    async function notify(key, uid)
    {
        let $config = {
            _link:mel_metapage.Functions.url("webconf", "", {
                _key:key,
                _wsp:uid
            }).replace(`&${rcmail.env.mel_metapage_const.key}=${rcmail.env.mel_metapage_const.value}`, ''),
            _uid:uid
        };

        return mel_metapage.Functions.post(
            mel_metapage.Functions.url("webconf", "notify"),
            $config
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