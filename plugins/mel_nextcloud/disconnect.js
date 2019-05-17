$(document).ready(function() {
	$.ajax({ // fonction permettant de faire de l'ajax
	   type: "GET", // methode de transmission des données au fichier php
	   url: rcmail.env.nextcloud_url+'/?rc_logout=1&from_roundcube=1', // url du fichier php
	   xhrFields: {
	       withCredentials: true
	    },
	   crossDomain: true,
	   success: function (data) {
	   },
	   error: function (xhr, ajaxOptions, thrownError) { //Add these parameters to display the required response
	   },
	});
});