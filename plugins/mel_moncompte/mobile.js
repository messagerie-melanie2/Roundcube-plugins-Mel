/**
 * Gestion des appareils mobiles via le web service z-push
 */
$(document).on({
    click: function (e) {
    	var id = $(this).parent().attr('id').split('--');
		switch(id[0]) {
	    	case "rcmrowrcmaccountsinfo":
	    		if (id.length == 3
	        			&& id[1] == rcmail.env.deviceid) {
		    		var param = {
		    			_command: 'ResyncUserDevice',
		    			_device_id: id[1],
		    			_user_device: id[2].replace(/_/g, '.'),
		    		};
	    		}
	    		break;
	    	case "rcmrowrcmsyncdetails":
	    		if (id.length == 4
	        			&& id[1] == rcmail.env.deviceid) {
		    		var param = {
		    			_command: 'ResyncFolderId',
		    			_device_id: id[1],
		    			_user_folder: id[2].replace(/_-p-_/g, '.'),
		    			_folder_id: id[3].replace(/_-p-_/g, '.').replace(/_-s-_/g, '/'),
		    		};
	    		}
	    		break;
		}
		if (param) {
    		zpush_send_command(param);
    	}
    }
}, "tbody td.mel_moncompte\\.resync"); // pass the element as an argument to .on

$(document).on({
    click: function (e) {
    	var id = $(this).parent().attr('id').split('--');
		switch(id[0]) {
	    	case "rcmrowrcmaccountsinfo":
	    		if (id.length == 3
	        			&& id[1] == rcmail.env.deviceid) {
		    		var param = {
		    			_command: rcmail.env.zp_version == 1 ? 'DeleteUserDeviceZP1' : 'DeleteUserDevice',
		    			_device_id: id[1],
		    			_user_device: id[2].replace(/_/g, '.'),
		    		};
	    		}
	    		break;
		}
		if (param) {
    		zpush_send_command(param);
    	}
    }
}, "tbody td.mel_moncompte\\.remove"); // pass the element as an argument to .on

$(document).on({
    click: function (e) {
    	switch($(this).attr('id')) {
	    	case "mel_statistics_delete_device":
	    		var param = {
	    			_command: 'Delete',
	    			_device_id: rcmail.env.deviceid,
	    		};
	    		break;
	    	case "mel_statistics_deletezp1_device":
	    		var param = {
	    			_command: 'DeleteZP1',
	    			_device_id: rcmail.env.deviceid,
	    		};
	    		break;
	    	case "mel_statistics_resync_device":
	    		var param = {
	    			_command: 'Resync',
	    			_device_id: rcmail.env.deviceid,
	    		};
	    		break;
	    	case "mel_statistics_wipe_device":
	    		var param = {
	    			_command: 'Wipe',
	    			_device_id: rcmail.env.deviceid,
	    		};
	    		break;
	    	case "mel_statistics_unwipe_device":
	    		var param = {
	    			_command: 'Unwipe',
	    			_device_id: rcmail.env.deviceid,
	    		};	    		
	    		break;
    	}
    	if (param) {
    		zpush_send_command(param);
    	}
    }
}, "#mobile_actions a"); // pass the element as an argument to .on


if (window.rcmail) {
	rcmail.addEventListener('responseafterplugin.statistics.zpush_command', function(evt) {
		rcmail.display_message(evt.response.message, evt.response.status);
		if (evt.response.status == 'success' 
				&& evt.response.command != 'Wipe') {
			if (evt.response.command == 'Delete') {
				parent.location.reload();
			} else {
				window.location.reload();
			}
		}
	});
	rcmail.addEventListener('init', function(evt) {
		var p = rcmail;
		if (rcmail.gui_objects.mel_statistics_mobiles_list) {
	        rcmail.mobiles_list = new rcube_list_widget(rcmail.gui_objects.mel_statistics_mobiles_list,
	          {multiselect:false, draggable:false, keyboard:true});
	        rcmail.mobiles_list.addEventListener('select', function(e) { p.mel_statistics_mobile_select(e); });
	        rcmail.mobiles_list.init();
	        rcmail.mobiles_list.focus();
		}
		
		if ($("#rcmaccountsinfo").length > 0) {
			$("#rcmaccountsinfo tbody tr").each(function() {
				var td = $(this).children('.mel_moncompte\\.z-push');
				if (td.html() == '1') {
					$(this).children('.mel_moncompte\\.resync').removeClass('mel_moncompte.resync');					
				}
				var td_user = $(this).children('.mel_moncompte\\.user');
				if (td_user.html().indexOf(rcmail.env.current_user) == -1) {
					$(this).children('.mel_moncompte\\.resync').removeClass('mel_moncompte.resync');
					$(this).children('.mel_moncompte\\.remove').removeClass('mel_moncompte.remove');
				}
			});			
		}
		if ($("#mel_statistics_sync_details").length > 0) {			
			$("#mel_statistics_sync_details tbody tr").each(function() {
				var td = $(this).children('.mel_moncompte\\.z-push');
				if (td.html() == '1') {
					$(this).children('.mel_moncompte\\.resync').removeClass('mel_moncompte.resync');
				}
				var td_user = $(this).children('.mel_moncompte\\.mailbox');
				if (td_user.html().indexOf(rcmail.env.current_user) == -1) {
					$(this).children('.mel_moncompte\\.resync').removeClass('mel_moncompte.resync');
				}
			});			
		}
	});
}

// Mobile selection
rcube_webmail.prototype.mel_statistics_mobile_select = function(option)
{
  var id = option.get_single_selection();
  if (id != null) {
  		this.load_mobile_frame(id);
  }
};

//load mobile frame
rcube_webmail.prototype.load_mobile_frame = function(id)
{
  var has_id = typeof(id) != 'undefined' && id != null;

  if (this.env.contentframe && window.frames && window.frames[this.env.contentframe]) {
    target = window.frames[this.env.contentframe];
    var msgid = this.set_busy(true, 'loading');
    target.location.href = this.env.comm_path+'&_action=plugin.mel_statistics_mobile&_framed=1'
      +(has_id ? '&_fid='+id : '')+'&_unlock='+msgid;
  }
};


function zpush_send_command(param) {
	if (confirm(rcmail.gettext("mel_moncompte.confirm_" + param._command))) {
		// MANTIS 3599: Mes statistiques : pas de changement de mot de passe à la réinitialisation
		if (param._command == 'Wipe') {
    		show_password_change();
		}
		var lock = rcmail.display_message(rcmail.gettext('mel_moncompte.wait'), 'loading');
		rcmail.http_post('plugin.statistics.zpush_command', param, lock);
	}
}

