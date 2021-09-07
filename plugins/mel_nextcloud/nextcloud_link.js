$(document).ready(function() {
	$('a').click(function (event) 
	{ 
	   var url = $(this).attr('href');
	   if (url.indexOf(rcmail.env.nextcloud_external_url) == 0) {
	     var other_params = "";

	     if (url.length > rcmail.env.nextcloud_external_url.length) {
	       other_params = url.replace(rcmail.env.nextcloud_external_url, "");
	     }

		 url =  rcmail.env.nextcloud_file_url.replace("%25%25other_params%25%25", encodeURIComponent(other_params));
		 url = url.replace("&_is_from=iframe", "");

		 //if ($(this).attr("target") === "_blacn")

		$(this).attr('href', url);
	   }	
	});
});