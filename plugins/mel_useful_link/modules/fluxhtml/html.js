/**
 * Class fluxhtml
 * 
 * @returns
 */
function fluxhtml(id, feedUrl) {
	this.id = id;
	this.feedUrl = feedUrl;
	this.rssTimeouts = {};
}

/**
 * Methode d'initialisation des flux html
 */
fluxhtml.prototype.init = function() {
	window.clearTimeout(this.rssTimeouts[this.id]);
	this.rssTimeouts[this.id] = setTimeout(() => {
		fetch(this.feedUrl, {credentials: "include", cache: "no-cache"}).then((res) => {
		  res.text().then((xmlTxt) => {
		    var domParser = new DOMParser()
			let doc = domParser.parseFromString(xmlTxt, 'text/html')
			var querySelectorLink = rcmail.env.portail_items[this.id].querySelectorLink;
			var querySelectorTitle = rcmail.env.portail_items[this.id].querySelectorTitle;
			var querySelectorDescription = rcmail.env.portail_items[this.id].querySelectorDescription;
			var querySelectorDate = rcmail.env.portail_items[this.id].querySelectorDate;
			var maxItems = rcmail.env.portail_items[this.id].maxItems ? rcmail.env.portail_items[this.id].maxItems : 6;

			var items = doc.querySelectorAll(rcmail.env.portail_items[this.id].querySelector);
			if (rcmail.env.portail_items[this.id].querySelectorBis) {
				var otherItems = doc.querySelectorAll(rcmail.env.portail_items[this.id].querySelectorBis);
			}
		    if (rcmail.env.portail_items[this.id].flip) {
		    	var referenceNode = document.querySelector('#' + this.id + ' .back ul.news > li') !== null ? document.querySelector('#' + this.id + ' .back ul.news > li:first-child') : false;
			}
		    for (let i = 0; i < Math.min(items.length, maxItems); i++) {
				let item = items[i];
				// title
				let title = null;
				if (querySelectorTitle) {
					title = item.querySelector(querySelectorTitle).textContent;
				}
				else {
					title = item.textContent;
				}
				// description
				let description = null;
				if (querySelectorDescription) {
					description = item.querySelector(querySelectorDescription).textContent;
				}
				else if (otherItems && otherItems[i]) {
					description = otherItems[i].textContent;
				}
				let url = querySelectorLink ? item.querySelector(querySelectorLink).textContent : null;
				if (rcmail.env.portail_items[this.id].feedOldUrl) {
					url = url.replace(rcmail.env.portail_items[this.id].feedOldUrl, rcmail.env.portail_items[this.id].feedNewUrl);
				}
		    	let news = {
					id: this.id + '_new_' + i,
					url: url, 
					title: title, 
					description: description,
					date: querySelectorDate ? (item.querySelector(querySelectorDate) ? item.querySelector(querySelectorDate).textContent : '') : null,
    			};
		    	if (i === 0 && !rcmail.env.portail_items[this.id].buttons) {
					portail.addNews(this.id, news, false, rcmail.env.portail_items[this.id].newtab);
					if (!rcmail.env.portail_items[this.id].flip 
							&& !rcmail.env.portail_items[this.id].multiNews) {
						break;
					}
		    	}
		    	if (rcmail.env.portail_items[this.id].flip) {
		    		portail.addNews(this.id, news, true, rcmail.env.portail_items[this.id].newtab, referenceNode);
				}
				else if (rcmail.env.portail_items[this.id].multiNews && i > 0) {
					portail.addNews(this.id, news, false, rcmail.env.portail_items[this.id].newtab);
				}
		    }
		  });
		});
	}, 500);
};

/**
 * Methode de refresh des flux html
 */
fluxhtml.prototype.refresh = function() {
	// Pas de refresh prévu pour l'instant, on le fait au F5
	return;
};
