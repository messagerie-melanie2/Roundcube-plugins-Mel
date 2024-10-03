<?php

/**
 * Classe de modification du mot de passe
 * Va utiliser le singleton de connexion LDAP pour effectuer les modifications
 * @author PNE Messagerie/Apitech
 *
 */
class Password {
	/**
	 * Génération du mot de passe SSHA1
	 * @param string $password
	 */
	public static function SSHA1PasswordGenerator($password) {
		// Initialiser le générateur de nombres aléatoires.
		mt_srand( (double) microtime() * 1000000);
		
		// Générer une clé
		$salt = mhash_keygen_s2k(MHASH_SHA1,       // Identifiant du hash utilisé
						$password,      // Mot de passe fourni par user
						substr(pack("h*",  // Grain de sel (8 octets)
								md5(mt_rand()))
								,0
								,8),
						4);                // Longueur de la clé en octets
		
		// salt = Doit être différent et suffisamment aléatoire pour chaque clé
		// que vous générez, afin d'en créer des différentes.
		// Ce grain de sel ("salt") servira à nouveau lorsque vous vérifierez
		// les clés : c'est alors une bonne idée que de l'ajouter à la fin de
		// la clé générée. salt  doit avoir la longueur de 8 octets, et sera
		// complété par des 0 si vous ne fournissez par suffisamment de données.
		
		// Calculer un hashage
		return "{ssha}" . base64_encode(mhash(MHASH_SHA1, $password . $salt) . $salt);
	}

	/**
	 * Validation du mot de passe
	 * 
	 * @param string $password
	 * @param LibMelanie\Api\Mel\User $user
	 * 
	 * @return boolean
	 */
	public static function Validate($password, $user) {
		// Inclusion des fichiers
        require __DIR__ . '/../config.inc.php';

		global $message;

		// Vérification de la longueur minimale
		if (strlen($password) < $config['external_password_min_length']) {
			utils::log("Extern/Password::Validate() [$user->email] - Password too short");
			$message = "Le mot de passe doit contenir au moins " . $config['external_password_min_length'] . " caractères";
			return false;
		}

		// Vérification de la longueur maximale
		if (strlen($password) > $config['external_password_max_length']) {
			utils::log("Extern/Password::Validate() [$user->email] - Password too long");
			$message = "Le mot de passe doit contenir au maximum " . $config['external_password_max_length'] . " caractères";
			return false;
		}

		// Est-ce que le mot de passe a une majuscule
		if ($config['external_password_uppercase'] && !preg_match('/[A-Z]/', $password)) {
			utils::log("Extern/Password::Validate() [$user->email] - Password must have an uppercase letter");
			$message = "Le mot de passe doit contenir au moins une majuscule";
			return false;
		}

		// Est-ce que le mot de passe a une minuscule
		if ($config['external_password_lowercase'] && !preg_match('/[a-z]/', $password)) {
			utils::log("Extern/Password::Validate() [$user->email] - Password must have a lowercase letter");
			$message = "Le mot de passe doit contenir au moins une minuscule";
			return false;
		}

		// Est-ce que le mot de passe a un chiffre
		if ($config['external_password_number'] && !preg_match('/[0-9]/', $password)) {
			utils::log("Extern/Password::Validate() [$user->email] - Password must have a number");
			$message = "Le mot de passe doit contenir au moins un chiffre";
			return false;
		}

		// Est-ce que le mot de passe a un caractère spécial
		if ($config['external_password_special_char'] && !preg_match('/[\x21-\x2F\x3A-\x40\x5B-\x5F\x7B-\x7E]/', $password)) {
			utils::log("Extern/Password::Validate() [$user->email] - Password must have a special character");
			$message = "Le mot de passe doit contenir au moins un caractère spécial";
			return false;
		}

		// Le mot de passe ne doit pas contenir de \
		if (strpos($password, "\\") !== false) {
			utils::log("Extern/Password::Validate() [$user->email] - Password must not contain a \\");
			$message = "Le mot de passe ne doit pas contenir de \\";
			return false;
		}

		// Est-ce que le mot de passe contient des accents
		if (!$config['external_password_accented_char'] && preg_match('/[éèêëàâäôöûüç]/', $password)) {
			utils::log("Extern/Password::Validate() [$user->email] - Password must not contain accented characters");
			$message = "Le mot de passe ne doit pas contenir de caractères accentués";
			return false;
		}

		// Est-ce que le nom prénom ou l'uid est contenu dans le mot de passe
		if ($config['external_password_ad_restrictions'] 
				&& (strpos(strtolower($password), strtolower($user->firstname)) !== false 
					|| strpos(strtolower($password), strtolower($user->lastname)) !== false)) {
			utils::log("Extern/Password::Validate() [$user->email] - Password must not contain the name or firstname");
			$message = "Le mot de passe ne doit pas contenir votre nom ou prénom";
			return false;
		}

		return true;
	}
}