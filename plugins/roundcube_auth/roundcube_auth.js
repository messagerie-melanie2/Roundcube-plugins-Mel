
/**
 * Plugin roundcube_auth - Associated JS file
 */

if (window.rcmail)
{
    rcmail.addEventListener('plugin.auth_redirect', function(evt)
    {
        console.log(evt);
        // window.location
    });
}
