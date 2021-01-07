$(document).ready(function() {   
    $('#_item_intranet_intranet').on('change', function(event) {
		$('#_item_intranet_name').val($(this).find('option:selected').text());
	});
});