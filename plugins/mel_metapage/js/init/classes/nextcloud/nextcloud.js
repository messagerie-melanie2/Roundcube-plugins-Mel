/**
 * Classe d'accès à Nextcloud.
 * @param {string} user Utilisateur qui éffectue des actions sur son espace Nextcloud.
 */
function Nextcloud(user)
{
  this.user = user;
}

/**
 * @async
 * Récupère tout les documents d'un dossier.
 * @param {string} folder Dossier en particulier. null = dossier de l'utilisateur
 * @param {boolean} getFolders Récupérer ou non les dossiers.
 * @param {string} href URL de la requête.
 * @returns {Promise<Nextcloud_Response>} Reponse de la requête.
 */
Nextcloud.prototype.getAllDocumentsFromFolder = async function(folder = null, getFolders = false, href = null)
{
  href = href === null ? (Nextcloud.url() + '/remote.php/dav/files/'+this.user+'/'+(folder === null ? "" : folder)) : Nextcloud.origin + href;
  return fetch(href, {withCredentials: true,
  method: 'PROPFIND', 
  credentials: "same-origin",
  headers: {
      'OCS-APIRequest': 'true',
      // Authorization:this.auth
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
  body: 
      '<?xml version="1.0"?><d:propfind xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns" xmlns:nc="http://nextcloud.org/ns"><d:prop><d:getlastmodified /><d:getetag /><d:getcontenttype /><d:resourcetype /><oc:fileid /><oc:permissions /><oc:size /><d:getcontentlength /><nc:has-preview /><oc:favorite /><oc:comments-unread /><oc:owner-display-name /><oc:share-types /></d:prop></d:propfind>'
  
  })
   .then(function(response) {
  //     console.log(response);
     return response.text();
   })
  .then(function(text) {
    //console.log('Request successful');
    //let parser = new DOMParser();
    let xmlDoc = $.parseXML(text);//parser.parseFromString(text,"text/xml");
    //console.log(xmlDoc);
    //window.doc = xmlDoc;
    return new Nextcloud_Response(xmlDoc, Nextcloud_File, getFolders);
    //let all = xmlDoc.getElementsByTagName("d:response");

  })
  .catch(function(error) {
    console.error('Request failed', error)
    return undefined;
  });
}

Nextcloud.prototype.GetFile = function(path)
{
  const href = Nextcloud.url() + '/remote.php/dav/files/'+this.user+'/'+path;

  return fetch(href, {withCredentials: true,
    method: 'PROPFIND', 
    credentials: "same-origin",
    headers: {
        'OCS-APIRequest': 'true',
        // Authorization:this.auth
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
    body: 
        '<?xml version="1.0"?><d:propfind xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns" xmlns:nc="http://nextcloud.org/ns"><d:prop><d:getlastmodified /><d:getetag /><d:getcontenttype /><d:resourcetype /><oc:fileid /><oc:permissions /><oc:size /><d:getcontentlength /><nc:has-preview /><oc:favorite /><oc:comments-unread /><oc:owner-display-name /><oc:share-types /></d:prop></d:propfind>'
    
    }).then(function(response) {
      //     console.log(response);
         return response.text();
       })
      .then(function(text) {
        //console.log('Request successful');
        //let parser = new DOMParser();
        let xmlDoc = $.parseXML(text);//parser.parseFromString(text,"text/xml");
        //console.log(xmlDoc);
        //window.doc = xmlDoc;
        return new Nextcloud_Response(xmlDoc, Nextcloud_File, false);
        //let all = xmlDoc.getElementsByTagName("d:response");
    
      })
      .catch(function(error) {
        console.error('Request failed', error)
        return new Promise(() => {});
      });
}

/**
 * @async
 * Créer un document dans un dossier.
 * @param {string} filename Nom du fichier.
 * @param {string} ext Extention du fichier (null si il est dans le filename).
 * @param {string} href URL de la requête.
 * @param {function} configModifier Fonction qui modifie la config de la requête.
 * @param {string} folder Dossier où créer le document.
 */
Nextcloud.prototype.createDocument = async function(filename, ext = null, href = null, configModifier = null, folder = null)
{
    if (href === "")
      href = null;
    href = href === null ? (Nextcloud.url() + "/remote.php/dav/files/"+this.user+"/" + (folder === null ? "" : folder + "/") + filename + (ext === null ? "" : ("." + ext))) : Nextcloud.origin + href;
    let config = {withCredentials: true,
      method: 'PUT', 
      credentials: "same-origin",
      headers: {
          'OCS-APIRequest': 'true',
          // Authorization:this.auth
          // 'Content-Type': 'application/x-www-form-urlencoded',
        },
      };
    if (configModifier !== null)
      config = configModifier(config);
    return fetch(href, config)
    .then(function(response) {
      //console.log(response);
      return response.text();
    })
    .then(function(text) {
      //console.log('Request successful', text);
    })
    .catch(function(error) {
      console.error('Request failed', error)
    });
    // const url = "http://localhost/nextcloud/remote.php/dav/files/tommy.delphin.i/RotoTest.txt";
    // var objHTTP = new XMLHttpRequest();
    // objHTTP.open('PUT', url, true);
    // objHTTP.setRequestHeader("OCS-APIRequest","true");
    // objHTTP.setRequestHeader("Authorization", "Basic " + Base64.encode("tommy.delphin.i:12002@lmLM"));
    // objHTTP.onreadystatechange = function() {
    //     if (objHTTP.readyState == XMLHttpRequest.DONE) {
    //         console.log(objHTTP.responseText);
    //     }
    // }
    // objHTTP.send();
}

/**
 * Récupère un document.
 * @param {string} filename Nom du fichier.
 * @param {string} folder Dossier où chercher le fichier.
 * @param {string} href URL de la requête.
 * @returns {Promise<Nextcloud_File>} Document.
 */
Nextcloud.prototype.searchDocument = async function(filename, folder = null, href = null) {
  var tmp = await this.getAllDocumentsFromFolder(folder, false, href);
  //console.log("¤¤¤$", tmp, filename, tmp.GetFile(filename));
  return (await this.getAllDocumentsFromFolder(folder, false, href)).GetFile(filename);
}

/**
 * Récupère tout les dossiers.
 */
Nextcloud.prototype.getAllFolders = async function ()
{
  return this._getAllFolders();
}

/**
 * Récupère tout les dossiers.
 * @param {string} folder Dossier de recherche
 * @param {string} parent Dossier parents.
 */
Nextcloud.prototype._getAllFolders = async function(folder = null, parent = "")
{
  let retour = [];
  retour.addRange = function(...args)
  {
    for (let i = 0; i < args.length; ++i) {
      const item = args[i];
      this.push(item);
    }
  }
  let tmp = (await this.getAllDocumentsFromFolder(folder, true)).files;
  let name = "";
  for (let index = 0; index < tmp.length; index++) {
    const element = tmp[index];
    if (!element.is_file() && !Enumerable.from(retour).any(x => x.link === element.href))
    {
      name = (folder === null ? "" : (folder + "/")) + element.name;
      if (element.href !== parent && element.name !== this.user)
        retour.addRange({name:name, link:element.href}, ...(await this._getAllFolders(name, element.href)))
    }
  }
  return retour;
}

Nextcloud.prototype.go = async function(file, goFunc = null)
{
  if (file.id === undefined)
  {

    let config = {
      _folder:file.path
    };

    file = await mel_metapage.Functions.get(
        mel_metapage.Functions.url("roundrive", "folder_list_all_items"),
        config,
        (datas) => {
            datas = JSON.parse(datas);
            for (const key in datas) {
              if (Object.hasOwnProperty.call(datas, key)) {
                const element = datas[key];
                if (element.basename === file.name)
                  return element;
              }
            }
            rcmail.display_message("Le fichier n'existe pas !", "error");
            return "stop";
        },
        (xhr, ajaxOptions, thrownError) => {
            console.error(xhr, ajaxOptions, thrownError);
            rcmail.display_message("Impossible de se connecter au stockage !", "error");
            return "stop";
        }
    );

    if (file === "stop")
        return;

  }

  if (goFunc !== null)
  {
    goFunc(file);
  }
  else {

    mel_metapage.Functions.doActionFrame("stockage", async (actionType, file) => {

      const url = `${Nextcloud.index_url}/apps/files?dir=/${file.dirname}&openfile=${file.id}`;

      switch (actionType) {
        case 0:
        case 1:
          await mel_metapage.Functions.change_frame("stockage", true, true);
          $(`iframe.stockage-frame`)[0].contentWindow.postMessage({
            exec:"update_location",
            _integrated:true,
            always:true,
            child:false,
            args:[url, "stockage-frame", "mel_nextcloud_frame"]
          }); 
          break;
        
        case 2:
          window.location.href = url;
          break;
      
        default:
          break;
      }
    }, file);
    
    
  }
}

// /**
//  * Permet d'ouvrir la frame Nextcloud.
//  * @param {*} data Données pour ouvrir la frame.
//  * @param {boolean} isFileData Si les données est un objet de type Nextcloud_File.
//  */
// Nextcloud.prototype.go = async function(data, isFileData = true)
// {
//   //console.log("data", data);
//   async function open()
//   {
//     mm_st_OpenOrCreateFrame("stockage", false);
//     rcmail.set_busy(true, "loading");
//     await wait(() => $('.stockage-frame').length === 0);
//     rcmail.set_busy(true, "loading");
//     needToOpen = true;
//     $('.stockage-frame').css("padding-top","60px");
//     return $('.stockage-frame');
//   }
//   rcmail.set_busy(true, "loading");
//   let frameToUpdate = null;
//   let needToOpen = false;
//   //console.log(rcmail.env.current_frame, $("#" + rcmail.env.current_frame).hasClass("stockage-frame"), $(".stockage-frame").length === 0);
//   if (rcmail.env.current_frame === undefined && rcmail.env.task === "stockage")
//     frameToUpdate = $("#mel_nextcloud_frame");
//   else if (!$("#" + rcmail.env.current_frame).hasClass("stockage-frame"))
//   {
//     //console.log("zbra", $(".stockage-frame").length);
//     if ($(".stockage-frame").length === 0){
//       frameToUpdate = open(); 
//     }
//     else 
//     {
//       frameToUpdate = $('.stockage-frame');
//       $('.stockage-frame').css("padding-top","60px");
//       needToOpen = true;
//     }
//   }
//   else 
//     frameToUpdate = $('.stockage-frame').css("padding-top","60px");
//   if (isFileData)
//     data =  Nextcloud.index_url +  "/apps/files?dir=/"+data.document_path()+"&openfile=" + data.id;
//   else {
//     data = await this.searchDocument(data.file, data.folder, data.href);
//     if (data === null || data.is_valid_file === false || data.type === mel_metapage.Symbols.nextcloud.folder)
//     {  
//       return false;
//     }
//     else 
//       data = Nextcloud.index_url + "/apps/files?dir=/"+data.document_path()+"&openfile=" + data.id;
//   }
//   //console.log("src", data);
//   //console.log('fu', frameToUpdate, typeof frameToUpdate !== "function");
//   rcmail.set_busy(true, "loading");
//   if (frameToUpdate.then === undefined)
//     frameToUpdate[0].src = data;
//   else {
//     frameToUpdate = await frameToUpdate;
//     frameToUpdate[0].src = data;
//   }
//   if (needToOpen)
//     mm_st_OpenOrCreateFrame("stockage", true);
//   rcmail.set_busy(false);
//   rcmail.clear_messages();
//   return true;
// }

/**
 * Url de Nextcloud.
 */
Nextcloud.index_url = rcmail.env.nextcloud_url;
/**
 * Récupère l'url de nextcloud sans le index.php.
 * @returns {string} Url.
 */
Nextcloud.url = function()
{
  if (Nextcloud._url === undefined)
    Nextcloud._url = Nextcloud.index_url.replace("index.php", "");
  else if (!Nextcloud.index_url.includes(Nextcloud._url))
    Nextcloud._url = Nextcloud.index_url.replace("index.php", "");
  return Nextcloud._url;
}
/**
 * Base de Nextcloud. (Ex: Nextcloud => http://localhost/nextcloud, origine => http://localhost).
 */
Nextcloud.origin = (rcmail.env.nextcloud_origin === undefined || rcmail.env.nextcloud_origin === null || rcmail.env.nextcloud_origin === "") ? window.location.origin : rcmail.env.nextcloud_origin;
/**
 * Récupère l'index, ex : /nextcloud/index.php
 */
Nextcloud.getIndex = function ()
{
  return this.index_url.replace(Nextcloud.origin, "");
}
