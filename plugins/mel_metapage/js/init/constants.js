const ev_calendar_url = '?_task=calendar&_action=load_events';
const mel_metapage = {
    EventListeners: {
        calendar_updated:new EventListenerDatas("mel_metapage.calendar_updated"),
        tasks_updated:new EventListenerDatas("mel_metapage.tasks_updated"),
        mails_updated: new EventListenerDatas("mel_metapage.mails_updated"),
    },
    Storage: {
        get:function(key) {
            return JSON.parse(window.localStorage.getItem(key));
        },
        set:function(key, item)
        {
            window.localStorage.setItem(key, JSON.stringify(item));
        },
        remove: function (key){
            window.localStorage.removeItem(key);
        },
        calendar:"mel_metapage.calendar",
        tasks:"mel_metapage.tasks",
        mail:"mel_metapage.mail.count",
    },
    Symbols: {
        my_day:{
            calendar:Symbol("calendar"),
            tasks:Symbol("tasks")
        }
    },
    Ids: {
        menu:{
            badge:{
                calendar:"menu-badge-calendar",
                tasks:"menu-badge-tasks",
                mail:"menu-badge-mail",
            }
        }
    },

}; 