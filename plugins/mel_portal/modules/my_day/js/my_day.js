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


/**
 * Affiche les évènements.
 * @param {array} datas Données des évènements.
 */
function setupMyDay(datas)
{
	const classes = {
		organizer:"icofont-royal royal",
		tick:"icofont-check lightgreen",
		waiting:"icofont-hour-glass clear",
		declined:"icofont-close danger"
	}
	const set_style = (event) => {
		const now = {
			now:moment(),
			start:moment().startOf('day'),
			end:moment().endOf('day')
		}
		const date = {
			start:moment(event.start),
			end:moment(event.end)
		}
		if (date.start < now.start || date.end > now.end)
			return {
				start:date.start.format("DD/MM/YYYY HH:mm"),
				end:date.end.format("DD/MM/YYYY HH:mm"),
			}
		else
			return {
				start:date.start.format("HH:mm"),
				end:date.end.format("HH:mm"),
			}
	};
	let html = ''
	// datas.sort(function(a,b){
	// 	return moment(a.start) - moment(b.start);
	// });
	let style;
	let link;
	let bool = false;
	let icon;
    for (let index = 0; index < datas.length; index++) {
        const element = datas[index];
		html += "<li>";
        html += "<div class=row style=margin-bottom:15px;margin-right:15px; >";
		if (element.allDay)
			html += "<div class=col-8><span class=element-title>" + rcmail.gettext("Journée entière") + "</span><br/><span class=element-desc>" + element.title +"</span></div>";
		else
		{
			const style_date = set_style(element);
        	html += "<div class=col-8><span class=element-title>" + style_date.start + " - " + style_date.end + "</span><br/><span class=element-desc>" + element.title +"</span></div>";
		}
		// bool = element.attendees !== undefined && 
		// element.attendees.length > 0 && 
		// Enumerable.from(element.attendees).any(x =>  rcmail.env.mel_metapage_user_emails.includes(x.email));
		// if (bool) //Affichage d'information lié aux participants
		// {
		// 	icon = null;
		// 	for (let it = 0; it < rcmail.env.mel_metapage_user_emails.length; it++) {
		// 		const mail = rcmail.env.mel_metapage_user_emails[it];
		// 		for (let j = 0; j < element.attendees.length; j++) {
		// 			const attendee = element.attendees[j];
		// 			if (attendee.email == mail)
		// 			{
		// 				if (attendee.role === "ORGANIZER")
		// 					icon = classes.organizer;
		// 				else if (attendee.status.toUpperCase() === 'CONFIRMED')
		// 					icon = classes.tick;
		// 				else if (attendee.status.toUpperCase() === 'DECLINED')
		// 					icon = classes.declined;
		// 				else 
		// 					icon = classes.waiting;
		// 				break;
		// 			}
		// 		}
		// 		if (icon !== null)
		// 			break;
		// 	}
		// }
        // html += '<div class=col-md-2><a ' + (bool ? "" : 'style="display:none;') + ' class="roundbadge large ' + (icon !== null ? icon : "") + '"></a></div>';
		if (element.location.includes("@visio") || element.location.includes("#visio"))
		{
			style = "";
			if (element.location.includes("@visio"))
				link = `target="_blank" href="${element.location.replace("@visio:", "")}"`;
			else
			{
				var tmp_link = new WebconfLink(element.location);
				link = `href="#" onclick="window.webconf_helper.go('${tmp_link.key}', ${tmp_link.get_wsp_string()}, ${tmp_link.get_ariane_string()})"`;
			}
		}
		else
			style = "display:none;";

		html += '<div class=col-4><div class="webconf-myday"><a '+link+' style="'+style+'" class="roundbadge link large dark icon-mel-videoconference"></a><span style="'+style+'" class="span-webconf">Webconf</span></div></div>';
        html += "</div>";
		html += "</li>";
    }

    html = `<ul class="ignore-bullet">${html}</ul>`;
	$("#agenda").html(html);

	if (datas.length > 0)
	{
		$("#agendanew").html(datas.length);
		$("#agendanew").removeClass("hidden");
	}
	else
		$("#agendanew").addClass("hidden");

		
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
    for (let index = 0; index < datas.length; index++) {
		html += "<li>";
        const element = datas[index];
		date = moment(parseInt(element.created + "000"));
        html += "<div class=row style=margin-bottom:15px;margin-right:15px;>";
		if (date._isValid)
        	html += '<div class=col-md-10><span class="element-title">' + element.title + '</span><br/><span class="element-desc">Créée le ' + date.format("DD/MM/YYYY") + " à " + date.format("hh:mm") +"</span></div>";
        else
			html += "<div class=col-md-10></div>";
		html += '<div class=col-md-2><a style=display:none; onclick="add_task_to_completed(`'+element.id+'`)" class="roundbadge large hover tick ' + (element.mel_metapage.order == 0 ? "icofont-warning warning" : "icofont-hour-glass clear") + '"></a></div>'
        html += "</div>";
		html += "</li>";
    }

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

// function removeEvent(id, calendarId)
// {
// 	$.ajax({ // fonction permettant de faire de l'ajax
// 	   type: "POST", // methode de transmission des données au fichier php
//        url: rcmail.env.ev_remove_calendar_url, // url du fichier php
//        data:{
//            action:"remove",
//            e:{
//             id:id,
//             calendar:calendarId
//            },
//            _remote:1,
//            _unlock:0
//        },
// 	   success: function (data) {
//             my_day();
// 	   },
// 	   error: function (xhr, ajaxOptions, thrownError) { // Add these parameters to display the required response

// 	   },
// 	});
// }

// function dateNow(date){
// 	let set = date; 
// 	let getDate = set.getDate().toString();
// 	if (getDate.length == 1){ //example if 1 change to 01
// 	 getDate = "0"+getDate;
// 	}
// 	let getMonth = (set.getMonth()+1).toString();
// 	if (getMonth.length == 1){
// 	 getMonth = "0"+getMonth;
// 	}
// 	let getYear = set.getFullYear().toString();
// 	let dateNow = getYear + "-" + getMonth + '-' + getDate+"T00:00:00";
// 	return dateNow;
//   }

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

	//   setTimeout(() => {
	// 	document.activeElement.blur();
	//   }, 100);
  }

