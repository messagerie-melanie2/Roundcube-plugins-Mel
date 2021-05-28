$(document).ready(
    function ()
    {
        rcmail.addEventListener('responseafter', function(props) {

            if (props.response && props.response.action == 'task') {
                parent.rcmail.triggerEvent(mel_metapage.EventListeners.tasks_updated.get);
            }

        });
    
        if (rcmail.env.task === "tasks")
        {
            new Promise(async (i,e) => {
                let event = rcmail.local_storage_get_item("task_id");

                if (event === null || event === undefined)
                    return;
                else
                {
                    await wait(() => $("#taskedit").hasClass("hidden"));
                    $("#taskedit-tasklist").val(event);
                    rcmail.local_storage_remove_item("task_id");
                }
                
            });
        }

    }  
);