var inputTimeout = null;

window.onload = function() {
    onInputChange();

    var onclickFunc = function(evt) {
        if (this.parentNode.classList.contains('visible'))
            this.parentNode.classList.remove('visible');
        else
            this.parentNode.classList.add('visible');
    };
    if (document.getElementById('input-links').getElementsByClassName('anchor').length) {
        document.getElementById('input-links').getElementsByClassName('anchor')[0].onclick = onclickFunc;
    }
};

if (window.rcmail) {
    // Call refresh panel
    rcmail.addEventListener('responseafterplugin.save_signature', function(evt) {
        if (evt.response.success) {
            rcmail.display_message(rcmail.get_label('mel_signatures.savesignaturesuccess'), 'confirmation');
        }
        else {
            rcmail.display_message(rcmail.get_label('mel_signatures.savesignatureerror'), 'error');
        }
    });
}

/**
 * On input change event refresh signature html
 */
function onInputChange() {
    if (inputTimeout) {
        clearTimeout(window.inputTimeout);
    }
    window.inputTimeout = setTimeout(() => {
        let html = getSignatureHTML();
        document.querySelector("#settings-right .usersignature .sign").innerHTML = html;
        document.getElementById("signature_html").value = html;
    }, 300);
}

/**
 * Copier la signature dans le presse papier
 */
function copy_signature() {
    document.querySelector("#signature_html").style.display = 'block';
    document.querySelector("#signature_html").select();
    let success = document.execCommand("copy");
    if (success) {
        rcmail.display_message(rcmail.get_label('mel_signatures.signaturecopiedmessage'), 'confirmation');
        document.querySelector("#copy-to-clipboard").value = rcmail.get_label('mel_signatures.signaturecopied');
        setTimeout(() => {
            document.querySelector("#copy-to-clipboard").value = rcmail.get_label('mel_signatures.clictocopy');
        }, 1000);
    }
}

/**
 * Activer la modification de la signature
 */
function modify_signature() {
    var x = document.querySelector(".userinfos");
    if (x.style.display === "block") {
        x.style.display = "none";
    } else {
        x.style.display = "block";
    }
}

/**
 * Enregistrement de la signature dans la conf Roundcube
 */
function use_signature() {
    var close_fn = function() { $(this).dialog('close'); };

    rcmail.show_popup_dialog(
        $('#identities-dialog'), 
        rcmail.get_label('mel_signatures.identitiesdialogtitle'),
        [{
            text: rcmail.get_label('mel_signatures.save'),
            'class': 'mainaction',
            click: function() {
                $(this).dialog('close');
                var identities = [];
                var checkboxes = document.querySelectorAll('#identities-list .list input.mailbox');
                for (var i=0; i < checkboxes.length; i++) {
                    if (checkboxes[i].checked) {
                        identities.push(checkboxes[i].value);
                    }
                }
                rcmail.http_post('settings/plugin.save_signature', {
                                _signature: document.querySelector("#signature_html").value,
                                _identities: identities
                            },
                            rcmail.set_busy(true, 'mel_signatures.savingsignature'));
            }
        },
        {
            text: rcmail.get_label('mel_signatures.cancel'),
            click: close_fn
        }],
        {close: close_fn}
    );
}

/**
 * Téléchargement de la signature dans un fichier HTM pour Outlook
 */
function download_signature_outlook_htm() {
    // HTML for Outlook
    var html = '<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">';
    html += '<head>';
    html += '<meta content="text/html; charset=utf-8" http-equiv="Content-Type">';
    html += '</head>';
    html += '<body lang=FR style="font-size:10pt;font-family:Arial,Helvetica,sans-serif;">';
    html += getSignatureHTML(true, '', true);
    html += '</body>';
    html += '</html>';
    download('signature.htm', html);
}

/**
 * Téléchargement de la signature dans un fichier zip pour Outlook
 */
function download_signature_outlook_zip() {
    // HTML for Outlook
    var html = '<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">';
    html += '<head>';
    html += '<meta content="text/html; charset=utf-8" http-equiv="Content-Type">';
    html += '</head>';
    html += '<body lang=FR style="font-size:10pt;font-family:Arial,Helvetica,sans-serif;">';
    html += getSignatureHTML(false, '', true);
    html += '</body>';
    html += '</html>';

    // Create the zip file
    var zip = new JSZip();

    // Add HTM file to zip
    zip.file("signature.htm", html);

    // Images folder
    var img = zip.folder("images");
    let select = document.getElementById("input-logo");

    // Add images files
    img.file("marianne.png", rcmail.env.logo_sources['images/marianne.gif'].replace('data:image/png;base64,', ''), { base64: true });
    img.file("devise.png", rcmail.env.logo_sources['images/devise.gif'].replace('data:image/png;base64,', ''), { base64: true });
    img.file(select.value.replace('images/', ''), rcmail.env.logo_sources[select.value].replace('data:image/png;base64,', ''), { base64: true });

    // Download zip to browser
    zip.generateAsync({type:"base64"})
        .then(function(content) {
            download('signature.zip', content, 'data:application/zip;base64');
        });
}

/**
 * Téléchargement de la signature dans un fichier HTM pour Outlook
 */
function download_signature_thunderbird() {
    var html = '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN">';
    html += '<HTML><HEAD><TITLE>Email Signature</TITLE>';
    html += '<META content="text/html; charset=utf-8" http-equiv="Content-Type">';
    html += '</HEAD>';
    html += '<BODY style="font-size:10pt;font-family:Arial,Helvetica,sans-serif;">';
    html += getSignatureHTML();
    html += '</BODY>';
    html += '</HTML>';
    download('signature.html', html);
}

/**
 * Check/uncheck all identities checkbox
 */
function checkAllIdentities(source) {
    var checkboxes = document.querySelectorAll('#identities-list .list input.mailbox');
    for (var i=0; i < checkboxes.length; i++) {
      checkboxes[i].checked = source.checked;
    }
}
/**
 * Uncheck "all mailboxes" when uncheck mailbox
 */
function checkOneIdentity(source) {
    if (!source.checked && document.querySelector('#identities-list .list input#checkbox-all-mailboxes').checked) {
        document.querySelector('#identities-list .list input#checkbox-all-mailboxes').checked = false;
    }
}

/**
 * Generate HTML signature from template HTML
 * 
 * return HTML
 */
function getSignatureHTML(embeddedImage = true, images_url = "", isOutlook = false) {
    let signature_html = '';
    if (isOutlook) {
        signature_html = document.getElementById("signature_outlook_template").innerHTML;
    }
    else {
        signature_html = document.getElementById("signature_template").innerHTML;
    }
    // User name
    signature_html = signature_html.replace('%%TEMPLATE_NAME%%', document.getElementById("input-nom").value);

    // User job
    let jobtitle = document.getElementById("input-fonction").value;
    signature_html = signature_html.replace('%%TEMPLATE_JOBTITLE%%', jobtitle ? jobtitle + '<br>' : '');

    // User address
    let address = document.getElementById("input-address").value.replace(/(\r\n|\n|\r)/gm," ");
    signature_html = signature_html.replace('%%TEMPLATE_ADDRESS%%', address ? address + '<br>' : '');

    // User office
    let office = document.getElementById("input-bureau").value;
    signature_html = signature_html.replace('%%TEMPLATE_OFFICE%%', office ? office + '<br>' : '');

    // Phone
    let phone = document.getElementById("input-fixe").value;
    let mobile = document.getElementById("input-mobile").value;
    phone = formatPhoneNumber(phone);
    document.getElementById("input-fixe").value = phone;
    mobile = formatPhoneNumber(mobile);
    document.getElementById("input-mobile").value = mobile;
    if (phone && mobile) {
        signature_html = signature_html.replace('%%TEMPLATE_PHONE%%', rcmail.get_label('mel_signatures.phonephone') + phone + ' - ' + rcmail.get_label('mel_signatures.mobilephone') + mobile + '<br>');
    }
    else if (phone) {
        signature_html = signature_html.replace('%%TEMPLATE_PHONE%%', rcmail.get_label('mel_signatures.phonephone') + phone + '<br>');
    }
    else if (mobile) {
        signature_html = signature_html.replace('%%TEMPLATE_PHONE%%', rcmail.get_label('mel_signatures.mobilephone') + mobile + '<br>');
    }
    else {
        signature_html = signature_html.replace('%%TEMPLATE_PHONE%%', '');
    }

    // Service
    let service = document.getElementById("input-service").value;
    signature_html = signature_html.replace('%%TEMPLATE_SERVICE%%', service ? service + '<br>' : '');
    signature_html = signature_html.replace(/%%TEMPLATE_DIRECTION%%/g, document.getElementById("input-department").value);

    // Gestion des liens
    let checkboxes = document.querySelectorAll("#input-links input");
    let links = "";
    if (document.getElementById("checkbox-custom-link").checked) {
        document.querySelector(".grid-form .custom-link").style.display = 'block';
        let customlink = document.getElementById("input-custom-link").value;
        let a = document.createElement('a');
        a.style = "color:#000000;font-size:8pt;font-family: Arial,sans-serif; font-weight : bold;";
        if (customlink.indexOf('://') === -1) {
            a.href = 'http://' + customlink;
        }
        else {
            a.href = customlink;
        }
        a.innerText = customlink;
        links += a.outerHTML + '<br>';
    }
    else {
        document.querySelector(".grid-form .custom-link").style.display = 'none';
    }
    for (const checkbox of checkboxes) {
        if (checkbox.checked && checkbox.id != 'checkbox-custom-link') {
            let a = document.createElement('a');
            a.style = "color:#000000;font-size:8pt;font-family: Arial,sans-serif; font-weight : bold;";
            a.href = checkbox.value;
            a.innerText = rcmail.env.signature_links[checkbox.value];
            links += a.outerHTML + '<br>';
        }
    }
    signature_html = signature_html.replace('%%TEMPLATE_LINKS%%', links);

    // Logo de la signature
    let select = document.getElementById("input-logo");
    if (embeddedImage) {
        signature_html = signature_html.replace('%%TEMPLATE_LOGO%%', 
                createImage(rcmail.env.logo_sources[select.value], select.options[select.selectedIndex].text, isOutlook));
    }
    else {
        signature_html = signature_html.replace('%%TEMPLATE_LOGO%%', 
                createImage(images_url + select.value, select.options[select.selectedIndex].text, isOutlook));
    }

    // Logo Marianne
    let logo_marianne = 'images/marianne.gif';
    if (rcmail.env.logo_sources[logo_marianne]) {
        if (embeddedImage) {
            signature_html = signature_html.replace('%%TEMPLATE_LOGO_MARIANNE%%', 
                    createImage(rcmail.env.logo_sources[logo_marianne], 'Marianne', isOutlook));
        }
        else {
            if (isOutlook) {
                logo_marianne = 'images/marianne.jpg';
            }
            signature_html = signature_html.replace('%%TEMPLATE_LOGO_MARIANNE%%', 
                    createImage(images_url + logo_marianne, 'Marianne', isOutlook));
        }
    }

    // Logo Devise
    let logo_devise = 'images/devise.gif';
    if (rcmail.env.logo_sources[logo_devise]) {
        if (embeddedImage) {
            signature_html = signature_html.replace('%%TEMPLATE_LOGO_DEVISE%%', 
                    createImage(rcmail.env.logo_sources[logo_devise], 'Liberté, Égalité, Fraternité', isOutlook));
        }
        else {
            if (isOutlook) {
                logo_devise = 'images/devise.jpg';
            }
            signature_html = signature_html.replace('%%TEMPLATE_LOGO_DEVISE%%', 
                    createImage(images_url + logo_devise, 'Liberté, Égalité, Fraternité', isOutlook));
        }
    }
    
    return signature_html.replace(/(\r\n|\n|\r)/gm,"").trim();
}

/**
 * Retour le HTML d'une image en fonction de la source et du alt
 * Pour Outlook fourni en plus du vml de l'image
 */
function createImage(src, alt, isOutlook = false) {
    let html = '';
    let img = document.createElement('img');
    img.src = src;
    img.alt = alt;
    
    // if (isOutlook) {
    //     // Pour Outlook ajouter des balise <v:image>
    //     html += '<!--[if gte vml 1]>';
    //     html += '<v:imagedata src="'+src+'" o:title="'+escape(alt)+'"/>';
    //     html += '<![endif]-->';
    //     html += '<![if !vml]>';
    //     html += img.outerHTML;
    //     html += '<![endif]>';
    // }
    // else {
    html = img.outerHTML;
    // }
    return html;
}

/**
 * Formatte le numéro de téléphone au format français
 */
function formatPhoneNumber(number) {
    let indicatifList = ['+33', '+262', '+269', '+508', '+590', '+594', '+596', '+681', '+687', '+689'];
    if (number.indexOf('+') === 0 && number.indexOf(' ') === -1) {
        for (const iterator of indicatifList) {
            if (number.indexOf(iterator) === 0) {
                number = number.replace(iterator, '');
                const first = number.substr(0, 1);
                number = number.substr(1);
                number = number.replace(/(.{2})/g, "$1 ");
                number = iterator + " " + first + " " + number;
                break;
            }
        }
    }
    else if (number.length === 10 && number.indexOf('0') === 0) {
        number = number.replace(/(.{2})/g,"$1 ");
    }
    return number.trim();
}

/**
 * Download file HTML from javascript
 */
function download(filename, text, type = 'text/html;charset=utf-8') {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:' + type + ',' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}