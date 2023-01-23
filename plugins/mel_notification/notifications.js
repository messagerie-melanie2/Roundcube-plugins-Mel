/**
 * Gestion des notifications dans le Bnum
 * La gestion est indépendante des refresh Roundcube 
 * pour en faire plus régulièrement
 */

var current_desktop_notification = 0;

// Initialise les notifications et lance le timeout
// Pas de traitement si on est pas dans la metapage
if (window.rcmail) {
    // Initialisation du js
    rcmail.addEventListener('init', function() {
        if (window == top) {
            // On est dans la metapage traitement global
            let notificationstack = document.getElementById("notificationstack");
            let notificationunread = document.getElementById("notificationunread");

            // Ajout du panneau de notification
            if (!notificationstack) {
                notificationstack = document.createElement('div');
                notificationstack.id = "notificationstack";
                document.getElementById("layout").append(notificationstack);
            }

            // Ajout du nombre de notification non lues
            if (!notificationunread) {
                notificationunread = document.createElement('div');
                notificationunread.id = "notificationunread";
                document.querySelector('#user-up-popup > div.row > div > div.user-child').append(notificationunread);
            }

            // Initialisation de la current
            current_desktop_notification = 0;

            // Afficher les notifications depuis le storage
            setTimeout(() => {
                // Lancement des notifications
                m_mp_NotificationStartup();
            }, 500);

            // Gérer les notifications venant des autres frames
            window.addEventListener("message", (event) => {
                if (event.data && event.data.type && event.data.type == 'notification') {
                    m_mp_NotificationRun(event.data.notification);
                }
            }, false);

            // Tout passer en lu à la fermeture
            if (rcmail.env.notifications_set_read_on_panel_close) {
                rcmail.addEventListener('toggle-options-user', (prop) => {
                    if (!prop.show) {
                        let notifications = m_mp_NotificationsGet(),
                            uids = [];

                        for (const uid in notifications) {
                            if (Object.hasOwnProperty.call(notifications, uid)) {
                                if (!notifications[uid].isread) {
                                    uids.push(btoa(uid));
                                }
                            }
                        }
                        m_mp_NotificationsAction('read', uids);
                    }
                    else {
                        document.getElementById('notificationstack').innerHTML = '';
                    }
                });
            }
        }

        // Ajouter le support des autres applications qui envoi des notifications
        rcmail.addEventListener('plugin.push_notification', m_mp_NotificationRun);
    });

    // Action plugin.notifications_refresh
    rcmail.addEventListener('responseafterplugin.notifications_refresh', function(evt) {
        if (evt.response.notifications.length) {
            // Récupération des notifications du storage
            let notifications = m_mp_NotificationsGet(),
                newNotifications = {};

            // Initialisation de la current
            current_desktop_notification = 0;

            for (const notification of evt.response.notifications) {
                if (!notifications[notification.uid] 
                        && !notification.isread) {
                    // On ne fait poper que les nouvelles notifications
                    m_mp_ShowNotification(notification);

                    // Ajoute la notification à la liste des nouvelles notifications
                    newNotifications[notification.uid] = notification;
                }
                else if (notifications[notification.uid]) {
                    notifications[notification.uid].isread = notification.isread;
                    notifications[notification.uid].todelete = false;
                }
                else if (m_mp_NotificationSettings('notifications_center', notification)) {
                    // Ajoute la notification à la liste des nouvelles notifications
                    newNotifications[notification.uid] = notification;
                }
            }
            // Merge les notifications
            m_mp_NotificationsMerge(m_mp_NotificationsDelete(notifications), newNotifications);
        }
        else {
            // Rafraichir les notifications du panel pour actualiser les dates
            m_mp_NotificationsAppendToPanel(m_mp_NotificationsGet());
        }

        // Positionne le last dans le storage
        rcmail.mel_storage_set('notification_last', evt.response.last);

        // Relance du process des notifications
        m_mp_NotificationProcess();
    });

    // Action plugin.notifications_action
    rcmail.addEventListener('responseafterplugin.notifications_action', function(evt) {
        if (evt.response.success) {
            // Lancement du traitement
            m_mp_NotificationProcessAfterAction(m_mp_NotificationsGet(), evt.response.uids, evt.response.act);
        }
    });
}

/**
 * Retourne les notifications depuis le storage
 * 
 * @returns notifications
 */
function m_mp_NotificationsGet() {
    // Récupération des notifications du storage
    let notifications = rcmail.mel_storage_get('notifications', true);
    
    return notifications ?? {};
}

/**
 * Enregistre les notifications dans le storage
 * 
 * @param {*} notifications 
 */
function m_mp_NotificationsSet(notifications) {
    rcmail.mel_storage_set('notifications', notifications, true);
}

/**
 * Lancement de la mécanique des notifications
 */
function m_mp_NotificationStartup() {
    // Récupération et nettoyage des notifications du storage
    let notifications = m_mp_NotificationsClean(m_mp_NotificationsGet());

    // Affiche les notifications dans le panel
    m_mp_NotificationsAppendToPanel(notifications);

    // Filtrer les notifications au démarrage
    m_mp_NotificationFilter();

        // Lance le refresh immédiatement
    m_mp_NotificationRefresh();
}

/**
 * Nettoyage des notifications au démarrage
 * 
 * @param {*} notifications 
 * @returns 
 */
function m_mp_NotificationsClean(notifications) {
    let hasChanged = false;

    // Parcourir les notifications et ne garder que les locales
    for (const uid in notifications) {
        if (Object.hasOwnProperty.call(notifications, uid)) {
            if (!notifications[uid].local) {
                notifications[uid].todelete = true;
                hasChanged = true;
            }
        }
    }

    // On enregistre les modifications dans le storage
    if (hasChanged) {
        m_mp_NotificationsSet(notifications);
    }

    // Nettoyage du last
    rcmail.mel_storage_remove('notification_last');

    return notifications;
}

/**
 * Supprime les notifications à supprimer
 * 
 * @param {*} notifications 
 * @returns 
 */
function m_mp_NotificationsDelete(notifications) {
    for (const uid in notifications) {
        if (Object.hasOwnProperty.call(notifications, uid) && notifications[uid].todelete) {
            delete notifications[uid];
        }
    }
    return notifications;
}

/**
 * Lancer une notification indirecte (ne passe pas par les notifications Bnum)
 * 
 * @param {*} notification 
 */
function m_mp_NotificationRun(notification) {
    // Est-ce qu'on est dans la metapage
    if (window == top) {
        // Récupération des notifications du storage
        let notifications = m_mp_NotificationsGet(),
            newNotifications = {};

        if (!notifications[notification.uid] 
                && !notification.isread
                && !notification.isdeleted) {
            // On ne fait poper que les nouvelles notifications
            m_mp_ShowNotification(notification);
        }

        // Si la notification est déjà dans la liste
        if (notifications[notification.uid]) {
            notifications[notification.uid].isread = notification.isread;
            notifications[notification.uid].modified = notification.modified;

            notifications = m_mp_NotificationsSort(notifications);

            // Actualiser les non lues et ajouter dans le panel
            m_mp_NotificationsAppendToPanel(notifications);

            // Filtrer les notifications si besoin
            m_mp_NotificationFilter();

            // Enregistre les notifications dans le storage
            m_mp_NotificationsSet(notifications);
        }
        else if (m_mp_NotificationSettings('notifications_center', notification)) {
            // Ajoute la notification à la liste des nouvelles notifications
            newNotifications[notification.uid] = notification;

            // Merge les notifications
            m_mp_NotificationsMerge(notifications, newNotifications);
        }
    }
    else {
        top.m_mp_NotificationRun(notification);
    }
}

/**
 * Merge les nouvelles notifications avec les anciennes et met dans le storage
 * 
 * @param {*} notifications 
 * @param {*} newNotifications 
 */
function m_mp_NotificationsMerge(notifications, newNotifications) {
    // Ajoute les nouvelles notifications avant les anciennes en les triant
    notifications = m_mp_NotificationsSort({...newNotifications, ...notifications});

    // Actualiser les non lues et ajouter dans le panel
    m_mp_NotificationsAppendToPanel(notifications);

    // Filtrer les notifications si besoin
    m_mp_NotificationFilter();

    // Enregistre les notifications dans le storage
    m_mp_NotificationsSet(notifications);
}

/**
 * Tri les notifications par modified
 * 
 * @param {*} notifications 
 */
function m_mp_NotificationsSort(notifications) {
    // Compatible uniquement ES10
    return Object.fromEntries(Object.entries(notifications).sort((a, b) => {
        return b[1].modified - a[1].modified;
    }));
}

/**
 * Process de gestion des notifications
 * Génère un timeout et le nettoie si nécessaire
 */
function m_mp_NotificationProcess() {
    if (rcmail.env.notification_timeout) {
        clearTimeout(rcmail.env.notification_timeout);
    }
    rcmail.env.notification_timeout = setTimeout(() => {
        m_mp_NotificationRefresh()
    }, rcmail.env.notifications_refresh_interval*1000);
}

/**
 * Rafraichissement de la liste des notifications en XHR
 */
function m_mp_NotificationRefresh() {
    rcmail.http_get('plugin.notifications_refresh', {_last: rcmail.mel_storage_get('notification_last')});
}

/**
 * Récupère les paramètres pour la notification et la key
 * 
 * @param {*} key 
 * @param {*} notification 
 * @returns boolean
 */
function m_mp_NotificationSettings(key, notification) {
    if (rcmail.env.notifications_settings[notification.category]) {
        const settings = rcmail.env.notifications_settings[notification.category];

        // Si on ne doit pas afficher la notification dans le centre de notification
        if (settings[key] === false) {
            return false;
        }
        else if (notification.category == 'mail' 
                && settings['mailboxes']
                && settings['mailboxes'][notification.mailbox]
                && settings['mailboxes'][notification.mailbox][key] === false) {
            // Paramètre spécifique pour la mailbox
            return false;
        }
    }
    return true;
}

/**
 * Affichage d'une notification
 * 
 * @param {*} notification 
 */
function m_mp_ShowNotification(notification) {
    // Gérer les notifications multiples
    setTimeout(() => {
        if (m_mp_NotificationSettings('inside_notification', notification)) {
            let notificationstack = document.getElementById("notificationstack"),
                article = m_mp_NotificationGetElement(notification, false);

            // Ajoute la notification à la stack
            notificationstack.append(article);

            // Timeout pour enlever la notification
            setTimeout(() => {
                article.remove();
            }, rcmail.env.notifications_show_duration*1000);
        }

        // Envoyer la notification sur le desktop
        m_mp_ShowDesktopNotification(notification);
    }, current_desktop_notification++ * 1000);
}

/**
 * Affiche une notification sur le bureau
 * 
 * @param {*} notification 
 */
function m_mp_ShowDesktopNotification(notification) {
    if (m_mp_NotificationSettings('desktop_notification', notification)) {
        let timeout = rcmail.env.notifications_show_duration || 10
            icon = rcmail.env.notifications_icons[notification.category] ?? rcmail.env.notifications_icons['default'];

        // Si l'utilisateur a permis les notifications
        if (window.Notification && Notification.permission === "granted") {
            var n = new Notification(notification.title, {
                dir: "auto",
                lang: "",
                body: notification.content,
                tag: "mel_notification",
                icon: rcmail.assets_path(icon)
            });
            n.onclick = () => { this.close(); };
            setTimeout(() => { n.close(); }, timeout * 1000);
        }
        else {
            Notification.requestPermission();
        }
    }
}

/**
 * Lance une action en XHR sur les uids
 * 
 * @param {string} action 
 * @param {*} uids 
 */
function m_mp_NotificationsAction(action, uids) {
    // Récupération des notifications du storage
    let notifications = m_mp_NotificationsGet();

    // Recherche les uid de notification locale
    let localUids = [], remoteUids = [];

    for (const uid of uids) {
        const clearUid = atob(uid);
        if (notifications[clearUid]) {
            if (notifications[clearUid].local) {
                localUids.push(clearUid);
            }
            else {
                remoteUids.push(uid);
            }
        } 
    }

    // Si on a des uids locaux
    if (localUids.length) {
        m_mp_NotificationProcessAfterAction(notifications, localUids, action);
    }

    // Si on a des uids serveur
    if (remoteUids.length) {
        // Lance la requête XHR
        rcmail.http_post('plugin.notifications_action', {
            _act: action,
            _uids: remoteUids
        }, rcmail.display_message(rcmail.get_label('loading'), 'loading'));
    }
}

/**
 * Traitement des notifications après l'action
 * 
 * @param {*} notifications 
 * @param {*} uids 
 * @param {*} action 
 */
 function m_mp_NotificationProcessAfterAction(notifications, uids, action) {
    for (const uid of uids) {
        if (notifications[uid]) {
            let object = document.querySelector('#notif' + uid.replace(/\W/g,'_'));

            if (!object) {
                continue;
            }

            // Traitement de l'action
            switch(action) {
                case 'read':
                    notifications[uid].isread = true;
                    object.className = object.className.replace(/ unread/g, '');
                    object.querySelector('a.button.read').textContent = rcmail.get_label('mel_notification.Mark as unread');
                    object.querySelector('a.button.read').title = rcmail.get_label('mel_notification.Mark as unread title');
                    object.title = rcmail.get_label('mel_notification.Mark as unread title');
                    break;
    
                case 'unread':
                    notifications[uid].isread = false;
                    if (object.className.indexOf('unread') === -1) {
                        object.className += ' unread';
                        object.querySelector('a.button.read').textContent = rcmail.get_label('mel_notification.Mark as read');
                        object.querySelector('a.button.read').title = rcmail.get_label('mel_notification.Mark as read title');
                        object.title = rcmail.get_label('mel_notification.Mark as read title');
                    }
                    break;
    
                case 'del':
                    if (notifications[uid].rizomo) {
                        notifications[uid].isdeleted = true;
                    }
                    else {
                        delete notifications[uid];
                    }
                    object.remove();
                    break;
            }
        }
    }

    // Actualiser les non lues
    m_mp_NotificationsRefreshUnread(notifications);

    // Filtrer les notifications
    m_mp_NotificationFilter();

    // Enregistre les notifications dans le storage
    m_mp_NotificationsSet(notifications);
}

/**
 * Affichage du nombre de non lus dans le Bienvenue
 * @param {*} unread 
 */
function m_mp_NotificationsShowUnread(unread) {
    let notificationunread = document.getElementById("notificationunread");

    // Afficher les non lues ou non
    if (unread) {
        notificationunread.className = 'active';
        notificationunread.textContent = unread;
        notificationunread.title = unread === 1 
            ? rcmail.get_label('mel_notification.Unread notification') 
                :  rcmail.get_label('mel_notification.X unread notifications').replace(/%d/, unread);
    }
    else {
        notificationunread.className = '';
        notificationunread.textContent = '';
        notificationunread.title = '';
    }
}

/**
 * Parcours les notifications pour donner les non lues
 * 
 * @param {*} notifications 
 */
function m_mp_NotificationsRefreshUnread(notifications) {
    let unread = 0, unreadCat = [];

    for (const uid in notifications) {
        if (Object.hasOwnProperty.call(notifications, uid)) {
            const notification = notifications[uid];

            // Gérer les paramètres du centre de notification et les deleted
            if (!m_mp_NotificationSettings('notifications_center', notification)
                    || notification.isdeleted) {
                continue;
            }

            if (!notification.isread) {
                unread++;
                if (!unreadCat[notification.category]) {
                    unreadCat[notification.category] = 0;
                }
                unreadCat[notification.category]++;
            }
        }
    }

    // Actualiser les catégories du select
    for (const category in rcmail.env.notifications_categories) {
        if (Object.hasOwnProperty.call(rcmail.env.notifications_categories, category)) {
            let option = document.querySelector('#notifications-panel .filters select option[value="' + category + '"]');
            if (option) {
                if (unreadCat[category]) {
                    option.text = rcmail.env.notifications_categories[category] + ' (' + unreadCat[category] + ')';
                }
                else {
                    option.text = rcmail.env.notifications_categories[category];
                }
            }
        }
    }

    // Afficher les non lues ou non
    m_mp_NotificationsShowUnread(unread);
}

/**
 * Ajoute la liste des notifications au panel
 * 
 * @param {*} notifications 
 */
function m_mp_NotificationsAppendToPanel(notifications) {
    // Ajouter un element
    let e = (className, ...elements) => {
        let elem = document.createElement('div');
        elem.className = className;
        elem.append(...elements);
        return elem;
    };

    let unread = 0,
        unreadCat = [],
        notificationspanel = document.getElementById("notifications-panel");

    // Création initiale
    if (notificationspanel.innerHTML == '') {
        notificationspanel.append(m_mp_NotificationsAppendFilters(), e('content'));
    }

    let content = notificationspanel.querySelector('.content');
    
    // Nettoie le notifications panel pour le refresh
    content.innerHTML = '';

    for (const uid in notifications) {
        if (Object.hasOwnProperty.call(notifications, uid)) {
            const notification = notifications[uid];

            // Gérer les paramètres du centre de notification et les deleted
            if (!m_mp_NotificationSettings('notifications_center', notification)
                    || notification.isdeleted) {
                continue;
            }

            if (!notification.isread) {
                unread++;
                if (!unreadCat[notification.category]) {
                    unreadCat[notification.category] = 0;
                }
                unreadCat[notification.category]++;
            }

            content.append(m_mp_NotificationGetElement(notification));
        }
    }

    // Actualiser les catégories du select
    for (const category in rcmail.env.notifications_categories) {
        if (Object.hasOwnProperty.call(rcmail.env.notifications_categories, category)) {
            let option = document.querySelector('#notifications-panel .filters select option[value="' + category + '"]');
            if (option) {
                if (unreadCat[category]) {
                    option.text = rcmail.env.notifications_categories[category] + ' (' + unreadCat[category] + ')';
                }
                else {
                    option.text = rcmail.env.notifications_categories[category];
                }
            }
        }
    }

    // Afficher les non lues ou non
    m_mp_NotificationsShowUnread(unread);
}

/**
 * Génère les filtres sur les notifications
 */
function m_mp_NotificationsAppendFilters() {
    // Ajouter un element
    let e = (className, ...elements) => {
        let elem = document.createElement('div');
        elem.className = className;
        elem.append(...elements);
        return elem;
    };

    // Création d'un bouton
    let b = (href, className, textContent, title, onclick = null, newtab = false) => {
        let button = document.createElement('a'), 
            span = document.createElement('span');
        button.className = className + ' btn btn-secondary mel-button';
        button.href = href;
        button.textContent = textContent;
        button.title = title;
        if (onclick) {
            button.onclick = onclick;  
        }
        if (newtab) {
            button.target = '_blank';
        }
        span.className = 'filters_button';
        span.append(button);
        return span;
    };

    // Select
    let select = document.createElement('select'),
        option = document.createElement('option');

    select.className = 'categories input-mel mel-input custom-select pretty-select';
    select.setAttribute('aria-labelledby', 'mel-notification-title')

    // All categories
    option.value = 'all';
    option.text = rcmail.get_label('mel_notification.all');
    select.add(option);

    // Parcourir les categories de filtre
    
    for (const key in rcmail.env.notifications_categories) {
        if (Object.hasOwnProperty.call(rcmail.env.notifications_categories, key)) {
            if (rcmail.env.notifications_settings[key]) {        
                // Si on ne doit pas afficher la catégorie dans le centre de notification
                if (rcmail.env.notifications_settings[key]['notifications_center'] === false) {
                    continue;
                }
            }
            option = document.createElement('option');
            option.value = key;
            option.text = rcmail.env.notifications_categories[key];
            select.add(option);
        }
    }

    // onchange event
    select.onchange = () => {
        m_mp_NotificationFilter();
    };

    let title = e('title', rcmail.get_label('mel_notification.Notifications'));
    title.id = 'mel-notification-title';

    // Ajouter les filters
    let filters = e('filters container',
        e('row', e('col', title)),
        e('row', 
            (rcmail.env.notifications_set_read_on_panel_close ? '' : e('col-md-auto hide-touch', b(
                '#', 'read',
                rcmail.get_label('mel_notification.Mark all as read'),
                rcmail.get_label('mel_notification.Mark all as read title'),
                () => {
                    let notifications = m_mp_NotificationsGet(),
                        uids = [], 
                        filter = document.querySelector('#notifications-panel > .filters select.categories').value;

                    for (const uid in notifications) {
                        if (Object.hasOwnProperty.call(notifications, uid)) {
                            if (!notifications[uid].isread && (filter == 'all' || filter == notifications[uid].category)) {
                                uids.push(btoa(uid));
                            }
                        }
                    }
                    m_mp_NotificationsAction('read', uids);
                }
            ))),
            e('col-md-auto hide-touch', b(
                '#', 'delete',
                rcmail.get_label('mel_notification.Delete all'),
                rcmail.get_label('mel_notification.Delete all title'),
                () => {
                    if (confirm(rcmail.get_label('mel_notification.Delete all title'))) {
                        let notifications = m_mp_NotificationsGet(),
                            uids = [], 
                            filter = document.querySelector('#notifications-panel > .filters select.categories').value;

                        for (const uid in notifications) {
                            if (Object.hasOwnProperty.call(notifications, uid)) {
                                if (filter == 'all' || filter == notifications[uid].category) {
                                    uids.push(btoa(uid));
                                }
                            }
                        }
                        m_mp_NotificationsAction('del', uids);
                    }
                }
            )),
            e('col-sm', select),
            e('col-md-auto hide-touch',
                b(
                    rcmail.url('settings/settings') + '&_open_section=notifications', 
                    'manage', 
                    rcmail.get_label('mel_notification.Manage notifications'),
                    rcmail.get_label('mel_notification.Manage notifications title')
                )
            )
        ),
    );
    return filters;
}

/**
 * Filtrer les notifications en fonction du select
 */
function m_mp_NotificationFilter() {
    let select = document.querySelector('#notifications-panel > .filters select.categories');

    if (document.querySelector('#notifications-panel > .content > .nonotification'))
        document.querySelector('#notifications-panel > .content > .nonotification').remove();

    // Enlever tous les hidden
    for (const article of document.querySelectorAll('#notifications-panel article.hidden')) {
        article.className = article.className.replace(/ hidden/, '');
    }

    // Ajouter les hidden nécessaire
    if (select.value != 'all') {
        for (const article of document.querySelectorAll('#notifications-panel article:not(.' + select.value + ')')) {
            article.className += ' hidden';
        }
        // Est-ce qu'on a des notifications à afficher ?
        if (!document.querySelectorAll('#notifications-panel article.' + select.value).length) {
            let div = document.createElement('div');
            div.className = 'nonotification';
            div.textContent = rcmail.get_label('mel_notification.No notification for').replace(/%s/, rcmail.env.notifications_categories[select.value]);
            document.querySelector('#notifications-panel > .content').append(div);
        }
    }
    else {
        // Est-ce qu'on a des notifications à afficher ?
        if (!document.querySelectorAll('#notifications-panel article').length) {
            let div = document.createElement('div');
            div.className = 'nonotification';
            div.textContent = rcmail.get_label('mel_notification.No notification').replace(/%s/, rcmail.env.notifications_categories[select.value]);
            document.querySelector('#notifications-panel > .content').append(div);
        }
    }
}

/**
 * Retourne une date lisible à partir du modified
 * 
 * @param {*} created 
 * @returns 
 */
function m_mp_NotificationGetDate(created) {
    let date = new Date(created * 1000),
        now = Date.now() / 1000,
        text = '',
        title = date.toLocaleString();
    
    const diff = now - created;
    if (diff < 120) { // Si cela fait moins de 2 min
        text = rcmail.get_label('mel_notification.now');
    }
    else if (diff < 3600) { // Si cela fait moins d'une heure
        const min = Math.floor(diff/60);
        text = rcmail.get_label('mel_notification.X minutes ago').replace(/%d/, min);
    }
    else if (diff < 86400) { // Si cela fait moins de 24h
        const hours = Math.floor(diff/3600);
        text = rcmail.get_label('mel_notification.X hours ago').replace(/%d/, hours);
    }
    else if (diff < 604800) { // Si cela fait moins de 7 jours
        const _string = date.toString().split(' '),
                day = rcmail.get_label('mel_notification.' + _string[0].toLocaleLowerCase()),
                hour = _string[4].substring(0,5);
        
        text = rcmail.get_label('mel_notification.last day')
                        .replace(/%s/, day)
                        .replace(/%h/, hour);
    }
    else { // Sinon on affiche la date
        text = title;
    }

    // Return time and title
    return {
        title: title,
        text: text
    };
}

/**
 * Génére un DOM element à partir d'une notification
 * 
 * @param {*} notification 
 * @param {boolean} isPanel 
 * @returns 
 */
function m_mp_NotificationGetElement(notification, isPanel = true) {
    // Ajouter un element
    let e = (className, ...elements) => {
        let elem = document.createElement('div');
        elem.className = className;
        elem.append(...elements);
        return elem;
    };

    // Création d'un bouton
    let b = (href, className, textContent, title, onclick = null, newtab = false) => {
        let button = document.createElement('a'), 
            span = document.createElement('span');
        button.className = className + ' button';
        button.href = href;
        button.textContent = textContent;
        button.title = title;
        if (onclick) {
            button.onclick = onclick;  
        }
        if (newtab) {
            button.target = '_blank';
        }
        span.className = 'notification_button';
        span.append(button);
        return span;
    };
        
    let article = document.createElement('article'),
        title = document.createElement('h1'),
        content = document.createElement('p'),
        category = document.createElement('span'),
        from = document.createElement('div');
    
    // Initialise les éléments de la notification
    title.textContent = notification.title;
    content.innerHTML = notification.content;
    category.textContent = rcmail.env.notifications_categories[notification.category] ?? notification.category;
    from.textContent = notification.from;
    category.className = 'category';
    from.className = 'from';
    article.id = 'notif' + notification.uid.replace(/\W/g,'_');
    article.className = notification.category + (notification.isread ? '' : ' unread') + " container";

    if (isPanel) {
        // Traitement de la date
        let _date = m_mp_NotificationGetDate(notification.modified),
            date = document.createElement('span');

        date.className = 'date';
        date.textContent = _date.text;
        date.title = _date.title;

        // Onclick pour passer en lu/non lu
        let read_onclick = (e) => {
            e.stopPropagation(); e.preventDefault();
            m_mp_NotificationsAction(
                document.querySelector('#notif' + notification.uid.replace(/\W/g,'_')).className.indexOf('unread') === -1 
                    ? 'unread' : 'read', 
                [btoa(notification.uid)]);
        };

        // Ajouter le onclick sur l'article
        article.onclick = read_onclick;
        article.title = notification.isread ? rcmail.get_label('mel_notification.Mark as unread title') : rcmail.get_label('mel_notification.Mark as read title');

        // Création du bouton pour passer en lu
        let button_read = b('#', 'read', 
            notification.isread ? rcmail.get_label('mel_notification.Mark as unread') : rcmail.get_label('mel_notification.Mark as read'),
            notification.isread ? rcmail.get_label('mel_notification.Mark as unread title') : rcmail.get_label('mel_notification.Mark as read title'),
            read_onclick);

        // Création du bouton pour supprimer
        let button_delete = b('#', 'delete', 
            rcmail.get_label('mel_notification.Delete'),
            rcmail.get_label('mel_notification.Delete title'),
            (e) => { e.stopPropagation(); e.preventDefault(); m_mp_NotificationsAction('del', [btoa(notification.uid)]); }
        );

        // Ajoute la notification sans action au panel
        article.append(e('row', e('col-sm', category), e('col-sm', date)), e('row', e('col-sm', from, title, content), e('col-md-auto hide-touch', button_read, button_delete)));
    }
    else {
        // On est dans la stack on ajoute un onclick event
        article.onclick = function() {
            // Passer en lu ?
            if (rcmail.env.notifications_set_read_on_click) {
                m_mp_NotificationsAction('read', [btoa(notification.uid)]);
            }
            this.remove();
        };

        // Ajoute la notification à la stack
        article.append(e('row', e('col-sm', category)), e('row', e('col-sm', from)), e('row', e('col-sm', title)), e('row', e('col-sm', content)));
    }

    // Gestion de l'action/des actions
    if (notification.action) {
        let actions = [];
        for (const key in notification.action) {
            if (Object.hasOwnProperty.call(notification.action, key)) {
                const action = notification.action[key];
                actions.push(
                    b(
                        action.href ?? '#',
                        action.class ? action.class + ' action' : 'action',
                        action.text ?? rcmail.get_label('mel_notification.Action'),
                        action.title ?? rcmail.get_label('mel_notification.Action title'),
                        action.command ? (e) => { rcmail.command(action.command, action.params ?? '', e); e.stopPropagation(); } : (e) => { e.stopPropagation(); },
                        action.newtab ?? false
                    )
                );
            }
        }
        // Ajout des actions à l'article
        article.append(e('row', e('col-sm', ...actions)));
    }

    return article;
}
