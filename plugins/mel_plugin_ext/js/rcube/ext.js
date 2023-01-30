
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

const alias_mel_rcmail_set_unread_count_display = rcmail.set_unread_count_display;
rcmail.set_unread_count_display = function(...args)
{
    const default_option = args[1];

    if (rcmail.env["mel_metapage.tab.notification_style"] !== 'none') args[1] = false;

    alias_mel_rcmail_set_unread_count_display.call(this, ...args);
    this.triggerEvent('set_unread_count_display.after', {set_title:default_option});
};

const alias_mel_rcmail_set_pagetitle = rcmail.set_pagetitle;
rcmail.set_pagetitle = function(...args)
{
    alias_mel_rcmail_set_pagetitle.call(this, ...args);

    if (window !== parent && top.rcmail.env.current_task === rcmail.env.task) top.rcmail.set_pagetitle(...args);
}
