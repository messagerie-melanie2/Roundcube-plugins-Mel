var timeout_sharesmailboxeslist;
var hide_mailviewsplitterv = false;
var mailviewright_left = 0;
var mailviewleft_width = 0;
var mailviewsplitterv_left = 0;
var page_loading;
var current_page_scroll;

// Changement d'utilisateur sur la page de login
$(document).on({
  click: function (e) {
    $('#formlogintable .hidden_login_input').removeClass('hidden_login_input');
    $('.login_div').hide();
    $('#rcmloginuser').val('');
    $('#rcmloginuser').focus();
    $('#rcmloginkeep').removeAttr('checked');
  }
}, "#rcmchangeuserbutton"); //pass the element as an argument to .on


if (window.rcmail) {
  rcmail.addEventListener('init', function(evt) {
    // Initialisation de la liste des pages chargées
    page_loading = {};
    current_page_scroll = 1;
    if (rcmail.env['plugin.show_password_change']) {
      show_password_change(this);
    }
    
    // Switch to default task commande
    rcmail.register_command('switch-to-default-task', function() {
      rcmail.switch_to_default_task();
    }, true);
    
    // Gestion de l'url courrielleur
    var url = window.location.href.split('?')[1];
    if (url && url.indexOf('_courrielleur') != -1 && url.indexOf('_err=session') != -1) {
      if (url.indexOf('_courrielleur=1') != -1) {
        window.location.href = '_task=login&_courrielleur=1';
      }
      else if (url.indexOf('_courrielleur=2') != -1) {
        window.location.href = '_task=login&_courrielleur=2';
      }
    }
    
    if (rcmail.env.task == 'mail' 
        && (!rcmail.env.action || rcmail.env.action == "")) {
      rcmail.enable_command('window-edit-folder', true);

      let ul = $('#folderlist-content').find('a[rel="'+rcmail.env.mailbox+'"]').closest('ul');
      let isHidden = ul.attr('style');
      if (isHidden) {
        ul.prev().click();
      }
      
      rcmail.addEventListener('contextmenu_init', function(menu) {
        // identify the folder list context menu
        if (menu.menu_name == 'folderlist') {
          // make sure this new shortcut is always active
          menu.addEventListener('activate', function(p) {
            if (p.command == 'window-edit-folder') {
              return true;
            }
          });
        }
      });
      if (rcmail.env.use_infinite_scroll) {
        var scroll = false;
        $('.pagenavbuttons').hide();
        $('#countcontrols').hide();

        var ml_container = '#messagelistcontainer';
        if(rcmail.env.skin == 'elastic' || rcmail.env.skin == 'mel_elastic') {
          ml_container = '#messagelist-content';
          $('.firstpage').parent()/*.closest('div').children()*/.hide();
        } else {
                $('.pagenavbuttons').hide();
                $('#countcontrols').hide();
        }
        // Gestion du scroll infini
        $(ml_container).scroll(function() {
          if (($(ml_container).scrollTop() > 1 
              && (($(ml_container).scrollTop() + $(ml_container).height()) / $('#messagelist').height()) >= 0.95)
          && current_page_scroll > 1
          && (!rcmail.env.iselectron || rcmail.env.mailbox.indexOf(rcmail.env.local_archive_folder) !== 0)) {
            // Affichage de la page suivante au bas de la page					  					  
            var page = current_page_scroll;
            if (!rcmail.busy)
              console.log("Fin de la liste des mails, recherche de mails plus ancien....");			 
            if (page > 0 && page <= rcmail.env.pagecount && !page_loading[page]) {
              page_loading[page] = true;
              var lock = rcmail.set_busy(true, 'loading');
              var post_data = {};
              post_data._mbox = rcmail.env.mailbox;
              post_data._page = page;
              // also send search request to get the right records
              if (rcmail.env.search_request)
                post_data._search = rcmail.env.search_request;
              rcmail.env.is_from_scroll = true;
              console.log("Recherche en cours....", post_data);
              rcmail.http_request('list', post_data, lock).always(() => {
                console.log("Recherche terminée !");
              });	

            }
            else if (!rcmail.busy)
              console.log("Il n'y a pas de nouveaux mails");
            
          }		  
        });
        if (!rcmail.env.ismobile) {
          // Réinitialise les données une fois que la liste est rafraichie
          rcmail.message_list.addEventListener('clear', function(evt) {
            page_loading = {};
            rcmail.env.current_page = 1;
            current_page_scroll = 2;
          });
          rcmail.addEventListener('responseafterlist', function(evt) {
            if (rcmail.env.use_infinite_scroll) {
              current_page_scroll = rcmail.env.current_page + 1;
              rcmail.env.current_page = 1;
            }
            rcmail.http_post('plugin.set_current_page', {});
          });
        }
      }
    }
    else if (rcmail.env.task == 'settings') {
      // Masquer la skin mobile de l'interface de choix des skins
      if ($('#rcmfd_skinmel_larry_mobile').length) {
        $('#rcmfd_skinmel_larry_mobile').parent().parent().parent().parent().hide();
      }
    }
    else if (rcmail.env.task == 'calendar') {
      // PAMELA - Masquer les champs non utilisés dans Mél
      $('#edit-url').parent().hide();
      $('#edit-priority').parent().hide();
      $('#edit-free-busy').parent().hide();
      $('#event-free-busy').hide();
      $('.edit-alarm-buttons').hide();
      $("#edit-sensitivity option[value='confidential']").remove();
      $("#edit-recurrence-frequency option[value='RDATE']").remove();
    }
  });
  // MANTIS 0004276: Reponse avec sa bali depuis une balp, quels "Elements envoyés" utiliser
  rcmail.addEventListener('change_identity', function(evt) {
    if (window.identity && window.identity != rcmail.env.identity) {
      var params = {};
      if (rcmail.env.identities_to_bal[rcmail.env.identity]) {
        params['_account'] = rcmail.env.identities_to_bal[rcmail.env.identity];
      }
      rcmail.http_request('mail/plugin.refresh_store_target_selection', params, rcmail.set_busy(true, 'loading'));
    }
    window.identity = rcmail.env.identity;
  });
  rcmail.addEventListener('responseafterplugin.refresh_store_target_selection', function(evt) {
    // @rotomeca
    $("#compose-options select[name=\"_store_target\"]").html($(evt.response.select_html).html());
    setTimeout(() => {
      $("#compose-options select[name=\"_store_target\"]").addClass("form-control custom-select pretty-select").change();
    }, 100);  
    $('#_compose_hidden_account').val(rcmail.env.identities_to_bal[rcmail.env.identity]);
  });
}

// Open edit folder iframe
rcube_webmail.prototype.window_edit_folder = function() {
  window.location.hash = 'createfolder';
  var folder = $('#mailboxlist > li.contextRow').length ? atob($('#mailboxlist > li.contextRow').attr('id').replace('rcmli', '')) : rcmail.env.mailbox;
  var frame = $('<iframe>').attr('id', 'managemailboxfolder')
    .attr('src', rcmail.url('settings/edit-folder') + '&_framed=1&_path=' + encodeURIComponent(folder))
    .attr('onLoad', "if (this.contentWindow.location.href.indexOf('edit-folder') === -1) {$('#managemailboxfolder').dialog('close'); window.location.reload();} ")
    .attr('frameborder', '0')
    .appendTo(document.body);
  
  var h = Math.floor($(window).height() * 0.75);
  var buttons = {};
  
  frame.dialog({
    modal: true,
    resizable: false,
    closeOnEscape: true,
    title: '',
    close: function() {
      frame.dialog('destroy').remove();
    },
    buttons: buttons,
    width: 450,
    height: 480,
    rcmail: rcmail
  }).width(430);
  $(window).on("hashchange", function(e) {
    if (e.originalEvent.oldURL.replace(e.originalEvent.newURL, '') == '#createfolder') {
      $('#managemailboxfolder').dialog('close');
    }
  });
};

// Get value from cache
rcube_webmail.prototype.mel_storage_get = function(name, fromJson = false, defaultValue = null) {
  if (this.env.keep_login) {
    var value = window.localStorage.getItem('mel.' + name);
  }
  else {
    var value = window.sessionStorage.getItem('mel.' + name);
  }
  
  if (value == null) {
    value = defaultValue;
  }
  else {
    if (fromJson) {
      value = JSON.parse(value);
    }
  }
  return value;
};

// Set value to cache
rcube_webmail.prototype.mel_storage_set = function(name, value, toJson = false) {
  if (toJson) {
    value = JSON.stringify(value);
  }
  if (this.env.keep_login) {
    window.localStorage.setItem('mel.' + name, value);
  }
  else {
    window.sessionStorage.setItem('mel.' + name, value);
  }
};

// Add value to cache
rcube_webmail.prototype.mel_storage_add = function(name, key, value) {
  var obj =  this.mel_storage_get(name, true)
  if (!obj) {
    obj = {};
  }
  obj[key] = value;
  this.mel_storage_set(name, obj, true);
};

// Remove value from cache
rcube_webmail.prototype.mel_storage_remove = function(name) {
  if (this.env.keep_login) {
    window.localStorage.removeItem('mel.' + name);
  }
  else {
    window.sessionStorage.removeItem('mel.' + name);
  }
};

// Switch to default task
rcube_webmail.prototype.switch_to_default_task = function() {
  this.switch_task(rcmail.env.default_task);
};

/**
* Show password change page as jquery UI dialog
*/
function show_password_change()
{
  var frame = $('<iframe>').attr('id', 'changepasswordframe')
    .attr('src', rcmail.url('settings/plugin.mel_moncompte') + '&_fid=changepassword&_framed=1')
    .attr('frameborder', '0')
    .appendTo(top.document.body);  
  
  var h = Math.floor($(window).height() * 0.75);
  var buttons = {};
  
  frame.dialog({
    modal: true,
    resizable: false,
    closeOnEscape: true,
    title: rcmail.env.passwordchange_title,
    close: function() {
      frame.dialog('destroy').remove();
    },
    buttons: buttons,
    width: 700,
    height: 500,
    rcmail: rcmail
  }).width(680);
}

if (rcmail
  && (rcmail.env.task == 'mail' || rcmail.env.task == 'addressbook')
  && typeof(rcube_list_widget) !== 'undefined') {
    /**
    * Réécriture de la fonction clear de la classe javascript rcube_list_widget
    * Permet d'ajouter le triggerEvent clear
    * Nécessaire pour le scroll infini notamment
    */
    rcube_list_widget.prototype.clear = function(sel)
    {
      if (this.tagname == 'table') {
        var tbody = document.createElement('tbody');
        this.list.insertBefore(tbody, this.tbody);
        this.list.removeChild(this.list.tBodies[1]);
        this.tbody = tbody;
      }
      else {
        $(this.row_tagname() + ':not(.thead)', this.tbody).remove();
      }
      
      this.rows = {};
      this.rowcount = 0;
      
      if (sel)
      this.clear_selection();
      
      // reset scroll position (in Opera)
      if (this.frame)
      this.frame.scrollTop = 0;
      
      // fix list header after removing any rows
      this.resize();
      // PAMELA - triggerEvent clear for list
      this.triggerEvent('clear');
    };
  }
  
