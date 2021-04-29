
function html_helper(option, html, optional_classes = ""){
    switch (option) {
        case html_helper.options["block"]:   
            return '<div class="square_div '+optional_classes+'"><div class=contents><div class=square-contents>'+html+'</div></div></div>';
        default:
            return html;
    }
}

html_helper.options = {
    "block":Symbol("block")
}

/**
 * Renvoie vrai si le string est vide ou vaut null
 * @param {string} string String à tester
 */
html_helper.is_null_or_empty = function(string)
{
    return string === null || string == "";
}

html_helper.JSON = {
	parse:(string) => {
		if (string === null || string === undefined)
			return string;
		return JSON.parse(string.replaceAll('¤¤¤¤¤¤¤¤', '"'));
	},
	stringify:(item) => {
		if (item === null)
			item = "null";
		else if (item === undefined)
			item = "undefined";
		return JSON.stringify(item).replaceAll('"', "¤¤¤¤¤¤¤¤");
	}
}

/**
 * Récupère le html pour la liste des tâches de l'utilisateur. Récupère les données depuis le stockage local.
 * @param {*} e Element qui contiendra le html
 * @param {*} e_news Element qui contiendra le nombre de tâches (facultatif)
 * @param {JSON} tabs Liste des onglets
 * @param {String} title Titre du block
 */
html_helper.TasksAsync = async function (tabs, e = null,  e_news = null,title = null)
{
    let storage = await mel_metapage.Storage.check(mel_metapage.Storage.tasks).wait();
	if (html_helper.tasks_updates === undefined)
	{
		html_helper.tasks_updates = new Mel_Update(mel_metapage.EventListeners.tasks_updated.after, "tasks.update", async () => {
			$('.html-tasks').each(async (i,e) => {
				e = $(e);
				const tabs = html_helper.JSON.parse(e.data('task-tabs'));
				const title = e.data('task-title');
				e[0].outerHTML = await html_helper.TasksAsync(tabs, null, null, title);
			});
		});
	}
    return html_helper.Tasks(storage, tabs, e, e_news, title);
}

/**
 * Récupère le html pour la liste des tâches de l'utilisateur.
 * @param {*} e Element qui contiendra le html
 * @param {Array} datas Liste des tâches
 * @param {*} e_news Element qui contiendra le nombre de tâches (facultatif)
 * @param {JSON} tabs Liste des noms des onglets
 * @param {String} title Titre du block
 */
html_helper.Tasks = function (datas, tabs, e = null,  e_news = null,title = null)
{
	console.log("title", title);
    let html = ''
	html += '<div class="html-tasks" data-task-tabs="'+html_helper.JSON.stringify(tabs)+'" data-task-title="'+title+'">';
    if (!html_helper.is_null_or_empty(title))
    {
        html += "<div class=task-title>";
        html += "<span>" + title + "</span>";
        html += "</div>";
    }
	// html = '<div id=dwp-tadk-urg class="tab-task-dwp mel-tab mel-tabheader">Tâches urgentes</div>';
	html += '<center><div id=dwp-tadk-all class="tab-task-dwp mel-tab mel-tabheader active last">'+tabs["right"]+'</div></center>';
	
    html += '<div style="margin:10px 0;"><div id="nb-waiting-task" class="nb-task wsp-task-classik tab-task mel-tab-content" style=""><span class="icofont-hour-glass roundbadge large clear"></span><span><span class="waiting-task"></span><span class="nb-waiting-task nb font-size-large">'+datas.length+'</span> tâches en cours</span></div></div>';

    datas = Enumerable.from(datas).orderBy((x) => x.order).thenBy((x) => (x._hasdate === 1 ? x.datetime : Number.MAX_VALUE )).toArray();
	let date;
    for (let index = 0; index < datas.length; index++) {
        const element = datas[index];
		date = moment(parseInt(element.created + "000"));
        html += "<div class=row style=margin-bottom:15px;margin-right:15px;>";
		if (date._isValid)
        	html += "<div class=col-md-10>" + element.title + "<br/>Créer le " + date.format("DD/MM/YYYY") + " à " + date.format("hh:mm") +"</div>";
        else
			html += "<div class=col-md-10></div>";
		html += '<div class=col-md-2><a style=display:none; onclick="add_task_to_completed(`'+element.id+'`)" class="roundbadge large hover tick ' + (element.mel_metapage.order == 0 ? "icofont-warning warning" : "icofont-hour-glass clear") + '"></a></div>'
        html += "</div>";
    }
    html += "</div>";
    if (e !== null)
	    e.html(html);
    if (e_news !== null)
    {
        if (datas.length > 0)
        {
            e_news.html(datas.length);
            e_news.removeClass("hidden");
        }
        else
            e_news.addClass("hidden");
    }
    return html;
}

html_helper.CalendarsAsync = async function(config = {
    add_day_navigation:false,
    add_create:false,
    add_see_all:false
}, e = null, e_number = null, _date = moment())
{
	if (moment().format() === _date.format())
    	var storage = await mel_metapage.Storage.check(mel_metapage.Storage.calendar).wait();
	else
		var storage = await rcube_calendar.block_change_date(null, 0, null, _date);

	if (html_helper.cals_updates === undefined)
	{
		html_helper.cals_updates = new Mel_Update(mel_metapage.EventListeners.calendar_updated.after, "calendars.update", async () => {
			$('.html-calendar').each(async (i,e) => {
				e = $(e);
				const config = html_helper.JSON.parse(e.data('config'));
				const date = moment(e.data('date'));
				if (config.add_day_navigation)
				{
					if ( moment(e.find(".mm-agenda-date").data("current-date")).startOf("day").format() === date.startOf("day").format())
						e[0].outerHTML = await html_helper.CalendarsAsync(config, null, null, date);
				}
				else
					e[0].outerHTML = await html_helper.CalendarsAsync(config, null, null, date);
			});
		});
	}
    return html_helper.Calendars({datas:storage, config:config, e:e, e_number:e_number, _date:_date});
}

html_helper.Calendars = function({datas, config = {
    add_day_navigation:false,
    add_create:false,
    add_see_all:false
}, e = null, e_number = null, _date = moment(), get_only_body = false} = {})
{
	const classes = {
		organizer:"icofont-royal royal",
		tick:"icofont-check lightgreen",
		waiting:"icofont-hour-glass clear",
		declined:"icofont-close danger"
	}
	const set_style = (event) => {
		const now = {
			now:_date,
			start:moment(_date).startOf('day'),
			end:moment(_date).endOf('day')
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
	if (!get_only_body)
		html += '<div class="html-calendar" data-config="'+html_helper.JSON.stringify(config)+'"  data-date="'+_date.format()+'">';
    if (config.add_day_navigation === true)
    {
        let nav_click = "rcube_calendar.change_calendar_date($('.mm-agenda-date'), ¤¤¤)";
        html += '<div class="row">';
        html += '<div class="col-2"><span class="icon-mel-calendar mm-agenda-icon"><span class="notif roundbadge lightgreen edited" '+(typeof datas === "string" || datas.length === 0 ? "style=display:none;" : "")+'>'+datas.length+'</span></span></div>';
        html += '<div class="col-6"><span class="mm-agenda-date">'+rcube_calendar.mel_metapage_misc.GetDate(_date)+'</span></div>';
        html += '<div class="col-4"><div class="row">';
        html += '<div class="col-6"><span class="icofont-arrow-left btn-arrow" onclick="'+nav_click.replace("¤¤¤", "-1")+'"></span></div>';
        html += '<div class="col-6"><span class="icofont-arrow-right btn-arrow" onclick="'+nav_click.replace("¤¤¤", "1")+'"></span></div>';
        html += "</div></div></div>"
    }
	if (!get_only_body)
    	html += "<div class=block-body>";
	let style;
	//let bool;
	//let icon;
	if (typeof datas === "string")
		html += "<div>" + datas + "</div>";
	else {
		for (let index = 0; index < datas.length; index++) {
			const element = datas[index];
			html += "<div class=row style=margin-bottom:15px;margin-right:15px;>";
			if (element.allDay)
				html += "<div class=col-md-8>" + rcmail.gettext("Journée entière") + "<br/><span style=font-size:smaller>" + element.title +"</span></div>";
			else
			{
				const style_date = set_style(element);
				html += "<div class=col-md-8>" + style_date.start + " - " + style_date.end + "<br/><span style=font-size:smaller>" + element.title +"</span></div>";
			}
			// bool = element.attendees !== undefined && 
			// element.attendees.length > 0 && 
			// Enumerable.from(element.attendees).any(x =>  rcmail.env.mel_metapage_user_emails.includes(x.email));
			// if (bool)
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
			if (element.location.includes("http://") || element.location.includes("https://") || (element.vurl !== null && vurl !== ""))
				style = "";
			else
				style = "display:none;";
			html += '<div class=col-4><div class="webconf-myday"><a target="_blank" style="'+style+'" href="'+element.location+'" class="roundbadge link large dark icon-mel-videoconference"></a><span style="'+style+'" class="span-webconf">Webconf</span></div></div>';
			html += "</div>";
		}
	}
	if (!get_only_body)
	{
		html += "</div>";
		html += "</div>";
	}
    if (e !== null)
	    e.html(html);
    if (e_number !== null)
    {
        if (datas.length > 0)
        {
            e_number.html(datas.length);
            e_number.removeClass("hidden");
        }
        else
        e_number.addClass("hidden");
    }
    return html;
}