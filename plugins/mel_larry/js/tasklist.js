/**
 * Client script for the Mél Larry Tasklist plugin
 *
 * @licstart  The following is the entire license notice for the
 * JavaScript code in this file.
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
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this file.
 */
var saving_lock;

// On focus quickaddinput
$(document).on("focusin", '#quickaddinput', function(e) {
	$('#taskstoolbar').hide();
	$('#quickaddbox').addClass('focus');
});

// On unfocus quickaddinput
$(document).on("focusout", '#quickaddinput', function(e) {
	setTimeout(() => {
		$('#taskstoolbar').show();
		$('#quickaddbox').removeClass('focus');
	}, 500);
});

// On submit button click
$(document).on("click", '#taskcreateform .form-section.submit input', function(e) {
	if (!rcmail.busy) {
		var tasktext = $('#taskcreateform #taskcreate-title').val(),
			rec = { tempid:Date.now(), title:tasktext, readonly:false, mask:0, complete:0, list:rctasks.selected_list };
		if (tasktext && tasktext.length) {
			var date = $('#taskcreateform #taskcreate-date').val(),
				time = $('#taskcreateform #taskcreate-time').val(),
				alarm = $('input#create-alarm-item').is(':checked'),
				priority = $('input#create-priority-item').is(':checked');
			
			if (date.length) {
				rec.date = date;
				rec.time = time.length ? time : null;
			}
			else if (time.length) {
				rec.date = get_today_date();
				rec.time = time.length ? time : null;
			}
			else {
				rec.date = null;
				rec.time = null;
			}
			rec.flagged = priority ? 1 : 0;
			rec.valarms = alarm ? [{ "trigger": "-PT1M", "action": "DISPLAY" }] : null;
			saving_lock = rcmail.set_busy(true, 'tasklist.savingdata');
	        rcmail.http_post('tasks/task', { action:'new', t:rec, filter:0 });
	        $('button.ui-button:ui-button').button('option', 'disabled', rcmail.busy);
	    }
		setTimeout(() => {
			rcmail.command('menu-close', 'taskcreatepopup');
		}, 500);
	}
});

// On submit button enter
$(document).on("keypress", '#taskcreateform input#taskcreate-title', function(e) {
	if (e.which == 13) {
		$('#taskcreateform .form-section.submit input').click();
		return false;
	}
});

if (window.rcmail) {
	rcmail.addEventListener('init', function(evt) {
		rcmail.addEventListener('plugin.unlock_saving', function(p) {
			if (saving_lock) {
	            rcmail.set_busy(false, null, saving_lock);
	            $('button.ui-button:ui-button').button('option', 'disabled', false);
	            saving_lock = null;
	        }
		});
	});

	// Open create task popup
	rcmail.addEventListener('menu-open', function(props) {
		if (props.name == 'taskcreatepopup') {
			// general datepicker settings
			var datepicker_settings = {
				// translate from PHP format to datepicker format
				dateFormat: rctasks.settings['date_format'].replace(/M/g, 'm').replace(/mmmmm/, 'MM').replace(/mmm/, 'M').replace(/dddd/, 'DD').replace(/ddd/, 'D').replace(/yy/g, 'y'),
				firstDay : rctasks.settings['first_day'],
				changeMonth: false,
				showOtherMonths: true,
				selectOtherMonths: true,
				onSelect: function(dateText, inst) {
					$("#taskcreate-date").val(dateText);
				}
			};
			$('#taskcreate-datepicker').datepicker(datepicker_settings);
			// configure drop-down menu on time input fields based on jquery UI autocomplete
	    	rctasks.init_time_autocomplete($('#taskcreate-time'), {container: '#taskcreateform'});
	    	$('#taskcreateform #taskcreate-title').focus();
		}
	});

	// Close create task popup
	rcmail.addEventListener('menu-close', function(props) {
		if (props.name == 'taskcreatepopup') {
			$('#taskcreateform #taskcreate-title').val('');
			$('#taskcreateform #taskcreate-date').val('');
			$('#taskcreateform #taskcreate-time').val('');
			$('input#create-alarm-item').prop('checked', false);
			$('input#create-priority-item').prop('checked', false);
			$('#taskcreate-datepicker').datepicker('setDate');
		}
	});
}

function get_today_date() {
	var today = new Date();
	var dd = today.getDate();
	var mm = today.getMonth() + 1; //January is 0!
	var yyyy = today.getFullYear();

	if (dd < 10) {
	  dd = '0' + dd;
	}

	if (mm < 10) {
	  mm = '0' + mm;
	}

	return dd + '/' + mm + '/' + yyyy;
}
