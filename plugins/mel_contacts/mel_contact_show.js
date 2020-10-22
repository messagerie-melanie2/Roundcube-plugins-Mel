if (window.rcmail) {
    rcmail.addEventListener('init', function() {
        if (rcmail.env.task == 'addressbook' && rcmail.env.action == 'show' && rcmail.env.source == 'amande') {
            rcmail.enable_command('copy-to-contact', true);
        }
    });
}

// Copy contact to default addressbook
rcube_webmail.prototype.copy_to_contact = function()
{
    this.http_post('addressbook/copy', {_cid: this.env.cid, _source: this.env.source, _to: rcmail.env.default_addressbook}, this.set_busy(true, 'loading'));
};
