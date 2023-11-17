import { Connector } from "./connector.js";

/**
 * 
 * @param {{datas: any | null, has_error: boolean, error: any | null}} data 
 * @param {Connector} connector 
 * @returns {{datas: {set:*, sent:boolean}, has_error: boolean, error: any | null}}
 */
export async function settings_da_set_email_recup(data, connector) {
    if (!data.has_error && !!connector.needed?._send_mail) {
        const result = await new Connector('settings', 'plugin.mel.doubleauth.send_otp', {
            type:Connector.enums.type.post
        }).force_connect({default_return: false});

        data.datas = {
            set: data.datas,
            sent: result
        };

        if (!result) {
            data.datas.set = null;
            data.datas.sent = false;
            data.has_error = true;
            data.error = 'Impossible d\'envoyer le message !';
        }
    }

    return data;
}

export async function m_mail_toggle_favorite(data, connector) {
    if (data.params._state === false) {
        let promises = [];
        const split = data.params._folder.split('/');

        let last = '';
        for (let index = 0, len = split.length; index < len; ++index) {
            const element = last + split[index];
            var promise = new Connector('mail', 'plugin.mel_metapage.toggle_display_folder', {
                type:Connector.enums.type.post,
                params:{
                    _state:false,
                    _folder:element
                }
            }).connect({});

            promises.push(promise);
            promise = null;
            last += element + '/';
        }

        const array_of_data = await Promise.allSettled(promises);

        data = array_of_data[array_of_data.length - 1];
    }

    return data;
}