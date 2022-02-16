$(document).ready(() => {

    $(".onclick").each(async (i, e) => {
        let it = 0;
        await wait(() => {
            if (it++ >= 50)
                return false;
            
            return jQuery._data(e, 'events') === undefined;
        }, 50);

        $(e).off("mousedown").off("mouseup").off("contextmenu");
        const classes = Enumerable.from(e.classList)
        const action = classes.first(x => x.includes("f_"));

        if (action !== null)
        {
            const args = classes.where(x => x.includes("a_"));
            $(e).on("click", () => {

                if ($(e).hasClass('selected'))
                    return;

                $("#sections-table tr").removeClass('selected').removeClass('focused');
                $(e).addClass("selected focused");
                if (args.any())
                    do_action(action, ...args.toArray());
                else
                    do_action(action);
            });
        }
    });

    function do_action(action, ...args)
    {
        $("#preferences-frame")[0].src = 'https://roundcube.ida.melanie2.i2/skins/mel_elastic/watermark.html';
        switch (action) {
            case "f_edit_prefs":
                rcmail.location_href({_action: 'edit-prefs', _section: args[0].replace('a_', ''), _framed: 1}, $("#preferences-frame")[0].contentWindow, true);
                break;
            case "f_news_edit_prefs":
                rcmail.set_busy(true, "loading");
                $("#preferences-frame")[0].src = mel_metapage.Functions.url("news", "news_edit_prefs", {
                    _section:args[0].replace('a_', ''),
                    _is_from:"iframe"
                });
                break;

            default:
                break;
        }
    }
});