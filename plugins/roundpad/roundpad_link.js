$(document).ready(function() {
  $(document).on('click', 'a', function (event) 
	{ 
	   var url = $(this).attr('href');
	   for (var key in rcmail.env.associative_files_url) {
	     if (url.indexOf(key) === 0) {
			var params = {_doc_url: url};
			if (rcmail.env.task == 'mail' && (rcmail.env.action == 'preview' || rcmail.env.action == 'show')) {
				params._doc_owner = $('#messageheader .from > .adr .mailto').text();
			}
	       	$(this).attr('href', rcmail.url('roundpad/roundpad', params).replace('&_action=roundpad', '').replace('&_framed=1', ''));
	     }
	   }
	});
});