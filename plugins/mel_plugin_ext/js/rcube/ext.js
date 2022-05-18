
if (rcmail.env.task === "mail" && rcmail.env.action === "compose")
{
    rcmail.addEventListener('init', () => {
        $('.save.model').off('click').click(() => {
            rcmail.env.save_has_model = true;
            rcmail.command('savedraft');
        }).removeClass('disabled');
    })

    const alias_mel_rcmail_submit_messageform = rcmail.submit_messageform;

    rcmail.submit_messageform = function (...args)
    {
        var form = this.gui_objects.messageform;

        form._model.value = this.env.save_has_model === true ? '1' : '';

        if (this.env.save_has_model) delete this.env.save_has_model;

        alias_mel_rcmail_submit_messageform.call(this, ...args);
    };
}

