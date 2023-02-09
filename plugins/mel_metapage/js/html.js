
function html_helper(option, html, optional_classes = "", attribs = null){

	if (!!attribs)
	{
		const tmp = attribs;
		attribs = '';

		for (const key in tmp) {
			if (Object.hasOwnProperty.call(tmp, key)) {
				const element = tmp[key];
				attribs += `${key}="${element}" `;
			}
		}

	}
	else attribs = '';

    switch (option) {
        case html_helper.options["block"]:   
            return  `<div class="square_div ${optional_classes}" ${attribs}><div class=contents><div class=square-contents>${html}</div></div></div>`;
        case html_helper.options.create_button:

			let onclick = "";
			let classes = 'mel-button create mel-before-remover btn btn-secondary';
			let id = "";

			if (typeof optional_classes !== "string" && optional_classes !== null && optional_classes !== undefined)
			{
				if (optional_classes.onclick !== undefined)
					onclick = `onclick="${optional_classes.onclick}"`;

				if (optional_classes.new_classes !== undefined)
					classes = `${optional_classes.new_classes}`
				
				if (optional_classes.additional_classes !== undefined)
					classes += `${optional_classes.additional_classes}`

				if (optional_classes.id !== undefined)
					id = `id="${optional_classes.id}"`;
			}

			if (classes !== "")
				classes = `class="${classes}"`;

			return `<button ${id} ${classes} ${onclick} ${attribs} >${html}</button>`;
		default:
            return html;
    }
}

html_helper.options = {
    "block":Symbol("block"),
	"create_button":Symbol("create_button")
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
    let html = ''
	html += '<div class="html-tasks" data-task-tabs="'+html_helper.JSON.stringify(tabs)+'" data-task-title="'+title+'">';
    if (!html_helper.is_null_or_empty(title))
    {
        html += "<div class=task-title>";
        html += "<span>" + title + "</span>";
        html += "</div>";
    }
	// html = '<div id=dwp-tadk-urg class="tab-task-dwp mel-tab mel-tabheader">Tâches urgentes</div>';
	//html += '<center><div id=dwp-tadk-all class="tab-task-dwp mel-tab mel-tabheader active last">'+tabs["right"]+'</div></center>';
	
    html += '<div style="margin:10px 0;"><div id="nb-waiting-task" class="nb-task wsp-task-classik tab-task mel-tab-content" style=""><span class="icon-mel-time roundbadge large clear"></span><span><span class="waiting-task"></span><span class="nb-waiting-task nb font-size-large">'+datas.length+'</span> tâches en cours</span></div></div>';

    datas = Enumerable.from(datas).orderBy((x) => x.order).thenBy((x) => (x._hasdate === 1 ? x.datetime : Number.MAX_VALUE )).toArray();
	let date;

    html += `<ul class="ignore-bullet">`;

    for (let index = 0; index < datas.length; index++) {
        const element = datas[index];
		date = moment(parseInt(element.created + "000"));
		html += "<li>";
        html += "<div class=row style=margin-bottom:15px;margin-right:15px;>";

		if (date._isValid)
			html += `<div class=col-md-10><a href=# class="element-block mel-not-link mel-focus" onclick="open_task('${element.id}')"><span class="element-title default-text bold element-block">${element.title}</span><span class="element-desc secondary-text element-block">Créée le ${date.format("DD/MM/YYYY")} à ${date.format("hh:mm")}</span></a></div>`;//html += "<div class=col-md-12><span class=element-title>" + element.title + "</span><br/><span class=element-desc>Créée le " + date.format("DD/MM/YYYY") + " à " + date.format("hh:mm") +"</span></div>";
        else
			html += "<div class=col-md-12></div>";

		//html += '<div class=col-md-2><a style=display:none; onclick="add_task_to_completed(`'+element.id+'`)" class="roundbadge large hover tick ' + (element.mel_metapage.order == 0 ? "icon-mel-warning warning" : "icon-mel-time clear") + '"></a></div>'
        html += "</div>";
		html += "</li>";
    }
	html += "</ul>";
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
	create_function:null,
    add_see_all:false, 
	next_when_empty_today_function:null,
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
				let config = html_helper.JSON.parse(e.data('config'));
				const date = moment(e.data('date'));

				if (config.add_create)
					delete config.add_create;

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
	create_function:null,
    add_see_all:false,
	next_when_empty_today_function:null
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
		const count = Enumerable.from(datas).where(x => x.free_busy !== "free").count();
        let nav_click = "rcube_calendar.change_calendar_date($('.mm-agenda-date'), ¤¤¤)";
        html += '<div class="row">';
        html += '<div class="col-2"><span class="icon-mel-calendar mm-agenda-icon"><span class="notif roundbadge lightgreen edited" '+(typeof datas === "string" || count === 0 ? "style=display:none;" : "")+'>'+count+'</span></span></div>';
        html += '<div class="col-6"><span class="mm-agenda-date">'+rcube_calendar.mel_metapage_misc.GetDate(_date)+'</span></div>';
        html += '<div class="col-4"><div class="row">';
        html += '<div class="col-6"><button class="btn-mel-invisible btn-arrow btn btn-secondary" onclick="'+nav_click.replace("¤¤¤", "-1")+'"> <span class="icon-mel-arrow-left"><span class="sr-only">'+rcmail.gettext("last_day", "mel_metapage")+'</span></span> </button></div>';
        html += '<div class="col-6"><button class="btn-mel-invisible btn-arrow btn btn-secondary" onclick="'+nav_click.replace("¤¤¤", "1")+'"> <span class="icon-mel-arrow-right"><span class="sr-only">'+rcmail.gettext("next_day", "mel_metapage")+'</span></span> </button></div>';
        html += "</div></div></div>"
    }
	if (!get_only_body)
    	html += '<ul class="block-body ignore-bullet">';
	let style;
	let link;
	let text;
	let title;
	let bool;
	//let icon;
	if (typeof datas === "string")
		html += "<div>" + datas + "</div>";
	else {

		if (datas.length > 0)
		{
			for (let index = 0; index < datas.length; index++) {
				const element = datas[index];

			if (element.status === "CANCELLED")
				continue;

			title = mel_metapage.Functions.updateRichText(element.title);

			if (element.free_busy === "free")
				title += ' (libre)';
			else if (element.free_busy === "telework")
				title += ' (télétravail)';

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
				html += "<div class=row style=margin-bottom:15px;margin-right:15px;>";

				if (element.allDay)
					text = rcmail.gettext("Journée entière");
				else
				{
					const style_date = set_style(element);
					text = `${style_date.start} - ${style_date.end}`;
				}



				html += `<div class=col-8><a href=# class="element-block mel-not-link mel-focus" onclick="${html_helper.Calendars.generate_link(element)}"><span class="element-title default-text bold element-block">${text}</span><span class="element-desc secondary-text element-block">${title}</span></a></div>`;

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
		
				html += '<div class=col-4><div class="webconf-myday"><a '+link+' style="'+style+'" class="roundbadge link large dark icon-mel-videoconference"><span class="sr-only">Webconf</span></a><span style="'+style+'" class="span-webconf">Webconf</span></div></div>';

				html += "</div>";
				html += "</li>";
			}
		}
		else 
		{
			const raw_storage = mel_metapage.Storage.get(mel_metapage.Storage.calendar_by_days);
			const storage = Enumerable.from(config.next_when_empty_today_function !== null && typeof config.next_when_empty_today_function === "function" ? config.next_when_empty_today_function(raw_storage) : raw_storage);
			const storage_count = storage.count();
			if (storage_count > 0)
			{
				const storage_first = storage.first();
				const value = storage_first.value[0];
				const all_day = value.allDay ? "_all_day" : "";
				html += `<li><span class="element-title element-no default-text bold element-block">${rcmail.gettext('mel_portal.no_event_today')}</span>
				<a href=# class="element-block mel-not-link mel-focus" onclick="${html_helper.Calendars.generate_link(value)}">
				<span class="element-title default-text bold element-block">${rcmail.gettext(`mel_portal.next_agenda_event${all_day}`).replace('{date}', storage_first.key).replace('{horaire}', moment(value.start).format('HH:mm'))}</span>
				<span class="element-desc secondary-text element-block">${value.title}</span>
				</a>
				</li>`;
			}
			else html += `<li>Pas d'évènements aujourd'hui ainsi que dans les 7 prochains jours !</li>`;
		}
	}

	if (!get_only_body)
	{
		html += "</ul>";
		html += "</div>";
	}
	else
		html = `<ul class="ignore-bullet">${html}</ul>`;

	if (config.add_create === true)
	{
		const data_text = 'Créer <span class="icon-mel-plus plus"></span>';
		if (!html.includes(data_text))
		html += html_helper(html_helper.options.create_button, data_text, {
			onclick:config.create_function === undefined || config.create_function === null ? "html_helper.Calendars.create()" : config.create_function
		});
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

html_helper.Calendars.create = function(config = {
	date:moment(),
	selector:null
})
{

	let date;

	if (config.selector !== undefined && config.selector !== null)
		date = $(config.selector).data("current-date");
	else if (config.date !== undefined && config.date !== null)
		date = config.date;
	else
		date = moment();

	const e = {
		target:null
	};

	let event = {
        start:moment(`${moment(date).format("YYYY-MM-DD")} ${moment().format("HH:mm")}`),
        end:null//moment().add(1, "h")
    };

	event.end = moment(event.start).add(1, "h");
    rcmail.local_storage_set_item("tmp_calendar_event", event);
	//console.log("[html_helper.Calendars.create]", event, date, config);

    return rcmail.commands['add-event-from-shortcut'] ? rcmail.command('add-event-from-shortcut', '', e.target, e) : rcmail.command('addevent', '', e.target, e);
}

html_helper.Calendars.generate_link = function(event)
{
	let link = "";

	if (SearchResultCalendar && SearchResultCalendar.CreateOrOpen)
		link = `SearchResultCalendar.CreateOrOpen('${JSON.stringify(event).replaceAll('"', '£¤£').replaceAll("'", "µ¤¤µ")}')`;

	return link;
}

class mel_html{
	constructor(tag, attribs = {}, content = '')
	{
		this.tag = tag.toLowerCase();
		this.attribs = attribs;
		this.content = content;
	}

	generate(additionnal_attribs = {})
	{
		let multi_balise = true;

		switch (this.tag) {
			case 'img':
			case 'input':
			case 'br':
				multi_balise = false;
				break;
		
			default:
				break;
		}

		if (multi_balise && !!this.attribs['NO_MULTI_BALISE']) multi_balise = false;

		let $html = $(`<${this.tag} ${(!multi_balise ? '/' : '')}>${(multi_balise ? `</${this.tag}>` : '')}`);

		for (const iterator of Enumerable.from(this.attribs).concat(additionnal_attribs)) {
			switch (iterator.key) {
				case 'class':
					$html.addClass(iterator.value);
					break;
				case 'on':
					for (const key in iterator.value) {
						if (Object.hasOwnProperty.call(iterator.value, key)) {
							const element = iterator.value[key];
							$html.on(key, element);
						}
					}
					break;
				default:
					$html.attr(iterator.key, iterator.value);
					break;
			}
		}

		return this._generateContent($html, this.content);
	}

	create($parent, additionnal_attribs = [])
	{
		return this.generate(additionnal_attribs).appendTo($parent);
	}

	_generateContent($html, content) {
		return $html.html(content);
	}
}

class mel_option extends mel_html{
	constructor(value, text, attribs = [])
	{
		super('select', attribs, text);
		this.attribs['value'] = value;
	}
}

class amel_form_item extends mel_html {
	constructor(tag, attribs = {}, content = '')
	{
		super(tag, attribs, content);

		if (!this.attribs['class']) {
			this.attribs['class'] = 'form-control input-mel';
		}
		else if (!this.attribs['class'].includes('form-control'))
		{
			this.attribs['class'] += ' form-control';
		}
		
		if (!this.attribs['class'].includes('input-mel')) this.attribs['class'] += ' input-mel';
	}

	toFloatingLabel(label) {
		let $label = new mel_html('div', {class:'form-floating'}, this.generate({required:'required'})).generate();
		return $label.append(new mel_html('label', {for:this.attribs['id']}, label).generate());
	}
}

class mel_select extends amel_form_item{
	constructor(attribs = {}, options = [])
	{
		super('select', attribs, options);
	}

	_generateContent($html, content) {
		//$html = super._generateContent(content);
		for (const iterator of content) {
			iterator.create($html);
		}

		return $html;
	}

	generate(value, additionnal_attribs = {})
	{
		return super.generate(additionnal_attribs).val(value);
	}
}

class mel_input extends amel_form_item
{
	constructor(attribs = {})
	{
		super('input', attribs, '');
	}

	static togglePasswordShowed(element) {
		const INPUT_DATA = 'for';
		const IS_SHOWED_DATA = 'isShowed';
		const DATA_VALID = 'yes';
		const DATA_INVALID = 'no';
		const ATTR = 'type';
		const ATTR_PASSWORD = 'password';
		const ATTR_TEXT = 'text';
		element = $(element);
		let $input = $(`#${element.data(INPUT_DATA)}`);
	
		if ($input.data(IS_SHOWED_DATA) === DATA_VALID) {
			$input.attr(ATTR, ATTR_PASSWORD);
			$input.data(IS_SHOWED_DATA, DATA_INVALID);
		}
		else {
			$input.attr(ATTR, ATTR_TEXT);
			$input.data(IS_SHOWED_DATA, DATA_VALID);
		}

		mel_input.togglePasswordShowed.updateButton(element);
	}

	static floatingSetFocusClass(element, isOut = false) {
		const DIV = 'for';
		const CLASS = 'floating-focus';
		element = $(element);
		let $div = $(`#${element.data(DIV)}`);
		
		if (isOut) {
			$div.removeClass(CLASS);
		}
		else {
			$div.addClass(CLASS);
		}
	}

	static floatingSetInput(element) {
		const DIV = 'for';
		const CLASS = 'floating-not-empty';
		element = $(element);
		let $div = $(`#${element.data(DIV)}`);

		if (element.val() !== '') $div.addClass(CLASS);
		else $div.removeClass(CLASS);
	}
}

mel_input.togglePasswordShowed.updateButton = function ($event) {
	const DATA_SHOW = 'icon-show';
	const DATA_HIDE = 'icon-hide';
	const BALISE = 'span';
	
	const icon_show = $event.data(DATA_SHOW);
	
	if (!!icon_show) {
		const icon_hide = $event.data(DATA_HIDE);

		if (!!icon_hide) {
			let $span = $event.find(BALISE);
	
			if ($span.hasClass(icon_show)) {
				$span.removeClass(icon_show).addClass(icon_hide);
			} else {
				$span.removeClass(icon_hide).addClass(icon_show);
			}
		}
	}


}
