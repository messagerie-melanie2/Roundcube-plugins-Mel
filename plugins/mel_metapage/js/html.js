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
	const Loader = (await loadJsModule('mel_metapage', 'calendar_loader', '/js/lib/calendar/')).CalendarLoader.Instance;
	let storage = Loader.get_next_events_day(_date, {}); 

	const KEY = 'HTML_CALENDAR_TOP_FUNCTION';
	const Top = (await loadJsModule('mel_metapage', 'top')).Top;

	if (!Top.has(KEY)) {
		Top.add(KEY, true);

		Loader.add_event_listener(mel_metapage.EventListeners.calendar_updated.after, function() {

			Loader.select('iframe.mm-frame').each((index, element) => {
				if (!$(element).hasClass('discussion-frame')) {
					element.contentWindow.$('.html-calendar').each(async (i, calendar) => {
						calendar = $(calendar);

						let config = html_helper.JSON.parse(calendar.data('config'));
						const date = moment(calendar.data('date'));

						if (config.add_create) delete config.add_create;

						if (!(config.add_day_navigation && moment(calendar.find(".mm-agenda-date").data("current-date")).startOf("day").format() !== date.startOf("day").format())) {
							e[0].outerHTML = await html_helper.CalendarsAsync(config, null, null, date);
						}
					});
				}
			});

		}, { callback_key:KEY});
	}

	if (moment().startOf('day').format() === moment(_date).startOf('day').format()) storage.where(x => moment(x.end) > moment());

    return await html_helper.Calendars({datas:storage.toArray(), config:config, e:e, e_number:e_number, _date:_date});
}

html_helper.Calendars = async function ({datas, config = {
    add_day_navigation:false,
    add_create:false,
	create_function:null,
    add_see_all:false,
	next_when_empty_today_function:null
}, e = null, e_number = null, _date = moment(), get_only_body = false} = {})
{
	const Loader = (await loadJsModule('mel_metapage', 'calendar_loader', '/js/lib/calendar/')).CalendarLoader.Instance;
	const html_events = (await loadJsModule('mel_metapage', 'html_events', '/js/lib/html/')).html_events;
	const html_li = (await loadJsModule('mel_metapage', 'html', '/js/lib/html/')).html_li;

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

	//let icon;
	if (typeof datas === "string")
		html += "<div>" + datas + "</div>";
	else {

		if (datas.length > 0)
		{
			var $jquery_array = $('');
			let li;
			for (let index = 0; index < datas.length; index++) {
				const element = datas[index];

				li = new html_li({});
				new html_events(element, {'data-ignore-date':true}, _date).appendTo(li);
				li = li.generate();
				$jquery_array = $.merge($jquery_array, li);
				html += html_events.$_toString(li);
			}
			html_helper.Calendars.$jquery_array = $jquery_array;
			li = null;
		}
		else 
		{
			const now = moment();
			const raw_storage = Loader.load_all_events();
			const storage = Enumerable.from(config.next_when_empty_today_function !== null && typeof config.next_when_empty_today_function === "function" ? config.next_when_empty_today_function(raw_storage) : raw_storage).where(x => moment(x.start) > now);
			const storage_count = storage.count();
			if (storage_count > 0)
			{
				const storage_first = storage.first();
				const value = !!storage_first.value && !!storage_first.value[0] ? storage_first.value[0] : storage_first;
				const all_day = value.allDay ? "_all_day" : "";
				html += `<li><span class="element-title element-no default-text bold element-block">${rcmail.gettext('mel_portal.no_event_today')}</span>
				<a href=# class="element-block mel-not-link mel-focus" onclick="${html_helper.Calendars.generate_link(value)}">
				<span class="element-title default-text bold element-block">${rcmail.gettext(`mel_portal.next_agenda_event${all_day}`).replace('{date}', moment(value.start).format('DD/MM/YYYY')).replace('{horaire}', moment(value.start).format('HH:mm'))}</span>
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

    if (e !== null) e.html(html);
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

	if (!!e && !!$jquery_array) {
		e.find('ul').html($jquery_array);
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

/**
 * Classe qui permet de générer du html
 */
class mel_html{
	/**
	 * Constructeur de la classe
	 * @param {string} tag Balise (exemple : div, li, ul etc...)
	 * @param {Object} attribs Attributs de la balise 
	 * @param {string} content Contenu de la balise
	 */
	constructor(tag, attribs = {}, content = '')
	{
		this.tag = tag.toLowerCase();
		this.attribs = attribs;
		this.content = content;
		this.onclick = new MelEvent();
		this.onkeydown = new MelEvent();
		this.onmouseover = new MelEvent();
		this.onmouseout = new MelEvent();
		this.aftergenerate = new MelEvent();
	}

	/**
	 * Actions à faire avant de générer l'élément jquery
	 * @abstract
	 * @private Cette fonction est privée
	 */
	_before_generate() {}

	/**
	 * Récupère le jquery de ces données html
	 * @param {Object} additionnal_attribs Attributs additionnels
	 * @returns {$}
	 */
	generate(additionnal_attribs = {})
	{
		this._before_generate();

		let multi_balise = true;

		switch (this.tag) {
			case CONST_HTML_IMG:
			case CONST_HTML_INPUT:
			case CONST_HTML_BR:
				multi_balise = false;
				break;
		
			default:
				break;
		}

		if (multi_balise && !!this.attribs[mel_html.ATTRIB_NO_MULTI_BALISE]) multi_balise = false;

		let $html = $(`${CONST_BALISE_START}${this.tag} ${(!multi_balise ? CONST_BALISE_CLOSE_END : CONST_BALISE_END)}${(multi_balise ? `${CONST_BALISE_CLOSE_START}${this.tag}${CONST_BALISE_END}` : EMPTY_STRING)}`);

		for (const iterator of Enumerable.from(this.attribs).concat(additionnal_attribs).where(x => 0 === x || !!(x || null))) {
			switch (iterator.key) {
				case CONST_ATTRIB_CLASS:
					$html.addClass(Array.isArray(iterator.value) ? iterator.value.join(' ') : iterator.value);
					break;
				case mel_html.EVENT_ON:
					for (const key in iterator.value) {
						if (Object.hasOwnProperty.call(iterator.value, key)) {
							const element = iterator.value[key];
							$html.on(key, element);
						}
					}
					break;
				case 'style':
					iterator.value = this._getStyle();
				default:
					$html.attr(iterator.key, iterator.value);
					break;
			}
		}

		let generated = this._generateContent($html, this.content);
		generated = this.bind_events(generated);

		if (this.aftergenerate.count() > 0) {
			this.aftergenerate.call(generated);
		}

		return generated;
	}

	/**
	 * Ajoute les évènements de l'objet à un élement jquery
	 * @param {$} $element 
	 * @returns {$} Elément avec les actions
	 */
	bind_events($element) {
		if (this.onclick.haveEvents()) $element.on(CONST_EVENT_ACTION_CLICK, (event) => {
			this.onclick.call(event);
		});

		if (this.onkeydown.haveEvents()) $element.on('keydown', (event) => {
			this.onkeydown.call(event);
		});

		if (this.onmouseover.haveEvents()) $element.on('mouseover', (event) => {
			this.onmouseover.call(event);
		});

		if (this.onmouseout.haveEvents()) $element.on('mouseout', (event) => {
			this.onmouseout.call(event);
		});

		return $element;
	}

	/**
	 * Ajoute une classe à la liste des classes de cet élément html
	 * @param {string} classes Classe à ajouter
	 * @returns Chaînage
	 */
	addClass(classes) {
		if (!this.attribs) this.attribs = {};
		if (!(this.attribs[CONST_ATTRIB_CLASS] || null)) this.attribs[CONST_ATTRIB_CLASS] = [];
		else if (STRING === typeof this.attribs[CONST_ATTRIB_CLASS]) this.attribs[CONST_ATTRIB_CLASS] = [this.attribs[CONST_ATTRIB_CLASS]];

		this.attribs[CONST_ATTRIB_CLASS].push(classes);
		return this;
	}

	/**
	 * Vérifie si l'élément possède une classe en particulier
	 * @param {string} html_class Classe à vérifier
	 * @returns {boolean}
	 */
	hasClass(html_class){
		if (!!this.attribs && !!this.attribs[CONST_ATTRIB_CLASS]) {
			if (STRING === typeof this.attribs[CONST_ATTRIB_CLASS]) return html_class === this.attribs[CONST_ATTRIB_CLASS];
			else return this.attribs[CONST_ATTRIB_CLASS].includes(html_class);
		}

		return false;
	}

	/**
	 * Ajoute du css initial à l'élément
	 * @param {string} key Propriété css (ex: display)
	 * @param {string} value Valeur css (ex : none)
	 * @returns Chaînage
	 */
	css(key, value) {
		if (!this.attribs) this.attribs = {};
		if (!(this.attribs['style'] || null)) this.attribs['style'] = {};
		else if (STRING === typeof this.attribs['style']) {
			const splited = this.attribs['style'].split(CONST_CSS_SEPARATOR);
			this.attribs['style'] = {};
			for (let index = 0, len = splited.length; index < len; ++index) {
				const element = splited[index].split(CONST_CSS_ASSIGN);
				this.attribs['style'][element[0]] = element[1];
			}
		}

		this.attribs['style'][key] = value;
		return this;
	}

	/**
	 * Ajoute un attribut à l'élément
	 * @param {string} key Nom de l'attribut 
	 * @param {string | number | Boolean} value Valeur de l'attribut 
	 * @returns Chaînage
	 */
	setAttr(key, value) {
		if (!this.attribs) this.attribs = {};

		this.attribs[key] = value;
		return this;
	}

	/**
	 * Met un id à l'élément
	 * @param {string} id 
	 * @returns Chaînage
	 */
	setId(id) {
		return this.setAttr('id', id);
	}

	toString() {
		return this.generate()[0].outerHTML;
	}

	_getStyle() {
		if (!this.attribs['style'] || STRING === typeof this.attribs['style']) return this.attribs['style'] || EMPTY_STRING;
		else {
			let array = [];
			for (let keys = Object.keys(this.attribs['style']), index = 0, len = keys.length; index < len; ++index) {
				const key = keys[index];
				const value = this.attribs['style'][key];
				array.push([key, value].join(CONST_CSS_ASSIGN));
			}

			array = array.join(CONST_CSS_SEPARATOR);

			return (EMPTY_STRING === array ? EMPTY_STRING : (array + CONST_CSS_SEPARATOR));
		}
	}

	/**
	 * Génère un élément jquery à partir des données de cet élément.
	 * 
	 * L'ajoute ensuite à un élément parent.
	 * @param {$} $parent Elément parent qui contiendra l'objet
	 * @param {Object} additionnal_attribs Attributs additionnels
	 * @returns {$}
	 */
	create($parent, additionnal_attribs = [])
	{
		return this.generate(additionnal_attribs).appendTo($parent);
	}

	/**
	 * Ajoute le html à l'élément jquery générer
	 * @param {$} $html Elément jquery 
	 * @param {string} content html générer
	 * @returns {$}
	 * @private
	 */
	_generateContent($html, content) {
		return $html.html(content);
	}

	/**
	 * Récupère un mel_html div
	 * @param {Object} attribs Attributs de l'élément
	 * @param {string} content Contenue de l'élément
	 * @returns {mel_html}
	 */
	static div(attribs = {}, content = '') {
		return new mel_html(CONST_HTML_DIV, attribs, content);
	}
}

Object.defineProperty(mel_html, 'EVENT_ON', {
	enumerable: false,
	configurable: false,
	writable: false,
	value:CONST_EVENT_ON
});

Object.defineProperty(mel_html, 'ATTRIB_NO_MULTI_BALISE', {
	enumerable: false,
	configurable: false,
	writable: false,
	value:CONST_ATTRIB_NO_MULTI_BALISE
});

Object.defineProperty(mel_html, 'select_html', {
	enumerable: false,
	configurable: false,
	writable: false,
	value:() => $(CONST_HTML_HTML)
});

/**
 * Classe qui permet de générer du html.
 * 
 * Accepte plusieurs mel_html enfants pour génrer son html
 */
class mel_html2 extends mel_html {
	/**
	 * Constructeur de la classe
	 * @param {string} tag Balise de l'élément
     * @param {Object} options - Les options du constructeur.
     * @param {Object} options.attribs - Attributs de l'élément
     * @param {[] | mel_html | string} options.contents - Eléments enfants
	 */
	constructor(tag, {attribs={}, contents=[]}) {
		super(tag, attribs, EMPTY_STRING);
		this._init()._setup(contents);
	}

	_init() {
		this.jcontents = [];
		return this;
	}

	_setup(contents = []) {
		if (!Array.isArray(contents)) {
			if ('string' === typeof contents) contents = [new mel_html('span', {}, contents)];
			else contents = [contents];
		}

		this.jcontents = contents;
		return this;
	}

	/**
	 * Ajoute un élément enfant
	 * @param {mel_html} mel_html Elément à ajouter
	 * @returns Chaînage
	 */
	addContent(mel_html) {
		this.jcontents.push(mel_html);
		mel_html.parent = this;
		return this;
	}

	_generateContent($html) {
		for (let index = 0, len = this.jcontents.length; index < len; ++index) {
			const element = this.jcontents[index];
			element.create($html);
		}

		return $html;
	} 

	/**
	 * Ajoute cet élément à un html parent
	 * @param {mel_html2} mel_html2 
	 * @returns Chaînage
	 */
	appendTo(mel_html2) {
		mel_html2.addContent(this);
		return this;
	}

	/**
	 * Taille des éléments enfants
	 * @returns {number}
	 */
	count() {
		return this.jcontents.length;
	}

	/**
	 * Récupère un élément enfant par son id 
	 * @param {string} id Id de l'élément à retrouver
	 * @returns {mel_html | null}
	 */
	find_by_id(id) {
		return Enumerable.from(this.jcontents).where(x => x.attribs['id'] === id).firstOrDefault();
	}

	/**
	 * Récupère des éléments enfant par une classe 
	 * @param {string} html_class Classe que l'on recherche
	 * @returns {Enumerable<mel_html>}
	 */
	find_by_class(html_class) {
		return Enumerable.from(this.jcontents).where(x => x.hasClass(html_class));
	}

	/**
	 * Récupère le premier élément enfant
	 * @returns {mel_html}
	 */
	first() {
		return this.jcontents[0];
	}

	/**
	 * Récupère le premier élément enfant ou une valeur par défaut
	 * @param {* | null} _default Renvoyer si first n'éxiste pas
	 * @returns {mel_html | * | null}
	 */
	firstOrDefault(_default = null) {
		try {
			return this.first();
		} catch (error) {
			return _default;
		}
	}

	/**
	 * Créer un mel_html2 qui représente une div
     * @param {Object} options - Les options du constructeur.
     * @param {Object} options.attribs - Attributs de l'élément
     * @param {[] | mel_html | string} options.contents - Eléments enfants
	 * @returns {mel_html2}
	 */
	static div({attribs={}, contents=[]}) {
		return new mel_html2('div', {attribs, contents});
	}
}

class mel_option extends mel_html{
	constructor(value, text, attribs = [])
	{
		super(CONST_HTML_SELECT, attribs, text);
		this.attribs[CONST_ATTRIB_VALUE] = value;
	}
}

class amel_form_item extends mel_html {
	constructor(tag, attribs = {}, content = EMPTY_STRING, ignore_default_action = false)
	{
		super(tag, attribs, content);

		if (!ignore_default_action) {
			if (!this.attribs[CONST_ATTRIB_CLASS]) this.attribs[CONST_ATTRIB_CLASS] = EMPTY_STRING;

			if (!this.attribs[CONST_ATTRIB_VALUE]) {
				this.attribs[CONST_ATTRIB_VALUE] = `${amel_form_item.CLASS_FORM_BASE} ${amel_form_item.CLASS_FORM_MEL}`;
			}
			
			if (!this.attribs[CONST_ATTRIB_CLASS].includes(amel_form_item.CLASS_FORM_BASE))
			{
				this.attribs[CONST_ATTRIB_CLASS] += ` ${amel_form_item.CLASS_FORM_BASE}`;
			}
			
			if (!this.attribs[CONST_ATTRIB_CLASS].includes(amel_form_item.CLASS_FORM_MEL)) this.attribs[CONST_ATTRIB_CLASS] += ` ${amel_form_item.CLASS_FORM_MEL}`;
		}

		this.onfocusout = new MelEvent();
		this.onfocus = new MelEvent();
		this.onchange = new MelEvent();
		this.oninput = new MelEvent();
	}

	toFloatingLabel(label) {
		let $label = new mel_html(CONST_HTML_DIV, {class:amel_form_item.CLASS_FORM_FLOATING}, this.generate({required:CONST_ATTRIB_REQUIRED})).generate();
		return $label.append(new mel_html(CONST_HTML_LABEL, {for:this.attribs[CONST_ATTRIB_ID]}, label).generate());
	}

	generate(value, additionnal_attribs = {})
	{
		let generated = super.generate(additionnal_attribs).val(value);

		if (this.onfocus.haveEvents()) {
			generated.on(CONST_EVENT_ACTION_FOCUS, (event) => {
				this.onfocus.call(event);
			});
		}

		if (this.onfocusout.haveEvents()) {
			generated.on(CONST_EVENT_ACTION_BLUR, (event) => {
				this.onfocusout.call(event);
			});
		}

		if (this.oninput.haveEvents()) {
			generated.on(CONST_EVENT_ACTION_INPUT, (event) => {
				this.oninput.call(event);
			});
		}
		
		if (this.onchange.haveEvents()) {
			generated.on(CONST_EVENT_ACTION_CHANGE, (event) => {
				this.onchange.call(event);
			});
		}

		return generated;
	}
}

Object.defineProperty(amel_form_item, 'CLASS_FORM_BASE', {
	enumerable: false,
	configurable: false,
	writable: false,
	value:CONST_CLASS_INPUT_FORM_BASE
});

Object.defineProperty(amel_form_item, 'CLASS_FORM_MEL', {
	enumerable: false,
	configurable: false,
	writable: false,
	value:CONST_CLASS_INPUT_FORM_MEL
});

Object.defineProperty(amel_form_item, 'CLASS_FORM_FLOATING', {
	enumerable: false,
	configurable: false,
	writable: false,
	value:CONST_CLASS_INPUT_FORM_FLOATING
});

Object.defineProperty(amel_form_item, 'CLASS_FORM_FLOATING_FOCUS', {
	enumerable: false,
	configurable: false,
	writable: false,
	value:CONST_CLASS_INPUT_FORM_FLOATING_FOCUS
});

Object.defineProperty(amel_form_item, 'CLASS_INPUT_FORM_FLOATING_NOT_EMPTY', {
	enumerable: false,
	configurable: false,
	writable: false,
	value:CONST_CLASS_INPUT_FORM_FLOATING_NOT_EMPTY
});

class mel_field extends amel_form_item {
	constructor(tag, attribs = {})
	{
		super(tag, attribs, '', true);
	}
}


class mel_select extends amel_form_item{
	constructor(attribs = {}, options = [])
	{
		super(CONST_HTML_SELECT, attribs, options);
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
		super(CONST_HTML_INPUT, attribs, EMPTY_STRING);
	}

	static togglePasswordShowed(element) {
		const INPUT_DATA = CONST_ATTRIB_FOR;
		const IS_SHOWED_DATA = 'isShowed';
		const DATA_VALID = 'yes';
		const DATA_INVALID = 'no';
		const ATTR = CONST_ATTRIB_TYPE;
		const ATTR_PASSWORD = CONST_ATTRIB_TYPE_PASSWORD;
		const ATTR_TEXT = CONST_ATTRIB_TYPE_TEXT;
		element = $(element);
		let $input = $(`${CONST_JQUERY_SELECTOR_ID}${element.data(INPUT_DATA)}`);
	
		if (0 === $input.length) $input = top.$(`${CONST_JQUERY_SELECTOR_ID}${element.data(INPUT_DATA)}`);

		if (0 < $input.length)
		{
			if (DATA_VALID === $input.data(IS_SHOWED_DATA)) {
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
		const DIV = CONST_ATTRIB_FOR;
		const CLASS = amel_form_item.CLASS_FORM_FLOATING_FOCUS;
		element = $(element);
		let $div = $(`${CONST_JQUERY_SELECTOR_ID}${element.data(DIV)}`);
		
		if (0 === $div.length) $div = top.$(`${CONST_JQUERY_SELECTOR_ID}${element.data(DIV)}`);

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
		const DIV = CONST_ATTRIB_FOR;
		const CLASS = amel_form_item.CLASS_INPUT_FORM_FLOATING_NOT_EMPTY;
		element = $(element);
		let $div = $(`${CONST_JQUERY_SELECTOR_ID}${element.data(DIV)}`);

		if ($div.length === 0) $div = top.$(`${CONST_JQUERY_SELECTOR_ID}${element.data(DIV)}`);

		if ($div.length > 0) {
			if (EMPTY_STRING !== element.val()) $div.addClass(CLASS);
			else $div.removeClass(CLASS);
		}
	}
}

class mel_label_input extends mel_input {
	constructor(id, type, label, attribs = {}) {
		super(attribs);

		this.id = id;
		this.type = type;
		this.label = label;
	}

	_before_generate() {
		this.setId(this.id);
		this.attribs.type = this.type;
	}

	generate(value, attribs = {}, parent_attribs = {}) {
		let $generated = super.generate(value, attribs);

		const html_label = new mel_html('label', {for:this.id}, this.label);
		let $parent_div = new mel_html2('div', {
			attribs:parent_attribs,
			contents:html_label
		}).generate();

		$parent_div.append($generated);
		$generated = null;

		return $parent_div;
	}
}

class mel_password extends mel_input {
	constructor(attribs = {})
	{
		super(attribs);
		this.attribs[CONST_ATTRIB_TYPE] = CONST_ATTRIB_TYPE_PASSWORD;
	}
}

mel_input.togglePasswordShowed.updateButton = function ($event) {
	const DATA_SHOW = 'icon-show';
	const DATA_HIDE = 'icon-hide';
	const BALISE = CONST_HTML_SPAN;
	
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

Object.defineProperty(mel_password_with_button, 'password_show_button', {
	enumerable: false,
	configurable: false,
	writable: false,
	value:CONST_ICON_EYE
});

Object.defineProperty(mel_password_with_button, 'password_hide_button', {
	enumerable: false,
	configurable: false,
	writable: false,
	value:CONST_ICON_EYE_CROSSED
});

class mel_button extends mel_html {
	constructor(attribs = {}, content = EMPTY_STRING)
	{
		super(CONST_HTML_BUTTON, attribs, content);
		this.attribs[CONST_ATTRIB_CLASS] = mel_button.html_base_class_full;//'mel-button btn btn-secondary no-button-margin'
	}
}

{
	let item = {};
	let bootstrap = {};
	Object.defineProperty(item, 'base', {
		enumerable: false,
		configurable: false,
		writable: false,
		value:CONST_CLASS_BUTTON_MEL
	});

	Object.defineProperty(bootstrap, 'base', {
		enumerable: false,
		configurable: false,
		writable: false,
		value:CONST_CLASS_BUTTON_BASE
	});

	Object.defineProperty(bootstrap, 'state', {
		enumerable: false,
		configurable: false,
		writable: false,
		value:CONST_CLASS_BUTTON_SECONDARY
	});

	Object.defineProperty(item, 'bootstrap', {
		enumerable: false,
		configurable: false,
		writable: false,
		value:bootstrap
	});

	Object.defineProperty(mel_button, 'html_base_class', {
		enumerable: false,
		configurable: false,
		writable: false,
		value:item
	});
}

Object.defineProperty(mel_button, 'html_base_class_no_margin', {
	enumerable: false,
	configurable: false,
	writable: false,
	value:CONST_CLASS_BUTTON_MEL_NO_MARGIN
});

Object.defineProperty(mel_button, 'html_base_class_success', {
	enumerable: false,
	configurable: false,
	writable: false,
	value:CONST_CLASS_BUTTON_SUCCESS
});

Object.defineProperty(mel_button, 'html_base_class_danger', {
	enumerable: false,
	configurable: false,
	writable: false,
	value:CONST_CLASS_BUTTON_DANGER
});

Object.defineProperty(mel_button, 'html_base_class_full', {
	enumerable: false,
	configurable: false,
	writable: false,
	value:`${mel_button.html_base_class.base} ${mel_button.html_base_class_no_margin} ${mel_button.html_base_class.bootstrap.base} ${mel_button.html_base_class.bootstrap.state}`
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

class mel_tabs extends mel_html {
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
		let mel_pannel = new mel_tabpanel(tab, {jquery_content:pannel});
		this.tabs.addTab(tab.select(selectedTab).setControl(mel_pannel));																																																					
		this.contents.push(mel_pannel);
		tab = (mel_pannel = null, null);
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

class mel_iframe extends mel_html {
	constructor(src, attribs = {}) {
		super('iframe', attribs);
		this.src = src;
		this.onload = new MelEvent();
	}

	generate(extra_attribs = {}) {
		if (Array.isArray(extra_attribs)) extra_attribs = {};

		extra_attribs[mel_html.ATTRIB_NO_MULTI_BALISE] = true;
		extra_attribs.src = this.src;
		return super.generate(extra_attribs).on('load', (e) => {
			this.onload.call(e);
		});
	}
}