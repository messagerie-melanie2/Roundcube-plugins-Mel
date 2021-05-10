/**
 * @class Représente la réponse d'une requête depuis Nextcloud.
 * @param {*} xml Fichier xml à convertir en objet
 * @param {*} func_class Classe utiliser pour convertir les propriétés en objet.
 * @param {*} includeFolder Les dossiers sont gardés dans la classe.
 * @param {*} includeInvalid Les objets invalides sont gardés dans la classe.
 */
function Nextcloud_Response(xml, func_class, includeFolder = false, includeInvalid = false)
{
    this.files = [];
    this.type = func_class;
    this.document = xml;
    let tmp = xml.firstElementChild.children;
    for (let index = 0; index < tmp.length; index++) {
        const element = tmp[index];
        const file = new func_class(element);
        if (file.type !== mel_metapage.Symbols.nextcloud.folder || includeFolder)
        {
            if (file.is_valid_file !== false)
                this.files.push(file);
        }
    }
}

/**
 * Récupère un fichier. 
 * Si plusieurs noms sont identiques, le premier trouvé sera renvoyé.
 * @param {string} filename Nom du fichier à récupérer.
 */
Nextcloud_Response.prototype.GetFile = function(filename)
{
    var tmp = Enumerable.from(this.files).where(x => x.name.includes(filename)).firstOrDefault(null);
    return tmp === undefined ? null : tmp;
}

/**
 * Récupère plusieurs fichiers qui porte le même nom.
 * @param {string} filename Fichiers à chercher.
 */
Nextcloud_Response.prototype.GetFiles = function(filename)
{
    return Enumerable.from(this.files).where(x => x.name.includes(filename)).toArray();
}

/**
 * Vérifie si un fichier éxiste.
 * @param {string} filename Fichier à rechercher.
 */
Nextcloud_Response.prototype.FileExist = function(filename)
{
    return this.GetFiles(filename).length > 0;
}