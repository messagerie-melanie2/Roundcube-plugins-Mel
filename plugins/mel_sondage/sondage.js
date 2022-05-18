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
		   const url = rcmail.env.sondage_startup_url != null && rcmail.env.sondage_startup_url !== undefined ? rcmail.env.sondage_startup_url : rcmail.env.sondage_gotourl;
		   if (navigator.appName == "Microsoft Internet Explorer"){
			   window.document.getElementById('mel_sondage_frame').src = url;
			    window.document.getElementById('mel_sondage_frame').contentWindow.location.reload(true);
			} else if (rcmail.env.ismobile) {
			  window.location = url;
			} else {
			   window.document.getElementById('mel_sondage_frame').src = url;
			}
		   $("#wait_box").hide();
		   top.rcmail.env.sondage_loaded = true;
	   },
	   error: function (xhr, ajaxOptions, thrownError) { // Add these parameters to display the required response
		   $("#wait_box").hide();
	   },
	});
});