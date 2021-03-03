$(document).ready(function() {
	if (navigator.appName == "Microsoft Internet Explorer"){
		window.document.getElementById('mel_nextcloud_frame').src = rcmail.env.nextcloud_gotourl;
		window.document.getElementById('mel_nextcloud_frame').contentWindow.location.reload(true);
	} else {
	   window.document.getElementById('mel_nextcloud_frame').src = rcmail.env.nextcloud_gotourl;
	}
	$("#wait_box").hide();
});