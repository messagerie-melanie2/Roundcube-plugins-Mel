$(document).ready(async () => {
    // debugger;
    const BnumConnector = await module_helper_mel.BnumConnector();

    let config = BnumConnector.connectors.settings_da_set_email_recup.needed;
    config._val = 'delphin.tommy@gmail.com';
    await BnumConnector.connect(BnumConnector.connectors.settings_da_send_otp_token, {
        params:config,
    });
});