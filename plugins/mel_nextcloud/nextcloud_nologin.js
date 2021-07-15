$(document).ready(function() {


	$("#mel_nextcloud_frame").on("load", () => {
		parent.rcmail.clear_messages();
		parent.rcmail.set_busy(false);
		$("#mel_nextcloud_frame").off("load");
	});

	parent.rcmail.set_busy(true, "loading");

	if (navigator.appName == "Microsoft Internet Explorer"){
		window.document.getElementById('mel_nextcloud_frame').src = rcmail.env.nextcloud_gotourl;
		window.document.getElementById('mel_nextcloud_frame').contentWindow.location.reload(true);
	} else {
	   window.document.getElementById('mel_nextcloud_frame').src = rcmail.env.nextcloud_gotourl;
	}
	// $("#wait_box").hide();
});