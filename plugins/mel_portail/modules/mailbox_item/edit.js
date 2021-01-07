$(document).ready(function() {   
    $('#_item_mailbox_item_mailbox').on('change', function(event) {
		$('#_item_mailbox_item_name').val($(this).find('option:selected').text());
	});
});