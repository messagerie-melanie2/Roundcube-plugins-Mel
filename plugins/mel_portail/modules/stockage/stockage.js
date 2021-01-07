/**
 * Class stockage
 * 
 * @returns
 */
function stockage(id, feedUrl) {
	this.NOTIFICATIONS_API = feedUrl.notifications;
	this.ACTIVITIES_API = feedUrl.activities;
	this.id = id;
	this.isLogged = false;
	this.lastActivityId = 0;
	this.MAX_ELEMENTS = rcmail.env.portail_items[id].flip ? 10 : 1;
}

/**
 * Methode d'initialisation du stockage
 */
stockage.prototype.init = function() {
	if (this.isLogged) {
		this.getActivities();
	}
	else {
		this.getLogin();
	}
};

/**
 * Methode de refresh du stockage
 */
stockage.prototype.refresh = function() {
	this.getActivities();
};

/**
 * Authentification sur le stockage
 */
stockage.prototype.getLogin = function() {
	var _this = this;
	$.ajax({ // fonction permettant de faire de l'ajax
	   type: "POST", // methode de transmission des données au fichier php
	   url: rcmail.env.nextcloud_url, // url du fichier php
	   data: "rc_user="+rcmail.env.nextcloud_username+"&rc_pwd="+rcmail.env.nextcloud_password+"&from_roundcube=1", // données à transmettre
	   xhrFields: {
	       withCredentials: true
	    },
	   success: function (data) {
	  	 _this.isLogged = true;
	  	 _this.getActivities();
	   },
	   error: function (xhr, ajaxOptions, thrownError) { // Add these parameters to display the required response
	  	 _this.isLogged = false;
	  	 console.log(thrownError);
	   },
	});
};

/**
 * Récupération des notifications depuis les API
 */
stockage.prototype.getNotifications = function() {
	if (this.isLogged) {
		var _this = this;
		$.ajax({ // fonction permettant de faire de l'ajax
		   type: "GET", // methode de transmission des données au fichier php
		   url: rcmail.env.nextcloud_url.replace('index.php', '') + this.NOTIFICATIONS_API, // url des recommantations API
		   // API HTTP header to avoid CSRF error
		   beforeSend: function(xhr) { 
		  	 xhr.setRequestHeader('OCS-APIRequest', true);
		   },
		   success: function(data) {
		  	 _this.readNotificationXML(data);
		   },
		   error: function(xhr, ajaxOptions, thrownError) { // Add these parameters to display the required response
		  	 console.log(thrownError);
		   },
		});
	}
};

/**
 * Lecture des notifications depuis le fichier XML
 */
stockage.prototype.readNotificationXML = function(doc) {
  var items = doc.querySelectorAll('element');
  for (let i = 0; i < Math.min(items.length, this.MAX_ELEMENTS); i++) {
  	let item = items[i];
  	if (!item.querySelector('subject')) {
  		continue;
  	}
  	var front = i < 1;
  	let news = {
  			url: item.querySelector('link').textContent, 
  			title: item.querySelector('subject').textContent, 
  			description: item.querySelector('message').textContent
		};
  	portail.addNews(this.id, news, !front, rcmail.env.portail_items[this.id].newtab || news.url.indexOf(rcmail.env.nextcloud_url) === -1);
  }
};

/**
 * Récupération des activites depuis les API
 */
stockage.prototype.getActivities = function() {
	if (this.isLogged) {
		var _this = this;
		$.ajax({ // fonction permettant de faire de l'ajax
		   type: "GET", // methode de transmission des données au fichier php
		   cache: false,
		   contentType: "application/json",
		   url: rcmail.env.nextcloud_url.replace('index.php', '') + this.ACTIVITIES_API.replace('%%lastActivityId%%', this.lastActivityId), // url des recommantations API
		   // API HTTP header to avoid CSRF error
		   beforeSend: function(xhr) { 
		  	 xhr.setRequestHeader('OCS-APIRequest', true);
		   },
		   success: function(data, status, xhr) {
		  	 if (data === undefined) {
				   data = $.parseJSON(xhr.responseText);
				 }
		  	 if (data) {
		  		 _this.readActivityJSON(data);
		  	 }
		   },
		   error: function(xhr, ajaxOptions, thrownError) { // Add these parameters to display the required response
		  	 console.log(thrownError);
		   },
		});
	}
};

/**
 * Lecture des activités depuis le fichier JSON
 */
stockage.prototype.readActivityJSON = function(json) {
  var items = json.ocs.data;
  if (rcmail.env.portail_items[this.id].flip) {
  	var referenceNode = document.querySelector('#' + this.id + ' .back ul.news > li') !== null ? document.querySelector('#' + this.id + ' .back ul.news > li:first-child') : false;
  }
  for (let i = 0; i < Math.min(items.length, this.MAX_ELEMENTS); i++) {
  	let item = items[i];
  	if (!item.subject) {
  		continue;
  	}
  	let news = {
  			id: 'activity_id_' + item.activity_id,
  			url: item.link,
  			title: item.subject, 
  			description: item.message,
  			date: item.datetime
		};
  	if (i === 0) {
  		//this.lastActivityId = item.activity_id;
    	portail.addNews(this.id, news, false, rcmail.env.portail_items[this.id].newtab || news.url.indexOf(rcmail.env.nextcloud_url) === -1);
  	}
  	if (rcmail.env.portail_items[this.id].flip) {
    	portail.addNews(this.id, news, true, rcmail.env.portail_items[this.id].newtab || news.url.indexOf(rcmail.env.nextcloud_url) === -1, referenceNode);
  	}
  }
};