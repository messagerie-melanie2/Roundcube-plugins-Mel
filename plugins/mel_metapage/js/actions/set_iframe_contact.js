$(document).ready(function() {
    $("#contact-frame").attr("src", rcmail.env.contact_url);
    if (!$(".button-calendar ").hasClass("calendar"))
        $(".button-calendar ").addClass("calendar")
    $(".contacts").addClass("selected");
    setTimeout(() => {
        //console.log($("iframe#contact-frame").contents());
        setInterval(() => {
            let item = $("iframe#contact-frame").contents().find("#rcmbtnfrm100");
            if (item.hasClass("edit") && item.attr("disabled") === "disabled")
                item.removeAttr("disabled");
        }, 100);
    }, 1000);
});