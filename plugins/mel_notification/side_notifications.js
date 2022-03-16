function side_notification({
    key,
    additionnalKey = '',
    icon=null,
    items=null,
    getdatas,
    updateNotif,
    selector,
    setup = false,
    onSetup = null,
    startSetup = false
})
{
    const storage = items ?? mel_metapage.Storage.get(key);

    $(selector).each((i,e) => {
        e = $(e);

        if (icon !== null && e.find('.replacedClass').length > 0) e.find('.replacedClass').removeClass('replacedClass').addClass(icon + ' ariane-icon');

        const datas = getdatas(storage, e);

        updateNotif(datas, e);
    });

    if(setup === true)
    {
        const setup_key = key+additionnalKey;
        if (side_notification[setup_key] === undefined || side_notification[setup_key] === null)
        {
            side_notification[setup_key] = {};
        }

        if (side_notification[setup_key].setup !== true)
        {
            rcmail.addEventListener(`storage.change.${key}`, (item) => {
                side_notification({
                    key,
                    icon, 
                    items:item,
                    getdatas,
                    updateNotif,
                    selector,
                    setup:false
                });
            });

            if (onSetup !== null) onSetup(startSetup);

            side_notification[setup_key].setup = true;
        }
    }
}

side_notification.workspaces = function ({
    _key,
    _icon,
    _class,
    _getWorkspaceData,
    _count,
    items = null,
    hideParentIfEmpty = false,
    additionnalKey = ''
})
{
    //debugger;
    const key = _key;
    const icon = _icon;
    const selector = `.workspace .${_class}`;
    side_notification(
        {
            key:key,
            icon:icon,
            items:items,
            getdatas:(storage, $element) => {
                //const uid = $element.parent().parent().parent().attr("id").replace('wsp-', '');
                let $parent = $element;
                while(!($parent.attr("id") === undefined ? false : $parent.attr("id").includes('wsp')) && $parent.attr("id") !== "layout")
                {
                    $parent = $parent.parent();
                }

                const uid = $parent.attr("id").replace('wsp-', '').replace('-epingle', '').replace('notifs-wsp-', '');
                return storage === null || storage === undefined ? null : _getWorkspaceData(storage, uid, $element);
            },
            updateNotif:(datas, $element) => {
                const count = datas !== undefined && datas !== null ? _count(datas, $element) : 0;
                let notif = $element.find(".wsp-notif");

                if (count > 0)
                {
                    notif.css('display', '').html(count);

                    if (hideParentIfEmpty === true) $element.parent().css('display', '')
                }
                else{
                    notif.css('display', 'none').html(0);

                    if (hideParentIfEmpty === true) $element.parent().css('display', 'none');
                }
            },
            selector:selector,
            setup:true
        }
    );
}

side_notification.wsp_mail = function (
    items = null,
    hideParentIfEmpty = false
)
{
    //debugger;
    const key = mel_metapage.Storage.wsp_mail;
    const icon = 'icon-mel-mail';
    const notif_class = 'mail';

    side_notification.workspaces({
        _key:key,
        _icon:icon, 
        _class:notif_class,
        _getWorkspaceData: (storage, uid) => {
            return storage[uid];
        },
        _count: (datas, $element) => {
            return datas.length;
        },
        items,
        hideParentIfEmpty
    });
}

side_notification.wsp_agenda = function (
    items = null,
    hideParentIfEmpty = false
)
{
    const key = mel_metapage.Storage.calendar;
    const icon = 'icon-mel-calendar';
    const notif_class = 'calendar';

    side_notification.workspaces({
        _key:key,
        _icon:icon, 
        _class:notif_class,
        _getWorkspaceData: (storage, uid) => {
            return Enumerable.from(storage).where(x => x.categories !== undefined && x.categories.length > 0 && x.categories[0].includes(uid) && x.free_busy !== "free");
        },
        _count: (datas, $element) => {
            return datas.count();
        },
        items,
        hideParentIfEmpty    
    });
}

side_notification.wsp_documents = function (
    items = null,
    hideParentIfEmpty = false
)
{
    const key = `wsp_doc_parent${rcmail.env.username}`;
    const icon = 'icon-mel-folder';
    const selector = `.workspace .doc`;

    let elements = [];

    side_notification(
        {
            key:key,
            icon:icon,
            items:items,
            getdatas:(storage, $element) => {
                let $parent = $element;
                while(!($parent.attr("id") === undefined ? false : $parent.attr("id").includes('wsp')) && $parent.attr("id") !== "layout")
                {
                    $parent = $parent.parent();
                }

                const uid = $parent.attr("id").replace('wsp-', '').replace('-epingle', '').replace('notifs-wsp-', '');
                elements.push(uid);
                return storage === null || storage === undefined ? null : storage[uid];
            },
            updateNotif:(datas, $element) => {
                let notif = $element.find(".wsp-notif");

                if (datas !== undefined && datas !== null && datas[id])
                {
                    notif.css('display', '').html("•");

                    if (hideParentIfEmpty === true) $element.parent().css('display', '')
                }
                else 
                {
                    notif.css('display', 'none').html('');

                    if (hideParentIfEmpty === true) $element.parent().css('display', 'none')
                }
            },
            selector:selector,
            setup:true,
            startSetup:true,
            onSetup:(startSetup) => {

                let _setup = () => {
                    //debugger;
                    let setup = async () => {
                        for (const key in elements) {
                            if (Object.hasOwnProperty.call(elements, key)) {
                                const element = elements[key];
                                let tree = mel_metapage.Storage.get(`wsp_nc_${rcmail.env.username}`);

                                if (tree != null && tree !== undefined && tree.tree !== undefined) tree = tree.tree[element];

                                try {
                                    new RoundriveShow(`dossiers-${element}`, null, {
                                        wsp:element,
                                        ignoreInit:true,
                                        updatedFunc: (bool) => {
                                            const id = `wsp_have_news_${rcmail.env.username}`;
                                            let datas = mel_metapage.Storage.get(id);
                                            if (datas === undefined || datas === null)
                                                datas = {};
                                
                                            datas[element] = bool;
                                            
                                            mel_metapage.Storage.set(id, datas);
                                        }
                                    }).checkNews(true);
                                } catch (error) {
                                    
                                }

                            }
                        }
                    };
    
                    switch (rcmail.env.task) {
                        case "bureau":
                            setup();
                            break;
            
                        case "workspace":
                            switch (rcmail.env.action) {
                                case "":
                                case "index":
                                    setup();
                                    break;
            
                                case "workspace":
                                    try {
                                        if (rcmail.env.wsp_roundrive_show)
                                            rcmail.env.wsp_roundrive_show.checkNews();
                                    } catch (error) {
                                        
                                    }
                                    break;
                            
                                default:
                                    break;
                            }
                            break;
                    
                        default:
                            break;
                    }
                };

                rcmail.addEventListener('mel_metapage_refresh', _setup);//refresh end
                _setup();

            } // onsetup end
        }
    );
}

side_notification.chat = {
    key:mel_metapage.Storage.ariane,
    icon:'icon-mel-message',
    menu:(items = null, hideParentIfEmpty = false) => {
        const key = side_notification.chat.key;
        const selector = '#taskmenu .rocket';
        side_notification(
            {
                key:key,
                icon:null,
                items:items,
                getdatas:(storage, $element) => {
                    return storage === null || storage === undefined ? null : window.new_ariane(storage);
                },
                updateNotif:(datas, $element) => {
                    let notif = $element.find("#" + mel_metapage.Ids.menu.badge.ariane);

                    if (notif.length === 0)
                    {
                        $element.append(`<sup><span id="`+mel_metapage.Ids.menu.badge.ariane+`" class="roundbadge menu lightgreen" style="">?</span></sup>`);
                        notif = $element.find("#" + mel_metapage.Ids.menu.badge.ariane);
                    }

                    const personnal = datas === null || datas === undefined ? 0 : datas.getPersonalUnreads();
    
                    if (personnal > 0)
                    {
                        notif.css('display', '').html(personnal);
    
                        if (hideParentIfEmpty === true) $element.parent().css('display', '')
                    }
                    else if (datas !== null && datas !== undefined && datas.have_unreads())
                    {
                        notif.css('display', '').html("•");
    
                        if (hideParentIfEmpty === true) $element.parent().css('display', '')
                    }
                    else{
                        notif.css('display', 'none').html(0);
    
                        if (hideParentIfEmpty === true) $element.parent().css('display', 'none');
                    }
                },
                selector:selector,
                setup:true
            }
        );
    },
    wsp: (
        items = null,
        hideParentIfEmpty = false
    ) =>
    {
        const key = side_notification.chat.key;
        const icon = side_notification.chat.icon;
        const notif_class = 'channel';
    
        side_notification.workspaces({
            _key:key,
            _icon:icon, 
            _class:notif_class,
            _getWorkspaceData: (storage, uid) => {
                return window.new_ariane(storage)
            },
            _count: (datas, $element) => {
                return datas.getChannel($element.data("channel")) ?? 0;
            },
            additionnalKey:'_wsp',
            items,
            hideParentIfEmpty,
        });
    },
    start: () => {
        side_notification.chat.menu();
        side_notification.chat.wsp();
    }
};
