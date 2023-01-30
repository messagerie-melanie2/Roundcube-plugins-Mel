rcmail.addEventListener('responsebefore', function(props) {

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

                await wait(() => rcmail.busy);

                rcmail.command('newtask');
                rcmail.triggerEvent("pamella.editTask.after", undefined);
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

    rcmail.addEventListener('init', () => {
        $('#layout-list .searchbar.menu').append(
            $(`<a href="#" class="button down-icon" style="" title="Afficher les filtres" role="button"></a>`).click((e) => {
                $('#layout-list .pagenav.pagenav-list.menu').click();
                e = $(e.currentTarget);
                
                if (e.hasClass('down-icon')) e.removeClass('down-icon').addClass('up-icon');
                else e.addClass('down-icon').removeClass('up-icon');
            })
        ).append(
            $(`<a href="#" class="button search-icon" style="pointer-events:none" title="Rechercher" role="button"></a>`).click((e) => {
                $('#searchform').change();
            })
        ).find('form').addClass('mel-after-remover');
    });
}//mel-after-remover