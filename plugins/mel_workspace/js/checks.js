/**
 * Active un item de la toolbar : enlève le spinner puis active l'item
 * @param {$} $item span (ex : $('.toolbar .wsp-wekan span').first())
 */
function set_toolbar_item_valid($item) {
    const tmpClass = Enumerable.from($item[0].classList).where(x => !x.includes('spinner-grow')).first().slice(1);
    $item.addClass(tmpClass).removeClass(`-${tmpClass}`);
    $item.removeClass('spinner-grow')
    $item.parent().removeClass('disabled').removeAttr('disabled');
}

/**
 * Main
 */
function check_workspace_integrity() 
{
    /**
     * Liste des services disponibles
     * @type {{
        channel:'channel',
        calendar:'calendar',
        tasks:'tasks',
        mail:'mail',
        cloud:'doc',
        group:'annuaire',
        wekan:'wekan',
        links:'useful-links'
    }}
     */
    const services = MelEnum.createEnum('wspservices', {
        channel:'channel',
        calendar:'calendar',
        tasks:'tasks',
        mail:'mail',
        cloud:'doc',
        group:'annuaire',
        wekan:'wekan',
        links:'useful-links'
    });

    /**
     * Etat d'un service
     * @type {
      {
            valid:'valid',
            invalid:'invalid'
        }
      }
     */
    const states = MelEnum.createEnum('wsp.states', {
        valid:'valid',
        invalid:'invalid'
    });
    /**
     * Id de l'espace de travail
     * @type {string}
     */
    const uid = rcmail.env.current_workspace_uid;
    /**
     * Services de l'espace
     */
    const workspace_services = rcmail.env.current_workspace_services;

    /**
     * Liste d'appels ajax
     * @type {Array<Promise>} 
     */
    let calls = [];
    /**
     * Liste des éléments de la toolbar qui seront modifiés
     */
    let items = {};
    /**
     * Classe de l'item de la toolbar à changer
     * @type {string | null}
     */
    let toolbar_item = null;
    /**
     * Appel ajax courant de la boucle
     * @type {Promise}
     */
    let ajax_call = null;
    for (const key in workspace_services) {
        if (Object.hasOwnProperty.call(workspace_services, key)) {
            const element = workspace_services[key];
            if (element){ //Si on a le service
                //Récupération de la classe de l'item de la toolbar
                switch (key) {
                    case services.calendar:
                        toolbar_item = 'wsp-agenda';
                        break;

                    case services.channel:
                        continue;

                    case services.wekan:
                        toolbar_item = 'wsp-wekan';
                        break;

                    case services.cloud:
                        continue;

                    case services.group:
                        continue;

                    case services.links:
                        toolbar_item = 'wsp-links';
                        break;

                    case services.mail:
                        continue;

                    case services.tasks:
                        toolbar_item = 'wsp-tasks';
                        break;   

                    default:
                        toolbar_item = null;
                        break;
                }

                //Désactive le bouton et ajoute un spinner
                if (!!toolbar_item)
                {
                    items[key] = $(`.wsp-toolbar.melw-wsp .${toolbar_item}`).addClass('disabled').attr('disabled', 'disabled');
                    const tmpClass = items[key].find('span').first()[0].classList[0];
                    items[key].find('span').first().removeClass(tmpClass).addClass(`-${tmpClass}`).addClass('spinner-grow');
                }

                //Lance le check du service
                ajax_call = mel_metapage.Functions.post(
                    mel_metapage.Functions.url('workspace', 'check_service_async'),
                    {
                        _id:uid,
                        _service:key 
                    },
                    (datas) => {
                        datas = JSON.parse(datas);

                        if (datas.state === states.invalid) { //Si le service a été supprimer
                            const isCustomState = !!datas.service_state?.state;
                            const text = isCustomState && !!datas.service_state.text ? datas.service_state.text : `Nous ne parvenons pas à trouver des données pour le service "${datas.service}", le service à dût être supprimer par un des administrateurs, création du service en cours....`;
                            console.error(`###[checks]${text}`, datas);
                            rcmail.display_message(text, 'error');

                            let child_call = mel_metapage.Functions.post( //On créer le service
                                mel_metapage.Functions.url('workspace', 'create_service_async'),
                                {
                                    _id:uid,
                                    _service:datas.service,
                                    _state:(isCustomState ? datas.service_state.custom_args : datas.service_state)
                                },
                                (creation_datas) => {
                                    creation_datas = JSON.parse(creation_datas);

                                    if (creation_datas !== 'false')
                                    {
                                        //Maj de rcmail.env
                                        if (!!creation_datas.env)
                                        {
                                            for (const key in creation_datas.env) {
                                                if (Object.hasOwnProperty.call(creation_datas.env, key)) {
                                                    const element = creation_datas.env[key];
                                                    rcmail.env[key] = element;
                                                }
                                            }
                                        }

                                        //MAJ des boutons de la barre d'outil
                                        if ((creation_datas.update_button?.length ?? 0) > 0)
                                        {
                                            for (const iterator of creation_datas.update_button) {
                                                let $querry = iterator.is_class ? $(`.wsp-toolbar.melw-wsp .${iterator.id}`) : $(`#${iterator.id}`);

                                                if (!!iterator.datas)
                                                {
                                                    for (const key in iterator.datas) {
                                                        if (Object.hasOwnProperty.call(iterator.datas, key)) {
                                                            const element = iterator.datas[key];
                                                            $querry.data(key, element);
                                                        }
                                                    }
                                                }
                                            }
                                        }

                                        //Appel de triggers
                                        if ((creation_datas.triggers?.length ?? 0) > 0)
                                        {
                                            for (const iterator of creation_datas.triggers) {
                                                if (typeof iterator === 'string') rcmail.triggerEvent(iterator);
                                                else {
                                                    if ((iterator?.is_top ?? false) === true) top.rcmail.triggerEvent(iterator.trigger);
                                                    else rcmail.triggerEvent(iterator);
                                                }
                                            }
                                        }

                                        let displayedText = EMPTY_STRING;
                                        
                                        if (isCustomState && !!datas.service_state.ok_text) displayedText = datas.service_state.ok_text;
                                        else displayedText = `Le service ${datas.service} a été créé avec succès !`;

                                        rcmail.display_message(displayedText, 'confirmation');
                                    }

                                    if (!!items[datas.service]) set_toolbar_item_valid(items[datas.service].find('span').first())
                                }
                            );

                            calls.push(child_call);
                        }
                        else {
                            if (!!items[datas.service]) set_toolbar_item_valid(items[datas.service].find('span').first())
                        }
                    }
                );

                calls.push(ajax_call);
                ajax_call = null;
            }
        }
    }
    
    //Supprimer les enums inutile pour libérer la mémoire
    Promise.allSettled(calls).then(() => {
        MelEnum.deleteEnum('wsp.states');
        MelEnum.deleteEnum('wspservices');
        calls = null;
    });
}

$(document).ready(() => {
    return;
    check_workspace_integrity();
});