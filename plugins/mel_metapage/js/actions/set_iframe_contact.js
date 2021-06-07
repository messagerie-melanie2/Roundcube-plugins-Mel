$(document).ready(function() {
    $("#contact-frame").attr("src", rcmail.env.contact_url + "&_accept_back=true" + (window !== parent ? `&${rcmail.env.mel_metapage_const.key}=${rcmail.env.mel_metapage_const.value}` : ""));

    if (!$(".button-calendar ").hasClass("calendar"))
        $(".button-calendar ").addClass("calendar")

    $(".contacts").addClass("selected");

    setTimeout(() => {

        setInterval(() => {
            let item = $("iframe#contact-frame").contents().find("#rcmbtnfrm100");
            
            if (item.hasClass("edit") && item.attr("disabled") === "disabled")
                item.removeAttr("disabled");
        }, 100);

    }, 1000);

});