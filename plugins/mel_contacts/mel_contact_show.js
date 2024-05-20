if (window.rcmail) {
  rcmail.addEventListener('init', function () {
    if (rcmail.env.task == 'addressbook' && rcmail.env.action == 'show' && rcmail.env.source == 'amande') {
      rcmail.enable_command('copy-to-contact', true);
    }
  });

  $(document).ready(function () {
    //Renvoie les listes de diffusions du contact sélectionné
    $("ul.nav-tabs li.nav-item a:contains(" + rcmail.gettext('lists', 'mel_contacts') + ")").click(async function () {
      if ($('#contactfield').length === 0) {

        const id_loading = rcmail.set_busy(true, 'loading');

        await mel_metapage.Functions.post(
          mel_metapage.Functions.url('addressbook', 'plugin.get-lists'),
          { cid: rcmail.env.cid },
          (datas) => {
            const contactfieldgroup = $(".contactfieldgroup.contactcontrollerlist");
            let html;

            try {
              datas = JSON.parse(datas);
            } catch (e) {
              datas = [];
            }

            if (datas.length !== 0) {
              const content = datas.map(data => {
                return new mel_html2('div', {
                  attribs: { class: 'row' },
                  contents: [new mel_html('a', { href: data.url, target: "_blank" }, data.name)]
                });
              });

              html = new mel_html2('div', { attribs: { id: 'contactfield' }, contents: content });
            } else {
              html = new mel_html('div', { class: 'no-list' }, rcmail.gettext('no_lists', 'mel_contacts'));
            }

            contactfieldgroup.html(html.generate());
          }, //success
          (...args) => { }, //error
        );

        rcmail.set_busy(false, 'loading', id_loading);

      }
    });
  });
}

// Copy contact to default addressbook
rcube_webmail.prototype.copy_to_contact = function () {
  this.http_post('addressbook/copy', { _cid: this.env.cid, _source: this.env.source, _to: rcmail.env.default_addressbook }, this.set_busy(true, 'loading'));
};
