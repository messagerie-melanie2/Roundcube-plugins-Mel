<?php
/**
 * Plugin Rocket.Chat
 *
 * Integration of Rocket.Chat as an iFrame in Roundcube
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 2
 * as published by the Free Software Foundation.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

require_once __DIR__ . "/vendor/autoload.php";

/**
 * Classe cliente de gestion de Rocket.Chat en MongoDB
 *
 * @author Thomas Payen <thomas.payen@i-carre.net>
 *
 */
class RocketChatMongoDB {
  /**
   * @var rcmail
   */
  private $rc;
  /**
   * @var MongoDB\Client
   */
  private $client;
  /**
   * Error message
   * 
   * @var string
   */
  private $error;
  /**
   * Détermine si la connexion à MongoDB est bonne
   * 
   * @var boolean
   */
  private $isConnected;

  /**
   * Constructeur par défaut
   * 
   * @param rcmail $rc
   */
  public function __construct($rc) {
    $this->rc = $rc;
    $this->connect();
  }

  /**
   * Connexion à la base de données MongoDB Rocket.Chat
   * 
   * @return boolean
   */
  private function connect() {
    if (mel_logs::is(mel_logs::TRACE))
      mel_logs::get_instance()->log(mel_logs::TRACE, "RocketChatMongoDB::connect()");
    $this->isConnected = true;
    try {
      $this->client = new MongoDB\Client($this->rc->config->get('rocket_chat_mongodb_uri', null));
    }
    catch (InvalidArgumentException $ex) {
      $this->error = $ex->getTraceAsString();
      $this->isConnected = false;
    }
    catch (Exception $ex) {
      $this->error = $ex->getTraceAsString();
      $this->isConnected = false;
    }
    return $this->isConnected;
  }
  /**
   * Suppression de la connexion à la base MongoDB
   */
  private function disconnect() {
    if (mel_logs::is(mel_logs::TRACE))
      mel_logs::get_instance()->log(mel_logs::TRACE, "RocketChatMongoDB::disconnect()");
    $this->client = null;
    $this->isConnected = false;
  }

  /**
   * Positionnement du ldap pour le user dans la base MongoDB
   * A faire après une création de l'utilisateur par les API
   * 
   * @param string $userId
   * @param string $username
   * @return boolean
   */
  public function setLdapUser($userId, $username) {
    if (mel_logs::is(mel_logs::TRACE))
      mel_logs::get_instance()->log(mel_logs::TRACE, "RocketChatMongoDB::setLdapUser($userId, $username)");
    $collection = $this->getCollection();

    try {
      $updateResult = $collection->updateOne(
          ['_id' => $userId],
          ['$set' => [
              'ldap' => true, 
              'services.ldap' => ['id' => $this->usernameToRocketId($username), 'idAttribute' => $this->rc->config->get('rocket_chat_idAttribute', 'uid')]]],
          ['$unset' => ['services.password' => '']]
      );
    }
    catch (Exception $ex) {
      $this->error = $ex->getTraceAsString();
      return false;
    }

    return $updateResult->getMatchedCount() === 1;
  }
  
  /**
   * Positionnement du token d'authentification dans la base MongoDB
   * 
   * @param string $userId
   * @param string $authToken
   * @return boolean
   */
  public function setAuthTokenUser($userId, $authToken) {
    if (mel_logs::is(mel_logs::TRACE))
      mel_logs::get_instance()->log(mel_logs::TRACE, "RocketChatMongoDB::setAuthTokenUser($userId)");
    $collection = $this->getCollection();
    
    try {
      $updateResult = $collection->updateOne(
          ['_id' => $userId],
          ['$push' => ['services.resume.loginTokens' => ['when' => (new MongoDB\BSON\UTCDateTime()), 'hashedToken' => $authToken]]]
      );
    }
    catch (Exception $ex) {
      $this->error = $ex->getTraceAsString();
      return false;
    }
    
    return $updateResult->getMatchedCount() === 1;
  }
  /**
   * Suppression du token d'authentification dans la base de données MongoDB
   * 
   * @param string $userId
   * @param string $authToken
   * @return boolean
   */
  public function unsetAuthTokenUser($userId, $authToken) {
    if (mel_logs::is(mel_logs::TRACE))
      mel_logs::get_instance()->log(mel_logs::TRACE, "RocketChatMongoDB::unsetAuthTokenUser($userId)");
    $collection = $this->getCollection();
    
    try {
      $updateResult = $collection->updateOne(
          ['_id' => $userId],
          ['$pull' => ['services.resume.loginTokens' => ['hashedToken' => $authToken]]]
          );
    }
    catch (Exception $ex) {
      $this->error = $ex->getTraceAsString();
      return false;
    }
    
    return $updateResult->getMatchedCount() === 1;
  }

  /**
   * Recherche l'utilisateur dans la base MongoDB Rocket.Chat en fonction du username
   * 
   * @param string $username
   * @return NULL|string User ID de l'utilisateur
   */
  public function searchUserByUsername($username) {
    if (mel_logs::is(mel_logs::TRACE))
      mel_logs::get_instance()->log(mel_logs::TRACE, "RocketChatMongoDB::searchUserByUsername($username)");
    $collection = $this->getCollection();

    try {
      $findResult = $collection->findOne(['services.ldap.id' => $this->usernameToRocketId($username)]);
    }
    catch (Exception $ex) {
      $this->error = $ex->getTraceAsString();
      return null;
    }
    if (mel_logs::is(mel_logs::TRACE))
      mel_logs::get_instance()->log(mel_logs::TRACE, "RocketChatMongoDB::searchUserByUsername($username) result: " . var_export($findResult, true));
    return [
        'id' => $findResult->_id,
        'name' => $findResult->name,
        'username' => $findResult->username,
        'fname' => $findResult->name,
        'email' => $findResult->emails[0]->address,
        'status' => $findResult->status
    ];
  }
  
  /**
   * Recherche l'utilisateur dans la base MongoDB Rocket.Chat en fonction de son adresse email
   *
   * @param string $email
   * @return NULL|array ['id', 'name', 'username', 'status']
   */
  public function searchUserByEmail($email) {
    if (mel_logs::is(mel_logs::TRACE))
      mel_logs::get_instance()->log(mel_logs::TRACE, "RocketChatMongoDB::searchUserByEmail($email)");
      $collection = $this->getCollection();
      
      try {
        $findResult = $collection->findOne(['emails.address' =>  ['$regex' => '^'.strtolower($email).'$', '$options' => 'i']]);
      }
      catch (Exception $ex) {
        $this->error = $ex->getTraceAsString();
        return null;
      }
      if (mel_logs::is(mel_logs::TRACE))
        mel_logs::get_instance()->log(mel_logs::TRACE, "RocketChatMongoDB::searchUserByEmail($email) result: " . var_export($findResult, true));
      return [
          'id' => $findResult->_id,
          'name' => $findResult->name,
          'username' => $findResult->username,
          'status' => $findResult->status,
      ];
  }

  /**
   * Récupère la dernière erreur de requête MongoDB
   * 
   * @return string
   */
  public function getError() {
    return $this->error;
  }
  
  /**
   * Retourne la collection Rocket.Chat pour la gestion des users
   * 
   * @return MongoDB\Collection
   */
  private function getCollection() {
    return $this->client->rocketchat->users;
  }
  
  /**
   * Conversion de l'uid LDAP en identifiant ldap pour la base MongoDB
   * 
   * @param string $username
   * @return string
   */
  private function usernameToRocketId($username) {
    return bin2hex($username);
  }
}
