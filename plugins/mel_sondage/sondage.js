$(document).ready(function() {
	$.ajax({ // fonction permettant de faire de l'ajax
	   type: "POST", // methode de transmission des données au fichier php
	   url: rcmail.env.sondage_url+'/?_p=external_login', // url du fichier php
	   data: "username="+rcmail.env.sondage_username+"&password="+rcmail.env.sondage_password+"&timezone="+rcmail.env.sondage_timezone, // données à transmettre
	   xhrFields: {
	       withCredentials: true
	    },
	   crossDomain: true,
	   success: function (data) {
		   if (navigator.appName == "Microsoft Internet Explorer"){
			   window.document.getElementById('mel_sondage_frame').src = rcmail.env.sondage_gotourl;
			    window.document.getElementById('mel_sondage_frame').contentWindow.location.reload(true);
			} else if (rcmail.env.ismobile) {
			  window.location = rcmail.env.sondage_gotourl;
			} else {
			   window.document.getElementById('mel_sondage_frame').src = rcmail.env.sondage_gotourl;
			}
		   $("#wait_box").hide();
	   },
	   error: function (xhr, ajaxOptions, thrownError) { // Add these parameters to display the required response
		   $("#wait_box").hide();
	   },
	});
});