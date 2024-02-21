$(document).ready(function() {
	const url = rcmail.env.tchap_startup_url != null && rcmail.env.tchap_startup_url !== undefined ? rcmail.env.tchap_startup_url : rcmail.env.tchap_url;
	if (navigator.appName == "Microsoft Internet Explorer"){
		window.document.getElementById('tchap_frame').src = url;
		window.document.getElementById('tchap_frame').contentWindow.location.reload(true);
	} else {
		window.document.getElementById('tchap_frame').src = url;
	}
	$("#wait_box").hide();
});