import { MelHtml } from "../../../../mel_metapage/js/lib/html/JsHtml/MelHtml.js";

const RotomecaHtml = MelHtml.start;

function input_style() {
    return 'width:150px;';
}

function button_code_forgotten(...args) {
    const [update_page] = args;
    return MelHtml.start
    .card_link({onclick:update_page}).accessibilty_setup_button({}).text('Impossible d\'utiliser son code ?').end();
}

async function update_page() {
    if ($('#resend-container').length > 0) $('#resend-container').show();
    else {
        const page = await MelHtml.load_page('resend', 'mel_doubleauth');
        $('#mel-login-form').append(page.generate());
    }

    $('#main-login-card').css('display', 'none');
}

export const page = MelHtml.write(
    /**
     * 
     * @param {RotomecaHtml} html 
     */
    function(html, ...args) {
        const [input_style, button_code_forgotten, update_page] = args;

        const js_html = 
        html.tr()
                .td({colspan:2, align:'center'})
                    .text('two_step_verification_form', 'mel_doubleauth')
                .end('td')
            .end('tr')
            .tr()
                .td({colspan:2, align:'center'})
                    .label({for:'2FA_code'}).css('display', 'none')
                        .text('Code 2FA')
                    .end()
                    .input_text({id:'2FA_code', placeholder:'Code généré', name:'_code_2FA', style:input_style, size:10, autocapitalize:'off', autocomplete:'off', maxlength:10})
                .end('td')
            .end('tr');

        return {
            js_html,
            button_code_forgotten: button_code_forgotten.bind(window, update_page)
        };

    },
    input_style, button_code_forgotten, update_page
)