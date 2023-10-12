import { Connector } from "./connector.js";
import { settings_da_set_email_recup } from "./functions.js";
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
    settings_da_send_otp_token: new Connector('settings', 'plugin.mel.doubleauth.send_otp', {type:Connector.enums.type.post})
  
};



