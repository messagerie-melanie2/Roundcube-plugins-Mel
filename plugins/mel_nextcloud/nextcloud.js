$(document).ready(function() {

	parent.rcmail.set_busy(true, "loading");
	$("#mel_nextcloud_frame").on("load", () => {
		parent.rcmail.clear_messages();
		parent.rcmail.set_busy(false);
		$("#mel_nextcloud_frame").off("load");

		if (rcmail.env.last_src_updated !== undefined && rcmail.env.last_src_updated !== null)
		{
			try {
				if ($("#mel_nextcloud_frame")[0].src !== rcmail.env.last_src_updated)
				{
					$("#mel_nextcloud_frame")[0].src = rcmail.env.last_src_updated
					delete rcmail.env.last_src_updated;
				}
				else if ($("#mel_nextcloud_frame")[0].contentWindow.location.href !== rcmail.env.last_src_updated)
				{
					$("#mel_nextcloud_frame")[0].src = rcmail.env.last_src_updated
					delete rcmail.env.last_src_updated;
				}
			} catch (error) {
				console.error('###[$("#mel_nextcloud_frame").on("load", () => {]', error);
			}
		}
	});

	$.ajax({ // fonction permettant de faire de l'ajax
	   type: "POST", // methode de transmission des données au fichier php
	   url: rcmail.env.nextcloud_url, // url du fichier php
	   data: "rc_user="+rcmail.env.nextcloud_username+"&rc_pwd="+rcmail.env.nextcloud_password+"&from_roundcube=1", // données à transmettre
	   xhrFields: {
	       withCredentials: false
	    },
		crossDomain: true,
	   success: function (data) {
		   if (navigator.appName == "Microsoft Internet Explorer"){
			    window.document.getElementById('mel_nextcloud_frame').src = rcmail.env.nextcloud_gotourl;
			    window.document.getElementById('mel_nextcloud_frame').contentWindow.location.reload(true);
			} else {
			   window.document.getElementById('mel_nextcloud_frame').src = rcmail.env.nextcloud_gotourl;
			}
		//    $("#wait_box").hide();
	   },
	   error: function (xhr, ajaxOptions, thrownError) { // Add these parameters to display the required response
		//    $("#wait_box").hide();
	   },
	});
});