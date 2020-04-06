$(document).ready(function() {
	$("#portailview .flip").click(function() {
		var item = $(this).parent().parent().parent();
		item.toggleClass('flipped');
	});
});

/**
 * Class Portail
 * 
 * @returns
 */
function Portail() {
	var cache = {};
}

/**
 * Methode d'initialisation du portail
 */
Portail.prototype.init = function() {
	// Parcourir les items pour le refresh
	for (var id in rcmail.env.portail_items) {
		switch (rcmail.env.portail_items[id].type) {
			case 'fluxrss':
				if (!rcmail.env.portail_items[id].object) {
					rcmail.env.portail_items[id].object = new fluxrss(id, rcmail.env.portail_items[id].feedUrl);
				}
				rcmail.env.portail_items[id].object.init();
				break;
			case 'fluxhtml':
				if (!rcmail.env.portail_items[id].object) {
					rcmail.env.portail_items[id].object = new fluxhtml(id, rcmail.env.portail_items[id].feedUrl);
				}
				rcmail.env.portail_items[id].object.init();
				break;
			case 'stockage':
				if (!rcmail.env.portail_items[id].object) {
					rcmail.env.portail_items[id].object = new stockage(id, rcmail.env.portail_items[id].feedUrl);
				}
				rcmail.env.portail_items[id].object.init();
				break;
			case 'meteo':
				if (!rcmail.env.portail_items[id].object) {
					rcmail.env.portail_items[id].object = new meteo(id, rcmail.env.portail_items[id].feedUrl);
				}
				rcmail.env.portail_items[id].object.init();
				break;
		}
	}
};

/**
 * Methode de refresh du portail
 */
Portail.prototype.refresh = function() {
	// Parcourir les items pour le refresh
	for (var id in rcmail.env.portail_items) {
		if (rcmail.env.portail_items[id].object) {
			rcmail.env.portail_items[id].object.refresh();
		}
	}
};

/**
 * Positioner une données dans le cache
 */
Portail.prototype.setCache = function(id, data) {
	
};

/**
 * Récupérer une données dans le cache
 */
Portail.prototype.getCache = function(id) {
	
};

/**
 * Methode d'ajout d'une news a une card
 */
Portail.prototype.addNews = function(id, news, back = false, newtab = false, referenceNode = false) {
	var _class = back ? '.back' : '.front';
	var ul = document.querySelector('#' + id + ' ' + _class + ' ul');
  	if (!ul) {
		// Le container n'est pas créé ou le rajoute
		ul = document.createElement('ul');
		ul.className = 'news';
		
		if (back) {
			let div = document.createElement('div');
			div.className = 'scrollbar';
			div.appendChild(ul);
			document.querySelector('#' + id + ' ' + _class).appendChild(div);
			if (!bw.mac && !bw.chrome) {
				// Custom scroll bar
				$(div).mCustomScrollbar({theme: 'minimal', scrollInertia: 500});
			}
		}
		else {
			document.querySelector('#' + id + ' ' + _class).appendChild(ul);
		}
  	}
	if (!news.id) {
		news.id = news.url ? news.url.split('/').pop().split('.')[0] : null;
		if (!news.id) {
			news.id = news.title.replace(/[^a-z0-9]/gi,'');
		}
	}
  
	if (document.querySelector('#' + id + ' ' + _class + ' ul li#' + news.id)  === null) {
		if (_class == '.front' && !rcmail.env.portail_items[id].multiNews) {
			// Ne conserver que la première news sur le front
			ul.innerHTML = '';
		}
		let li = document.createElement('li');
		li.id = news.id;
		let a = document.createElement('a');
		if (news.url) {
			a.href = news.url;
		}
		else {
			a.onclick = function(e) {
				$(e.target).find('span.description').toggle();
				$(e.target).find('span.description_short').toggle();
			};
		}
		if (newtab) {
			a.target = '_blank';
		}
		li.appendChild(a);
		// Ajouter au début ou à la fin de la liste
		if (referenceNode !== false) {
			ul.insertBefore(li, referenceNode);
		}
		else {
			ul.appendChild(li);
		}
		// Affichage de la date
		if (news.date) {
			let span = document.createElement('span');
			span.className = 'date';
			span.innerHTML = this.formatDate(news.date);
			a.appendChild(span);
		}
		// Affichage du  titre
		let h1 = document.createElement('h1');
		h1.textContent = news.title;
		a.appendChild(h1);
		a.title = news.title;
		// Affichage de la description
		if (news.description) {
			let span = document.createElement('span');
			span.className = 'description';
			span.innerHTML = news.description;
			a.appendChild(span);
			if (!news.url) {
				let span = document.createElement('span');
				span.className = 'description_short';
				span.innerHTML = news.description.length > 50 ? news.description.substr(0, 50) + '...' : news.description;
				a.appendChild(span);
			}
		}
	}
};

/**
 * Methode pour formatter une date pour l'affichage
 */
Portail.prototype.formatDate = function(datetime) {
	function checkTime(i) {
	  if (i < 10) {
	    i = "0" + i;
	  }
	  return i;
	}
	
	var date = new Date(datetime);
	return rcmail.get_label("right_panel.day_min_" + date.getDay()) + " " + date.getDate() + " " + rcmail.get_label("right_panel.month_min_" + date.getMonth()) 
						+ ' ' + checkTime(date.getHours()) + ':' + checkTime(date.getMinutes());
};

/**
 * Methode pour retourner des cards aléatoirement
 */
Portail.prototype.randomlyFlipCard = function() {
	var rand = this.getRandomIntInclusive(0, Object.keys(rcmail.env.portail_items).length);
	var i = 0;
	// Parcourir les items
	for (var id in rcmail.env.portail_items) {
		if (i == rand) {
			if (rcmail.env.portail_items[id].flip && !$('#portailview #' + id).hasClass('flipped')) {
				$('#portailview #' + id).addClass('flipped');
				setTimeout(() => {
					$('#portailview #' + id).removeClass('flipped');
				}, 30000);
			}
			break;
		}
		i++;
	}
};

/**
 * On renvoie un entier aléatoire entre une valeur min (incluse)
 * et une valeur max (incluse).
 * Attention : si on utilisait Math.round(), on aurait une distribution
 * non uniforme !
 */
Portail.prototype.getRandomIntInclusive = function(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min +1)) + min;
};


/**
 * Open an url in the portail
 */
Portail.prototype.open_url = function(id, url, event) {
	if (event) {
		event.preventDefault();
	}
	if (rcmail.busy) {
		return;
	}
	if (id && rcmail.env.portail_items[id].inner) {
		var lock = rcmail.set_busy(true, 'loading');
		if (navigator.appName == "Microsoft Internet Explorer"){
		   window.document.getElementById('mel_portail_frame').src = url;
	     window.document.getElementById('mel_portail_frame').contentWindow.location.reload(true);
		} else {
		   window.document.getElementById('mel_portail_frame').src = url;
		}
		window.document.getElementById('mel_portail_frame').onload = function() {
			 	$('#portailview').hide();
				$('#portailtoolbar').show();
				$('#mainscreencontent').show();
				rcmail.set_busy(false, null, lock);
	  }
	}
	else if (id && rcmail.env.portail_items[id].innerCard) {
		$('#portailview #' + id).addClass('flipped');
		
	  var h = Math.floor($(window).height() * 0.75);
	  var buttons = {};
	
		setTimeout(() => {
			var frame = $('<iframe>').attr('id', id + 'dialog')
		    .attr('src', url)
		    .attr('frameborder', '0')
		    .appendTo(document.body);
			
			frame.dialog({
		    modal: true,
		    resizable: false,
		    closeOnEscape: true,
		    title: '',
		    close: function() {
		      frame.dialog('destroy').remove();
		      $('#portailview #' + id).removeClass('flipped');
		    },
		    buttons: buttons,
		    width: 900,
		    height: 700,
		    rcmail: rcmail
		  }).width(885);
		}, 200);
		
	}
	else if (id && !rcmail.env.portail_items[id].newtab) {
		window.location = url;
	}
	else {
		var win = window.open(url, '_blank');
	  win.focus();
	}
};

/**
 * Close an url in the portail
 */
Portail.prototype.close_url = function() {
	$('#portailview').show();
	$('#portailtoolbar').hide();
	$('#mainscreencontent').hide();
};

var portail = new Portail();
portail.init();

if (window.rcmail) {
	rcmail.enable_command('portail_close_url', true);
	
	// Call refresh panel
	rcmail.addEventListener('plugin.refresh_right_panel', function () {
		portail.refresh();
		portail.randomlyFlipCard();
	});
	
	// Rcmail init
	rcmail.addEventListener('init', function(evt) {
		if (rcmail.env.task == 'settings') {
			var tab = $('<span>').attr('id', 'settingstabpluginmel_resources_portail')
		      .addClass('listitem_mel mel'), button = $('<a>')
		      .attr('href', rcmail.env.comm_path
		          + '&_action=plugin.mel_resources_portail')
		      .attr('title', rcmail
		          .gettext('mel_portail.manageresourcesportail')).html(rcmail
		          .gettext('mel_portail.resourcesportail')).appendTo(tab);
		  // add tab
		  rcmail.add_element(tab, 'tabs');
		}
		else if (rcmail.env.task == 'portail') {
			// Gestion des scrollbar custom
			$('#portailview .item .links').mCustomScrollbar({theme: 'minimal-dark', scrollInertia: 500});
			if (!bw.mac && !bw.chrome) {
				$('#portailview .item .back .news').mCustomScrollbar({theme: 'minimal', scrollInertia: 500});	
			}
		}
	});
}

// Open an url in the portail
rcube_webmail.prototype.portail_open_url = function(id, url, event) {
	portail.open_url(id, url, event);
};

//Close an url in the portail
rcube_webmail.prototype.portail_close_url = function() {
	portail.close_url();
};