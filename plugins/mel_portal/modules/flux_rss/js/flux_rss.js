/**
 * Class fluxrss
 * 
 * @returns
 */
function fluxrss(id, feedUrl, datas = {header:"", body:"", footer:""}) {
	this.id = id;
	this.indexes = datas;
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
			//console.log(doc);
			let items = doc.querySelectorAll('item');
		    if (items.length === 0) {
		    	items = doc.querySelectorAll('entry');
			}
			if (items.length > 0)
			{
				$("." + this.getId(0)).html(doc.querySelector("title").innerHTML);
				window.title = items[0].querySelector("title");
				items[0].querySelector("title").innerHTML = "<h3>" + items[0].querySelector("title").innerHTML + "</h3>";
				$("." + this.getId(1)).html(items[0].querySelector("title"));
				if (items[0].querySelector("category") !== null && items[0].querySelector("category").innerHTML !== "")
					$("." + this.getId(2)).html("#" + items[0].querySelector("category").innerHTML);
				$("." + this.getId(2)).parent().append(this.add_signet());
			}

		  });
		});
	}, 500);
};

fluxrss.prototype.getId = function (idNum)
{
	let retour;
	switch (idNum) {
		case 0:
			retour = this.indexes.header + "-" + this.id;
			break;
		case 1:
			retour = this.indexes.body + "-" + this.id;
			break;
		case 2:
			retour = this.indexes.footer + "-" + this.id;
			break;
		default:
			retour = "";
			break;
	}
	return retour;
}

/**
 * Methode de refresh des flux rss
 */
fluxrss.prototype.refresh = function() {
	// Pas de refresh prévu pour l'instant, on le fait au F5
	return;
};

fluxrss.prototype.add_signet = function()
{
    return `<i class="icofont-book-mark roundbadge signet" id="signet-` + this.id + `"></i>`;
}