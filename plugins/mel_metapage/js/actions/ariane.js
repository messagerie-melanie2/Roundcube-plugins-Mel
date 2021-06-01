$(document).ready(() => {
    $(".rocket").addClass("selected");
    rcmail.addEventListener("init", () =>{
        mm_st_CreateOrOpenModal("rocket", true);
        // new Promise(async (a,b) => {
        //     while($(".discussion-frame").length === 0)
        //     {
        //         await delay(500);
        //     }
        //     $(".discussion-frame").css("display", "");
        // });
    });

});