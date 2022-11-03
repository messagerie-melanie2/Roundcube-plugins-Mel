/**
 * Fonction appelé par la fonction "Main" du plugin.
 * Créer ou met à jours le module "My_Day".
 * @param {Symbol} symbol Symbole qui correspond au calendrier ou aux tâches. (mel_metapage.Symbols)
 */
function my_day(symbol = null)
{
	if (symbol === null || symbol === mel_metapage.Symbols.my_day.calendar) //Si l'on charge tout ou uniquement les évènements du calendrier
		current_day(mel_metapage.Storage.calendar, mel_metapage.Storage.last_calendar_update, mel_metapage.EventListeners.calendar_updated.get, setupMyDay);
	if (symbol === null || symbol === mel_metapage.Symbols.my_day.tasks) //Si l'on charge tout ou uniquement les tâches
		current_day(mel_metapage.Storage.tasks, mel_metapage.Storage.last_task_update, mel_metapage.EventListeners.tasks_updated.get, setup_tasks);

	try {
		if (rcmail.env.notes_enabled)
		{
			setup_notes();	
			rcmail.addEventListener('notes.apps.updated', setup_notes);
		}
	} catch (error) {
		
	}

	MEL_ELASTIC_UI.gestionTabs($("#myday .tabs"));
}

/**
 * 
 * Met à jours un block du module "my_Day".
 * 
 * @param {string} storage Clé du stockage local qui contient la données à tester.
 * @param {string} trigger Clé du trigger à appeller si il n'y a pas de données en local.
 * @param {function} setup_func Fonction à appeller si il y a des données en local.
 */
function current_day(storage, last_update_storage, trigger, setup_func = (local_storage) => { console.log(local_storage);})
{
	let local_storage = mel_metapage.Storage.get(storage);
	if (moment(mel_metapage.Storage.get(last_update_storage)).format("DD/MM/YYYY") !== moment().startOf('day').format("DD/MM/YYYY"))
		local_storage = null;
	//console.log(local_storage, moment(mel_metapage.Storage.get(last_update_storage)).format("DD/MM/YYYY"), moment().startOf('day').format("DD/MM/YYYY"));
	if (local_storage !== null)
	{
		setup_func(local_storage)
	}
	else{
		parent.rcmail.triggerEvent(trigger);
		return true;
	}
	return false;
}

Main.Add(my_day); //Sera appelé au chargement du plugin "mel_portal".
Update(my_day); //Sera appelé à chaque fois que l'on ouvrira la frame qui contient ce module.


function my_day_generate_link(event)
{
	let link = "";

	if (SearchResultCalendar && SearchResultCalendar.CreateOrOpen)
		link = `SearchResultCalendar.CreateOrOpen('${JSON.stringify(event).replaceAll('"', '£¤£').replaceAll("'", "µ¤¤µ")}')`;

	return link;
}

/**
 * Affiche les évènements.
 * @param {array} datas Données des évènements.
 */
function setupMyDay(datas)
{
	html_helper.Calendars({
		datas,
		config:{
			add_day_navigation:false,
			add_create:false,
			create_function:null,
			add_see_all:false,
			next_when_empty_today_function:null
		},
		e:$("#agenda"),
		e_number:$("#agendanew"),
		get_only_body:true
	});
}

/**
 * 
 * Met à jours le block des tâches.
 * 
 * @param {array} datas Données des tâches. 
 */
function setup_tasks(datas)
{
	let html = ''
	// html = '<div id=dwp-tadk-urg class="tab-task-dwp mel-tab mel-tabheader">Tâches urgentes</div>';
	// html += '<div id=dwp-tadk-all class="tab-task-dwp mel-tab mel-tabheader">Toute les tâches</div>';
	datas = Enumerable.from(datas).orderBy((x) => x.order).thenBy((x) => (x._hasdate === 1 ? x.datetime : Number.MAX_VALUE )).toArray();
	let date;

	if (datas.length > 0)
	{
		for (let index = 0; index < datas.length; index++) {
			html += "<li>";
			const element = datas[index];
			date = moment(parseInt(element.created + "000"));
			html += "<div class=row style=margin-bottom:15px;margin-right:15px;>";

			if (date._isValid)
				html += `<div class=col-md-10><a href=# class="element-block mel-not-link mel-focus" onclick="open_task('${element.id}')"><span class="element-title default-text bold element-block">${element.title}</span><span class="element-desc secondary-text element-block">Créée le ${date.format("DD/MM/YYYY")} à ${date.format("hh:mm")}</span></a></div>`;
			else
				html += "<div class=col-md-10></div>";

			html += '<div class=col-md-2><a style=display:none; onclick="add_task_to_completed(`'+element.id+'`)" class="roundbadge large hover tick ' + (element.mel_metapage.order == 0 ? "icofont-warning warning" : "icofont-hour-glass clear") + '"></a></div>'
			html += "</div>";
			html += "</li>";
		}
	}
	else 
		html += `<li>Aucune tâche en cours...</li>`;

    html = `<ul class="ignore-bullet">${html}</ul>`;

	$("#tasks").html(html);

	if (datas.length > 0)
	{
		$("#tasksnew").html(datas.length);
		$("#tasksnew").removeClass("hidden");
	}
	else
		$("#tasksnew").addClass("hidden");
}

/**
 * Termine une tâche.
 * @param {*} id Identifiant de la tâche à mettre comme "Terminée".
 */
function add_task_to_completed(id)
{
	if (rcmail.busy)
		return;
	rcmail.set_busy(true, "loading");
	let local_storage = mel_metapage.Storage.get(mel_metapage.Storage.tasks);
	if (local_storage != null)
	{
		let item = Enumerable.from(local_storage).firstOrDefault((x) => x.id === id, null);
		if (item !== null)
		{
			item.complete = 1;
			item.status = "COMPLETED";
		}
		$.ajax({ // fonction permettant de faire de l'ajax
		type: "POST", // methode de transmission des données au fichier php
		url: "?_task=tasks&_action=task", // url du fichier php
		data:{
			action:"edit",
			t:item,
			_remote:1,
			_unlock:0
		},
		success:  function (data) {
			rcmail.set_busy(false);
			rcmail.clear_messages();
			rcmail.triggerEvent(mel_metapage.EventListeners.tasks_updated.get);
		},
		error: function (xhr, ajaxOptions, thrownError) { // Add these parameters to display the required response
 
		},
	 });
	}
}

/**
 * Selectionne un onglet.
 * @param {string} id Id de l'onglet à activer.
 * @param {*} element Element à afficher.
 */
  function selectTab(id, element)
  {
	  $(".tablinks").each((i,e) => {
		e.classList.remove("selected");
		$(e).attr("aria-selected", false).attr("tabindex", -1);
	  });
	  
	  $(".tabcontent").each((i,e) => {
		e.classList.add("hidden");
		$(e).attr('hidden=""');
	  });

	  element.classList.add("selected");
	  $(element).attr("aria-selected", true).attr("tabindex", 0);
	  $("#" + id).removeClass("hidden").removeAttr("hidden");
  }

function setup_notes()
{
	let $myday_title = $('#myday h2').first();
    //Si il n'y a pas de note, il y en a une par défaut
    if (Enumerable.from(rcmail.env.mel_metapages_notes).count() === 0 || !!rcmail.env.mel_metapages_notes['create'])
    {
		$('#tab-for-notes-contents').css('display', 'none');
		$('#tab-for-agenda-content').click();
		$myday_title.html(rcmail.gettext('my_day', 'mel_portal'));
    }
	else {
		$myday_title.html(rcmail.gettext('my_day_and_notes', 'mel_portal'));
		let $notes = $('.tabs-contents #notes').css('padding', '15px').css('height', 'calc(100% - 60px)').html('');
		$('#tab-for-notes-contents').css('display', '');

		let $actions = $('<div style="display:flex" class="justify-content-between"></div>').appendTo($notes);

		var $action_left = $('<button><span class="icon-mel-arrow-left"></span></button>').click(() => {
			$(`#notes-block-${setup_notes.current.value.uid.toLowerCase()}`).css('display', 'none');
			const current = Enumerable.from(rcmail.env.mel_metapages_notes).where(x => !!x.value.order && x.value.order === setup_notes.current.value.order - 1).firstOrDefault();

			if(!!current){
				setup_notes.current = current;
				$(`#notes-block-${setup_notes.current.value.uid.toLowerCase()}`).css('display', '');

				const prev = Enumerable.from(rcmail.env.mel_metapages_notes).where(x => !!x.value.order && x.value.order === setup_notes.current.value.order - 1).firstOrDefault();
				if (!prev) {
					$action_left.addClass('disabled').attr('disabled', 'disabled');
				}

				$action_right.removeClass('disabled').removeAttr('disabled', 'disabled');
			}
			else $(`#notes-block-${setup_notes.current.value.uid.toLowerCase()}`).css('display', '');
		}).addClass('btn-mel-invisible btn-arrow btn btn-secondary').appendTo($actions);
		var $action_right = $('<button><span class="icon-mel-arrow-right"></span></button>').click(() => {
			$(`#notes-block-${setup_notes.current.value.uid.toLowerCase()}`).css('display', 'none');
			const current = Enumerable.from(rcmail.env.mel_metapages_notes).where(x => !!x.value.order && x.value.order === setup_notes.current.value.order + 1).firstOrDefault();

			if(!!current){
				setup_notes.current = current;
				$(`#notes-block-${setup_notes.current.value.uid.toLowerCase()}`).css('display', '');

				const next = Enumerable.from(rcmail.env.mel_metapages_notes).where(x => !!x.value.order && x.value.order === setup_notes.current.value.order + 1).firstOrDefault();
				if (!next) {
					$action_right.addClass('disabled').attr('disabled', 'disabled');
				}

				$action_left.removeClass('disabled').removeAttr('disabled', 'disabled');
			}
			else $(`#notes-block-${setup_notes.current.value.uid.toLowerCase()}`).css('display', '');
		}).addClass('btn-mel-invisible btn-arrow btn btn-secondary').appendTo($actions);

		let $main_notes = $('<div id="main-notes-block" style="height:100%"></div>').css('margin', '0 5px').appendTo($notes);

		let the_one = false;
		let already = !!setup_notes.current && !!Enumerable.from(rcmail.env.mel_metapages_notes).where(x => x.value.uid === setup_notes.current.value.uid).firstOrDefault();
		for (const iterator of Enumerable.from(rcmail.env.mel_metapages_notes).orderBy(x => x.order)) {
			if (!iterator.value.uid) continue;

			$(`<div style="height:100%;${the_one || already && setup_notes.current.value.uid !== iterator.value.uid ? 'display:none;' : ''}" id="notes-block-${iterator.value.uid.toLowerCase()}"></div>`).append(iterator.value.text.replaceAll('\n', '<br/>')).appendTo($main_notes);
			$(`<textarea class="form-control input-mel" style="height:100%; width:100%; display:none;background-color:var(--inputs-bg-color)" id="notes-area-${iterator.value.uid.toLowerCase()}"></textarea>`).append(iterator.value.text).appendTo($main_notes);

			if (!the_one && !already)  {
				setup_notes.current = iterator;
				the_one = true;
			}
		}

		if (!Enumerable.from(rcmail.env.mel_metapages_notes).where(x => !!x.value.order && x.value.order === setup_notes.current.value.order + 1).firstOrDefault())
		{
			$action_right.addClass('disabled').attr('disabled', 'disabled');
		}

		if (!Enumerable.from(rcmail.env.mel_metapages_notes).where(x => !!x.value.order && x.value.order === setup_notes.current.value.order - 1).firstOrDefault())
		{
			$action_left.addClass('disabled').attr('disabled', 'disabled');
		}

		let $bottom = $('<div style="text-align: right;"></div>').appendTo($notes);
		var $action_edit = $('<button class="mel-button btn btn-secondary no-button-margin" style="border-radius:100%;"><span class="icon-mel-pencil"></span></button>').click(() => {
			const current = setup_notes.current;
			let $block = $(`#notes-block-${current.value.uid.toLowerCase()}`);
			let $area = $(`#notes-area-${current.value.uid.toLowerCase()}`);

			if (!setup_notes.edit_mode)
			{
				$action_left.css('opacity', 0).css('pointer-events', 'none');
				$action_right.css('opacity', 0).css('pointer-events', 'none');
				$block.css('display', 'none');
				$area.css('display', '');
				$action_edit.find('.icon-mel-pencil').removeClass('icon-mel-pencil').addClass('icon-mel-check');
				setup_notes.edit_mode = true;
			}
			else {
				$block.css('display', '').html('<div style="text-align:center"><span class="spinner-grow"></span></div>');
				$area.css('display', 'none');
				$action_edit.find('.icon-mel-check').addClass('icon-mel-pencil').removeClass('icon-mel-check');
				setup_notes.edit_mode = false;
				top.rcmail.triggerEvent('notes.master.edit', {
					text:$area.val(),
					id:current.value.uid
				}).then(() => {
					setup_notes();
				});
			}

		}).appendTo($bottom);
	}
}
