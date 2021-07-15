// $(document).ready(
//     function ()
//     {
        

//     }  
// );

rcmail.addEventListener('responsebefore', function(props) {

    if (props.response && props.response.action == 'task') {
        parent.rcmail.triggerEvent(mel_metapage.EventListeners.tasks_updated.get);
    }

});

if (rcmail.env.task === "tasks")
{
    console.log("yolo");
    rcmail.addEventListener("pamella.editTask.after", (element) => {
        const event = rcmail.local_storage_get_item("task_id");

        if (event !== null && event !== undefined)
        {
            $("#taskedit-tasklist").val(event);
            rcmail.local_storage_remove_item("task_id");
        }
    });

    rcmail.addEventListener("pamella.tasks.afterinit", (task) => {

        m_mp_action_from_storage('task_create', async () => {

            //let tmp = setTimeout(async () => {

                await wait(() => rcmail.busy);

                rcmail.command('newtask');
                //clearTimeout(tmp);

                rcmail.triggerEvent("pamella.editTask.after", undefined);


            //}, 100);

        });
        
    });

    rcmail.addEventListener("plugin.data_ready", (r) => {
        
        let val = mel_metapage.Storage.get("task_to_open");

        if (val !== null && val !== undefined)
        {
            mel_metapage.Storage.remove("task_to_open");
            setTimeout(() => {
                $(`#${val}-title`).parent().click();
            }, 100);
        }
    });
    // new Promise(async (i,e) => {
    //     let event = rcmail.local_storage_get_item("task_id");

    //     if (event === null || event === undefined)
    //         return;
    //     else
    //     {
    //         //await wait(() => $("#taskedit").hasClass("hidden"));
    //         $("#taskedit-tasklist").val(event);
    //         rcmail.local_storage_remove_item("task_id");
    //     }
        
    // });
}