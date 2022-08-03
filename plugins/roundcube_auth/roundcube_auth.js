
/**
 * Plugin roundcube_auth - Associated JS file
 */

if (window.rcmail)
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
