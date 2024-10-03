if (parent != window) {
  parent.location.reload();
}

$(document).ready(() => {
  let color_mode = window.matchMedia('(prefers-color-scheme: dark)');
  color_mode.addListener(function (e) {
    let _color_mode = e.matches ? 'dark' : 'light';

    if (MEL_ELASTIC_UI.color_mode() !== _color_mode)
      MEL_ELASTIC_UI.switch_color();

    if (_color_mode === 'dark')
      $('.mel-logo').attr('src', 'skins/mel_elastic/images/taskbar-logo.svg');
    else
      $('.mel-logo').attr(
        'src',
        'plugins/mel_portal/skins/elastic/images/logoportal.svg',
      );
    // switch_color_mode();
    // reset_cookie();
  });

  if (MEL_ELASTIC_UI.color_mode() === 'dark')
    $('.mel-logo').attr('src', 'skins/mel_elastic/images/taskbar-logo.svg');
  else
    $('.mel-logo').attr(
      'src',
      'plugins/mel_portal/skins/elastic/images/logoportal.svg',
    );

  if (rcmail.env.maintenance_text !== undefined) {
    $('#mel-login-form').prepend(`
        <div class="maintenance-text" style="">
		    <h2>${rcmail.env.maintenance_text}</h2>
	    </div>`);
  }

  $('input.form-control').addClass('input-mel login-type');

  const login_id = 'login-alt-1';

  if (rcmail.get_cookie('mel_cerbere') === '1') {
    $(`#${login_id}`).css('display', '');
  }

  $(`#${login_id}`).click(() => {
    window.location.href = mel_metapage.Functions.url('login', '', {
      oidc: 1,
      _timezone: $('input[name="_timezone"]').val(),
    });
  });

  document.onkeyup = function (e) {
    if (e.ctrlKey && e.altKey && e.shiftKey && e.which == 67) {
      $(`#${login_id}`).css('display', '');
    }
  };

  $(window).resize(() => {
    const isNotTouch = !$('html').hasClass('touch');

    if (
      (window.innerHeight < 530 ||
        (window.innerHeight < 566 &&
          $('#login-alt-1').css('display') !== 'none')) &&
      isNotTouch
    ) {
      $('#mel-login-form').css('top', '0');
      $('.login-title h1').css('font-size', '30px');

      if (!$('#layout').hasClass('overflowed'))
        $('#layout').addClass('overflowed');
    } else if (window.innerHeight < 561 && isNotTouch) {
      $('#mel-login-form').css('top', '0');
      $('.login-title h1').css('font-size', '30px');
      $('#layout').removeClass('overflowed');
    } else if (window.innerHeight < 666 && isNotTouch) {
      $('#mel-login-form').css('top', '5vh');
      $('.login-title h1').css('font-size', '30px');
      $('#layout').removeClass('overflowed');
    } else if (window.innerHeight < 693 && isNotTouch) {
      $('.login-title h1').css('font-size', '30px');
      $('#layout').removeClass('overflowed');
    } else {
      $('.login-title h1').css('font-size', '');
      $('#mel-login-form').css('top', '');
      $('#layout').removeClass('overflowed');
    }
  });

  $(window).resize();
});
