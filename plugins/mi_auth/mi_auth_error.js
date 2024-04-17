(function(){
  "use strict";
  class mceError{
    config;
    decompte_ts = 60;
    timer = null;
    portail_config = null;
    constructor(){
      this.config = JSON.parse(document.getElementById('app_conf').innerText);
      document.getElementById('btn_portail').addEventListener('click',() => {this.goPortail()});
      document.getElementById('btn_refresh').addEventListener('click',() => {this.refresh()});
      this.decompte();
    }
    decompte(){
      let here = this;
      this.timer = setInterval(() => {
        if(here.decompte_ts > 0){
          here.decompte_ts--;
          document.getElementById('refresh_ts').innerHTML = here.decompte_ts;
        }else{
          clearInterval(here.timer);
          here.refresh();
        }
      }, 1000);

    }
    goPortail(){
      document.location = this.config.auth_uri;
    }
    refresh(){
      document.location = '/';
    }
    async init(){
      let info = await this.getInfo();
      await this.getPortailConfig();
      this.setLogos();
      this.setFooter(info);
    }
    async getPortailConfig(){
      let uri = this.config.auth_uri + 'config/config.json';
      let f = await fetch(uri, this.fetchH);
      if(!f.ok)
        return;
      this.portail_config = await f.json();
    }
    setFooter(info){
      this.setCr(info);
      this.setRight();
    }
    async setRight(){
      if(!this.portail_config.aide.enable)
        return;
      let a = document.createElement('a');
      a.href = this.portail_config.aide.url;
      a.target = "mce_info";
      a.innerHTML = this.portail_config.aide.title;
      document.getElementById('right').appendChild(a);
    }
    setCr(info){
      let span1 = document.createElement('span');
      span1.innerHTML = '©' + info.libelle;
      let span2 = document.createElement('span');
      span2.innerHTML = info.direction;
      let cr = document.getElementById('cr');
      cr.appendChild(span1);
      cr.appendChild(span2);
    }
    setLogos(){
      this.setLogo('logoMi', this.portail_config.logos.mi);
      this.setLogo('logoMCE', this.portail_config.logos.mce);
    }
    setLogo(id, logoId){
      let img = document.createElement('img');
      let src = this.config.api_uri + 'ministere/pureLogo?logoid=' + logoId;
      img.src = src;
      img.alt = id;
      img.classList.add('logo');
      document.getElementById(id).appendChild(img);
    }
    async getInfo(){
      let uri = this.config.api_uri + 'ministere/info';
      let f = await fetch(uri, this.fetchH);
      if(!f.ok)
        return false;
      return await f.json();
    }
    fetchH(){
      return {
        headers: {
          'Content-Type': 'text/plain; charset=UTF-8'
        },
        credentials: "include"
      };
    }
  }
  window.addEventListener('load', () => {
    let mce = new mceError();
    mce.init();
  });
})()
