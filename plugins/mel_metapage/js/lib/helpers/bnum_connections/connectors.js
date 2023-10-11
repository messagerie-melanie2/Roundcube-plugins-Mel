import { Connector } from "./connector.js";
export { connectors as Connectors };

const connectors = {
    settings_da_get_email_recup: Connector.in_work(),
    settings_da_set_email_recup: Connector.in_work(),
    settings_da_set_token_otp: Connector.in_work(),
    settings_da_have_token_otp: Connector.in_work(),
    settings_da_have_token_expired: Connector.in_work(),
};



