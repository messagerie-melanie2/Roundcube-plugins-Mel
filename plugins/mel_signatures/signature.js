var inputTimeout = null;
// Texte de la signature modifié directement dans la zone
let textEdited = false;
// État du formulaire lors de la dernière génération
let lastFormState = null;
// Dernière position du curseur dans la signature
let lastRange = null;

window.onload = function() {
    initSignatureEditor();

    if (rcmail.env.saved_signature) {
        showSavedSignature();
    }
    else {
        onInputChange();
    }

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
    // Touches sans effet sur le formulaire (Tab, flèches…) : rien à régénérer
    if (getFormState() === lastFormState) {
        return;
    }
    if (inputTimeout) {
        clearTimeout(window.inputTimeout);
    }
    window.inputTimeout = setTimeout(refreshSignature, 300);
}

/**
 * Valeurs actuelles du formulaire, pour savoir s'il a vraiment changé
 */
function getFormState() {
    return Array.prototype.map.call(
        document.querySelectorAll('.userinfos input, .userinfos textarea, .userinfos select'),
        function(field) {
            return field.type === 'checkbox' ? String(field.checked) : field.value;
        }
    ).join('\u0001');
}

/**
 * Zone d'affichage de la signature
 */
function getSignatureElement() {
    return document.querySelector('#settings-right .usersignature .sign');
}

/**
 * Branche les événements de la zone de signature modifiable
 */
function initSignatureEditor() {
    const sign = getSignatureElement();
    sign.addEventListener('input', markTextEdited);
    document.addEventListener('selectionchange', saveCursorPosition);
    sign.addEventListener('paste', pastePlainText);
    sign.addEventListener('dragover', function(evt) {
        evt.preventDefault();
    });
    sign.addEventListener('drop', function(evt) {
        evt.preventDefault();
    });
}

/**
 * Mémorise la position du curseur dans la signature
 * (le clic sur « Insérer une image » lui fait perdre le focus)
 */
function saveCursorPosition() {
    const selection = window.getSelection();
    if (selection.rangeCount && getSignatureElement().contains(selection.getRangeAt(0).commonAncestorContainer)) {
        lastRange = selection.getRangeAt(0).cloneRange();
    }
}

/**
 * Colle uniquement du texte brut, sans mise en forme ni image
 */
function pastePlainText(evt) {
    evt.preventDefault();
    const text = toPlainLetters(evt.clipboardData ? evt.clipboardData.getData('text/plain') : '');
    const fragment = document.createDocumentFragment();
    text.split(/\r\n|\n|\r/).forEach(function(line, index) {
        if (index > 0) {
            fragment.appendChild(document.createElement('br'));
        }
        fragment.appendChild(document.createTextNode(line));
    });
    textEdited = true;
    insertAtCursor(fragment, true);
}

/**
 * Remplace les lettres Unicode « stylées » (𝗴𝗿𝗮𝘀, 𝘪𝘵𝘢𝘭𝘪𝘲𝘶𝘦…) par des lettres normales
 */
function toPlainLetters(text) {
    return text.replace(/[\u{1D400}-\u{1D7FF}]/gu, function(character) {
        return character.normalize('NFKC');
    }).normalize('NFC');
}

/**
 * Insère un élément à l'endroit du curseur,
 * ou sur une nouvelle ligne à la fin de la signature s'il n'y a pas de curseur
 */
function insertAtCursor(node, replaceSelection) {
    const sign = getSignatureElement();
    const selection = window.getSelection();
    let range = null;
    if (selection.rangeCount && sign.contains(selection.getRangeAt(0).commonAncestorContainer)) {
        range = selection.getRangeAt(0);
    }
    else if (lastRange && sign.contains(lastRange.commonAncestorContainer)) {
        range = lastRange;
    }

    if (range) {
        if (replaceSelection) {
            range.deleteContents();
        }
        else {
            range.collapse(false);
        }
        const lastNode = node.nodeType === Node.DOCUMENT_FRAGMENT_NODE ? node.lastChild : node;
        range.insertNode(node);
        if (lastNode) {
            sign.focus();
            range.setStartAfter(lastNode);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }
    else {
        (sign.firstElementChild || sign).append(document.createElement('br'), node);
    }
    syncSignatureField();
}

/**
 * Le texte de la signature a été modifié directement
 */
function markTextEdited() {
    textEdited = true;
    syncSignatureField();
}

/**
 * Recopie la signature affichée dans le champ caché utilisé pour l'enregistrement
 */
function syncSignatureField() {
    const sign = getSignatureElement();
    if (sign.firstElementChild) {
        sign.firstElementChild.classList.toggle('signature-edited', textEdited);
    }
    document.getElementById('signature_html').value = sign.innerHTML.trim();
}

/**
 * Régénère la signature depuis le formulaire en gardant les images ajoutées à leur place
 */
function refreshSignature() {
    const images = collectAddedImages(getSignatureElement());
    resetSignature();
    reattachAddedImages(images);
    syncSignatureField();
}

/**
 * Régénère la signature depuis le formulaire, sans images ni modifications
 */
function resetSignature() {
    getSignatureElement().innerHTML = getSignatureHTML();
    textEdited = false;
    lastRange = null;
    lastFormState = getFormState();
    syncSignatureField();
}

/**
 * Relève les images ajoutées et ce qui les précède (logo ou texte),
 * pour pouvoir les remettre au même endroit
 */
function collectAddedImages(container) {
    return Array.prototype.map.call(container.querySelectorAll('img.signature-added-image'), function(img) {
        let anchorClass = null;
        let anchorText = null;
        let anchorRank = 0;
        let anchorPath = null;
        let anchorLine = 0;
        let newLine = false;
        for (let previous = img.previousSibling; previous; previous = previous.previousSibling) {
            if (previous.nodeType === Node.TEXT_NODE || (previous.nodeType === Node.ELEMENT_NODE
                    && !['BR', 'IMG'].includes(previous.tagName))) {
                if (previous.textContent.trim()) {
                    anchorText = previous.textContent.trim();
                    anchorRank = countTextBefore(container, previous, anchorText);
                    anchorPath = getElementPath(container, previous.parentNode);
                    anchorLine = countLineBreaksBefore(previous);
                    break;
                }
                continue;
            }
            if (previous.nodeType !== Node.ELEMENT_NODE) {
                continue;
            }
            if (previous.tagName === 'BR') {
                newLine = true;
                continue;
            }
            if (!previous.classList.contains('signature-added-image')) {
                anchorClass = previous.classList[0] || null;
                break;
            }
        }
        return {
            img: img,
            anchorClass: anchorClass,
            anchorText: anchorText,
            anchorRank: anchorRank,
            anchorPath: anchorPath,
            anchorLine: anchorLine,
            newLine: newLine,
        };
    });
}

/**
 * Nombre de fois où le même texte apparaît avant le repère
 * (un texte peut figurer plusieurs fois dans la signature)
 */
function countTextBefore(container, anchor, text) {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    let count = 0;
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (node === anchor || anchor.contains(node)) {
            break;
        }
        if (node.textContent.trim() === text) {
            count++;
        }
    }
    return count;
}

/**
 * Éléments enfants issus du modèle de signature (sans les images ajoutées)
 */
function getTemplateChildren(parent) {
    return Array.prototype.filter.call(parent.children, function(child) {
        return !child.classList.contains('signature-added-image');
    });
}

/**
 * Chemin d'un élément depuis le conteneur (position à chaque niveau)
 */
function getElementPath(container, element) {
    const path = [];
    for (let node = element; node && node !== container; node = node.parentElement) {
        path.unshift(getTemplateChildren(node.parentElement).indexOf(node));
    }
    return path;
}

/**
 * Retrouve l'élément désigné par un chemin de getElementPath
 */
function getElementByPath(container, path) {
    let node = container;
    for (const index of path) {
        node = getTemplateChildren(node)[index];
        if (!node) {
            return null;
        }
    }
    return node;
}

/**
 * Numéro de ligne d'un nœud dans son bloc (retours à la ligne avant lui)
 */
function countLineBreaksBefore(node) {
    let count = 0;
    for (let previous = node.previousSibling; previous; previous = previous.previousSibling) {
        if (previous.nodeName === 'BR') {
            count++;
        }
    }
    return count;
}

/**
 * Place les éléments à la fin de la ligne donnée d'un bloc
 */
function insertAtEndOfLine(block, line, nodes) {
    const lineBreak = Array.prototype.filter.call(block.childNodes, function(child) {
        return child.nodeName === 'BR';
    })[line];
    if (lineBreak) {
        lineBreak.before(...nodes);
    }
    else {
        block.append(...nodes);
    }
}

/**
 * Retrouve le texte repère à son rang d'apparition
 * (comparaison exacte : « Damien C » ne correspond pas à « Damien COTTON »)
 */
function findTextAnchor(sign, text, rank) {
    const walker = document.createTreeWalker(sign, NodeFilter.SHOW_TEXT);
    let remaining = rank;
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (node.textContent.trim() === text && remaining-- === 0) {
            return node;
        }
    }
    return null;
}

/**
 * Remet les images ajoutées après leur repère ; si le texte repère a changé,
 * à la fin de la même ligne ; à défaut, à la fin de la signature
 */
function reattachAddedImages(images) {
    const sign = getSignatureElement();
    const root = sign.firstElementChild || sign;
    const lastByAnchor = {};
    // Blocs de secours repérés avant toute insertion, qui décalerait les positions
    const fallbackBlocks = images.map(function(data) {
        return data.anchorPath ? getElementByPath(sign, data.anchorPath) : null;
    });
    images.forEach(function(data, index) {
        const nodes = data.newLine ? [document.createElement('br'), data.img] : [data.img];
        let key = null;
        let reference = null;
        if (data.anchorClass) {
            key = 'logo:' + data.anchorClass;
            reference = lastByAnchor[key] || sign.querySelector('img.' + CSS.escape(data.anchorClass));
        }
        else if (data.anchorText) {
            key = 'texte:' + data.anchorRank + ':' + data.anchorText;
            reference = lastByAnchor[key] || findTextAnchor(sign, data.anchorText, data.anchorRank);
        }

        if (reference) {
            reference.after(...nodes);
            lastByAnchor[key] = data.img;
        }
        else if (fallbackBlocks[index]) {
            insertAtEndOfLine(fallbackBlocks[index], data.anchorLine, nodes);
            lastByAnchor[key] = data.img;
        }
        else {
            root.append(document.createElement('br'), data.img);
        }
        alignSiblingImages(data.img);
    });
}

/**
 * Affiche la signature enregistrée : telle quelle si le texte a été modifié,
 * sinon régénérée depuis le formulaire avec les images remises
 */
function showSavedSignature() {
    // HTML déjà nettoyé par le serveur ; on retire en plus scripts et événements par précaution
    const doc = new DOMParser().parseFromString(rcmail.env.saved_signature, 'text/html');
    doc.body.querySelectorAll('script, iframe, object, embed').forEach(function(element) {
        element.remove();
    });
    doc.body.querySelectorAll('*').forEach(function(element) {
        Array.prototype.slice.call(element.attributes).forEach(function(attribute) {
            if (/^on/i.test(attribute.name)) {
                element.removeAttribute(attribute.name);
            }
        });
    });

    if (!doc.body.querySelector('.signature-edited')) {
        const images = collectAddedImages(doc.body);
        resetSignature();
        reattachAddedImages(images);
        syncSignatureField();
        return;
    }

    getSignatureHTML();
    lastFormState = getFormState();
    getSignatureElement().replaceChildren(...doc.body.childNodes);
    textEdited = true;
    syncSignatureField();
}

/**
 * Crée l'élément image ajoutée
 */
function createAddedImage(data) {
    const img = document.createElement('img');
    img.className = 'signature-added-image';
    img.src = data.src;
    img.alt = data.alt;
    if (data.width) {
        img.setAttribute('width', data.width);
    }
    if (data.height) {
        img.setAttribute('height', data.height);
    }
    img.style.verticalAlign = 'middle';
    return img;
}

/**
 * Centre verticalement les images de la même ligne, en style inline
 * pour que le fichier téléchargé et les messages envoyés s'affichent comme à l'écran
 */
function alignSiblingImages(addedImage) {
    Array.prototype.forEach.call(addedImage.parentNode.children, function(element) {
        if (element.tagName === 'IMG' && !element.style.verticalAlign) {
            element.style.verticalAlign = 'middle';
        }
    });
}

/**
 * Régénère la signature depuis le formulaire, après confirmation
 * s'il y a des images ajoutées ou des modifications (elles seront perdues)
 */
// eslint-disable-next-line no-unused-vars -- appelée depuis settings.html (onclick)
function regenerate_signature() {
    const modified = textEdited || getSignatureElement().querySelector('img.signature-added-image');
    if (modified && !window.confirm(rcmail.get_label('mel_signatures.regeneratesignature_confirm'))) {
        return;
    }
    resetSignature();
}

/**
 * Insère l'image choisie (PNG, JPEG, GIF, 200 Ko max., réduite à 250 x 100 px) au curseur
 */
// eslint-disable-next-line no-unused-vars -- appelée depuis settings.html (onchange)
function insert_image(input) {
    const file = input.files && input.files[0];
    input.value = '';
    if (!file) {
        return;
    }
    if (['image/png', 'image/jpeg', 'image/gif'].indexOf(file.type) === -1) {
        rcmail.display_message(rcmail.get_label('mel_signatures.imageinvalid'), 'error');
        return;
    }
    if (file.size > 200 * 1024) {
        rcmail.display_message(rcmail.get_label('mel_signatures.imagetoobig'), 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function() {
        const img = new Image();
        img.onload = function() {
            const scale = Math.min(1, 250 / img.naturalWidth, 100 / img.naturalHeight);
            const addedImage = createAddedImage({
                src: reader.result,
                alt: file.name.replace(/\.[^.]+$/, ''),
                width: Math.round(img.naturalWidth * scale),
                height: Math.round(img.naturalHeight * scale),
            });
            insertAtCursor(addedImage, false);
            alignSiblingImages(addedImage);
            syncSignatureField();
        };
        img.onerror = function() {
            rcmail.display_message(rcmail.get_label('mel_signatures.imageinvalid'), 'error');
        };
        img.src = reader.result;
    };
    reader.readAsDataURL(file);
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
    setSignatureEditMode(x.style.display === 'block');
}

/**
 * Rend la signature et ses boutons modifiables, uniquement en mode édition
 */
function setSignatureEditMode(enabled) {
    const sign = getSignatureElement();
    sign.contentEditable = enabled ? 'true' : 'false';
    sign.setAttribute('aria-readonly', enabled ? 'false' : 'true');
    if (enabled) {
        sign.title = rcmail.get_label('mel_signatures.signatureeditabletitle');
    }
    else {
        sign.removeAttribute('title');
    }
    document.querySelector('#settings-right .usersignature').classList.toggle('editing', enabled);
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
    html += '<body lang=FR>';
    html += getSignatureHTML(true, '', true);
    html += '</body>';
    html += '</html>';
    download('signature.htm', html);
    window.location.hash = "#outlook2016";
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
    html += '<body lang=FR>';
    html += getSignatureHTML(false, '', true);
    html += '</body>';
    html += '</html>';

    // Create the zip file
    var zip = new JSZip();

    // Add HTM file to zip
    zip.file("signature.htm", html);

    // Images folder
    var img = zip.folder("images");

    // Add images files
    img.file(rcmail.env.logo_url_marianne_outlook.replace(/images\//, ''), rcmail.env.logo_sources[rcmail.env.logo_url_marianne].replace('data:image/png;base64,', ''), { base64: true });
    img.file(rcmail.env.logo_url_devise_outlook.replace(/images\//, ''), rcmail.env.logo_sources[rcmail.env.logo_url_devise].replace('data:image/png;base64,', ''), { base64: true });

    if (rcmail.env.logo_url_other) {
        let filename = rcmail.env.logo_url_other_outlook.replace(/images\//, '');
        if (filename.toLowerCase().indexOf('.png') !== -1) {
            img.file(filename, rcmail.env.logo_sources[rcmail.env.logo_url_other].replace('data:image/png;base64,', ''), { base64: true });
        }
        else {
            img.file(filename, rcmail.env.logo_sources[rcmail.env.logo_url_other].replace('data:image/jpeg;base64,', ''), { base64: true });
        }
    }

    // Download zip to browser
    zip.generateAsync({type:"base64"})
        .then(function(content) {
            download('signature.zip', content, 'application/zip', 'application/zip;base64');
        });
    window.location.hash = "#outlook2013";
}

/**
 * Téléchargement de la signature dans un fichier HTM pour Outlook
 */
function download_signature_thunderbird() {
    var html = '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN">';
    html += '<HTML><HEAD><TITLE>Email Signature</TITLE>';
    html += '<META content="text/html; charset=utf-8" http-equiv="Content-Type">';
    html += '</HEAD>';
    html += '<BODY>';
    syncSignatureField();
    html += document.getElementById('signature_html').value;
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

    // Logo type
    let select_logotype = document.getElementById("select-logo-type");
    signature_html = createLogoType(select_logotype.options[select_logotype.selectedIndex].value, signature_html, isOutlook);

    // Gestion des liens
    let checkboxes = document.querySelectorAll("#input-links input");
    let links = "";
    if (document.getElementById("checkbox-custom-link").checked) {
        document.querySelector(".grid-form .custom-link").style.display = 'block';
        let customlink = document.getElementById("input-custom-link").value;
        let a = document.createElement('a');
        a.style = "color:#000000;font-size:8pt;font-weight:bold;";
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
            a.style = "color:#000000;font-size:8pt;font-weight:bold;text-decoration:none;";
            a.href = checkbox.value;
            a.innerText = rcmail.env.signature_links[checkbox.value];
            links += a.outerHTML + '<br>';
        }
    }
    signature_html = signature_html.replace('%%TEMPLATE_LINKS%%', links);

    // Logo de la signature
    let select = document.getElementById("input-logo");
    signature_html = signature_html.replace('%%TEMPLATE_LOGO%%', createLogo(select.options[select.selectedIndex].value));

    // Logo Marianne
    let logo_marianne = rcmail.env.logo_url_marianne;
    if (rcmail.env.logo_sources[logo_marianne]) {
        if (embeddedImage) {
            signature_html = signature_html.replace('%%TEMPLATE_LOGO_MARIANNE%%', 
                    createImage(rcmail.env.logo_sources[logo_marianne], 'Marianne', isOutlook, 'marianne'));
        }
        else {
            if (isOutlook) {
                logo_marianne = rcmail.env.logo_url_marianne_outlook;
            }
            signature_html = signature_html.replace('%%TEMPLATE_LOGO_MARIANNE%%', 
                    createImage(images_url + logo_marianne, 'Marianne', isOutlook, 'marianne'));
        }
    }
    else {
        signature_html = signature_html.replace('%%TEMPLATE_LOGO_MARIANNE%%', '');
    }

    // Logo Devise
    let logo_devise = rcmail.env.logo_url_devise;
    if (rcmail.env.logo_sources[logo_devise]) {
        if (embeddedImage) {
            signature_html = signature_html.replace('%%TEMPLATE_LOGO_DEVISE%%', 
                    createImage(rcmail.env.logo_sources[logo_devise], 'Liberté, Égalité, Fraternité', isOutlook, 'devise'));
        }
        else {
            if (isOutlook) {
                logo_devise = rcmail.env.logo_url_devise_outlook;
            }
            signature_html = signature_html.replace('%%TEMPLATE_LOGO_DEVISE%%', 
                    createImage(images_url + logo_devise, 'Liberté, Égalité, Fraternité', isOutlook, 'devise'));
        }
    }
    else {
        signature_html = signature_html.replace('%%TEMPLATE_LOGO_DEVISE%%', '');
    }

    // Gestion du logo supplémentaire
    if (rcmail.env.logo_url_other) {
        if (embeddedImage) {
            signature_html = signature_html.replace('%%TEMPLATE_OTHER_LOGO%%', 
                '<br>' + createImage(rcmail.env.logo_source_other ? rcmail.env.logo_source_other : rcmail.env.logo_sources[rcmail.env.logo_url_other], rcmail.env.logo_title_other, isOutlook, 'other'));
        }
        else {
            let logo_other = rcmail.env.logo_url_other;
            if (isOutlook) {
                if (!rcmail.env.logo_url_other_outlook) {
                    rcmail.env.logo_url_other_outlook = rcmail.env.logo_url_other;
                }
                logo_other = rcmail.env.logo_url_other_outlook;
            }
            signature_html = signature_html.replace('%%TEMPLATE_OTHER_LOGO%%', 
                '<br>' + createImage(images_url + logo_other, rcmail.env.logo_title_other, isOutlook, 'other'));
        }
    }
    else {
        signature_html = signature_html.replace('%%TEMPLATE_OTHER_LOGO%%', '');
    }
    
    
    return signature_html.replace(/(\r\n|\n|\r)/gm,"").trim();
}

/**
 * Retour le HTML d'une image en fonction de la source et du alt
 * Pour Outlook fourni en plus du vml de l'image
 */
function createImage(src, alt, isOutlook = false, className = null) {
    let img = document.createElement('img');
    img.src = src;
    img.alt = alt;
    if (className) {
        img.className = className;
    }
    // Pour outlook ajouter la taille des images
    document.querySelector('#signature .' + className)
    if (isOutlook && document.querySelector('#signature .' + className) !== null) {
        img.width = document.querySelector('#signature .' + className).clientWidth;
        img.height = document.querySelector('#signature .' + className).clientHeight;
    }
    return img.outerHTML;
}

/**
 * Retourne le logo en html
 */
function createLogo(htmlLogo) {
    if (htmlLogo == 'custom') {
        document.querySelector(".grid-form .custom-logo").style.display = 'block';
        htmlLogo = document.querySelector("#input-custom-logo").value.toUpperCase().replace(/\r?\n/g, '<br>');
    }
    else {
        document.querySelector(".grid-form .custom-logo").style.display = 'none';
        document.querySelector("#input-custom-logo").value = htmlLogo.replace(/<br>/gi, "\r\n");
    }
    let span = document.createElement('span');
    span.style = "font-size:15.25px;font-weight:bold;line-height:16.25px;color:#000;";
    span.innerHTML = htmlLogo;
    return span.outerHTML;
}

/**
 * Retourne le logotype en html
 */
 function createLogoType(htmlLogo, signature_html, isOutlook) {
    if (htmlLogo == 'custom') {
        document.querySelector(".grid-form .custom-logotype").style.display = 'block';
        htmlLogo = document.querySelector("#input-logo-type").value.replace(/\r?\n/g, '<br>');

        let logo_type = document.createElement('span');
        logo_type.style = "display:block;font-weight:bold;font-size:9pt;line-height:9pt;color:#000;max-width:200px;";
        logo_type.innerText = htmlLogo;
        signature_html = signature_html.replace(/%%TEMPLATE_LOGO_TYPE%%/g, logo_type.outerHTML);
        signature_html = signature_html.replace(/%%TEMPLATE_LOGO_TYPE_BORDER%%/g, "1.5px solid #3c3c3c");
        signature_html = signature_html.replace(/%%TEMPLATE_LOGO_TYPE_PADDING%%/g, "0 0 15px 15px");
    }
    else {
        document.querySelector(".grid-form .custom-logotype").style.display = 'none';
        htmlLogo = createImage(rcmail.env.logotype_sources[htmlLogo], 'Logo type signature', isOutlook, 'logotype');
        signature_html = signature_html.replace(/%%TEMPLATE_LOGO_TYPE%%/g, htmlLogo);
        signature_html = signature_html.replace(/%%TEMPLATE_LOGO_TYPE_BORDER%%/g, "none");
        signature_html = signature_html.replace(/%%TEMPLATE_LOGO_TYPE_PADDING%%/g, "0 0 0 30px");
    }
    return signature_html;
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
function download(filename, text, contentype = 'text/html', type = 'text/html;charset=utf-8') {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:' + type + ',' + encodeURIComponent(text));
    element.setAttribute('type', contentype);
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}
