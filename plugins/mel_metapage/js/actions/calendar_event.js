$(document).ready(
    function ()
    {
        rcmail.addEventListener("init", () => {

            rcmail.addEventListener('responsebefore', function(props) {
                const action = "update_cal";

                if (props.response && props.response.action == 'event') {
                    mel_metapage.Functions.call(action, false, {
                        _integrated:true,
                        eval:"always",
                        args:{
                            child:true,
                            goToTop:true
                        }
                    });
                    
                }
                else if (props.response && (props.response.action === "mailimportitip" || props.response.action === "itip-delegate" || props.response.action === "itip-remove"))
                {
                    let config = {
                        _integrated:true,
                        eval:"always",
                        args:{
                            refresh:true,
                            child:true,
                            goToTop:true
                        }
                    };

                    if (window.mel_metapage !== undefined)
                        mel_metapage.Functions.call(action, false, config);
                    else
                    {
                        config["exec"] = action;
                        config["child"] = false;
                        parent.postMessage(config);
                    }
                    
                }
    
            });

            parent.metapage_frames.addEvent("open.after", async (eClass, changepage, isAriane, querry, id, actions) => {
            
                if (eClass === "calendar")
                {
                    querry = $(`iframe#${id}`);
                    if (querry.length > 0)
                    {
                        //querry[0].contentWindow.$('#calendar').fullCalendar( 'refetchEvents' );
                        querry[0].contentWindow.$('#calendar').fullCalendar('rerenderEvents');
                    }
                    else
                    {
                        try {
                            //$('#calendar').fullCalendar( 'refetchEvents' );
                            $('#calendar').fullCalendar('rerenderEvents');
                        } catch (error) {
                            
                        }
                    } 
                }
            
            });

        });
    


    }  
);

function search_action(searchValue)
{
    const timeoutValue = 111;
    setTimeout(async () => {
        await wait(() => rcmail.busy);
        $("#searchform").val(searchValue).parent().submit();
    }, timeoutValue);
}