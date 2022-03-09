// Charger les notifications de Rizomo
const url = rcmail.env.rizomo_api_url + '/notifications/' + rcmail.env.rizomo_user_id;

let myHeaders = new Headers();

myHeaders.append("Content-Type", "application/json");
myHeaders.append("Accept", "application/json");
myHeaders.append("X-Auth-Token", rcmail.env.rizomo_token);

let myInit = { 
    method: 'GET',
    headers: myHeaders,
    // mode: 'cors',
    // cache: 'default' 
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
                    let notifications = rcmail.mel_storage_get('notifications', true),
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
                            notifications[uid].isread = iterator.read ?? notifications[uid].isread;
                            hasChanged = true;
                        }
                        else {
                            // traitement du JSON
                            m_mp_NotificationRun({
                                uid: uid,
                                category: iterator.type,
                                title: iterator.title,
                                content: iterator.content,
                                created: Math.floor(Date.parse(iterator.createdAt) / 1000),
                                isread: iterator.read,
                                rizomo: true,
                                local: true,
                                action: [{
                                    href: iterator.link,
                                    newtab: true,
                                }]
                            });
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
                        // Affiche les notifications dans le panel
                        m_mp_NotificationsAppendToPanel(notifications);

                        // Filtrer les notifications au démarrage
                        m_mp_NotificationFilter();

                        // Enregistre les notifications dans le storage
                        rcmail.mel_storage_set('notifications', notifications, true);
                    }
                }
                
            });
        }
});