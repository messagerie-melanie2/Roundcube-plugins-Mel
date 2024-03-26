class Mce{
  badUser = false;
  conf = null;
  async setCss(){
    if(this.conf == null)
      await this.getConf();
    if(document.getElementById('css_mi_auth') == null){
      let css = document.createElement('link');
      css.type = "text/css";
      css.href = "/plugins/mi_auth/mi_auth.css?v=" + this.conf.version;
      css.id = "css_mi_auth";
      css.setAttribute('rel', "stylesheet");
      document.head.appendChild(css);
    }
  }
  setFavIco(){
    let link = document.querySelector('link[rel~="icon"]');
    if(!link){
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = '/plugins/mi_auth/favicon.ico';
  }
  setTitle(){
    document.title = 'MCE';
  }
  setPortailJs(){
    if(document.getElementById('scr_portail_js') == null){
      let scr = document.createElement('script');
      scr.type="text/javascript";
      scr.async = false;
      scr.id = 'scr_portail_js';
      scr.src = rcmail.env.portail_uri + 'ressources/js/external.js';
      document.head.appendChild(scr);
    }
  }
  async getConf(){
    if(window.mce.config == undefined){
      let json = await fetch(rcmail.env.portail_uri + 'config/config.json');
      window.mce.config =  await json.json();
    }
    this.conf = window.mce.config;
  }
  setBadUser(){
    this.badUser = true;
    window.location = '/?_token=' + rcmail.env.request_token + '&_task=logout&_baduser=1';
    return;
  }
  async verifyUser(){
    let params = {
      headers:  {
        'Content-Type': 'text/plain; charset=UTF-8'
      },
      credentials: 'include',

    };
    let response = await fetch(rcmail.env.mi_auth_verify, params);
    if(!response.ok){
      this.setBadUser();
      return;
    }
    let json = await response.json();
    if(json.email == undefined){
      this.setBadUser();
      return;
    }

    if(json.email !== rcmail.env.user_email){
      this.setBadUser();
      return;
    }
  }
  init(){
    if(window.mce === undefined)
      window.mce = {};
    this.setTitle();
    this.setFavIco();
  }
}
if(window.rcmail){
  let mce = new Mce();
  mce.init();
  $(window).on("load", async function(){
    let dom = document.getElementsByTagName('head')[0];
    let url = window.location.href.split('?')[1];
    let is_courrielleur = rcmail.env.mi_auth_courrielleur;
    if((dom != null) && !is_courrielleur){
      mce.setCss();
      if(rcmail.env.mi_auth_verify !== null){
        mce.verifyUser();
        if(!mce.badUser)
          mce.setPortailJs();
      }
    }
  });
}
