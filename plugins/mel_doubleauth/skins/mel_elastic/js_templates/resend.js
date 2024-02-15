import { EMPTY_STRING } from "../../../../mel_metapage/js/lib/constants/constants.js";
import { BnumConnector } from "../../../../mel_metapage/js/lib/helpers/bnum_connections/bnum_connections.js";
import { MelHtml } from "../../../../mel_metapage/js/lib/html/JsHtml/MelHtml.js";
import { MainIconHtml } from "../../../../mel_metapage/js/lib/html/html_icon.js";
import { MelObject } from "../../../../mel_metapage/js/lib/mel_object.js";

const RotomecaHtml = MelHtml.start;

function help(text) {
    return new MainIconHtml('help', {title:text}, {}).addClass('cursor-help').addClass('ml-2').toString();
}

function show_address() {
    const CHAR_ENCODED = '*';
    const CHAR_AT = '@';
    const splitted = rcmail.env.double_authentification_adresse_recuperation.split(CHAR_AT);

    let mail = [];
    for (let index = 0, len = splitted[0].length; index < len; ++index) {
        const element = splitted[0][index];
        
        if ((len > 3 && index >= 3) || (len <= 3 && len > 1 && index > 1)) {
            mail.push(CHAR_ENCODED);
        }
        else mail.push(element);
    }

    mail.push(CHAR_AT);
    mail.push(splitted[1]);

    mail = mail.join(EMPTY_STRING);
    
    return `Votre adresse de récupération est : ${mail}`;
}

function back() {
    $('#resend-container').hide();
    $('#main-login-card').show();
}

function connect() {
    rcmail.set_busy(true, 'loading');
    $('button').addClass('disabled').attr('disabled', 'disabled');

    const val = $('#resend-username').val();

    (top ?? parent ?? window).location.href = MelObject.Empty().url('login', {action:'plugin.da.try_connect', params:{_token:val}});
}

async function send_code() {
    const busy = rcmail.set_busy(true, 'loading');
    $('button').addClass('disabled').attr('disabled', 'disabled');
    const sent = await BnumConnector.force_connect(BnumConnector.connectors.settings_da_send_otp_token, {});

    if (-1 === sent) {}
    else {
        rcmail.display_message('Message envoyé !', 'confirmation');
        $('#mind-card').hide();
        $('#resend-card').show();
    }

    rcmail.set_busy(false, 'loading', busy);
    $('button').removeClass('disabled').removeAttr('disabled');
}

MelHtml.extend('resend_page_mind_guard', function ({
    //icon = (name) => 'icon',
    show_address = () => '',
    back = () => null,
    next = () => null
}) {
    return this.card({id:'mind-card', class:'clear'})
        .card_title({for:'mind-card', class:'hidden'})
            .text('Garde fou')
        .end()
        .card_body({class:'mel_correction'})
            .p().css('text-align', 'center')
                .text('Pour recevoir un code de validation sur votre ')
                .span({class:'cursor-help border-bottom border-dark', title:show_address})
                    .text('adresse de récupération')
                .end()
                .text(', cliquez sur le bouton ci-dessous.')
            .end()
            .div({class:'mind-card-footer'}).css({display:'flex', 'justify-content': 'center'})
                .mel_button({onclick:back})
                    .span().css('vertical-align', 'super')    
                        .text('Retour')
                    .end()
                    .icon('undo', {class:'ml-4'}).end()
                .end()
                .mel_button({class:'ml-2', onclick:next})
                    .span().css('vertical-align', 'super')    
                        .text('Envoyer le code')
                    .end()
                    .icon({class:'ml-4'}).text('send').end()
                .end()
            .end()
        .end()
    //.end();
});


MelHtml.extend('resend_page_code', function({
    help_text = (text) => 'Placeholder',
    send_code = () => null,
    connect = () => null
}) {
    return this.card({id:'resend-card', class:'clear'})
        .card_title({for:'resend-card', class:'hidden'})
            .text('Saisir le code reçu')
        .end()
        .card_body({class:'mel_correction'})
            .form().css('text-align', 'center')
                .h6()
                    .label({for:'resend-username'})
                        .text('Saisissez le code reçu par mail')
                        .text(help_text.bind(this, 'Vous avez reçu un mail avec un code de confirmation sur votre adresse de récupération.\r\nIl s\'agit d\'un code à 6 chiffres.'))
                    .end('label')
                .end()
                .input({id:'resend-username', style:'max-width:150px', type:'text', placeholder:'0 0 0 0 0 0'}).css('text-align','center').center()
                .div({class:'resend-card-footer'}).css('width', '100%')
                    .mel_button({type:'button', onclick: send_code})
                        .span().css('vertical-align', 'super')
                            .text('Renvoyer un code')
                        .end()
                        .icon({class:'ml-4'})
                            .text('send')
                        .end()
                    .end('mel-button')
                    .mel_button({type:'button', class:'ml-2', onclick:connect})
                        .span().css('vertical-align', 'super')
                            .text('Connexion')
                        .end()
                        .icon({class:'ml-4'})
                            .text('login')
                        .end()
                    .end('mel-button')
                .end('resend-card-footer')
            .end('form')
        .end('card-body')
});

export const page = MelHtml.write(
    /**
     * Fonction qui génère le js html.
     * @param {RotomecaHtml} html Html parent
     * @param  {...any} args arguments de la fonction
     */
    function (html, ...args) {
        const [help_text, show_address, back, send_code, connect] = args;

        const jsHtml = 
        html.div({id:"resend-container"})
            .resend_page_mind_guard({show_address, back, next:send_code}).end()
            .resend_page_code({help_text, send_code, connect}).css('display', 'none').end()
        .end();

        return jsHtml;
    }
    , help, show_address, back, send_code, connect
);