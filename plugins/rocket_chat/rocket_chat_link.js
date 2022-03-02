$(document).ready(function() {
	$('a').click(function (event) 
	{ 
	   var url = $(this).attr('href');
	   if (url.indexOf(rcmail.env.rocket_chat_url) == 0) {
	     var other_params = "";
       if (url.length > rcmail.env.rocket_chat_url.length) {
         other_params = url.replace(rcmail.env.rocket_chat_url, "");
       }
		   $(this).attr('href', rcmail.env.rocket_chat_params_url.replace("%25%25other_params%25%25", encodeURIComponent(other_params)));
	   }	
	});
});