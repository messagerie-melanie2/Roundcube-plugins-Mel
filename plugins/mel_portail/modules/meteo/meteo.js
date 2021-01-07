/**
 * Class meteo
 * 
 * @returns
 */
function meteo(id, feedUrl) {
	this.id = id;
	this.feedUrl = feedUrl;
	this.geolocation = null;
}

/**
 * Methode de refresh de meteo
 */
meteo.prototype.refresh = function() {
	alert('refresh');
	if (!this.geolocation) {
		//this.getLocation();
	}
	else {
		this.getWeatherWithLocation(this.geolocation);
	}
	if (!this.geolocation) {
		this.getWeatherWithoutLocation();
	}
};

/**
 * Methode de récupération de l'emplacement geoloc
 */
meteo.prototype.getLocation = function() {
	alert('getLocation');
	if (navigator.geolocation) {
		this.geolocation = navigator.geolocation.getCurrentPosition(this.getWeatherWithLocation);
	}
};

/**
 * Methode de récupération de la meteo avec localisation
 */
meteo.prototype.getWeatherWithLocation = function(location) {
	alert('getWeatherWithLocation');
	this.geolocation = location;
	var url = this.feedUrl + "?lat="
							+ location.coords.latitude + "&lon=" + location.coords.longitude;
	this.getWeather(url);
};

/**
 * Methode de récupération de la meteo sans localisation
 */
meteo.prototype.getWeatherWithoutLocation = function() {
	alert('getWeatherWithoutLocation');
	var url = this.feedUrl + "?q="
							+ rcmail.env.portail_items[id].defaultCity;
	this.getWeather(url);
};

/**
 * Methode de récupération de la meteo
 */
meteo.prototype.getWeather = function(url) {
	alert('getWeather');
	$.ajax({
		dataType : "json",
		url : url,
		data : function(data) {
		},
		success : function(success) {
			alert(success);
		}
	});
};
