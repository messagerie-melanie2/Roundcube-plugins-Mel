
function lm_OnClick(e, action)
{
    // if (action === "dashboard")
    //     e.setAttribute("href", rcmail.url("index"))
    // else
        e.setAttribute("href", rcmail.url("index", "_data="+action))
}