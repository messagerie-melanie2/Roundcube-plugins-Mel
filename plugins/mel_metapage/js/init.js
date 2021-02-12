class EventListenerDatas
{
    constructor(event, before = null, after = null)
    {
        this.get = event;
        if (before === null)
        {
           if (event.includes("."))
           {
               let tmp = event.split(".");
               before = tmp[0] + ".before." + tmp[1];
           } 
        }
        this.before = before;
        if (after === null)
        {
           if (event.includes("."))
           {
               let tmp = event.split(".");
               after = tmp[0] + ".after." + tmp[1];
           } 
        }
        this.after = after;
    }

    toString()
    {
        return this.get;
    }
}
const ev_calendar_url = '?_task=calendar&_action=load_events';
const mel_metapage = {
    EventListeners: {
        calendar_updated:new EventListenerDatas("mel_metapage.calendar_updated"),
        tasks_updated:new EventListenerDatas("mel_metapage.tasks_updated"),
    },
    Storage: {
        calendar:"mel_metapage.calendar",
        tasks:"mel_metapage.tasks"
    },
    Symbols: {
        my_day:{
            calendar:Symbol("calendar"),
            tasks:Symbol("tasks")
        }
    }
}; 

(function(){

if (rcmail)
{
    if (rcmail.env.task === "tasks")
        parent.child_rcmail = rcmail;
    parent.rcmail.addEventListener("init", function() {
        //Definition des functions
        parent.rcmail.mel_metapage_fn = {
            calendar_updated: function () {
                parent.rcmail.triggerEvent(mel_metapage.EventListeners.calendar_updated.before);
                rcmail.set_busy(true, "loading");
                if (parent.rcmail.env.ev_calendar_url === undefined)
                    parent.rcmail.env.ev_calendar_url = ev_calendar_url;
                $.ajax({ // fonction permettant de faire de l'ajax
                type: "POST", // methode de transmission des données au fichier php
                url: parent.rcmail.env.ev_calendar_url+'&start='+dateNow(new Date())+'&end='+dateNow(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()+1)), // url du fichier php
                success: function (data) {
                    try {
                        let events = [];
                        data = JSON.parse(data);
                        let startMoment;
                        let endMoment;
                        let element;
                        let now = moment().startOf('day');
                        for (let index = 0; index < data.length; ++index) {
                            element = data[index];
                            if (element.allDay)
                            {
                                if (moment(element.start).date() === moment().date())
                                {                                   
                                    element.start = moment(element.start).startOf('day').format("YYYY-MM-DDTHH:mm:ss");
                                    element.end = moment(element.start).startOf('day').add({
                                        hours:23,
                                        minutes:59,
                                        seconds:59
                                    }).format("YYYY-MM-DDTHH:mm:ss");
                                    //console.log(element);
                                    events.push(element);
                                }
                            }
                            else
                            {
                                startMoment = moment(element.start);
                                endMoment = moment(element.end);
                                if (startMoment < now)
                                    element.start = now.format("YYYY-MM-DDTHH:mm:ss");
                                if (endMoment > now.add({
                                    hours:23,
                                    minutes:59,
                                    seconds:59
                                }))
                                    element.end = now.add({
                                        hours:23,
                                        minutes:59,
                                        seconds:59
                                    }).format("YYYY-MM-DDTHH:mm:ss");
                                events.push(element);
                            }
                        }
                        data = null;
                        rcmail.local_storage_set_item(mel_metapage.Storage.calendar, events);
                        parent.rcmail.triggerEvent(mel_metapage.EventListeners.calendar_updated.after);
                    } catch (ex) {
                        console.error(ex);
                        rcmail.display_message("Une erreur est survenue lors de la synchronisation.", "error")
                    }
                },
                error: function (xhr, ajaxOptions, thrownError) { // Add these parameters to display the required response
                    console.error(xhr, ajaxOptions, thrownError);
                    rcmail.display_message("Une erreur est survenue lors de la synchronisation.", "error")
                },
             }).always(() => {
                rcmail.set_busy(false);
                rcmail.clear_messages();
             });
            },
            tasks_updated: function(){
                rcmail.set_busy(true, "loading");
                //?_task=tasks&_action=fetch&filter=0&lists=tommy_-P-_delphin_-P-_i&_remote=1&_unlock=true&_=1613118450180
                parent.rcmail.triggerEvent(mel_metapage.EventListeners.tasks_updated.before);
                $.ajax({ // fonction permettant de faire de l'ajax
                type: "POST", // methode de transmission des données au fichier php
                url: '?_task=tasks&_action=fetch&filter=0&_remote=1&_unlock=true&_=1613118450180',//rcmail.env.ev_calendar_url+'&start='+dateNow(new Date())+'&end='+dateNow(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()+1)), // url du fichier php
                success: function (data) {
                    try {
                        data=JSON.parse(data).callbacks[0][1].data;
                        let datas_to_save = [];
                        let element;
                        for (let index = 0; index < data.length; ++index) {
                            element = data[index];
                            if (element.complete === 0)
                            {
                                element.mel_metapage = {
                                    order:(element._hasdate === 1 ? (moment(element.datetime*1000) <= moment() ? 0 : 1 ) : 1),
                                };
                                datas_to_save.push(element);
                            }
                        }
                        datas_to_save.sort((a,b) => a.mel_metapage.order - b.mel_metapage.order);
                        rcmail.local_storage_set_item(mel_metapage.Storage.tasks, datas_to_save);
                        parent.rcmail.triggerEvent(mel_metapage.EventListeners.tasks_updated.after);
                    } catch (ex) {
                        console.error(ex);
                        rcmail.display_message("Une erreur est survenue lors de la synchronisation.", "error")
                    }
                },
                error: function (xhr, ajaxOptions, thrownError) { // Add these parameters to display the required response
                    console.error(xhr, ajaxOptions, thrownError);
                    rcmail.display_message("Une erreur est survenue lors de la synchronisation.", "error")
                },
             }).always(() => {
                rcmail.set_busy(false);
                rcmail.clear_messages();
             });
            },
            refresh: function () {}
        };

        //ajout des events listener
        parent.rcmail.addEventListener(mel_metapage.EventListeners.calendar_updated.get, parent.rcmail.mel_metapage_fn.calendar_updated);
        parent.rcmail.addEventListener(mel_metapage.EventListeners.tasks_updated.get, parent.rcmail.mel_metapage_fn.tasks_updated);

        //checks
        let local_storage = {
            calendar:rcmail.local_storage_get_item(mel_metapage.Storage.calendar)
        }
        if (local_storage.calendar != null && local_storage.calendar.length > 0)
        {
            let startMoment = moment(local_storage.calendar[0].start);
            let startDate = startMoment.date();
            let endMoment = moment(local_storage.calendar[0].end);
            let endDate = endMoment.date();
            let now = moment();
            let date = now.date();
            //console.log(startDate != date, endDate != date, startMoment, now, endMoment);
            if (startDate != date)
            {
                parent.rcmail.triggerEvent(mel_metapage.EventListeners.calendar_updated.get);
            }
        }
    });

}

function dateNow(date){
	let set = date; 
	let getDate = set.getDate().toString();
	if (getDate.length == 1){ //example if 1 change to 01
	 getDate = "0"+getDate;
	}
	let getMonth = (set.getMonth()+1).toString();
	if (getMonth.length == 1){
	 getMonth = "0"+getMonth;
	}
	let getYear = set.getFullYear().toString();
	let dateNow = getYear + "-" + getMonth + '-' + getDate+"T00:00:00";
	return dateNow;
  }

})();
