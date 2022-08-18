(() => {

    function webconf_is_active()
    {
        return window.webconf_master_bar !== undefined || parent.webconf_master_bar !== undefined;
    }

    async function go_to_webconf(key = null, wsp = null, ariane = null, show_config_popup = false)
    {
        if (!webconf_is_active())
        {
            top.m_mp_close_ariane();
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

    async function getWebconfPhoneNumber(webconf)
    {
        const url = `https://voxapi.joona.fr/api/v1/conn/jitsi/phoneNumbers?conference=${webconf}@conference.webconf.numerique.gouv.fr`;
        let phoneNumber = null;
        await mel_metapage.Functions.get(
            url,
            {},
            (datas) => {
                const indicator = rcmail.env['mel_metapage.webconf_voxify_indicatif'];
                if (!!datas && datas.numbersEnabled && !!datas.numbers[indicator] && datas.numbers[indicator].length > 0) phoneNumber = datas.numbers[indicator][0];
            }
        );

        return phoneNumber;
    }

    async function getWebconfPhonePin(webconf)
    {
        const url = `https://voxapi.joona.fr/api/v1/conn/jitsi/conference/code?conference=${webconf}@conference.webconf.numerique.gouv.fr`;
        let phoneNumber = null;
        await mel_metapage.Functions.get(
            url,
            {},
            (datas) => {
                if (!!datas && !!datas.id ) phoneNumber = datas.id;
            }
        );

        return phoneNumber;
    }

    window.webconf_helper = {
        go:go_to_webconf,
        already:webconf_is_active,
        notify:notify,
        phone:{
            get:getWebconfPhoneNumber,
            pin:getWebconfPhonePin,
            async getAll(webconf){
                const datas = await Promise.allSettled([this.get(webconf), this.pin(webconf)]);

                return {
                    number:datas[0].value,
                    pin:datas[1].value
                }
            }
        }
    };

})();