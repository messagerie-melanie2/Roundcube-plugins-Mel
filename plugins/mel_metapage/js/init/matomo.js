var _paq = _paq || [];
_paq.push(['setDocumentTitle', rcmail.env.task]);
_paq.push(['setDownloadClasses', ["LienTelecharg","document"]]);
_paq.push(['trackPageView']);
_paq.push(['enableLinkTracking']);
(function() {
var u="//audience-sites.din.developpement-durable.gouv.fr/";
_paq.push(['setTrackerUrl', u+'piwik.php']);
_paq.push(['setSiteId','1503']);
var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
g.type='text/javascript'; g.async=true; g.defer=true; g.src=u+'piwik.js'; s.parentNode.insertBefore(g,s);
})();

$(document).ready(function() {
  piwikTrackClick(rcmail.env.matomo_tracking);
});

rcmail.addEventListener('on_create_window.matomo', () => {
  piwikTrackClick(rcmail.env.matomo_tracking_popup);
})

rcmail.addEventListener('on_click_button.matomo', (args) => {
  _paq.push(['trackEvent', 'Bouton', args, 'Clic']);
})


function piwikTrackVideo(type,section,page,x1){
_paq.push(['trackEvent', 'Video', 'Play', page]);
}

function piwikTrackClick(config_value) {
  if (config_value) {
    for (const key in config_value) {
      if (Object.hasOwnProperty.call(config_value, key)) {
        const element = config_value[key];
        $(key).on('click', () => {
          _paq.push([...element]);
        });
      }
    }
  }
}