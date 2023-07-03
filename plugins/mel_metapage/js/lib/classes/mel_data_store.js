/**
 * Gère le stockage local pour éviter les erreurs de quota.
 * Inspired by https://github.com/nisalperi/DataStore/blob/master/dataStore.js
 */
export class MelDataStore {
    /**
     * Constructeur de la classe
     * @param {string} name Nom de la clé qui regroupera toute les données dans le stockage local
     * @param {{localcache:boolean} | {}} config Configuration des données
     */
    constructor(name, config) {
        this._init()._setup(name, config);
    }

    /**
     * Initisalise les variables de la classe
     * @private Cette fonction est privée, merci de ne pas l'utiliser en dehord de la classe
     * @returns Chaîne
     */
    _init() {
        this.queue = [];
        this.store = {};
        this.name = EMPTY_STRING;
        this.config = {};
        return this;
    }

    /**
     * Associe les variables de la classe
     * @param {string} name Nom de la clé qui regroupera toute les données dans le stockage local
     * @param {{localcache:boolean} | {}} config Configuration des données
     * @private Cette fonction est privée, merci de ne pas l'utiliser en dehord de la classe
     * @returns Chaîne
     */
    _setup(name, config) {
        if (!name) {
            throw new Error('MelDataStore object should have a name');
        }

        this.name = name;

        if (!!config) this.config = config;

        //Le cache local est activé par défaut
        if (!this.config?.localcache) this.config.localcache = true;
        
        if (this.config.localcache) {
            const tmp = JSON.parse(localStorage.getItem(this.name));

            if (tmp) this.store = tmp;
            
            for (const d in tmp) {
                if (tmp.hasOwnProperty(d)) {
                    this.queue.push(d);
                }
            }
        }

        return this;
    }

    /**
     * Ajoute un indexe à la queue
     * @param {string} id Id qui sera ajouté à la queue
     * @private Cette fonction est privée, merci de ne pas l'utiliser en dehord de la classe
     * @returns Chaîne
     */
    _pushToQueue(id) {
        this.queue.push(id);
        return this;
    }

    /**
     * Vérifie si un indexe éxiste
     * @param {string} id Id qui sera vérifier
     * @private Cette fonction est privée, merci de ne pas l'utiliser en dehord de la classe
     * @returns Chaîne
     */
    _inQueue(id) {
        for (let i = 0, len = this.queue.length; i < len; ++i) {
            if (id === this.queue[i]) return true;
        }

        return false;
    }

    /**
     * Supprime les valeurs les plus anciennes
     * @private Cette fonction est privée, merci de ne pas l'utiliser en dehord de la classe
     * @returns Chaîne
     */
    _removeOldestValue() {
        const id = this.queue.shift();
        this.store = JSON.parse(localStorage.getItem(this.name));
        delete this.store[id];
        localStorage.setItem(this.name, JSON.stringify(this.store));

        return this;
    }

    /**
     * Stocke une valeur. Si le stockage local est activé, ajoute la valeur et supprime la plus ancienne si un erreur de quota est lancé.
     * @param {string} id Clé qui permet de retrouver la données
     * @param {*} val Donnée à sauvegarder, doit pouvoir être convertit en json
     * @returns Chaîne
     */
    set(id, val) {
        if (this.config.localcache) {
            let self = this;
            try {
                self.store[id] = val;
                localStorage.setItem(this.name, JSON.stringify(this.store));
                if (!this._inQueue(id)) this._pushToQueue(id);
            } catch (e) {

                if (Object.keys(self.store).length <= 1) {
                    console.error(`###[MelDataStore]Impossible d'ajouter ${id} au stockage local`, self.getSize(), e, self, val);
                }
                else {
                    console.warn('/!\\[MelDataStore]', e, this.getSize(), self, val);
                    self._removeOldestValue()
                    .set(id, val);
                }
            }
        } else {
            this.store[id] = val;
        }

        return this;
    };

    /**
     * Récupère une valeur
     * @param {string} id Clé qui permet de retrouver et récupérer l'objet
     * @returns {* | null}
     */
    get(id) {
        return this.store[id] ?? null;
    }

    /**
     * Supprime une donnée
     * @param {string} id Clé de la donnée à supprimer 
     * @returns Chaîne
     */
    remove(id) {
        delete this.store[id];
        localStorage.removeItem(id);

        return this;
    }

    /**
     * Récupère la taille du stockage
     * @returns {string} Taille en mo et en nb de char
     */
    getSize() {
        return `${mel_metapage.Functions.calculateObjectSizeInMo(this.store)} mo | ${localStorage.getItem(this.store)?.length ?? 0} charactères`;
    }
}