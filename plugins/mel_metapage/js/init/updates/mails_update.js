(() => {

    rcube_rcmail_update("set_unread_count", function (mbox, count, set_title, mark)
    {
        rcmail.set_unread_count_parent(mbox, count, set_title, mark);
        rcmail.triggerEvent("set_unread", {
            mbox:mbox,
            count:count,
            set_title:set_title,
            mark:mark
        });
    });

})();