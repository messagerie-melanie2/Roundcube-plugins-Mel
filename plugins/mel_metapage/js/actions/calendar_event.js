$(document).ready(
    function ()
    {
        let event = rcmail.local_storage_get_item("calendar_redirect");
        let cal = new rcube_calendar_ui($.extend(rcmail.env.calendar_settings, rcmail.env.libcal_settings));
        if (parent.child_cal === undefined)
            parent.child_cal = cal;
        if (event !== null)
        {
            console.log("parent.rcmail.env.calendar_mm_created", parent.rcmail.env.calendar_mm_created);
            if (parent.rcmail.env.calendar_mm_created !== undefined && parent.rcmail.env.calendar_mm_created === true)
            {
                event = JSON.parse(event.replace(/£¤£/g, '"'))
                cal.event_show_dialog(event);
                rcmail.local_storage_remove_item("calendar_redirect");
                console.log(moment(event.start).format("YYYY-MM-DD")),
                // setTimeout(() => {
                //     $('#datepicker').datepicker("setDate", moment(event.start).format("YYYY-MM-DD"))
                // }, 1000);
                delete parent.rcmail.env.calendar_mm_created;
            }
        }
        else {
            // event = rcmail.local_storage_get_item("calendar_create");
            // if(event !== null)
            // {
            //     console.log("event", event, parent.child_cal);
            //     if (event === true)
            //         parent.child_cal.add_event("")
            //     rcmail.local_storage_remove_item("calendar_create");
            // }
        }


        // setInterval(() => {
        //     if (rcmail.busy)
        //     {
        //         rcmail.set_busy(false);
        //         $(".loading").remove();
        //     }
        // }, 1000);  


        rcmail.addEventListener('responseafter', function(props) {
            //console.log("responseafter", props);
            if (props.response && props.response.action == 'event') {
                let navigator = window != parent ? parent : window;
                navigator.rcmail.triggerEvent(mel_metapage.EventListeners.calendar_updated.get);
                if (rcmail.env.task === "calendar")
                {
                    if (rcmail.busy)
                    {
                        rcmail.set_busy(false);
                        $(".loading").remove();
                    }
                }
            }

        });
    


    }  
);