$(document).ready(() => {
    if ($('#layout-list').length > 0) {
        let global_target = null;
        
        $('#preferences-frame').on('load', async () => {
            switch ($('#preferences-frame').data('action-type')) {
                case 'default':
                    $('#preferences-frame').data('action-type', 'disabled')
                    rcmail.location_href({_action: 'edit-prefs', _section: global_target.attr('id').replace('l:', '').replace('rcmrow', ''), _framed: 1}, $("#preferences-frame")[0].contentWindow, true);
                    $('#layout-content .header').show();
                    break;
            
                case 'frame':
                    await logout();
                    await login();
                    
                    let context = $('#preferences-frame')[0].contentWindow;
                    context.postMessage({'bnum_settings': true}, "*");
                    context.postMessage({
                        externalCommand: 'go',
                        path: '/account/preferences'
                        }, '*')
                    break;

                default:
                    break;
            }

            global_target = null;

        });

        $('#layout-list td').each(async (i, e) => {
            let it = 0;
            await wait(() => {
                if (it++ >= 50)
                    return false;
                
                return jQuery._data(e, 'events') === undefined;
            }, 50);
            $(e).off("mousedown").off("mouseup").off("contextmenu");
            e = $(e).parent(); 
            e.off("mousedown").off("mouseup").off("contextmenu");
            switch ($(e).attr('id').replace('rcmrow', '')) {
                case 'mel_chat_settings':
                    $(e)[0].outerHTML = $(e).clone().attr('id', 'section_mel_chat_settings')[0].outerHTML; 
                    $('#section_mel_chat_settings').click((e) => {
                        $('#preferences-frame').data('action-type', 'frame').attr('src', rcmail.env.rocket_chat_url)

                        $('#layout-content .header').hide();
                        reset_selected();
                        set_selected($(e.currentTarget));
                    }).click();

                    break;
            
                default:
                    $(e).click((target) => {
                        $('#preferences-frame').data('action-type', 'default').attr('src', 'skins/mel_elastic/watermark.html');
                        target = $(target.currentTarget);
                        global_target = target;
                        reset_selected();
                        set_selected(target);
                    });
                    break;
            }
        });

        if ($('#layout-list td').length === 1) {
            $('#layout-list').hide();
        }

        function reset_selected() {
            return $('#sections-table .selected').removeClass('selected');
        }

        function set_selected($target) {
            if ($target[0].nodeName === 'TD') $target = $target.parent();

            return $target.addClass('selected');
        }

        function rc_url(task, action = "", args = null)
        {
            let url = task;
            if (action !== null && action !== undefined && action !== "")
                url += "&_action=" + action;
    
            if (window.location.href.includes(`${rcmail.env.mel_metapage_const.key}=${rcmail.env.mel_metapage_const.value}`) || window !== parent)
            {
                if (args === null || args === undefined)
                {
                    args = {};
                    args[rcmail.env.mel_metapage_const.key] = rcmail.env.mel_metapage_const.value;
                }
                else if (args[rcmail.env.mel_metapage_const.key] === undefined)
                    args[rcmail.env.mel_metapage_const.key] = rcmail.env.mel_metapage_const.value;
            }
    
            if (args !== null)
            {
                for (const key in args) {
                    if (Object.hasOwnProperty.call(args, key)) {
                        const element = args[key];
                        url += "&" + key + "=" + element
                    }
                }
            }
            return rcmail.get_task_url(url, window.location.origin + window.location.pathname)
        }

        async function login()
        {  
            await $.ajax({ // fonction permettant de faire de l'ajax
                type: "GET", // methode de transmission des données au fichier php
                url: rc_url("discussion", "login"),//"/?_task=discussion&_action=login",
                success: function (data) {
                    data = JSON.parse(data);
                    rcmail.env.rocket_chat_auth_token = data.token;
                    rcmail.env.rocket_chat_user_id = data.uid;
                    rcmail.triggerEvent('rocket.chat.onloggin', {token:data.token, uid:data.uid, error:false});
                },
                error: function (xhr, ajaxOptions, thrownError) { // Add these parameters to display the required response
                    console.error(xhr, ajaxOptions, thrownError);
                    rcmail.triggerEvent('rocket.chat.onloggin', {error:true});
                },
            });

            await new Promise((ok, nok) => {
                setTimeout(function() {
                    try {
                        $('#preferences-frame')[0].contentWindow.postMessage({
                            externalCommand: 'login-with-token',
                            token: rcmail.env.rocket_chat_auth_token,
                        }, '*');
                    } catch (error) {
                        try {
                            $('#preferences-frame')[0].contentWindow.postMessage({
                                externalCommand: 'login-with-token',
                                token: rcmail.env.rocket_chat_auth_token,
                            }, '*');
                        } catch (error) {
                            console.error(error);
                            nok(error);
                        }
                    }
                    rcmail.env.ariane_is_logged = true;
                    ok();
                    
                }, 50);
            });
        } 

        function logout(onSuccess = null)
        {
            return $.ajax({ // fonction permettant de faire de l'ajax
                type: "GET", // methode de transmission des données au fichier php
                url: rc_url("chat", "logout"),//"/?_task=discussion&_action=login",
                success: function (data) {
                    if (onSuccess !== null) onSuccess(data === "loggued");
    
                    rcmail.triggerEvent('rocket.chat.onloggout', {datas:data, error:false});
                },
                error: function (xhr, ajaxOptions, thrownError) { // Add these parameters to display the required response
                    console.error(xhr, ajaxOptions, thrownError);
                    rcmail.triggerEvent('rocket.chat.onloggout', {datas:{xhr, ajaxOptions, thrownError}, error:true});
                },
            });
        } 
    }
});