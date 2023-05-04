/**
 * Représente un LI
 */
export class html_li extends mel_html2 {
    /**
     * Constructeur de la classe
     * @param {Object} options - Les options du constructeur.
     * @param {Object} options.attribs - Attributs de l'élément
     */
    constructor({attribs={}, contents=[]}) {
        super('li', {attribs, contents});
    }
}

/**
 * Représente un UL.
 * 
 * Seul des LI peuvent être ajoutés.
 */
export class html_ul extends mel_html2 {
    constructor({attribs={}}) {
        super('ul', {attribs, contents:[]});
    }

    /**
     * Ajoute un li à la liste des li
     * @param {Object} options - Les options du constructeur.
     * @param {Object} options.attribs - Attributs de l'élément
     * @returns {html_li} Li ajouter
     */
    li({attribs={}, contents=[]}) {
        const li = new html_li({attribs, contents});
        this.addContent(li);
        return li;
    }

    /**
	 * Ajoute un élément enfant
	 * @param {html_li} mel_html Elément à ajouter
	 * @returns Chaînage
	 */
	addContent(mel_html) {
		super.addContent(mel_html);
        if (!(mel_html instanceof html_li)) {
            delete this.jcontents[this.count() - 1];
            throw {msg:'Seul un li peut-être ajouter !', errored:[this, mel_html]};
        }
        return this;
	}
}