$(document).ready(function() {
	$("#portailview .flip > button").click(function() {
		var item = $(this).parent().parent().parent().parent();
		
		item.toggleClass('flipped');
	});
});

if (window.rcmail) {
	rcmail.enable_command('portail_close_url', true);
}

// Open an url in the portail
rcube_webmail.prototype.portail_open_url = function(url, event) {
	if (event) {
		event.preventDefault();
	}
	if (navigator.appName == "Microsoft Internet Explorer"){
	   window.document.getElementById('mel_portail_frame').src = url;
     window.document.getElementById('mel_portail_frame').contentWindow.location.reload(true);
	} else {
	   window.document.getElementById('mel_portail_frame').src = url;
	}
	$('#portailview').hide();
	$('#portailtoolbar').show();
	$('#mainscreencontent').show();
};

//Open an url in the portail
rcube_webmail.prototype.portail_close_url = function() {
	$('#portailview').show();
	$('#portailtoolbar').hide();
	$('#mainscreencontent').hide();
};