if (window.rcmail) {
    rcmail.addEventListener('init', function(evt) {
        if (navigator.appName == "Microsoft Internet Explorer"){
			window.document.getElementById('mel_roadmap_frame').src = rcmail.env.roadmap_url;
			window.document.getElementById('mel_roadmap_frame').contentWindow.location.reload(true);
		} else {
		   window.document.getElementById('mel_roadmap_frame').src = rcmail.env.roadmap_url;
		}
		$("#wait_box").hide();
    });
}