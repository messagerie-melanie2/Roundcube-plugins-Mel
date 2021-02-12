$(document).ready(
    function ()
    {
        // let event = rcmail.local_storage_get_item("calendar_redirect");
        // let cal = new rcube_calendar_ui($.extend(rcmail.env.calendar_settings, rcmail.env.libcal_settings));
        // if (event !== null)
        // {
        //     cal.event_show_dialog(event);
        //     rcmail.local_storage_remove_item("calendar_redirect");
        //     // console.log(moment(event.start).format("YYYY-MM-DD")),
        //     // setTimeout(() => {
        //     //     $('#datepicker').datepicker("setDate", moment(event.start).format("YYYY-MM-DD"))
        //     // }, 1000);
        // }
        // else {
        //     event = rcmail.local_storage_get_item("calendar_create");
        //     if(event !== null)
        //     {
        //         if (event === true)
        //             cal.add_event("")
        //         rcmail.local_storage_remove_item("calendar_create");
        //     }
        // }


        rcmail.addEventListener('responseafter', function(props) {
            if (props.response && props.response.action == 'task') {
                console.log("rc", parent.rcmail);
                //let navigator = window != parent ? parent : window;
                parent.rcmail.triggerEvent(mel_metapage.EventListeners.tasks_updated.get);
            }

        });
    


    }  
);