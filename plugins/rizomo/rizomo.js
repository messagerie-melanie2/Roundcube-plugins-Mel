/**
 * Connexion aux API Rizomo et récupération des notifications
 */

/**
 * URL vers les notifications
 */
const api_notifications = '/notifications/me';

// Initialise les notifications et lance le timeout
// Pas de traitement si on est pas dans la metapage
// if (window.rcmail && window == top) {
//     console.log('Rizomo window top');
//     if (typeof m_mp_NotificationRun === "function") { 
//         // Notification plugin is enable
//         rcmail.addEventListener('responseafterrefresh', function(props) {
//             console.log('Rizomo response after refresh');
//             m_mp_RizomoRefreshNotifications();
//         });
//     }
// }

// Affichage de la frame Rizomo
if (window.rcmail && rcmail.env.task == 'rizomo') {
    setTimeout(() => {
        const url = rcmail.env.rizomo_startup_url != null && rcmail.env.rizomo_startup_url !== undefined ? rcmail.env.rizomo_startup_url : rcmail.env.rizomo_gotourl;
        window.document.getElementById('rizomo_frame').src = url;

        if (rcmail.env.rizomo_user_token) {
            window.document.getElementById('rizomo_frame').onload = function() {
                setTimeout(function() {
                    console.log('Rizomo login-with-token');
                    window.document.getElementById('rizomo_frame').contentWindow.postMessage({
                        event: 'login-with-token',
                        token: rcmail.env.rizomo_user_token,
                    }, '*');
                }, 50);
            };
        }

        $("#wait_box").hide();
    }, 50);
}

/**
 * Lance le refresh des notifications depuis Rizomo
 */
function m_mp_RizomoRefreshNotifications() {
    const url = rcmail.env.rizomo_api_url + api_notifications;

    let myHeaders = new Headers();

    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Accept", "application/json");
    myHeaders.append("X-Auth-Token", rcmail.env.rizomo_user_token);

    let myInit = { 
        method: 'GET',
        headers: myHeaders,
    };

    let myRequest = new Request(url, myInit);

    fetch(myRequest, myInit)
    .then(function(response) {
        var contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return response.json().then(function(json) {
                if (json.status == 'success') {
                    // Nettoyer toutes les notifications Rizomo
                    // Récupération des notifications du storage
                    let notifications = m_mp_NotificationsGet(),
                        newNotifications = {},
                        hasChanged = false;

                    // Parcourir les notifs rizomo
                    for (const uid in notifications) {
                        if (Object.hasOwnProperty.call(notifications, uid)) {
                            if (notifications[uid].rizomo) {
                                notifications[uid].todelete = true;
                            }
                        }
                    }

                    // Traitement des résultats
                    for (const iterator of json.data) {
                        const uid = 'rizomo-' + iterator._id;

                        if (notifications[uid]) {
                            notifications[uid].todelete = false;
                            notifications[uid].isread = iterator.read === true ? true : notifications[uid].isread;
                            hasChanged = true;
                        }
                        else {
                            // Définition de l'action
                            let action = null;
                            if (iterator.link) {
                                action = [{
                                    href: iterator.link,
                                    newtab: true,
                                }]
                            }

                            // Définition de la notification
                            let notification = {
                                uid: uid,
                                category: iterator.type,
                                title: iterator.title,
                                content: iterator.content,
                                created: Math.floor(Date.parse(iterator.createdAt) / 1000),
                                isread: iterator.read,
                                rizomo: true,
                                local: true,
                                action: action
                            };

                            // Ajoute la notification à la liste des nouvelles notifications
                            newNotifications[uid] = notification;

                            // On ne fait poper que les nouvelles notifications
                            m_mp_ShowNotification(notification);

                            hasChanged = true;
                        }
                    }

                    // Parcourir les notifs rizomo pour les supprimer
                    for (const uid in notifications) {
                        if (Object.hasOwnProperty.call(notifications, uid)) {
                            if (notifications[uid].rizomo && notifications[uid].todelete) {
                                delete notifications[uid];
                                hasChanged = true;
                            }
                        }
                    }

                    // Mettre à jour le stockage
                    if (hasChanged) {
                        // Merge les notifications
                        m_mp_NotificationsMerge(notifications, newNotifications);
                    }
                }
            });
        }
    });
}

