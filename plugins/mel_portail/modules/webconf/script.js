function joinWebConf() {
	var conf = prompt("Quelle conférence souhaitait vous rejoindre ?", "ExempleDeConference365");
	if (conf) {
		//rcmail.portail_open_url(rcmail.env.portail_items.webconf.url + conf);
		window.location = rcmail.env.portail_items.webconf.url + conf.split('/').pop();
	}
}