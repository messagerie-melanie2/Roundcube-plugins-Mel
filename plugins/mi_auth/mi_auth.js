if(window.rcmail){
  $(window).on("load", function(){
    let dom = document.getElementById('header');
    let url = window.location.href.split('?')[1];
    let is_courrielleur = rcmail.env.mi_auth_courrielleur;

    if((dom != null) && !is_courrielleur){
      if(rcmail.env.mi_auth_verify !== null){
        let params = {headers: {}};
        params.credentials = 'include';
        params.headers['Content-Type'] = 'text/plain; charset=UTF-8';
        fetch(rcmail.env.mi_auth_verify, params)
        .then((response) => {
          response.json()
          .then((json) => {
            if(json.email != undefined){
              if(json.email != rcmail.env.user_email){
                window.location = '/?_token=' + rcmail.env.request_token + '&_task=logout&_baduser=1';
              }
            }
          })
        })
        .catch((e) => {
            console.error(e);
        })
      }

  		let scr = document.createElement('script');
  		scr.type="text/javascript";
  		scr.async = false;
  		scr.id = 'scr_portail_js';
  		let d = new Date();
  		scr.src = rcmail.env.portail_uri + 'ressources/js/external.js?v=' + d.getTime();
  		document.head.appendChild(scr);
  		let logo = dom.getElementsByClassName('logo')[0];
  		logo.classList.toggle('hidde');
    }
  });
}
