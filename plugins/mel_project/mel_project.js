var right_style_saved,
    left_style_saved;

if (window.rcmail) {
  rcmail.addEventListener('init', function(evt) {
    if (rcmail.env.mel_project_objects) {
      for (const key in rcmail.env.mel_project_objects) {
        const object = rcmail.env.mel_project_objects[key];
        if (object.default) {
          rcmail.mel_project_open_iframe(key);
        }
        // Register commande
        rcmail.register_command('switch-to-' + key, function(props) {
					rcmail.mel_project_switch(key);
        }, true);
        // Show button
        $('#taskbar a.button-' + key).show();
      }
    }
  });
}

// Switch iframe
rcube_webmail.prototype.mel_project_switch = function(name) {
  if (rcmail.env.mel_project_objects[name].open) {
    if (rcmail.env.mel_project_objects[name].principal && !window.right_style_saved) {
      window.right_style_saved = $('#projectview-right').attr('style');
      $('#projectview-right').attr('style', 'left: 0;');
      $('#projectview-left').hide();
    }
    else if (!window.left_style_saved) {
      window.left_style_saved = $('#projectview-left').attr('style');
      $('#projectview-left').attr('style', 'width: 100%;');
      $('#projectview-right').hide();
    }
    this.mel_project_close_iframe(name);
  }
  else {
    if (rcmail.env.mel_project_objects[name].principal && window.right_style_saved) {
      $('#projectview-right').attr('style', window.right_style_saved);
      $('#projectview-left').show();
      window.right_style_saved = null;
    }
    else if (window.left_style_saved) {
      $('#projectview-left').attr('style', window.left_style_saved);
      $('#projectview-right').show();
      window.left_style_saved = null;
    }
    this.mel_project_open_iframe(name);
  }
};

// Close project iframe
rcube_webmail.prototype.mel_project_close_iframe = function(name) {
  const id = 'mel_project_' + name + '_frame';

  if ($('#' + id).length) {
    const object = rcmail.env.mel_project_objects[name];
    if (object.open) {
      rcmail.env.mel_project_objects[name].open = false;
      $('#' + id).hide();
      $('#taskbar a.button-' + name).removeClass('button-selected');
      $('#taskbar a.button-' + name).addClass('button-launched');
    }
  }
};

// Open project iframe
rcube_webmail.prototype.mel_project_open_iframe = function(name) {
  const id = 'mel_project_' + name + '_frame';
  
  // Fermer les autres objets
  for (const key in rcmail.env.mel_project_objects) {
    if (rcmail.env.mel_project_objects[key].principal == rcmail.env.mel_project_objects[name].principal) {
      rcmail.mel_project_close_iframe(key);
    }
  }
  const object = rcmail.env.mel_project_objects[name];
  // Gestion du parent
  const parent = object.principal ? $('#projectview-left') : $('#projectview-right');
  if ($('#' + id).length) {
    $('#' + id).show();
  }
  else if (name == 'stockage') {
    var iframe = $('<iframe>');
    iframe.attr('name', id);
    iframe.attr('id', id);
    if (object.allow) {
      iframe.attr('allow', object.allow);
    }
    parent.find('> .iframebox').append(iframe);
    var url = object.url;
    $.ajax({ // fonction permettant de faire de l'ajax
	    type: "POST", // methode de transmission des données au fichier php
	    url: rcmail.env.stockage_url, // url du fichier php
	    data: "rc_user="+rcmail.env.stockage_username+"&rc_pwd="+rcmail.env.stockage_password+"&from_roundcube=1", // données à transmettre
	    xhrFields: {
        withCredentials: true
      },
	    success: function (data) {
        if (navigator.appName == "Microsoft Internet Explorer"){
          window.document.getElementById(id).src = url;
          window.document.getElementById(id).contentWindow.location.reload(true);
			  } else {
          window.document.getElementById(id).src = url;
			  }
      },
	  });
  }
  else {
    var iframe = $('<iframe>');
    iframe.attr('name', id);
    iframe.attr('id', id);
    iframe.attr('src', object.url);
    if (object.allow) {
      iframe.attr('allow', object.allow);
    }
    parent.find('> .iframebox').append(iframe);
  }
  rcmail.env.mel_project_objects[name].open = true;
  $('#taskbar a.button-' + name).addClass('button-launched');
  $('#taskbar a.button-' + name).addClass('button-selected');
};