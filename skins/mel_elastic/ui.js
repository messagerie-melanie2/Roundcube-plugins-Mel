$(document).ready(() => {
    if (parent === window)
    {
        //La sidebar étant en position absolue, on décale certaines divs pour que l'affichage soit correct.
        const width = "60px";
        if ($("#layout-sidebar").length > 0)
            $("#layout-sidebar").css("margin-left", width);
        else if ($("#layout-content").length > 0)
            $("#layout-content").css("margin-left", width);
    }
});