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

    class Mel_Elastic {
        constructor() {
        }
        getRandomColor() {
            var letters = '0123456789ABCDEF';
            var color = '#';
            for (var i = 0; i < 6; i++) {
                color += letters[Math.floor(Math.random() * 16)];
            }
            return color;
        }
    }
    

    window.MEL_ELASTIC_UI = new Mel_Elastic();

});

