$(document).ready(() => {
    $(".rocket").addClass("selected");
    rcmail.addEventListener("init", () =>{
        //mm_st_CreateOrOpenModal("rocket", true);
        mel_metapage.Functions.open_chat(rcmail.env.chat_go_action)
        // mel_metapage.Functions.change_frame('rocket', true, true).then(() => {
        //     if (rcmail.env.chat_go_action !== undefined)
        //     {
        //         if (rcmail.env.chat_go_action[0] !== '/')
        //             rcmail.env.chat_go_action = `/${rcmail.env.chat_go_action}`;
        //         parent.$('.discussion-frame')[0].contentWindow.postMessage({
        //             externalCommand: 'go',
        //             path: rcmail.env.chat_go_action
        //         }, '*')
        // }
        // });
        // new Promise(async (a,b) => {
        //     while($(".discussion-frame").length === 0)
        //     {
        //         await delay(500);
        //     }
        //     $(".discussion-frame").css("display", "");
        // });
    });

});