if (window.rcmail) {
	rcmail.addEventListener('init', function(evt) {
		// Récupération du title rocket
		var rocket_chat_title = localStorage.getItem('rocket_chat_title');
		if (rocket_chat_title) {
			$('.button-rocket_chat .button-inner').text(rocket_chat_title);
		}
	});
//	
//	window.addEventListener('storage', function(e) {
//		if (e.key == 'rocket_chat_title') {
//			$('.button-rocket_chat .button-inner').text(e.newValue);
//		}
//	});
}