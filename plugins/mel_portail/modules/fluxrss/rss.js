/**
 * Class fluxrss
 * 
 * @returns
 */
function fluxrss(id, feedUrl) {
	this.id = id;
	this.feedUrl = feedUrl;
	this.rssTimeouts = {};
}

/**
 * Methode d'initialisation des flux rss
 */
fluxrss.prototype.init = function() {
	window.clearTimeout(this.rssTimeouts[this.id]);
	this.rssTimeouts[this.id] = setTimeout(() => {
		fetch(this.feedUrl, {credentials: "include", cache: "no-cache"}).then((res) => {
		  res.text().then((xmlTxt) => {
		    var domParser = new DOMParser()
		    let doc = domParser.parseFromString(xmlTxt, 'text/xml')
		    var items = doc.querySelectorAll('item');
		    if (items.length === 0) {
		    	items = doc.querySelectorAll('entry');
		    }
		    if (rcmail.env.portail_items[this.id].flip) {
		    	var referenceNode = document.querySelector('#' + this.id + ' .back ul.news > li') !== null ? document.querySelector('#' + this.id + ' .back ul.news > li:first-child') : false;
			}
			var maxItems = rcmail.env.portail_items[this.id].maxItems ? rcmail.env.portail_items[this.id].maxItems : 6;
		    for (let i = 0; i < Math.min(items.length, maxItems); i++) {
				let item = items[i];
				let url = item.querySelector('link').textContent;
				if (rcmail.env.portail_items[this.id].feedOldUrl) {
					url = url.replace(rcmail.env.portail_items[this.id].feedOldUrl, rcmail.env.portail_items[this.id].feedNewUrl);
				}
		    	let news = {
		    			url: url, 
		    			title: item.querySelector('title').textContent, 
		    			description: item.querySelector('description') ? item.querySelector('description').textContent : '',
    					date: item.querySelector('date') ? item.querySelector('date').textContent.replace(/-/g, '/') : '',
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
 * Methode de refresh des flux rss
 */
fluxrss.prototype.refresh = function() {
	// Pas de refresh prévu pour l'instant, on le fait au F5
	return;
};
