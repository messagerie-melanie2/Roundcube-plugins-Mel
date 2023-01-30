$(document).ready(() => {
    $(".rocket").addClass("selected");
    rcmail.addEventListener("init", () =>{
        mel_metapage.Functions.open_chat(rcmail.env.chat_go_action)
    });

});