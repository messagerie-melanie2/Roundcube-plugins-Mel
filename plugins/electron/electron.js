/**
 * Plugin Mél Electron
 *
 * Plugin d'affichage de Mél dans un client Electron en lien avec le plugin Mél_archivage
 * Les messages sont téléchargés sur le poste de l'utilisateur
 * Puis copié dans un dossier configuré dans le dossier d'archive 
 * Du dossier de l'application Electron 
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 2
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */
if (rcmail.env.iselectron) {
  if (window.api) {
    //Définition variables globales
    let searchform_onsubmit;
    let events;

    rcmail.addEventListener('init', function (evt) {
      if (rcmail.env.account) {
        //On finit de télécharger les archives s'il en reste
        window.api.send('download_eml', { "token": rcmail.env.request_token });
      }

      //Récupère le nom du dossier des archive configuré dans le fichier .env
      window.api.send('get_archive_folder')
      window.api.receive('archive_folder', (folder) => {
        rcmail.env.local_archive_folder = folder;
        createFolder();
        displaySubfolder();
      });
      rcmail.message_list
        .addEventListener('dragstart', function (o) { drag_start(o); })
        .addEventListener('dragend', function (o) { drag_end_archive(o) })
    });

    //  ----- Réaffiche les sous-dossier après archivage d'un nouveau dossier -----
    window.api.receive('new_folder', (folder) => {
      displaySubfolder();
    })

    // ----- Ajout des mails dans la liste après archivage -----
    window.api.receive('add_message_row', (row) => {
      addMessageRow(row, rcmail.env.local_archive_folder + "/" + row.mbox)
    })

    // ----- Avancement de l'archivage -----
    let message_archivage = '';
    window.api.receive('download-advancement', (data) => {
      rcmail.hide_message(message_archivage);
      message_archivage = rcmail.display_message(`Nombre de mails restants : ${data.length}`, 'loading');
      message_cancel = rcmail.display_message(`Cliquez ici pour arrêter l'archivage`, 'error stop_archivage');

      $('.error.stop_archivage').on('click', function (e) {
        e.preventDefault();
        window.api.send('stop-archivage')
      })

      if (data.uid) {
        try {
          rcmail.http_post('mail/delete', {
            _mbox: data.mbox,
            _uid: data.uid,
          });
        } catch (error) {
          console.log('Erreur dans la suppression du mail n°' + data.uid);
        }
      }
    })

    // ----- Suppression des mails après archivage -----
    window.parent.api.receive('download-finish', (file) => {
      rcmail.hide_message(message_archivage);
      rcmail.hide_message(message_cancel);
      rcmail.display_message('Fin du téléchargement des archives', 'confirmation');
    });

    // ----- Créer le dossier des archives -----
    function createFolder() {
      let link = $('<a>').attr('href', '#')
        .attr('rel', rcmail.env.local_archive_folder)
        .attr('onClick', "chargementArchivage('')")
        .html(rcmail.env.local_archive_folder);

      rcmail.treelist.insert({ id: rcmail.env.local_archive_folder, html: link, classes: ['mailbox archives_locales'] });
      if ($("li.trash").length) {
        $("li.archives_locales").detach().insertAfter($("li.trash"));
      }
    }

    // ----- Affiche les sous-dossier des archives (récursif)-----
    function displaySubfolder() {
      window.api.send('subfolder');
      window.api.receive('listSubfolder', (subfolders) => {
        subfolders.forEach(subfolder => {
          if (subfolder.name == rcmail.env.account) {
            subfolder.relativePath = '';
            getChildren(subfolder);
          }
        })
      });
    }

    function getChildren(parent) {
      if (parent && parent.children) {
        for (var i = 0, l = parent.children.length; i < l; ++i) {
          var child = parent.children[i];
          child.relativePath = child.relativePath.replace(/\\/g, "/");
          let key = child.relativePath;
          let link = $('<a>').attr('href', '#')
            .attr('rel', key)
            .attr('onClick', "chargementArchivage('" + key + "')")
            .html(translateFolder(child.name));
          //On ignore le dossier de l'utilisateur
          if (parent.relativePath == "") {
            rcmail.treelist.insert({ id: rcmail.env.local_archive_folder + '/' + key, html: link, classes: ['mailbox'] }, rcmail.env.local_archive_folder, 'mailbox');
          }
          //On insère les dossiers sous le dossier principal
          else {
            rcmail.treelist.insert({ id: rcmail.env.local_archive_folder + '/' + key, html: link, classes: ['mailbox'] }, rcmail.env.local_archive_folder + '/' + parent.relativePath, 'mailbox');
          }
          getChildren(child);
        }
      }
    }

    // ----- Changement de l'environnement et chargement de la liste  ----- 
    // ----- Fonction appelée lors du clique sur un dossier -----
    function chargementArchivage(path) {
      delete rcmail.message_list._events.select;
      delete rcmail.message_list._events.initrow;
      delete rcmail.message_list._events.dblclick;
      hideSelectedMail()

      mbox = (path == '') ? rcmail.env.local_archive_folder : rcmail.env.local_archive_folder + "/" + path;
      rcmail.env.mailbox = mbox;

      displayMessageList(path);
      rcmail.message_list
        .addEventListener('select', function (o) { messagelist_select(o) })
        .addEventListener('dragstart', function (o) { drag_start(o) })
        .addEventListener('dragend', function (o) { drag_end_import(o) });

      search_form();
      reset_search_form(path);
    }

    // ----- Affiche la liste des messages d'un dossier -----
    function displayMessageList(path) {
      rcmail.message_list.clear();

      window.api.send('read_mail_dir', path)
      window.api.receive('mail_dir', (mails) => {
        mails.forEach((mail) => {
          if (mail.break == 0) {
            addMessageRow(mail, mbox);
          }
        });
        read_unread();
        flag_unflagged();
      })
    }

    //Ajout de l'évènement de sélection d'un mail 
    let messagelist_select = function (list) {
      let uid = list.get_selection();

      deleteMails(uid);

      if (list.get_selection().length < 2) {
        if (!uid.length && rcmail.env.mailbox != rcmail.env.local_archive_folder) {
          let body = $("#mainscreen").contents().find('#mailview-bottom');
          body.html('<iframe name="messagecontframe" id="messagecontframe" style="width:100%; height:100%" frameborder="0" src="skins/mel_larry/watermark.html" title="Prévisualisation des courriels"></iframe>');
          cancel_search_form();
          cancel_reset_search_form();
          delete rcmail.message_list._events;
          rcmail.message_list
            .addEventListener('initrow', function (o) { rcmail.init_message_row(o); })
            .addEventListener('dblclick', function (o) { rcmail.msglist_dbl_click(o); })
            .addEventListener('keypress', function (o) { rcmail.msglist_keypress(o); })
            .addEventListener('select', function (o) { rcmail.msglist_select(o); })
            .addEventListener('dragstart', function (o) { rcmail.drag_start(o); })
            .addEventListener('dragstart', function (o) { drag_start(o); })
            .addEventListener('dragmove', function (e) { rcmail.drag_move(e); })
            .addEventListener('dragend', function (e) { rcmail.drag_end(e); })
            .addEventListener('dragend', function (o) { drag_end_archive(o) })
            .addEventListener('expandcollapse', function (o) { rcmail.msglist_expand(o); })
            .addEventListener('column_replace', function (o) { rcmail.msglist_set_coltypes(o); })
            .addEventListener('listupdate', function (o) { rcmail.triggerEvent('listupdate', o); })
            .init();
        }
        //Premier index de message_list = 0 au lieu de 'MA'
        if (uid == "MA") {
          uid = 0;
        }

        window.api.send('mail_select', uid)
      }
    };

    window.api.receive('mail_return', (mail) => {
      let body = $("#mainscreen").contents().find('#mailview-bottom');
      body.html(mail);
    });




    let drag_uid = [];
    function drag_start(list) {
      drag_uid = list.get_selection();
    }

    function drag_end_import(list) {
      if (drag_uid && list.target.rel) {
        if (!list.target.rel.includes(rcmail.env.account)) {
          for (const uid of drag_uid) {
            window.api.send('eml_read', { "uid": uid, "folder": list.target.rel });
          }
        }
      }
    }

    function drag_end_archive(list) {
      if (drag_uid.length && list.target.rel) {
        if (list.target.rel.includes(rcmail.env.account) || list.target.rel == rcmail.env.local_archive_folder) {
          rcmail.http_get('mail/plugin.mel_archivage_traitement_electron', {
            _mbox: rcmail.env.mailbox,
            _account: rcmail.env.account,
            _uids: drag_uid,
          });

        }
      }
    }

    rcmail.addEventListener('responseafterplugin.mel_archivage_traitement_electron', function (event) {
      let stringified = JSON.stringify(event.response.data);
      let parsedObj = JSON.parse(stringified);
      let files = [];
      for (const mbox in parsedObj) {
        for (let i = 0; i < parsedObj[mbox].length; i++) {
          const uid = parsedObj[mbox][i];
          uid.flags = (Array.isArray(uid.flags)) ? { "SEEN": false } : uid.flags;
          if (!uid.flags.hasOwnProperty('SEEN')) {
            uid.flags.SEEN = false;
          }
          files.push({ "url": rcmail.url('mail/viewsource', rcmail.params_from_uid(uid.message_uid)).concat("&_save=1"), "uid": uid.message_uid, "path_folder": rcmail.env.account + "/" + mbox, "mbox": mbox, "etiquettes": uid.flags });
        }
        window.parent.api.send('download_eml', { "files": files, "token": rcmail.env.request_token });
        $("#nb_mails").text(rcmail.get_label('mel_archivage.archive_downloading'));
      }
    });

    window.api.receive('eml_return', (eml) => {
      rcmail.http_post('mail/plugin.import_message', {
        _folder: eml.folder,
        _message: eml.text,
        _uid: eml.uid
      });
    });

    rcmail.addEventListener('responseafterplugin.import_message', function (event) {
      if (event.response.data) {
        rcmail.message_list.remove_row(event.response.uid);
        window.api.send('delete_selected_mail', [event.response.uid]);
        rcmail.display_message('Courriel(s) importé(s) avec succès', 'confirmation');
        drag_uid = [];
      }
    });


    function search_form() {
      //Système de recherche des mails
      searchform_onsubmit = $("[name ='rcmqsearchform']").attr('onsubmit');
      $("[name ='rcmqsearchform']").removeAttr('onsubmit').submit(function (e) {
        e.preventDefault();
        window.api.send('search_list', { "value": $('#quicksearchbox').val(), "subfolder": rcmail.env.mailbox.replace(rcmail.env.local_archive_folder + "/", "") });
        window.api.receive('result_search', (rows) => {
          rcmail.message_list.clear();
          for (const row of rows) {
            if (row.break == 0) {
              addMessageRow(row, rcmail.env.local_archive_folder + "/" + row.subfolder);
            }
          }
        });
      });
    }

    function cancel_search_form() {
      $("[name ='rcmqsearchform']").attr('onsubmit', searchform_onsubmit);
    }

    function reset_search_form(path) {
      $("#searchreset").on('click', function (e) {
        e.preventDefault();
        rcmail.message_list.clear();
        displayMessageList(path);
      });
    }

    function cancel_reset_search_form() {
      $("#searchreset").unbind('click');
    }

    function openAttachment(uid, partid) {
      window.api.send('attachment_select', { 'uid': uid, 'partid': partid })
    }

    function addMessageRow(row, mbox) {
      row.fromto = "<span class='adr'><span class='rcmContactAddress'>" + row.fromto + "</span></span>";
      row.date = formatDate(row.date);
      let etiquettes = JSON.parse(row.etiquettes);
      let seen = etiquettes.SEEN ? 1 : 0;
      let flagged = etiquettes.FLAGGED ? 1 : 0;
      let flags = { "flagged": flagged, "seen": seen, "ctype": row.content_type, "mbox": mbox };
      rcmail.add_message_row(row.id, row, flags, false);
    }


    //Gestion des lus/non lus
    function read_unread() {
      $("span[id*='msgicnrcmrow']").unbind('click');
      $("span[id*='msgicnrcmrow']").click(function () {
        let seen = $(this).hasClass('unread') ? true : false;
        let flagged = $(this).closest('tr').hasClass('flagged') ? true : false;
        $(this).toggleClass('unread');
        $(this).closest('tr').toggleClass('unread');
        let uid = $(this).next().attr('href').split('&')[2].split('=')[1];
        window.api.send('read_unread', { "uid": uid, "SEEN": seen, "FLAGGED": flagged });
        rcmail.display_message('Courriels marqués avec succès', 'confirmation');
      })
    }

    //Gestion des flags
    function flag_unflagged() {
      $("span[id*='flagicnrcmrow']").unbind('click');
      $("span[id*='flagicnrcmrow']").click(function () {
        let flagged = $(this).hasClass('flagged') ? false : true;
        if (!flagged) {
          $(this).addClass('unflagged').removeClass('flagged');
        }
        else {
          $(this).addClass('flagged').removeClass('unflagged');
        }
        $(this).closest('tr').toggleClass('flagged');

        let seen = $(this).closest('tr').hasClass('unread') ? false : true;

        let uid = $(this).closest('tr').find('a').attr('href').split('&')[2].split('=')[1];
        window.api.send('flag_unflagged', { "uid": uid, "SEEN": seen, "FLAGGED": flagged });
        rcmail.display_message('Courriels marqués avec succès', 'confirmation');
      })
    }

    function deleteMails(uids) {
      rcmail.enable_command('delete', true);
      $(".button.delete").unbind('click');
      $('.button.delete').removeAttr("onclick").removeAttr('href');
      $('.button.delete').on('click', function (e) {
        e.preventDefault();
        if (confirm('Voulez-vous supprimer le(s) mail(s) sélectionné(s) ?')) {
          for (const uid of uids) {
            rcmail.message_list.remove_row(uid);
          }
          window.api.send('delete_selected_mail', uids);
          let body = $("#mainscreen").contents().find('#mailview-bottom');
          body.html('');
          rcmail.display_message('Courriel(s) supprimé(s) avec succès', 'confirmation');
        }
      });
    }

    function formatDate(row_date) {
      let date = new Date(row_date);
      return (date.getDate() < 10 ? '0' : '') + date.getDate() +
        '/'
        + (date.getMonth() < 10 ? '0' : '') + (date.getMonth() + 1) +
        '/'
        + date.getFullYear() +
        ' '
        + (date.getHours() < 10 ? '0' : '') + date.getHours() +
        ':'
        + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();
    }

    function hideSelectedMail() {
      let doc = document.getElementById('messagecontframe').contentWindow.document;
      doc.open();
      doc.write("");
      doc.close();
    }

    function translateFolder(name) {
      switch (name) {
        case 'INBOX':
          return 'Boite de réception'
        case 'Drafts':
          return 'Brouillons'
        case 'Sent':
          return 'Envoyés'
        case 'Trash':
          return 'Corbeille'
        case 'Junk':
          return 'Indésirable'
        case 'Templates':
          return 'Modèles'
        default:
          return name;
      }
    }
  }
}