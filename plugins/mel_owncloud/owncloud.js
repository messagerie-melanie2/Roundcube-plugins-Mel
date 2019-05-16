$(document).ready(function() {
	$.ajax({ // fonction permettant de faire de l'ajax
	   type: "POST", // methode de transmission des données au fichier php
	   url: rcmail.env.owncloud_url, // url du fichier php
	   data: "rc_user="+rcmail.env.owncloud_username+"&rc_pwd="+rcmail.env.owncloud_password+"&from_roundcube=1", // données à transmettre
	   xhrFields: {
	       withCredentials: true
	    },
	   success: function (data) {
		   if (navigator.appName == "Microsoft Internet Explorer"){
			    window.document.getElementById('mel_owncloud_frame').src = rcmail.env.owncloud_gotourl;
			    window.document.getElementById('mel_owncloud_frame').contentWindow.location.reload(true);
			} else {
			   window.document.getElementById('mel_owncloud_frame').src = rcmail.env.owncloud_gotourl;
			}
		   $("#wait_box").hide();
	   },
	   error: function (xhr, ajaxOptions, thrownError) { // Add these parameters to display the required response
		   $("#wait_box").hide();
	   },
	});
});