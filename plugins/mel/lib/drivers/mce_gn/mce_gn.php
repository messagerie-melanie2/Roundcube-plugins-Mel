<?php
/**
 * Plugin Mél
 *
 * Driver specifique au MTES pour le plugin mel
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 2
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */
use LibMelanie\Ldap\Ldap as Ldap;

include_once __DIR__ . '/../mce/mce.php';

class mce_gn_driver_mel extends mce_driver_mel {
    /**
     * Namespace for the objets
     */
    protected static $_objectsNS = "\\LibMelanie\\Api\\Gn\\";


    /**
     * Récupère et traite les infos de routage depuis l'objet LDAP
     * pour retourner le hostname de connexion IMAP et/ou SMTP
     *
     * @param array $infos Entry LDAP
     * @param string $function Nom de la fonction pour personnaliser les retours
     *
     * @return string $hostname de routage, null si pas de routage trouvé
     */
    public function getRoutage($infos, $function = '')
    {
        $dnsRoutage = rcmail::get_instance()->config->get('llng_storage_dns', null);
        $dnsListRoutage = explode(",", $dnsRoutage);
        $dnsRoutage = [];
        foreach($dnsListRoutage as $r) {
            list($dn,$replace) = explode(":",$r);
            $dnsRoutage["#$dn$#"] = $replace;
        }
        $hostname = null;
        if ($infos) {
            $routingAdresses = $infos->getObjectMelanie()->mceMailRoutingAddress;
            if ($routingAdresses
                && is_array($routingAdresses)
                && count($routingAdresses) > 0) {
                // MANTIS 3925: mineqMelRoutage multivalué
                foreach ($routingAdresses as $melroutage) {
                    if (strpos($melroutage, '%') !== false) {
                        $tmp = explode('@', $melroutage);
                        $hostname = $tmp[1];
                        $hostname = preg_replace(array_keys($dnsRoutage), array_values($dnsRoutage), $hostname);
                        break;
                    }
                }
            }
        } else {
            $infos->load('server_host');
            $hostname = $infos->server_host;
        }
        return $hostname;
    }

    /**
     * Selon le choix dans la conf amande (c tortueux je sais)
     * la recherche doit se faire via l'attr 'description' (par défaut c'était le dn (trop lourd visuellement pour l'utilisateur)
     * @param $user
     * @return bool
     */
    public function userIsGroup($user)
    {
            /** @var \LibMelanie\Api\Gn\Group $g */
            $g = $this->group();
            $g->cn = $user;
            return $g->load();
    }

    /**
     * @return boolean true if admin
     */
    public function isAdmin()
    {
        $adminGroup = rcmail::get_instance()->config->get('admin_group', null);
        if(!$adminGroup || !in_array($this->getUser()->email, $adminGroup)) return false;
        return true;
    }

    /***************** utilitaire dggn *******************/
    /**
     * remplace la dernière occurence d'un motif
     * @param $search
     * @param $replace
     * @param $subject
     * @return string|string[]
     */
    private function str_lreplace($search, $replace, $subject)
    {
        $pos = strrpos($subject, $search);

        if($pos !== false)
        {
            $subject = substr_replace($subject, $replace, $pos, strlen($search));
        }

        return $subject;
    }
    public function fixMail($mail) {
        return strpos($mail, '@') !== false ? $mail : mel::str_lreplace('%', '@', $mail);
    }

    /**
     * Retourne le username et le balpname à partir d'un username complet
     * balpname sera null si username n'est pas un objet de partage
     * username sera nettoyé de la boite partagée si username est un objet de partage
     *
     * @param string $mail Mail à traiter peut être un objet de partage ou non, ou un mailroutingaddress
     * @return array($user_object_share, $host) $username traité, $balpname si objet de partage ou null sinon, idem $host
     */
    public function getShareUserBalpHostFromMail($mail) {
        $user_host = null;
        $user_objet_share = $mail;
        // forme uid@domain@host
        if (preg_match("/^(?P<radical>.+?)@(?P<domaine>(?:(?:gendarmerie|police)\.)?interieur.gouv.fr)@(?P<host>.+?)$/",
            $mail, $m)) {
            // doit-on faire ici un fixmail ? on va passer par nginx
            $user_objet_share = $this->fixMail($m["radical"] . (isset($m["domaine"]) && $m["domaine"] ? "@".$m["domaine"] : ""));

            // si on a un @gendarmerie.interieur.gouv.fr => ce n'est pas un host
            $user_host = isset($m["host"]) && $m["host"] ? $m["host"] : null;
        }
        // forme uid%40domain@host
        elseif (preg_match("/^(?P<radical>.+?)%40(?P<domaine>(?:(?:gendarmerie|police)\.)?interieur.gouv.fr)@(?P<host>.+?)$/",
            $mail, $m)) {
            // doit-on faire ici un fixmail ? on va passer par nginx
            $user_objet_share = $this->fixMail($m["radical"] . (isset($m["domaine"]) && $m["domaine"] ? "@".$m["domaine"] : ""));

            // si on a un @gendarmerie.interieur.gouv.fr => ce n'est pas un host
            $user_host = isset($m["host"]) && $m["host"] ? $m["host"] : null;
        }
        // devrait toujours matcher
        elseif (preg_match("/^(?P<radical>.+?)(@((?P<domaine>(?:(?:gendarmerie|police)\.)?interieur.gouv.fr)|(?P<host>.+?)))?$/",
            $mail, $m)) {
            // doit-on faire ici un fixmail ? on va passer par nginx
            $user_objet_share = $this->fixMail($m["radical"] . (isset($m["domaine"]) && $m["domaine"] ? "@".$m["domaine"] : ""));

            // si on a un @gendarmerie.interieur.gouv.fr => ce n'est pas un host
            $user_host = isset($m["host"]) && $m["host"] ? $m["host"] : null;
        }
        return [$user_objet_share, $user_host];
    }

    /**
     * Retourne les valeurs depuis la session
     * @return array ($user_objet_share, $host) $user_object_share, $host
     */
    public function getShareUserBalpHostFromSession() {
        return $this->getShareUserBalpHostFromMail(rcmail::get_instance()->get_user_name());
    }

    /**
     * Retourne le username et le balpname à partir d'un username complet
     * balpname sera null si username n'est pas un objet de partage
     * username sera nettoyé de la boite partagée si username est un objet de partage
     *
     * @param string $username Username à traiter peut être un objet de partage ou non
     * @return array($username, $balpname) $username traité, $balpname si objet de partage ou null sinon
     */
    public function getBalpnameFromUsername($username) {

        $original_username = $username;
        // on peut recevoir un mailroutingaddress
        // sylvain.-.stc.bmpn.stsisi%gendarmerie.interieur.gouv.fr@organique.gendarmerie.fr
        // alexandre.-.sdac.stsisi%police.interieur.gouv.fr%gendarmerie.interieur.gouv.fr@organique.gendarmerie.fr
        // alexandre.-.sdac.stsisi%police.interieur.gouv.fr@gendarmerie.interieur.gouv.fr
        if (strpos($username, '%') !== false) {
            $inf = explode('@', $username);
            if (isset($inf[1]) && !in_array($inf[1], array("gendarmerie.interieur.gouv.fr", "police.interieur.gouv.fr", "interieur.gouv.fr")) ) {
                # si on finit par un @fqdn qui n'est pas un domaine mail et on a un % => on est sur un mailroutingaddress => on vire le serveur
                $username = $inf[0];
            }
            // s'il n'y a pas d'@ ou bien 2 % il faut corriger
            if (substr_count($username, '%') === 2 || strpos($username, '@') === false) {
                $username = $this->fixMail($username);
            }
        }

        // on a maintenant
        // sylvain.-.stc.bmpn.stsisi@gendarmerie.interieur.gouv.fr
        // alexandre.-.sdac.stsisi%police.interieur.gouv.fr@gendarmerie.interieur.gouv.fr
        // alexandre.-.sdac.stsisi%police.interieur.gouv.fr@gendarmerie.interieur.gouv.fr
        $balregexp = rcmail::get_instance()->config->get('email_regexp', false);

        if (!$balregexp || !preg_match($balregexp, $username, $m )) {
            return array($username, null);
        }

        # alexandre.-.sdac%interieur.gouv.fr@gendarmerie.interieur.gouv.fr
        # radical = alexandre.-.sdac%interieur.gouv.fr
        # uid     = alexandre
        # balp    = sdac
        # domaineuser = interieur.gouv.fr
        # domaine = gendarmerie.interieur.gouv.fr

        if (!$m["domaineuser"]) {
            $m["domaineuser"] = $m["domaine"];
        }

        $user = $m["uid"] .'@'. $m["domaineuser"];
        $balpname = $m["balp"] ? $m["balp"] .'@'. $m["domaine"] : null;

        return array($user, $balpname);
    }

    public function getShareFromObjects($user, $balp) {
        $infuser = explode('@', $user);
        $infbalp = explode('@', $balp);
        // si on a soit des domaines partout, soit nulle part
        if (isset($infuser[1]) && !isset($infbalp[1]) || !isset($infuser[1]) && isset($infbalp[1])) {
            return null;
        }
        $osDelim = driver_mel::gi()->objectShareDelimiter();
        if (isset($infuser[1])) {
            return $infuser[0] . $osDelim . $infbalp[0] . ( $infbalp[1] === $infuser[1] ? "" : "%".$infbalp[1])
                . "@" . $infuser[1];
        } else {
            return $infuser[0] . $osDelim . $infbalp[0];
        }
    }

    /**
     * Définition des propriétées de l'utilisateur
     */
    private function set_user_properties() {
        if (!empty($this->get_account) && $this->get_account != $this->rc->get_user_name()) {
            // Récupération du username depuis l'url
//      $this->user_name = urldecode($this->get_account);
//      $inf = explode('@', $this->user_name);
//      $this->user_objet_share = urldecode($inf[0]);
//      $this->user_host = $inf[1] ?: null;
            $this->user_name = urldecode($this->get_account);
            list($user_object_share, $user_host) = $this->getShareUserBalpHostFromMail($this->user_name);
            $this->user_objet_share = $user_object_share;
            $this->user_host = $user_host ?: null;

            $user = driver_mel::gi()->getUser($this->user_objet_share, false);
            if ($user->is_objectshare) {
                $this->user_bal = $user->objectshare->mailbox_uid;
            }
            else {
                $this->user_bal = $this->user_objet_share;
            }
        }
        else {
            // Récupération du username depuis la session
            $this->user_name = $this->rc->get_user_name();
            //amr $this->user_objet_share = $this->rc->user->get_username('local');
            $this->user_objet_share = $this->rc->user->get_username();
            $this->user_host = $this->rc->user->get_username('host');
            $this->user_bal = $this->user_objet_share;
        }
    }

      /**
     *  Récupère un couple login/password pour jouer une authentification externe de type basic
     * ici on utilise une clé asymétrique car pas de mot de pass
     * @return array [login,password] for authentification type basic
     */
    public function getBasicAuth() {
        $rc = rcmail::get_instance();
        $user = $this->getUser();
        $user->load('employeenumber');
        $login = $user->employeenumber;
        $password = "MceToken@".hash('sha256',$login."_".$rc->config->get('nextcloud_token'));
        return [$login, $password];
    }
}
