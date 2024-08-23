$(document).ready(() => {
  rcmail.register_command(
    'rcs-agenda-tri-alpha',
    function () {
      if (rcmail.env.account) {
        alert(rcmail.gettext('cannot_sort', 'mel_moncompte'));

        return;
      }

      if (confirm(rcmail.gettext('sort_warning', 'mel_moncompte'))) {
        const busy = rcmail.set_busy(true, 'loading');
        mel_metapage.Functions.post(
          mel_metapage.Functions.url(
            'settings',
            'plugin.ressources_calendar_agendas_tri_alpha',
          ),
          {},
          function success(data) {
            //debugger;
            if (data === 'reload') {
              window.location.reload();
            }
          },
        ).always(() => rcmail.set_busy(false, 'loading', busy));
      }
    },
    true,
  );
});
