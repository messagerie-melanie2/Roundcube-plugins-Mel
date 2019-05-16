$(document).ready(function() {
	$('a').click(function (event) 
	{ 
	   var url = $(this).attr('href');
	   if (url.indexOf(rcmail.env.owncloud_external_url) == 0) {
	     var other_params = "";
	     if (url.length > rcmail.env.owncloud_external_url.length) {
	       other_params = url.replace(rcmail.env.owncloud_external_url, "");
	     }
		   $(this).attr('href', rcmail.env.owncloud_file_url.replace("%25%25other_params%25%25", encodeURIComponent(other_params)));
	   }	
	});
});