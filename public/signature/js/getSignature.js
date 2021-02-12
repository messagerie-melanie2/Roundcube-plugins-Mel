/**
 * JQuery Functionality to write generated signature into textarea
 * Clicking on the text area automatically selects all text
 */

$(document).ready(function() {
    $('#markup').text($('#signature').html());

    $('#markup').focus(function() {
        $('#markup').select();
        // Work around Chrome's little problem
        $('#markup').on("mouseup", function() {
            // Prevent further mouseup intervention
            $('#markup').onmouseup = null;
            return false;
        });
    });
});
