$(document).ready(() => {
  rcmail.register_command(
    'rcs-agenda-tri-alpha',
    function () {
      if (rcmail.env.account) {
        alert(
          'Vous pouvez trier par ordre alphabétique seulement depuis votre agenda personnel !',
        );

        return;
      }

      if (
        confirm(
          "Cela va changer l'ordre de vos agenda, êtes vous-sûr de vôtre action ?",
        )
      ) {
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
