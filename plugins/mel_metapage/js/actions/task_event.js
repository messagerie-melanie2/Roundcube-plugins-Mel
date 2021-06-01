// $(document).ready(
//     function ()
//     {
        

//     }  
// );

rcmail.addEventListener('responseafter', function(props) {

    if (props.response && props.response.action == 'task') {
        parent.rcmail.triggerEvent(mel_metapage.EventListeners.tasks_updated.get);
    }

});

if (rcmail.env.task === "tasks")
{
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