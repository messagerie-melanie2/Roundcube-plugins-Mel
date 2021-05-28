$(document).ready(
    function ()
    {
        rcmail.addEventListener("init", () => {

            rcmail.addEventListener('responsebefore', function(props) {
                if (props.response && props.response.action == 'event') {
                    let navigator = window != parent ? parent : window;
                    navigator.rcmail.triggerEvent(mel_metapage.EventListeners.calendar_updated.get);
                    
                    if (rcmail.env.task === "calendar")
                    {
                        if (rcmail.busy)
                        {
                            rcmail.set_busy(false);
                            $(".loading").remove();
                        }
                    }
                    
                }
    
            });

        });
    


    }  
);