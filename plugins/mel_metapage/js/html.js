
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
		this.onclick = new MelEvent();
		this.onkeydown = new MelEvent();
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

		for (const iterator of Enumerable.from(this.attribs).concat(additionnal_attribs).where(x => x === 0 || !!(x || null))) {
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

		let generated = this._generateContent($html, this.content);

		if (this.onclick.haveEvents()) generated.on('click', (event) => {
			this.onclick.call(event);
		});

		return generated;
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

		this.onfocusout = new MelEvent();
		this.onfocus = new MelEvent();
		this.onchange = new MelEvent();
		this.oninput = new MelEvent();
	}

	toFloatingLabel(label) {
		let $label = new mel_html('div', {class:'form-floating'}, this.generate({required:'required'})).generate();
		return $label.append(new mel_html('label', {for:this.attribs['id']}, label).generate());
	}

	generate(value, additionnal_attribs = {})
	{
		let generated = super.generate(additionnal_attribs).val(value);

		if (this.onfocus.haveEvents()) {
			generated.on('focus', (event) => {
				this.onfocus.call(event);
			});
		}

		if (this.onfocusout.haveEvents()) {
			generated.on('blur', (event) => {
				this.onfocusout.call(event);
			});
		}

		if (this.oninput.haveEvents()) {
			generated.on('input', (event) => {
				this.oninput.call(event);
			});
		}
		
		if (this.onchange.haveEvents()) {
			generated.on('change', (event) => {
				this.onchange.call(event);
			});
		}

		return generated;
	}
}

class mel_select extends amel_form_item{
	constructor(attribs = {}, options = [])
	{
		super('select', attribs, options);
	}

	_generateContent($html, content) {
		for (const iterator of content) {
			iterator.create($html);
		}

		return $html;
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
	
		if ($input.length === 0) $input = top.$(`#${element.data(INPUT_DATA)}`);

		if ($input.length > 0)
		{
			if ($input.data(IS_SHOWED_DATA) === DATA_VALID) {
				$input.attr(ATTR, ATTR_PASSWORD);
				$input.data(IS_SHOWED_DATA, DATA_INVALID);
			}
			else {
				$input.attr(ATTR, ATTR_TEXT);
				$input.data(IS_SHOWED_DATA, DATA_VALID);
			}
		}

		mel_input.togglePasswordShowed.updateButton(element);
	}

	static floatingSetFocusClass(element, isOut = false) {
		const DIV = 'for';
		const CLASS = 'floating-focus';
		element = $(element);
		let $div = $(`#${element.data(DIV)}`);
		
		if ($div.length === 0) $div = top.$(`#${element.data(DIV)}`);

		if ($div.length > 0) {
			if (isOut) {
				$div.removeClass(CLASS);
			}
			else {
				$div.addClass(CLASS);
			}
		}
	}

	static floatingSetInput(element) {
		const DIV = 'for';
		const CLASS = 'floating-not-empty';
		element = $(element);
		let $div = $(`#${element.data(DIV)}`);

		if ($div.length === 0) $div = top.$(`#${element.data(DIV)}`);

		if ($div.length > 0) {
			if (element.val() !== '') $div.addClass(CLASS);
			else $div.removeClass(CLASS);
		}
	}
}

class mel_password extends mel_input {
	constructor(attribs = {})
	{
		super(attribs);
		this.attribs['type'] = 'password';
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

class mel_password_with_button extends mel_password{
	constructor(id, input_id, attribs = {}, attribsOnParent = {}, attribsOnButton = {}) {
		super(attribs);
		this.id = id;
		this._id = input_id;
		this.main = new mel_html('div', attribsOnParent);
		this.button = new mel_button(attribsOnButton);
		this.button_span = new mel_html('span', {class:'icon-mel-eye'});

		this.onfocus.push(function (event) {
			mel_input.floatingSetFocusClass(event.currentTarget, false);
		});

		this.onfocusout.push(function (event) {
			mel_input.floatingSetFocusClass(event.currentTarget, true);
		});

		this.oninput.push(function (event) {
			mel_input.floatingSetInput(event.currentTarget);
		});
		
		this.button.onclick.push(function (event) {
			mel_input.togglePasswordShowed(event.currentTarget);
		});
	}

	generate(value, label = 'Mot de passe', additionnal_attribs = {})
	{
		const DATA_FOR = 'data-for';
		const CLASS_INPUT_GROUP = 'input-group';
		const CLASS_RETURN = 'form-floating pixel-correction';
		const ATTR_ID = 'id';
		const ATTR_REQUIRED = 'required';
		const BALISE_LABEL = 'label';
		const BALISE_DIV = 'div';

		const button_config = {
			'data-for':this._id, 
			'data-icon-show':mel_password_with_button.password_show_button, 
			'data-icon-hide':mel_password_with_button.password_hide_button,
		};
		const main_config = {class:CLASS_INPUT_GROUP};
		const return_config = {id:this.id, class:CLASS_RETURN};
		const label_config = {for:button_config[DATA_FOR]};

		additionnal_attribs[DATA_FOR] = return_config.id;
		additionnal_attribs[ATTR_ID] = button_config[DATA_FOR];
		additionnal_attribs[ATTR_REQUIRED] = ATTR_REQUIRED;
		additionnal_attribs['class'] = 'input-mel';

		let $input = super.generate(value, additionnal_attribs);
		let $button = new mel_html(BALISE_DIV, {class:'input-group-append'}).generate().append(this.button.generate(button_config).append(this.button_span.generate()));
		let $main = this.main.generate(main_config).append($input).append($button);
		let $label = new mel_html(BALISE_LABEL, label_config, label);

		return new mel_html(BALISE_DIV).generate(return_config).append($main).append($label.generate());
	}
}

mel_password_with_button.password_show_button = 'icon-mel-eye';
mel_password_with_button.password_hide_button = 'icon-mel-eye-crossed';

class mel_button extends mel_html {
	constructor(attribs = {}, content = '')
	{
		super('button', attribs, content);
		this.attribs['class'] = 'mel-button btn btn-secondary no-button-margin'
	}
}

Object.defineProperty(mel_button, 'html_base_class', {
	enumerable: false,
	configurable: false,
	writable: false,
	value:new MelEnum({
		base:'mel-button',
		boostrap:new MelEnum({
			base:'btn',
			state:'btn-secondary'
		}, false)
	}, false)
});

Object.defineProperty(mel_button, 'html_base_class_no_margin', {
	enumerable: false,
	configurable: false,
	writable: false,
	value:'no-button-margin'
});

Object.defineProperty(mel_button, 'html_base_class_success', {
	enumerable: false,
	configurable: false,
	writable: false,
	value:'btn-success'
});

Object.defineProperty(mel_button, 'html_base_class_danger', {
	enumerable: false,
	configurable: false,
	writable: false,
	value:'btn-danger'
});

class mel_tab extends mel_button{
	constructor(namespace, id, attribs={}, text) {
		super(attribs, text);
		this._init()._setup(id);
	}

	_init() {
		this.namespace = EMPTY_STRING;
		this.id = EMPTY_STRING;
		/**
		 * @type {mel_tabpanel}
		 */
		this.control = null;
		return this;
	}

	_setup(namespace, id){
		this.id = id;
		this.namespace = namespace;
		return this;
	}

	generate(attribs={}) {
		attribs['id'] = id;
		attribs['tabindex'] = -1;
		attribs['aria-controls'] = this.control?.attribs?.['id'];
		attribs['role'] = 'tab';
		attribs['type'] = 'button';
		attribs['aria-selected'] = attribs?.['aria-selected'] ?? false;
		attribs['class'] = this.namespace + ' mel-html-tab';
		attribs['data-tabnamespace'] = this.namespace;

		this.onclick.push((e) => {
			e = $(e.currentTarget);
			MelAsync.forof($(`button.mel-html-tab.${e.data('tabnamespace')}`), async (iterator) => {
				$(iterator).removeClass('selected').attr('aria-selected', false);
			}, false).then(() => {
				e.addClass('selected').attr('aria-selected', true);
			});
			
			MelAsync.forof($(`mel-html-tabpanel.mel-html-tab.${e.data('tabnamespace')}`), async (iterator) => {
				$(iterator).css('display', 'none');
			}, false).then(() => {
				$(`mel-html-tabpanel.mel-html-tab.${e.data('tabnamespace')}.${this.id}`);
			});
		});

		this.onkeydown.push((event) => {
			let tabs = $(`button.mel-html-tab.${e.data('tabnamespace')}`);
			const key = event.keyCode;

			let direction = 0;
			switch (key) {
				case this.keys.left:
					direction = -1;
					break;
				case this.keys.right:
					direction = 1;
					break;

				case this.keys.home:
					$(tabs[0]).focus().click();
					break;
				case this.keys.end:
					$(tabs[tabs.length-1]).focus().click();
					break;
			
				default:
					break;
			}

			if (direction !== 0)
			{
				for (let index = 0; index < tabs.length; ++index) {
					const element = $(tabs[index]);
					
					if (element.hasClass("selected") || element.hasClass("active"))
					{
						let id;
						if (index + direction < 0)
							id = tabs.length - 1;
						else if (index + direction >= tabs.length)
							id = 0;
						else
							id = index + direction;

						$(tabs[id]).focus().click();

						break;
					}
				}
			}
		});

		return super.generate(attribs);
	}

	select(selected) {
		attribs['aria-selected'] = selected;
		return this;
	}

	setControl(controler) {
		this.control = controler;
		return this;
	}

}
class mel_tablist extends mel_html {
	constructor(namespace, id, {
		attribs={},
		tabs=[],
		label=EMPTY_STRING
	}) {
		super('div', attribs);
		this._init()._setup(namespace, id, {tabs, label});
	}

	_init() {
		/**
		 * @type {mel_tab[]}
		 */
		this.tabs = [];
		this.id = EMPTY_STRING;
		this.label = EMPTY_STRING;
		this.namespace = EMPTY_STRING;
		return this;
	}

	_setup(namespace, id, {tabs=[], label=EMPTY_STRING})
	{
		this.id = id;
		this.tabs = tabs;
		this.label = label;
		this.namespace = namespace;
		return this;
	}

	generate(attribs={}){
		attribs['role'] = 'tablist';
		let $tablist = super.generate(attribs);

		for (let index = 0, len = this.tabs.length; index < len; ++index) {
			this.tabs[index].generate().appendTo($tablist);
		}

		new mel_html('label', {for:this.id, class:'sr-only'}).generate().appendTo($tablist);

		return $tablist;
	}

	/**
	 * 
	 * @returns {mel_tab}
	 */
	getSelectedTab() {
		return Enumerable.from(this.tabs).where(x => x.attribs['aria-selected'] === true).firstOrDefault();
	}

	/**
	 * 
	 * @param {mel_tab} tab 
	 */
	addTab(tab) {
		this.tabs.push(tab.setControl(this.pannel));
		return this;
	}
}

class mel_tabpanel extends mel_html {
	constructor(namespace, tab, {attribs={}, contents=EMPTY_STRING, jquery_content = null}) {
		super('div', attribs, contents);
		this._init()._setup(tab, {jquery_content});
	}

	_init() {
		this.namespace = EMPTY_STRING;
		/**
		 * @type {mel_tab}
		 */
		this.tab = null;
		/**
		 * @type {mel_html[]}
		 */
		this.pannels = [];
		this.jcontent = null;
		return this;
	}

	_setup(namespace, tab, {jquery_content = null}) {
		this.tab = tab;
		this.jcontent = jquery_content;
		this.namespace = namespace;
		return this;
	}

	generate(attribs={}){
		attribs['aria-labelledby'] = this.tab.id;
		attribs['tabindex'] = 0;
		attribs['class'] = `${this.tab.id} ${this.namespace} mel-html-tabpanel`;
		let $generated = super.generate(attribs);

		if (!!this.jcontent) this.jcontent.appendTo($generated);

		return $generated;
	}
}

class mel_tabs {
	constructor(id, label, {attribs={}, tablist_attribs={}}) {
		super('div', attribs);
		this._init()._setup(id, label, {tablist_attribs});
	}

	_init() {
		/**
		 * @type {mel_tablist}
		 */
		this.tabs = null;
		/**
		 * @type {mel_tabpanel[]}
		 */
		this.contents = null;
		return this;
	}

	_setup(id, label, {tablist_attribs={}}) {
		this.tabs = new mel_tablist(id, {label, attribs:tablist_attribs})
		this.contents = [];
		return this;
	}

	add(id, tabtext, pannel, selectedTab = false) {
		let tab = new mel_tab(id, {}, tabtext);
		let pannel = new mel_tabpanel(tab, {jquery_content:pannel});
		this.tabs.addTab(tab.select(selectedTab).setControl(pannel));																																																					
		this.contents.push(pannel);
		tab = (pannel = null, null);
		return this;
	}

	generate({attribs={}, tablist_attribs={}}) {
		let $generated = super.generate(attribs);
		this.tabs.generate(tablist_attribs).appendTo($generated);

		const selected_tab = this.tabs.getSelectedTab();
		
		for (let index = 0, len = this.contents.length, content; index < len; ++index) {
			const element = this.contents[index];
			content = this.contents.generate();

			if (!!selected_tab && selected_tab.id === element.tab.id) content.css('display', '');
			else content.css('display', 'none');

			content.appendTo($generated);
		}

		return $generated;

	}

}