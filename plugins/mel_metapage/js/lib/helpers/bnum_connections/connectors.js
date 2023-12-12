import { Connector } from "./connector.js";
import { settings_da_set_email_recup, m_mail_get_favorites_colors } from "./functions.js";
export { connectors as Connectors };

const connectors = {
    settings_da_get_email_recup: new Connector('settings', 'plugin.mel.doubleauth.get', {params:{_prop:'double_authentification_adresse_recuperation'}}),
    settings_da_get_email_valid: new Connector('settings', 'plugin.mel.doubleauth.get', {params:{_prop:'double_authentification_adresse_valide'}}),
    settings_da_set_email_recup: new Connector('settings', 'plugin.mel.doubleauth.set', {
                                                                                            type: Connector.enums.type.post,
                                                                                            params:{_prop:'double_authentification_adresse_recuperation'},
                                                                                            needed:{_val:'email', _send_mail:true},
                                                                                            moulinette: settings_da_set_email_recup
                                                                                        }),
    settings_da_set_token_otp: new Connector('settings', 'plugin.mel.doubleauth.verify_code', {
                                                                                                type: Connector.enums.type.post,
                                                                                                needed:{_token:'token'}
                                                                                              }),
    settings_da_send_otp_token: new Connector('settings', 'plugin.mel.doubleauth.send_otp', {type:Connector.enums.type.post}),
    settings_da_get_recovery_code_max: new Connector('settings', 'plugin.mel.doubleauth.get', {params:{_prop:'NUMBER_RECOVERY_CODES'}}),

    mail_toggle_favorite: new Connector('mail', 'plugin.mel_metapage.toggle_favorite', {
                                                                                            type:Connector.enums.type.post,
                                                                                            needed:{_folder:'folder', _state:false}//,
                                                                                            //moulinette: m_mail_toggle_favorite
                                                                                        }),
    mail_toggle_display_folder: new Connector('mail', 'save-pref', {
                                                                        type:Connector.enums.type.post,
                                                                        params:{_name:'favorite_folders_collapsed',_remote:"1"},
                                                                        needed:{_value:''}
                                                                    }),
    mail_get_favorite_folder: new Connector('mail', 'plugin.mel_metapage.get_favorite_folders', {
                                                                                                    type:Connector.enums.type.post
                                                                                                }),
    mail_set_folder_color: new Connector('mail', 'plugin.mel_metapage.set_folder_color', {
                                                                                            type:Connector.enums.type.post,
                                                                                            needed:{_folder:'', _color:''}
                                                                                        }),
    mail_get_folders_color: new Connector('mail', 'plugin.mel_metapage.get_folders_color', {
                                                                                            type:Connector.enums.type.post,
                                                                                            moulinette: m_mail_get_favorites_colors
                                                                                        }),
};



