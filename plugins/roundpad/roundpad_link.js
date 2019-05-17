$(document).ready(function() {
  $(document).on('click', 'a', function (event) 
	{ 
	   var url = $(this).attr('href');
	   for (var key in rcmail.env.associative_files_url) {
	     if (url.indexOf(key) === 0) {
	       $(this).attr('href', rcmail.url('roundpad/roundpad', {_doc_url: url}).replace('&_action=roundpad', '').replace('&_framed=1', ''));
	     }
	   }
	});
});