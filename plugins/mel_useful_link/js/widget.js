$(document).ready(() => {
    if (rcmail.env.is_widget === true)
    {
        $('.not-widget').css('display', "none");
        $("#layout-content").css("padding", '0');
        $('.widget-links').each((i, e) => {
            e = $(e);
            if (!e.children().hasClass('row')) e.addClass('row');
        });
        $('.widget-no-events').css("pointer-events", 'none');
    }
});