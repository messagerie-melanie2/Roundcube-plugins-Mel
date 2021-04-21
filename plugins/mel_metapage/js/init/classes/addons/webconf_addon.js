(() => {

    function webconf_is_active()
    {
        return window.webconf_master_bar !== undefined;
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
            }
            mel_metapage.Functions.call("$('.tiny-rocket-chat').css('display', 'none')", false);
            mel_metapage.Functions.call(() => {
                if (window.create_popUp !== undefined)
                    window.create_popUp.close();
            }, false);
            await mel_metapage.Functions.change_frame('webconf', true, true, config);
        }
    }

    if (window.Webconf !== undefined)
        window.Webconf.helpers = {
            go:go_to_webconf,
            already:webconf_is_active
        };
    window.webconf_helper = {
        go:go_to_webconf,
        already:webconf_is_active
    };

})();