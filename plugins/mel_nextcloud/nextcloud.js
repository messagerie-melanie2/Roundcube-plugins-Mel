$(document).ready(function () {
  const id = rcmail.set_busy(true, 'loading');
  const timeout = setTimeout(() => {
    rcmail.set_busy(false, 'loading', id);
  }, 10000);
  $('#mel_nextcloud_frame').on('load', () => {
    rcmail.set_busy(false, 'loading', id);
    $('#mel_nextcloud_frame').off('load');
    clearTimeout(timeout);

    if (
      rcmail.env.last_src_updated !== undefined &&
      rcmail.env.last_src_updated !== null
    ) {
      try {
        if ($('#mel_nextcloud_frame')[0].src !== rcmail.env.last_src_updated) {
          $('#mel_nextcloud_frame')[0].src = rcmail.env.last_src_updated;
          delete rcmail.env.last_src_updated;
        } else if (
          $('#mel_nextcloud_frame')[0].contentWindow.location.href !==
          rcmail.env.last_src_updated
        ) {
          $('#mel_nextcloud_frame')[0].src = rcmail.env.last_src_updated;
          delete rcmail.env.last_src_updated;
        }
      } catch (error) {
        console.error(
          '###[$("#mel_nextcloud_frame").on("load", () => {]',
          error,
        );
      }
    }

    window.document
      .getElementById('mel_nextcloud_frame')
      .contentWindow.postMessage(`switch-theme-${MEL_ELASTIC_UI.color_mode()}`);
  });

  function nc_login(refresh = true) {
    return $.ajax({
      // fonction permettant de faire de l'ajax
      type: 'POST', // methode de transmission des données au fichier php
      url: rcmail.env.nextcloud_url, // url du fichier php
      data:
        'rc_user=' +
        rcmail.env.nextcloud_username +
        '&rc_pwd=' +
        rcmail.env.nextcloud_password +
        '&from_roundcube=1', // données à transmettre
      xhrFields: {
        withCredentials: false,
      },
      crossDomain: true,
      success: function (data) {
        //console.log("nc_login", refresh, rcmail.env.nextcloud_gotourl);
        if (refresh) {
          if (navigator.appName == 'Microsoft Internet Explorer') {
            window.document.getElementById('mel_nextcloud_frame').src =
              rcmail.env.nextcloud_gotourl;
            window.document
              .getElementById('mel_nextcloud_frame')
              .contentWindow.location.reload(true);
          } else {
            window.document.getElementById('mel_nextcloud_frame').src =
              rcmail.env.nextcloud_gotourl;
          }
        }
        //    $("#wait_box").hide();
      },
      error: function (xhr, ajaxOptions, thrownError) {
        // Add these parameters to display the required response
        //    $("#wait_box").hide();
      },
    });
  }
  nc_login();

  let timeOut = null;
  try {
    parent.metapage_frames.addEvent(
      'open.after',
      (eClass, changepage, isAriane, querry, id, actions) => {
        if (eClass === 'stockage') {
          //console.log("login", nc_login + "");
          if (
            window.document
              .getElementById('mel_nextcloud_frame')
              .contentWindow.location.href.includes('index.php/login')
          )
            nc_login();
          else {
            if (timeOut !== null) {
              try {
                clearTimeout(timeOut);
              } catch (error) {}
            }

            timeOut = setTimeout(() => {
              if (
                window.document
                  .getElementById('mel_nextcloud_frame')
                  .contentWindow.location.href.includes('index.php/login')
              )
                nc_login();
            }, 2000);
          }
        }
      },
    );
  } catch (error) {}
});
