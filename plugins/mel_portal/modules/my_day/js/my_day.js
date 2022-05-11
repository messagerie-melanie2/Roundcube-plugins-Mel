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
	let style;
	let link;
	let bool = false;
	let icon;
	let title;

	if (datas.length > 0)
	{
		for (let index = 0; index < datas.length; index++) {
			const element = datas[index];

			if (element.status === "CANCELLED")
				continue;

			title = mel_metapage.Functions.updateRichText(element.title);

			if (element.free_busy === "free")
				title += " (libre)";

			if (element.attendees !== undefined && element.attendees.length > 0)
			{
				bool = false;
				const item = Enumerable.from(element.attendees).where(x => x.email === rcmail.env.mel_metapage_user_emails[0]).firstOrDefault(null);
				if (item !== null)
				{
					try {
						switch (item.status) {
							case "NEEDS-ACTION":
								title += ` (En attente)`;
								break;
	
							case "ACCEPTED":
								title += ` (Accepté)`;
								break;
	
							case "TENTATIVE":
								title += ` (Peut-être)`;
								break;
	
							case "CANCELLED":
								bool = true;
								break;
						
							default:
								break;
						}
					} catch (error) {
						
					}
				}

				if (bool)
					continue;

			}

			html += "<li>";
			html += "<div class=row style=margin-bottom:15px;margin-right:15px; >";

			if (element.allDay)
				html += `<div class=col-8><a href=# class="element-block mel-not-link mel-focus" onclick="${my_day_generate_link(element)}"><span class="element-title default-text bold element-block">` + rcmail.gettext("Journée entière") + `</span><span class="element-desc secondary-text element-block">` + title + `</span></a></div>`;
			else
			{
				const style_date = set_style(element);
				html += `<div class=col-8><a href=# class="element-block mel-not-link mel-focus" onclick="${my_day_generate_link(element)}"><span class="element-title default-text bold element-block">` + style_date.start + " - " + style_date.end + `</span><span class="element-desc secondary-text element-block">` + title +"</span></a></div>";
			}

			if (rcube_calendar.is_desc_webconf(element.location))//element.location.includes("@visio") || element.location.includes("#visio") || element.location.includes(rcmail.env["webconf.base_url"]))
			{
				style = "";
				if (element.location.includes("@visio"))
					link = `target="_blank" href="${element.location.replace("@visio:", "")}"`;
				else {
					var tmp_link = WebconfLink.create(element);
					link = `href="#" onclick="window.webconf_helper.go('${tmp_link.key}', ${tmp_link.get_wsp_string()}, ${tmp_link.get_ariane_string()})"`;	
				}
				// else if (element.location.includes("#visio"))
				// {
				// 	var tmp_link = new WebconfLink(element.location);
				// 	link = `href="#" onclick="window.webconf_helper.go('${tmp_link.key}', ${tmp_link.get_wsp_string()}, ${tmp_link.get_ariane_string()})"`;
				// }
				// else
				// {
				// 	const categoryExist = element.categories !== undefined && element.categories !== null && element.categories.length > 0;
				// 	const isWsp = categoryExist && element.categories[0].includes("ws#");
				// 	const ariane = isWsp ? "null" : "'@home'";
				// 	const wsp = isWsp ? `'${element.categories[0].replace("ws#", "")}'` : "null";
				// 	link = `href="#" onclick="window.webconf_helper.go('${mel_metapage.Functions.webconf_url(element.location)}', ${wsp}, ${ariane})"`;
				// }
			}
			else
				style = "display:none;";

			html += '<div class=col-4><div class="webconf-myday"><a '+link+' style="'+style+'" class="roundbadge link large dark icon-mel-videoconference"><span class="sr-only">Aller à la Webconf</span></a><span style="'+style+'" class="span-webconf">Webconf</span></div></div>';
			html += "</div>";
			html += "</li>";
		}
	}
	else 
	{
		const storage = Enumerable.from(mel_metapage.Storage.get(mel_metapage.Storage.calendar_by_days));
		const storage_count = storage.count();
		if (storage_count > 0)
		{
			const storage_first = storage.first();
			const value = storage_first.value[0];
			const all_day = value.allDay ? "_all_day" : "";
			html += `<li><span class="element-title element-no default-text bold element-block">${rcmail.gettext('mel_portal.no_event_today')}</span>
			<a href=# class="element-block mel-not-link mel-focus" onclick="${my_day_generate_link(value)}">
			<span class="element-title default-text bold element-block">${rcmail.gettext(`mel_portal.next_agenda_event${all_day}`).replace('{date}', storage_first.key).replace('{horaire}', moment(value.start).format('HH:mm'))}</span>
			<span class="element-desc secondary-text element-block">${value.title}</span>
			</a>
			</li>`;
		}
		else html += `<li>Pas d'évènements aujourd'hui ainsi que dans les 7 prochains jours !</li>`;
	}

    html = `<ul class="ignore-bullet">${html}</ul>`;
	$("#agenda").html(html);

	const count = Enumerable.from(datas).where(x => x.free_busy !== 'free').count();

	if (count > 0)
	{
		$("#agendanew").html(count);
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

	//   setTimeout(() => {
	// 	document.activeElement.blur();
	//   }, 100);
  }

