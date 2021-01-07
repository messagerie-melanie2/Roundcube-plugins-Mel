$(document).ready(function() {   
    $('#_item_twitter_account').on('change', function(event) {
        var val = $(this).val().split('twitter.com/').pop();
        if (val.indexOf('?') !== -1) {
            val = val.split('?')[0];
        }
        if (val.indexOf('/') !== -1) {
            val = val.split('/')[0];
        }
        $('#_item_twitter_account').val(val);
        $('#_item_twitter_name').val(rcmail.get_label('mel_portail.twitter of ') + val);
        $('#_item_twitter_tooltip').val(rcmail.get_label('mel_portail.this is the twitter of ') + val);
	});
});