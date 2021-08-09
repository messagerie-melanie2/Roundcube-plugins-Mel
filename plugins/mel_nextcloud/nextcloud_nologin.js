$(document).ready(function() {


	$("#mel_nextcloud_frame").on("load", () => {
		parent.rcmail.clear_messages();
		parent.rcmail.set_busy(false);
		$("#mel_nextcloud_frame").off("load");
		console.log("ready", rcmail.env.last_src_updated);
		if (rcmail.env.last_src_updated !== undefined && rcmail.env.last_src_updated !== null)
		{
			console.log("ready2", $("#mel_nextcloud_frame")[0].src !== rcmail.env.last_src_updated);
			try {
				if ($("#mel_nextcloud_frame")[0].src !== rcmail.env.last_src_updated)
				{
					console.log("ready3", rcmail.env.last_src_updated);
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

	parent.rcmail.set_busy(true, "loading");

	if (navigator.appName == "Microsoft Internet Explorer"){
		window.document.getElementById('mel_nextcloud_frame').src = rcmail.env.nextcloud_gotourl;
		window.document.getElementById('mel_nextcloud_frame').contentWindow.location.reload(true);
	} else {
	   window.document.getElementById('mel_nextcloud_frame').src = rcmail.env.nextcloud_gotourl;
	}
	// $("#wait_box").hide();
});