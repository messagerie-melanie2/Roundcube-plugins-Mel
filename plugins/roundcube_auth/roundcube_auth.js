
/**
 * Plugin roundcube_auth - Associated JS file
 */
function docReady(fn)
{
    // see if DOM is already available
    if (document.readyState === "complete" 
        || document.readyState === "interactive")
    {
        // call on next available tick
        setTimeout(fn, 1);
    } else { document.addEventListener("DOMContentLoaded", fn); }
}

docReady(function()
{
    // DOM is loaded and ready for manipulation here

    //=====
    //
    //=====
    if(window.rcmail)
    {
        // NOT USED CURRENTLY
        rcmail.addEventListener('plugin.auth_redirect', function(evt)
        {
            // console.log("PLUGIN_AUTH_REDIRECT");
            // console.log(evt);
            // console.log(window.location);
            // // window.location
            // const baseURL = "https://rcube.preprod.m2.e2.rie.gouv.fr/bureau/"
            // window.location.replace(`${baseURL}?${evt}`);
        });
    }
    
    //=====
    //
    //=====
    const forms = document.getElementsByTagName('form');

    if(forms.length > 0)
    {
        for (let form of forms)
        {
            // Select login form
            if(form.action.includes('?_task=login'))
            {
                form.addEventListener('submit', (e) =>
                {
                    // Select OIDC button
                    if(e.submitter.id == "rcmlogin_oidc")
                    {
                        // Avoid form submission
                        e.preventDefault();

                        // Redirect to OIDC route
                        window.location.replace(`${window.location.origin}?oidc=1`);
                    }
                });
            }
        }
    }
});