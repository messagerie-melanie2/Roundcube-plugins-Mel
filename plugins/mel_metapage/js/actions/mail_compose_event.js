$(document).ready(() => {

    if (rcmail.env.is_model)
    {
        removeCookie('current_model_id');
        const id = parseInt(rcmail.env.model_id);

        $('#toolbar-menu .send').css('display', 'none');
        $('#toolbar-menu .save.draft').css('display', 'none');
        $('#toolbar-menu .save.model .inner').text(rcmail.gettext('save'));
        $('[name="_draft_saveid"]').val(id);
    }

    if (!!rcmail.env.default_sended_folder) {
        $('#compose-store-target').val(rcmail.env.default_sended_folder);

        let $select = $('#compose-store-target')[0];
        
        if ('' === $select.value) {
            $select.value = rcmail.env.sended_folder;
        }

        $select = null;
    }

    if ('empty' === rcmail.env['compose-option'] && true === rcmail.env.show_sig) {
        rcmail.command('insert-sig');
    }
});