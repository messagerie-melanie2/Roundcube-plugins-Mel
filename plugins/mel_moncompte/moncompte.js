/* (Manage) Mon compte */
$(document).on(
  {
    click: function (e) {
      if ($('#settingstabpluginmel_resources').hasClass('_selected'))
        $('#settingstabpluginmel_resources').removeClass('_selected');
      else $('#settingstabpluginmel_resources').addClass('_selected');
      // Toggle les items de la liste
      $('#settingstabpluginmel_resources_portail').toggle();
      $('#settingstabpluginmel_resources_bal').toggle();
      $('#settingstabpluginmel_resources_agendas').toggle();
      $('#settingstabpluginmel_resources_contacts').toggle();
      $('#settingstabpluginmel_resources_tasks').toggle();
    },
  },
  '.tablink.mel.resources',
); // pass the element as an argument to .on

$(document).on(
  {
    click: function (e) {
      // Toggle les items de la liste
      if ($('#settingstabpluginmel_statistics').hasClass('_selected'))
        $('#settingstabpluginmel_statistics').removeClass('_selected');
      else $('#settingstabpluginmel_statistics').addClass('_selected');
      $('#settingstabpluginmel_statistics_mobile').toggle();
    },
  },
  '.tablink.mel.statistics',
); // pass the element as an argument to .on

$(function () {
  $('#resources-details').tabs();
});

$(document).on(
  {
    submit: function (e) {
      // Toggle les items de la liste
      if (
        $('#rcmfd_changepassword_newpassword').val() !=
        $('#rcmfd_changepassword_newpassword_confirm').val()
      ) {
        // alert('mots de passe différents');
        e.preventDefault();
        rcmail.display_message(
          rcmail.gettext('mel_moncompte.error_password_confirm'),
          'error',
        );
      }
    },
  },
  '#change_password_form',
); // pass the element as an argument to .on

document.addEventListener('DOMContentLoaded', function () {
  let togglePasswordButton = document.getElementById('toggle_password_view');

  if (togglePasswordButton) {
    togglePasswordButton.addEventListener('click', function () {
      let passwordField = document.getElementById(
        'rcmfd_changepassword_newpassword',
      );
      const type =
        passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordField.setAttribute('type', type);

      if (type === 'text') {
        this.classList.add('text-visible');
      } else {
        this.classList.remove('text-visible');
      }

      passwordField = null;
    });
  }

  togglePasswordButton = null;
});

$(document).on(
  {
    change: function (e) {
      var url = document.location.href;
      if (url.indexOf('_current_username') == -1 && url.indexOf('#') == -1) {
        // Valeur n'est pas window présente, on l'ajoute
        window.location = url + '&_current_username=' + $(this).val();
      } else if (url.indexOf('_current_username') == -1) {
        // La valeur n'existe pas mais l'url fini par #
        window.location = url.replace(
          '#',
          '&_current_username=' + $(this).val() + '#',
        );
      } else {
        // La valeur est présente, on la recherche pour faire un replace
        var params = url.split('?')[1].split('&');
        for (var key in params) {
          if (params[key].indexOf('_current_username') == 0) {
            var value = params[key].split('=')[1];
            window.location = url.replace(
              '_current_username=' + value,
              '_current_username=' + $(this).val(),
            );
            break;
          }
        }
      }
    },
  },
  '#rcmmoncomptebalplist',
); // pass the element as an argument to .on

// Gestonnaire absence, boutons radio

$(document).on(
  {
    change: function (e) {
      if ($(this).val() == 'abs_texte_nodiff') {
        // var msg = $('#abs_msg_mel').val();
        // alert(msg);
        // $('#abs_msg_inter').val(msg);
        // $('#abs_msg_inter').val($('#abs_msg_mel').val());
        $('#abs_msg_inter').addClass('disabled').attr('disabled', 'disabled');
      } else {
        $('#abs_msg_inter').removeClass('disabled').removeAttr('disabled'); //.show();
      }
    },
  },
  "input[name='absence_reponse_externe']",
);
// -----------------------------------

// Publication photo

$(document).on(
  {
    click: function (e) {
      if ($(this).is(':checked')) {
        $('#photo_ader').parent().show();
      } else {
        $('#photo_ader').prop('checked', false);
        $('#photo_ader').parent().hide();
      }
    },
  },
  '#photo_intra',
);

// -----------------------------------

// Gestonnaire de listes

var lists_members = [];
var lists_isdyn = [];

$(document).on(
  {
    change: function (e) {
      if (lists_members[$(this).val()]) {
        refreshListMembers($(this).val());
      } else {
        var lock = rcmail.display_message(
          rcmail.gettext('mel_moncompte.wait'),
          'loading',
        );
        var res = rcmail.http_post(
          'plugin.listes_membres',
          {
            _dn_list: $(this).val(),
            _current_username: $('#rcmmoncomptebalplist option:selected').val(),
          },
          lock,
        );
      }
    },
  },
  '#liste_listes',
);

$(document).on(
  {
    click: function (e) {
      AddExternalMember();
    },
  },
  '#listes_saisir',
);

$(document).on(
  {
    click: function (e) {
      RemoveMember();
    },
  },
  '#listes_retirer',
);

$(document).on(
  {
    click: function (e) {
      RemoveAllMembers();
    },
  },
  '#listes_purger',
);

$(document).on(
  {
    click: function (e) {
      ExportMembers();
    },
  },
  '#listes_exporter',
);

$(document).on(
  {
    click: function (e) {
      var dn_list = $('#liste_listes option:selected').val();
      if (dn_list) {
        show_uploadform(dn_list);
      } else {
        alert(rcmail.gettext('mel_moncompte.listes_noselect'));
      }
    },
  },
  '#listes_importer',
);

function show_uploadform(dn_list) {
  var content = $('#upload-dialog');
  dialog = content.clone(true);

  dialog.find('#hidden_dn_list').val(dn_list);
  rcmail.gui_objects.uploadform = dialog.find('#upload-formFrm')[0];

  var save_func = function (e) {
    rcmail.command('upload-listes-csv', '', this, e);
    return true;
  };

  dialog = rcmail.simple_dialog(
    dialog,
    rcmail.gettext('mel_moncompte.listes_importer'),
    save_func,
    {
      button: 'import',
      closeOnEscape: true,
      minWidth: 400,
      height: 60,
    },
  );
}

// -----------------------------------

if (window.rcmail) {
  rcmail.addEventListener('responseafterplugin.listes_membres', function (evt) {
    lists_members[evt.response.dn_list] = evt.response.data;
    lists_isdyn[evt.response.dn_list] = evt.response.is_listdyn;
    refreshListMembers(evt.response.dn_list);
  });

  rcmail.addEventListener(
    'responseafterplugin.listes_add_externe',
    function (evt) {
      lists_members[evt.response.dn_list] = evt.response.data;
      refreshListMembers(evt.response.dn_list);
    },
  );

  rcmail.addEventListener('responseafterplugin.listes_remove', function (evt) {
    lists_members[evt.response.dn_list] = evt.response.data;
    refreshListMembers(evt.response.dn_list);
  });

  rcmail.addEventListener(
    'responseafterplugin.listes_remove_all',
    function (evt) {
      lists_members[evt.response.dn_list] = evt.response.data;
      refreshListMembers(evt.response.dn_list);
    },
  );

  rcmail.addEventListener('init', function (evt) {
    // rcmail.register_command('hide_resource_in_roundcube', function(){
    // rcmail.hide_resource_in_roundcube(); }, true);
    // rcmail.register_command('show_resource_in_roundcube', function(){
    // rcmail.show_resource_in_roundcube(); }, true);
    var tab;

    // Ajout des resources
    if (rcmail.env.enable_mesressources) {
      (tab = $('<li>')
        .attr('id', 'settingstabpluginmel_resources')
        .addClass('tablink mel resources')),
        (button = $('<a>')
          .attr('href', '#')
          .attr('role', 'button')
          .attr('title', rcmail.gettext('mel_moncompte.manageresources'))
          .html(rcmail.gettext('mel_moncompte.resources'))
          .appendTo(tab));
      // add tab
      rcmail.add_element(tab, 'tabs');
    }

    // Ajout des ressources mails
    if (rcmail.env.enable_mesressources_mail) {
      (tab = $('<li>')
        .attr('id', 'settingstabpluginmel_resources_bal')
        .addClass('listitem_mel mel')),
        (button = $('<a>')
          .attr(
            'href',
            rcmail.env.comm_path + '&_action=plugin.mel_resources_bal',
          )
          .attr('title', rcmail.gettext('mel_moncompte.manageresourcesbal'))
          .html(rcmail.gettext('mel_moncompte.resourcesbal'))
          .appendTo(tab));
      // add tab
      rcmail.add_element(tab, 'tabs');
    }

    // Ajout des ressources calendar
    if (rcmail.env.enable_mesressources_cal) {
      (tab = $('<li>')
        .attr('id', 'settingstabpluginmel_resources_agendas')
        .addClass('listitem_mel mel')),
        (button = $('<a>')
          .attr(
            'href',
            rcmail.env.comm_path + '&_action=plugin.mel_resources_agendas',
          )
          .attr('title', rcmail.gettext('mel_moncompte.manageresourcesagendas'))
          .html(rcmail.gettext('mel_moncompte.resourcesagendas'))
          .appendTo(tab));
      // add tab
      rcmail.add_element(tab, 'tabs');
    }

    // Ajout des ressources contacts
    if (rcmail.env.enable_mesressources_addr) {
      (tab = $('<li>')
        .attr('id', 'settingstabpluginmel_resources_contacts')
        .addClass('listitem_mel mel')),
        (button = $('<a>')
          .attr(
            'href',
            rcmail.env.comm_path + '&_action=plugin.mel_resources_contacts',
          )
          .attr(
            'title',
            rcmail.gettext('mel_moncompte.manageresourcescontacts'),
          )
          .html(rcmail.gettext('mel_moncompte.resourcescontacts'))
          .appendTo(tab));
      // add tab
      rcmail.add_element(tab, 'tabs');
    }

    // Ajout des ressources tâches
    if (rcmail.env.enable_mesressources_task) {
      (tab = $('<li>')
        .attr('id', 'settingstabpluginmel_resources_tasks')
        .addClass('listitem_mel mel')),
        (button = $('<a>')
          .attr(
            'href',
            rcmail.env.comm_path + '&_action=plugin.mel_resources_tasks',
          )
          .attr('title', rcmail.gettext('mel_moncompte.manageresourcestaches'))
          .html(rcmail.gettext('mel_moncompte.resourcestaches'))
          .appendTo(tab));
      // add tab
      rcmail.add_element(tab, 'tabs');
    }

    // Ajout des ressources Mes applications du portail
    if (rcmail.env.enable_mesressources_portail) {
      (tab = $('<li>')
        .attr('id', 'settingstabpluginmel_resources_portail')
        .addClass('listitem_mel mel')),
        (button = $('<a>')
          .attr(
            'href',
            rcmail.env.comm_path + '&_action=plugin.mel_resources_portail',
          )
          .attr('title', rcmail.gettext('mel_portail.manageresourcesportail'))
          .html(rcmail.gettext('mel_portail.resourcesportail'))
          .appendTo(tab));
      // add tab
      rcmail.add_element(tab, 'tabs');
    }

    var p = rcmail;

    if (rcmail.gui_objects.mel_resources_elements_list) {
      rcmail.mel_resources_elements_list = new rcube_list_widget(
        rcmail.gui_objects.mel_resources_elements_list,
        {
          multiselect: false,
          draggable: rcmail.env.account ? false : true,
          keyboard: false,
        },
      );
      rcmail.mel_resources_elements_list
        .addEventListener('select', function (e) {
          p.mel_resources_element_select(e);
        })
        .addEventListener('dragstart', function (e) {
          p.mel_resources_element_dragstart(e);
        })
        .addEventListener('dragend', function (e) {
          p.mel_resources_element_dragend(e);
        })
        .addEventListener('initrow', function (row) {
          row.obj.onmouseover = function () {
            p.mel_resources_element_focus_filter(row);
          };
          row.obj.onmouseout = function () {
            p.mel_resources_element_unfocus_filter(row);
          };
        });
      rcmail.mel_resources_elements_list.init();
      rcmail.mel_resources_elements_list.focus();
      rcmail.mel_resources_elements_list.select_first();
    }
    if (
      rcmail.env.action &&
      rcmail.env.action.indexOf('plugin.mel_resources') != -1 &&
      rcmail.env.enable_mesressources
    ) {
      $('#settingstabpluginmel_resources_portail').show();
      $('#settingstabpluginmel_resources_bal').show();
      $('#settingstabpluginmel_resources_agendas').show();
      $('#settingstabpluginmel_resources_contacts').show();
      $('#settingstabpluginmel_resources_tasks').show();
      $('#settingstabpluginmel_resources').addClass('_selected');
      switch (rcmail.env.resources_action) {
        case 'bal':
          $('#settingstabpluginmel_resources_bal').addClass('selected');
          break;
        case 'agendas':
          $('#settingstabpluginmel_resources_agendas').addClass('selected');
          break;
        case 'contacts':
          $('#settingstabpluginmel_resources_contacts').addClass('selected');
          break;
        case 'tasks':
          $('#settingstabpluginmel_resources_tasks').addClass('selected');
          break;
        default:
          break;
      }
      // Activation des commandes
      rcmail.enable_command('calendar_edit', true);
      rcmail.enable_command('set_default_resource', true);
      rcmail.enable_command('hide_resource_in_roundcube', true);
      rcmail.enable_command('show_resource_in_roundcube', true);
      rcmail.enable_command('invitation', true);
      rcmail.enable_command('no_invitation', true);
      rcmail.enable_command('synchro_on_mobile', true);
      rcmail.enable_command('no_synchro_on_mobile', true);
      rcmail.enable_command('plugin.mel_moncompte_add_resource', true);
      // register commands
      rcmail.register_command('plugin.mel_moncompte_add_resource', function () {
        rcmail.add_resource();
      });
      rcmail.register_command(
        'plugin.mel_moncompte_delete_resource',
        function () {
          rcmail.delete_resource();
        },
      );

      // general datepicker settings
      var datepicker_settings = {
        // translate from fullcalendar format to datepicker format
        dateFormat: 'dd/mm/yy',
        firstDay: 1,
        changeMonth: false,
        showOtherMonths: true,
        selectOtherMonths: true,
      };

      $('#event-export-startdate').datepicker(datepicker_settings);

      $('#event-export-range').change(function (e) {
        var custom = $('option:selected', this).val() == 'custom',
          input = $('#event-export-startdate');
        input.parent()[custom ? 'show' : 'hide']();
        if (custom) input.select();
      });

      $('#submit_restore_cal').click(function () {
        var form = rcmail.gui_objects.exportform;
        if (form) {
          var start = 0,
            range = $('#event-export-range option:selected', this).val(),
            source = $('#event-export-calendar').val(),
            joursvg = $('#event-export-joursvg option:selected').val(),
            token = $('#rcmExportForm input[name="_token"]').val();

          if (range == 'custom')
            start = date2unixtime(
              parse_datetime('00:00', $('#event-export-startdate').val()),
            );
          else if (range > 0) start = 'today -' + range + '^months';

          // MANTIS 3996: La sauvegarde de l'agenda ne fonctionne pas depuis "Mon compte dans le Courrielleur"
          if (rcmail.env.courrielleur) {
            window.location.href = rcmail.url('calendar/export_events', {
              source: source,
              start: start,
              attachments: 0,
              joursvg: joursvg,
              _token: token,
            });
          } else {
            rcmail.goto_url('calendar/export_events', {
              source: source,
              start: start,
              attachments: 0,
              joursvg: joursvg,
              _token: token,
            });
          }
        }
      });

      $('#submit_restore_contacts').click(function () {
        var form = rcmail.gui_objects.exportform;
        if (form) {
          var source = $('#event-export-contacts').val(),
            joursvg = $('#event-export-contactsvg option:selected').val(),
            token = $('#rcmExportForm input[name="_token"]').val();

          // MANTIS 3996: La sauvegarde de l'agenda ne fonctionne pas depuis "Mon compte dans le Courrielleur"
          if (rcmail.env.courrielleur) {
            window.location.href = rcmail.url('addressbook/export', {
              _source: source,
              joursvg: joursvg,
              _token: token,
            });
          } else {
            rcmail.goto_url('addressbook/export', {
              _source: source,
              joursvg: joursvg,
              _token: token,
            });
          }
        }
      });
    } else {
      $('#settingstabpluginmel_resources_portail').hide();
      $('#settingstabpluginmel_resources_bal').hide();
      $('#settingstabpluginmel_resources_agendas').hide();
      $('#settingstabpluginmel_resources_contacts').hide();
      $('#settingstabpluginmel_resources_tasks').hide();
    }

    // Moncompte
    if (rcmail.env.enable_moncompte) {
      (tab = $('<li>')
        .attr('id', 'settingstabpluginmel_moncompte')
        .addClass('tablink mel moncompte')),
        (button = $('<a>')
          .attr('href', rcmail.env.comm_path + '&_action=plugin.mel_moncompte')
          .attr('role', 'button')
          .attr('title', rcmail.gettext('mel_moncompte.managemoncompte'))
          .html(rcmail.gettext('mel_moncompte.moncompte'))
          .appendTo(tab));

      // add tab
      rcmail.add_element(tab, 'tabs');
    }

    if (
      rcmail.env.action.indexOf('plugin.mel_moncompte') != -1 &&
      rcmail.env.enable_moncompte
    ) {
      var p = rcmail;

      if (rcmail.gui_objects.mel_moncompte_options_list) {
        rcmail.options_list = new rcube_list_widget(
          rcmail.gui_objects.mel_moncompte_options_list,
          {
            multiselect: false,
            draggable: false,
            keyboard: true,
          },
        );
        rcmail.options_list.addEventListener('select', function (e) {
          p.mel_moncompte_option_select(e);
        });
        rcmail.options_list.init();
        rcmail.options_list.focus();
      }
    }

    // Statistiques
    if (rcmail.env.enable_messtatistiques) {
      (tab = $('<li>')
        .attr('id', 'settingstabpluginmel_statistics')
        .addClass('tablink mel statistics')),
        (button = $('<a>')
          .attr('href', '#')
          .attr('roble', 'button')
          .attr('title', rcmail.gettext('mel_moncompte.managestatistics'))
          .html(rcmail.gettext('mel_moncompte.statistics'))
          .appendTo(tab));

      // add tab
      rcmail.add_element(tab, 'tabs');
    }

    // Mes statistiques mobile
    if (rcmail.env.enable_messtatistiques_mobile) {
      (tab = $('<li>')
        .attr('id', 'settingstabpluginmel_statistics_mobile')
        .addClass('listitem_mel mel statistics mobile')),
        (button = $('<a>')
          .attr(
            'href',
            rcmail.env.comm_path + '&_action=plugin.mel_statistics_mobile',
          )
          .attr('title', rcmail.gettext('mel_moncompte.managestatisticsmobile'))
          .html(rcmail.gettext('mel_moncompte.statisticsmobile'))
          .appendTo(tab));
      // add tab
      rcmail.add_element(tab, 'tabs');
    }

    if (rcmail.env.action.indexOf('plugin.mel_statistics') != -1) {
      $('#settingstabpluginmel_statistics_mobile').show();
    } else {
      $('#settingstabpluginmel_statistics_mobile').hide();
    }

    /* dates du gestionnaire absence */

    if (rcmail.env.action.indexOf('plugin.mel_moncompte') != -1) {
      $.datepicker.setDefaults({
        dateFormat: 'dd/mm/yy',
      });

      var shift_enddate = function (dateText) {
        var start_date = $.datepicker.parseDate('dd/mm/yy', dateText);
        var end_date = $.datepicker.parseDate(
          'dd/mm/yy',
          $('#abs_date_fin').val(),
        );

        if (!end_date || start_date.getTime() > end_date.getTime()) {
          $('#abs_date_fin').val(dateText);
          $('#abs_msg_mel').val(
            $('#abs_msg_mel')
              .val()
              .replace(
                /jusqu'au [\dj]{1,2}\/[\dm]{1,2}\/[\da]{2,4}/i,
                "jusqu'au " + dateText,
              ),
          );
          $('#abs_msg_inter').val(
            $('#abs_msg_inter')
              .val()
              .replace(
                /jusqu'au [\dj]{1,2}\/[\dm]{1,2}\/[\da]{2,4}/i,
                "jusqu'au " + dateText,
              ),
          );
        }
      };

      var shift_startdate = function (dateText) {
        var end_date = $.datepicker.parseDate('dd/mm/yy', dateText);
        var start_date = $.datepicker.parseDate(
          'dd/mm/yy',
          $('#abs_date_debut').val(),
        );

        if (!start_date || start_date.getTime() > end_date.getTime()) {
          $('#abs_date_debut').val(dateText);
        }
        $('#abs_msg_mel').val(
          $('#abs_msg_mel')
            .val()
            .replace(
              /jusqu'au [\dj]{1,2}\/[\dm]{1,2}\/[\da]{2,4}/i,
              "jusqu'au " + dateText,
            ),
        );
        $('#abs_msg_inter').val(
          $('#abs_msg_inter')
            .val()
            .replace(
              /jusqu'au [\dj]{1,2}\/[\dm]{1,2}\/[\da]{2,4}/i,
              "jusqu'au " + dateText,
            ),
        );
      };

      $('#abs_date_debut')
        .datepicker()
        .datepicker('option', 'onSelect', shift_enddate)
        .change(function () {
          shift_enddate(this.value);
        });
      $('#abs_date_fin')
        .datepicker()
        .datepicker('option', 'onSelect', shift_startdate)
        .change(function () {
          shift_startdate(this.value);
        });

      //modifier texte au submit
      $('#gest_save').click(function () {
        $('#abs_msg_mel').val(
          $('#abs_msg_mel')
            .val()
            .replace(
              /jusqu'au [\dj]{1,2}\/[\dm]{1,2}\/[\da]{2,4}/i,
              "jusqu'au " + $('#abs_date_fin').val(),
            ),
        );
      });

      // gestion des listes - import CSV
      rcmail.register_command(
        'upload-listes-csv',
        function () {
          var form = rcmail.gui_objects.uploadform;
          if (form && form.elements._listes_csv.value) {
            var p = rcmail;
            rcmail.async_upload_form(
              form,
              'plugin.listes_upload_csv',
              function (e) {
                p.set_busy(false, null, rcmail.file_upload_id);
              },
            );

            // display upload indicator
            rcmail.file_upload_id = rcmail.set_busy(true, 'uploading');
          }
        },
        true,
      );

      rcmail.addEventListener('plugin.import_listes_csv_success', function (p) {
        lists_members[p.dn_list] = p.data;
        refreshListMembers(p.dn_list);
        UI.show_uploadform();

        rcmail.display_message(
          rcmail.gettext('mel_moncompte.listes_import_success'),
          'success',
        );
        if (p.addr_error.length > 0) {
          alert(
            rcmail.gettext('mel_moncompte.listes_addr_error') + p.addr_error,
          );
        }
      });
    }
    /* -------------------------------- */
    switch (rcmail.env.action) {
      case 'plugin.mel_moncompte':
        $('#settingstabpluginmel_moncompte').addClass('selected');
        break;
      case 'plugin.mel_statistics_mobile':
        $('#settingstabpluginmel_statistics').addClass('_selected');
        $('#settingstabpluginmel_statistics_mobile').addClass('selected');
      default:
        break;
    }
  });
}

// Resources selection
rcube_webmail.prototype.mel_resources_element_select = function (element) {
  var id = element.get_single_selection();
  if (id != null) {
    this.load_shares_element_frame(id);
  }
};

// load filter frame
rcube_webmail.prototype.mel_resources_element_dragstart = function (list) {
  var id = list.get_single_selection();

  this.drag_active = true;
  this.drag_filter = id;
};

rcube_webmail.prototype.mel_resources_element_dragend = function (e) {
  if (this.drag_active) {
    if (this.drag_filter_target) {
      var lock = this.set_busy(true, 'loading');
      var items = [];
      var index = 0,
        i = 0;
      $('#mel_resources_elements_list tbody > tr').each(function () {
        var id = this.id.replace(/^rcmrow/, '');
        if (id == rcmail.drag_filter_target) {
          index = i;
        }
        if (id != rcmail.drag_filter) {
          items.push(id);
          i++;
        }
      });
      items.splice(index, 0, this.drag_filter);
      this.show_contentframe(false);
      this.http_post(
        'plugin.sort_resource_roundcube',
        '_items=' +
          JSON.stringify(items) +
          '&_type=' +
          rcmail.env.resources_action,
        lock,
      );
    }
    this.drag_active = false;
  }
};

rcube_webmail.prototype.mel_resources_element_focus_filter = function (row) {
  if (this.drag_active) {
    var id = row.id.replace(/^rcmrow/, '');
    if (id != this.drag_filter) {
      this.drag_filter_target = id;
      $(row.obj).addClass('elementmoveup');
    }
  }
};

rcube_webmail.prototype.mel_resources_element_unfocus_filter = function (row) {
  if (this.drag_active) {
    $(row.obj).removeClass('elementmoveup');
    this.drag_filter_target = null;
  }
};

rcube_webmail.prototype.mel_resources_reload_page = function () {
  setTimeout(function () {
    if (rcmail.env.framed) {
      window.parent.location.reload();
    } else {
      window.location.reload();
    }
  }, 500);
};

// load filter frame
rcube_webmail.prototype.load_shares_element_frame = function (id) {
  var has_id = typeof id !== 'undefined' && id != null;

  if (
    this.env.contentframe &&
    window.frames &&
    window.frames[this.env.contentframe]
  ) {
    if (
      rcmail.env.resources_action != 'bal' &&
      $('#rcmrow' + id).hasClass('personnal')
    ) {
      rcmail.enable_command('plugin.mel_moncompte_delete_resource', true);
    } else {
      rcmail.enable_command('plugin.mel_moncompte_delete_resource', false);
    }

    target = window.frames[this.env.contentframe];
    // var msgid = this.set_busy(true, 'loading');
    this.lock_frame(target);
    target.location.href =
      this.env.comm_path +
      '&_action=plugin.mel_resources_' +
      this.env.resources_action +
      '&_framed=1' +
      (has_id ? '&_id=' + id : ''); // + '&_unlock=' + msgid;
    // this.http_post("plugin.mel_resources_" + this.env.resources_action, '&_framed=1' + (has_id ? '&_id=' + id : ''),
    // msgid);
  }
};

// Filter selection
rcube_webmail.prototype.mel_moncompte_option_select = function (option) {
  var id = option.get_single_selection();
  if (id != null) {
    this.load_moncompte_frame(id);
  }
};

// load filter frame
rcube_webmail.prototype.load_moncompte_frame = function (id) {
  var has_id = typeof id !== 'undefined' && id != null;

  if (
    this.env.contentframe &&
    window.frames &&
    window.frames[this.env.contentframe]
  ) {
    target = window.frames[this.env.contentframe];
    var msgid = this.set_busy(true, 'loading');
    target.location.href =
      this.env.comm_path +
      '&_action=plugin.mel_moncompte&_framed=1' +
      (has_id ? '&_fid=' + id : '') +
      '&_unlock=' +
      msgid;
  } else if (rcmail.env.ismobile) {
    window.location.href =
      this.env.comm_path +
      '&_action=plugin.mel_moncompte' +
      (has_id ? '&_fid=' + id : '');
  }
};

rcube_webmail.prototype.hide_resource_in_roundcube = function (mbox, type) {
  if (mbox && type) {
    var lock = this.display_message(
      rcmail.gettext('mel_moncompte.wait'),
      'loading',
    );
    this.http_post(
      'plugin.hide_resource_roundcube',
      {
        _mbox: mbox,
        _type: type,
      },
      lock,
    );
  }
};

rcube_webmail.prototype.show_resource_in_roundcube = function (mbox, type) {
  if (mbox && type) {
    var lock = this.display_message(
      rcmail.gettext('mel_moncompte.wait'),
      'loading',
    );
    this.http_post(
      'plugin.show_resource_roundcube',
      {
        _mbox: mbox,
        _type: type,
      },
      lock,
    );
  }
};

rcube_webmail.prototype.invitation = function (mbox) {
  if (mbox) {
    var lock = this.display_message(
      rcmail.gettext('mel_moncompte.wait'),
      'loading',
    );
    this.http_post(
      'plugin.invitation',
      {
        _mbox: mbox,
      },
      lock,
    );
  }
};

rcube_webmail.prototype.no_invitation = function (mbox) {
  if (mbox) {
    var lock = this.display_message(
      rcmail.gettext('mel_moncompte.wait'),
      'loading',
    );
    this.http_post(
      'plugin.no_invitation',
      {
        _mbox: mbox,
      },
      lock,
    );
  }
};

rcube_webmail.prototype.synchro_on_mobile = function (mbox, type) {
  if (mbox && type) {
    var lock = this.display_message(
      rcmail.gettext('mel_moncompte.wait'),
      'loading',
    );
    this.http_post(
      'plugin.synchro_on_mobile',
      {
        _mbox: mbox,
        _type: type,
      },
      lock,
    );
  }
};

rcube_webmail.prototype.no_synchro_on_mobile = function (mbox, type) {
  if (mbox && type) {
    var lock = this.display_message(
      rcmail.gettext('mel_moncompte.wait'),
      'loading',
    );
    this.http_post(
      'plugin.no_synchro_on_mobile',
      {
        _mbox: mbox,
        _type: type,
      },
      lock,
    );
  }
};

rcube_webmail.prototype.add_resource = function () {
  if (rcmail.env.resources_action != 'bal') {
    var type = rcmail.env.resources_action;
    var name = prompt(
      rcmail.gettext('mel_moncompte.add_resource_prompt_' + type),
    );
    if (name) {
      var lock = this.display_message(
        rcmail.gettext('mel_moncompte.wait'),
        'loading',
      );
      this.http_post(
        'plugin.mel_add_resource',
        {
          _name: name,
          _type: type,
        },
        lock,
      );

      rcmail.addEventListener('plugin.mel_add_resource_success', function (p) {
        setTimeout(function () {
          rcmail.triggerEvent('mel_update', { type: type });
          window.location.reload();

          var iframe = document.getElementById('mel_resources_type_frame');
          iframe.src = 'skins/mel_larry/watermark.html';
        }, 750);
      });
    }
  }
};

rcube_webmail.prototype.delete_resource = function () {
  if (rcmail.env.resources_action != 'bal') {
    var type = rcmail.env.resources_action;
    var id = this.mel_resources_elements_list.get_single_selection();
    if (
      confirm(rcmail.gettext('mel_moncompte.delete_resource_confirm_' + type))
    ) {
      var lock = this.display_message(
        rcmail.gettext('mel_moncompte.wait'),
        'loading',
      );
      this.http_post(
        'plugin.mel_delete_resource',
        {
          _id: id,
          _type: type,
        },
        lock,
      );

      rcmail.addEventListener(
        'plugin.mel_delete_resource_success',
        function (p) {
          setTimeout(function () {
            rcmail.triggerEvent('mel_update', { type: type });
            window.location.reload();

            var iframe = document.getElementById('mel_resources_type_frame');
            iframe.src = 'skins/mel_larry/watermark.html';
          }, 750);
        },
      );
    }
  }
};

rcube_webmail.prototype.calendar_edit = function (calId, data) {
  if (calId && data) {
    data = JSON.parse(data.replace(/'/g, '"'));
    const url = 'calendar&_action=calendar';
    cal_data = {
      action: 'edit',
      c: {
        id: calId,
      },
    };

    if (data[0] === 'color') data[1] = data[1].replace(/^#/, '');
    cal_data.c[data[0]] = data[1];

    const busy = rcmail.set_busy(true, 'loading');

    rcmail.http_post('calendar/calendar', cal_data, busy).done((a) => {
      if (data[0] === 'name') {
        $('.boxtitle').text(data[1]);
        parent.$(`#rcmrow${calId} td.name`).text(data[1]);
      }
    }).fail((...e) => {
      console.log('Error:', ...e);
    })
  }
};

rcube_webmail.prototype.set_default_resource = function (mbox, type) {
  if (mbox && type) {
    var lock = this.display_message(
      rcmail.gettext('mel_moncompte.wait'),
      'loading',
    );
    this.http_post(
      'plugin.set_default_resource',
      {
        _mbox: mbox,
        _type: type,
      },
      lock,
    );
    $('#rcmfd_default').prop('disabled', true);
    if (rcmail.env.resource_synchro_mobile_not_set) {
      $('#rcmfd_synchronisation').prop('disabled', true);
      $('#rcmfd_synchronisation').prop('checked', 'checked');
    }
  }
};

// gestion des listes
function AddExternalMember() {
  var dn_list = $('#liste_listes option:selected').val();
  if (dn_list) {
    var newSmtp = prompt(
      rcmail.gettext('mel_moncompte.listes_memb_externe'),
      '',
    );
    if (newSmtp) {
      if (isValidEmail(newSmtp)) {
        var lock = rcmail.display_message(
          rcmail.gettext('mel_moncompte.wait'),
          'loading',
        );
        var res = rcmail.http_post(
          'plugin.listes_add_externe',
          {
            _dn_list: dn_list,
            _new_smtp: newSmtp,
            _current_username: $('#rcmmoncomptebalplist option:selected').val(),
          },
          lock,
        );
      } else {
        alert(
          rcmail
            .gettext('mel_moncompte.listes_addr_nok')
            .replace('%%newSMTP%%', newSmtp),
        );
      }
    }
  } else {
    alert(rcmail.gettext('mel_moncompte.listes_noselect'));
  }
}

function AnaisMemberCallback() {
  var dn_list = $('#liste_listes option:selected').val();
  if (dn_list) {
    var newSmtp = arguments[1];
    if (newSmtp) {
      if (isValidEmail(newSmtp)) {
        var lock = rcmail.display_message(
          rcmail.gettext('mel_moncompte.wait'),
          'loading',
        );
        var res = rcmail.http_post(
          'plugin.listes_add_externe',
          {
            _dn_list: dn_list,
            _new_smtp: newSmtp,
            _current_username: $('#rcmmoncomptebalplist option:selected').val(),
          },
          lock,
        );
      } else {
        alert(
          rcmail
            .gettext('mel_moncompte.listes_addr_nok')
            .replace('%%newSMTP%%', newSmtp),
        );
      }
    }
  } else {
    alert(rcmail.gettext('mel_moncompte.listes_noselect'));
  }
}

function RemoveMember() {
  var dn_list = $('#liste_listes option:selected').val();
  if (dn_list) {
    var address = $('#idLboxMembers option:selected').val();
    if (address) {
      if (
        confirm(
          rcmail
            .gettext('mel_moncompte.listes_addr_del')
            .replace('%%addr_supp%%', address),
        )
      ) {
        var lock = rcmail.display_message(
          rcmail.gettext('mel_moncompte.wait'),
          'loading',
        );
        var res = rcmail.http_post(
          'plugin.listes_remove',
          {
            _dn_list: dn_list,
            _address: address,
            _current_username: $('#rcmmoncomptebalplist option:selected').val(),
          },
          lock,
        );
      }
    } else {
      alert(rcmail.gettext('mel_moncompte.listes_member_noselect'));
    }
  } else {
    alert(rcmail.gettext('mel_moncompte.listes_noselect'));
  }
}

function RemoveAllMembers() {
  var dn_list = $('#liste_listes option:selected').val();
  if (dn_list) {
    if (confirm(rcmail.gettext('mel_moncompte.listes_addr_del_all'))) {
      var lock = rcmail.display_message(
        rcmail.gettext('mel_moncompte.wait'),
        'loading',
      );
      var res = rcmail.http_post(
        'plugin.listes_remove_all',
        {
          _dn_list: dn_list,
          _current_username: $('#rcmmoncomptebalplist option:selected').val(),
        },
        lock,
      );
    }
  } else {
    alert(rcmail.gettext('mel_moncompte.listes_noselect'));
  }
}

function ExportMembers() {
  var dn_list = $('#liste_listes option:selected').val();
  if (dn_list) {
    rcmail.goto_url('settings/plugin.listes_export', {
      _dn_list: dn_list,
      _current_username: $('#rcmmoncomptebalplist option:selected').val(),
    });
  } else {
    alert(rcmail.gettext('mel_moncompte.listes_noselect'));
  }
}

function isValidEmail(email) {
  // var reg = /^[a-zA-Z0-9'._-]+@[a-z0-9'._-]{2,}[.]([a-z]{2,3}|i2)$/
  var reg = /^[a-zA-Z0-9'._-]+@[a-zA-Z0-9'._-]+\.[a-zA-Z0-9]{2,}$/;
  return reg.exec(email) != null;
}

function refreshListMembers(dn_list) {
  var select = $('#idLboxMembers');
  select.html('');
  lists_members[dn_list].forEach(function (entry) {
    select.append('<option value="' + entry + '">' + entry + '</option>');
  });
  $('#members_count').html(
    lists_members[dn_list].length +
      ' ' +
      rcmail.gettext('mel_moncompte.listes_membres'),
  );

  if (lists_isdyn[dn_list]) {
    $('.listes_buttons').hide();
    $('#legende_list_membres').text(
      rcmail.gettext('mel_moncompte.listes_membres_dyn'),
    );
  } else {
    $('.listes_buttons').show();
    $('#legende_list_membres').text(
      rcmail.gettext('mel_moncompte.listes_membres'),
    );
  }
}

$(document).ready(() => {
  rcmail.set_busy(false);
  parent.rcmail.set_busy(false);
});
