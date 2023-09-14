import { ParapheurAction } from "./parapheur_action.js";

/** La ligne `const command_parapheur = 'toParapheur';` déclare une variable constante nommée
* `command_parapheur` et lui attribue la valeur `'toParapheur'`. Cette constante est utilisée comme
* identifiant de commande pour une action spécifique dans le code. 
*/
const command_parapheur = 'toParapheur';
/** La classe ParapheurMailAction est une classe JavaScript qui étend la classe ParapheurAction et
fournit une méthode pour envoyer un mail au système Parapheur. */
export class ParapheurMailAction extends ParapheurAction {
    constructor(){
        super();
    }

/**
 * La fonction principale enregistre une commande appelée "command_parapheur" et l'affecte à une
 * fonction appelée "command_to_parapheur".
 * @param args - Le paramètre `args` est un tableau qui contient les arguments de ligne de commande
 * transmis à la fonction `main`.
 */
    main(...args) {
        super.main(...args);

        this.rcmail().register_command(command_parapheur, () => {
            this.command_to_parapheur();
        }, true);
    }

    /**
     * La fonction `command_to_parapheur()` envoie un mail au "parapheur" et affiche un message de
     * confirmation en cas de succès, ou un message d'erreur en cas d'échec.
     */
    command_to_parapheur() {
        const mail_uid = this.rcmail().get_single_uid();

        this.post('to_parapheur', (data) => {
            if ('true' === data) this.rcmail().display_message('Message envoyé au parapheur !', 'confirmation');
            else this.rcmail().display_message('Impossible de transférer le mail au parapheur !', 'error');
        }, {
            params: {
                _uid:mail_uid,
                _folder: this.get_env('mailbox') 
            }
        });
    }

/**
 * La fonction `exec_command_to_parapheur()` exécute une commande pour interagir avec le système
 * "parapheur".
 * @returns le résultat de la méthode `command()` appelée sur l'objet `rcmail()`.
 */
    static exec_command_to_parapheur() {
        return this.rcmail().command(command_parapheur);
    }
}