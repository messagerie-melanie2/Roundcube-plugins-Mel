<?php

/**
 * Enumeration pour les types de notifications
 */
class ENotificationType {
  private /*string*/ $type;
  private function __construct(string $type) {
    $this->type = $type;
  }

  /**
   * Récupère la valeur de l'énumération
   * @return string
   */
  public function get()/* : string*/
  {
    return $this->type;
  }

  /**
   * Vérifie si l'énumération à la bonne valeur
   * @param ENotificationType $other Vérifier si les types sont identiques
   * @return bool
   */
  public function is(ENotificationType $other)/* : bool */
  {
    return $other->type === $this->type;
  }

  /**
   * Catégorie Mail
   * @static 
   * @return ENotificationType
   */
  public static function Mail()        { return new ENotificationType('mail');        }
  /**
   * Catégorie Agenda
   * @static 
   * @return ENotificationType
   */
  public static function Agenda()      { return new ENotificationType('agenda');      }
  /**
   * Catégorie Espace de travail
   * @static 
   * @return ENotificationType
   */
  public static function Workspace()   { return new ENotificationType('workspace');   }  /**
   * Catégorie Visioconférence
   * @static 
   * @return ENotificationType
   */
  public static function Webconf()     { return new ENotificationType('webconf');     }
  /**
   * Catégorie Information
   * @static 
   * @return ENotificationType
   */
  public static function Information() { return new ENotificationType('info');        }
  /**
   * Catégorie Onboarding
   * @static 
   * @return ENotificationType
   */
  public static function Onboarding()  { return new ENotificationType('onboarding');  }
  /**
   * Catégorie Divers
   * @static 
   * @return ENotificationType
   */
  public static function Misc()        { return new ENotificationType('misc');        }
  /**
   * Catégorie Suggestion
   * @static 
   * @return ENotificationType
   */
  public static function Suggestion()  { return new ENotificationType('suggestion');  }
  /**
   * Catégorie Tchat
   * @static 
   * @return ENotificationType
   */
  public static function Chat()        { return new ENotificationType('chat');        }     
  /**
   * Catégorie Double authentification
   * @static 
   * @return ENotificationType
   */
  public static function DoubleAuth()  { return new ENotificationType('double_auth'); }
} 

/**
 * Classe de base pour les action des notifications
 * @abstract
 */
abstract class NotificationActionBase {
  /**
   * Texte de la notifications
   * @var string
   */
  public /*string*/ $text;
  /**
   * Texte au survol de la notification
   * @var string
   */
  public /*string*/ $title;

  /**
   * Une action de notification est toujours au moins composé d'un texte et d'un title
   * @param string $text Texte de la notification
   * @param string $title Titre (au survol) de la notification
   */
  public function __construct(string $text, string $title) {
    $this->text = $text;
    $this->title = $title;
  }

  public function get() {
    return [$this];
  }

  /**
   * Créer une action de notification
   * @static 
   * @param string $text Texte de la notification
   * @param string $title Titre de la notification
   * @param string $action Url ou nom de commande
   * @param bool $iscommand Si c'est un url, mettre à faux. 
   * @return NotificationActionBase
   */
  public static function Create(string $text, string $title, string $action, bool $iscommand = true) {
    if ($iscommand) return new NotificationAction($action, $text, $title);
    else return new NotificationActionHref($action, $text, $title);
  }
}

/**
 * Classe pour les actions de notifications. La notification appelle une commande. 
 */
class NotificationAction extends NotificationActionBase {
  /**
   * Commande qui sera appelé lors du clique de la notification
   * @var string
   */
  public /*string*/ $command;

  /**
   * Une action de notification est toujours au moins composé d'un texte, d'un title et d'une action, ici une commande.
   *
   * @param string $command Commande appeler au clique
   * @param string $text Texte de l'action
   * @param string $title Titre de l'action
   */
  public function __construct(string $command, string $text, string $title) {
    parent::__construct($text, $title);
    $this->command = $command;
  }
}

/**
 * Classe pour les actions de notifications. La notification appelle une url. 
 */
class NotificationActionHref extends NotificationActionBase {
  /**
   * Url qui sera appelé lors du clique de la notification
   *
   * @var string 
   */
    public /*string*/ $href;

  /**
   * Une action de notification est toujours au moins composé d'un texte, d'un title et d'une action, ici un href.
   *
   * @param string $href Url appeler au clique
   * @param string $text Texte de l'action
   * @param string $title Titre de l'action
   */
  public function __construct(string $href, string $text, string $title) {
    parent::__construct($text, $title);
    $this->href = $href;
  }
}

/**
 * Classe pour les actions de notifications. La notification appelle une url et une commande.
 */
class NotificationActionCommandHref extends NotificationAction {
  /**
   * Url qui sera appelé lors du clique de la notification
   *
   * @var string 
   */
    public /*string*/ $href;

  /**
   * Une action de notification est toujours au moins composé d'un texte, d'un title et d'une action, ici un href.
   *
   * @param string $href Url appeler au clique
   * @param string $text Texte de l'action
   * @param string $title Titre de l'action
   */
  public function __construct(string $href, string $command, string $text, string $title) {
    parent::__construct($command, $text, $title);
    $this->href = $href;
  }
}

/**
 * Représente une notification et donne des fonctions utile à la création et l'envoie d'une notification
 */
class Notification {
  /**
   * Catégorie de la notification
   * @var ENotificationType
   */
  private /*ENotificationType*/ $notification_type;
  /**
   * Action de la notification
   * @var ?NotificationActionBase
   */
  private /*?NotificationActionBase*/ $action;
  /**
   * Titre de la notification (au survol de la souris)
   * @var string
   */
  private /*string*/ $title;
  /**
   * Contenu de la notificatyion (html)
   * @var string
   */
  private /*string*/ $content;

  /**
   * Créer une notification. Celle-ci pourra être modifier et envoyer.
   *
   * @param ENotificationType $notification_type Type de la notification
   * @param string $title Titre de la notification (au survol)
   * @param string $content Contenu html de la notification
   * @param NotificationActionBase|null $action Action de la notification
   */
  public function __construct(ENotificationType $notification_type, string $title, string $content, ?NotificationActionBase $action = null) {
    $this->notification_type = $notification_type;
    $this->title = $title;
    $this->content = $content;
    $this->action = $action;
  }

  /**
   * Met à jour la titre de la notification
   *
   * @param string $title Nouveau titre
   * @return Notification Chaînage
   */
  public function update_title(string $title)/* : Notification*/
  {
    $this->title = $title;
    return $this;
  }

  /**
   * Met à jour la catégorie de la notification
   *
   * @param ENotificationType $type Nouvelle catégorie
   * @return Notification Chaînage
   */
  public function update_type(ENotificationType $type)/* : Notification*/
  {
    $this->notification_type = $type;
    return $this;
  }

  /**
   * Met à jour le contenu de la notification
   *
   * @param string $content Nouveau contenu de la notification
   * @return Notification Chaînage
   */
  public function update_content(string $content)/* : Notification*/
  {
    $this->content = $content;
    return $this;
  }

  /**
   * Met à jour l'action de la notification
   *
   * @param ?NotificationActionBase $action Nouvelle action de la notification
   * @return Notification Chaînage
   */
  public function update_action(?NotificationActionBase $action)/* : Notification*/
  {
    $this->action = $action;
    return $this;
  }

  /**
   * Récupère sous forme de tableau, les données de la notification. 
   *
   * @return array
   */
  public function get_for_command()/* : array*/
  {
    $config =  [
      'title' => $this->title,
      'content' => $this->content,
      'created' => time(),
      'modified' => time(),
      'category' => $this->notification_type->get()
    ];

    if (isset($this->action)) $config['action'] = [$this->action];

    return $config;
  }

  /**
   * Notifie un utilisateur des données de cette notification
   *
   * @param any $user Utilisateur à notifier. Si `null` ça sera l'utilisateur en cours
   * @return void
   */
  public function notify($user = null) {
    self::NotifyUser($this, $user);
  }

  /**
   * Notifie un utilisateur
   *
   * @param Notification $notification Notification qui sera envoyé
   * @param any $user Utilisateur à notifier. Si `null` ça sera l'utilisateur en cours
   * @return void
   * @static
   */
  public static function NotifyUser(Notification $notification, $user = null) {
    mel_notification::notify($notification->notification_type->get(), $notification->title, $notification->content, $notification->action, $user);
  }

  /**
   * Notifie un utilisateur sans passer par la création d'un objet `Notification`.
   *
   * @param ENotificationType $notification_type Type de la notification
   * @param string $title Text au survol de la notification
   * @param string $content Contenu (html) de la notification
   * @param NotificationActionBase|null $action Action de la notification
   * @param any $user Utilisateur à notifier. Si `null` ça sera l'utilisateur en cours
   * @return void
   */ 
  public static function Notif(ENotificationType $notification_type, string $title, string $content, NotificationActionBase $action = null, $user = null) {
    self::NotifyUser(new Notification($notification_type, $title, $content, $action), $user);
  }
}

/**
 * Notification local, seulement pour l'utilisateur en cours
 */
class CommandNotification extends Notification {
  /**
   * Id de la notification
   *
   * @var string
   */
  private /*string*/ $uid;
  /**
   * Paire de clé/valeur supplémentaire pour la notification.
   *
   * @var array
   */
  private /*array*/ $extra;

  /**
   * Créer une notification. Celle-ci pourra être modifier et envoyer.
   *
   * @param ENotificationType $notification_type Catégorie de la notification
   * @param string $title Texte au survol de la notification
   * @param string $content Contenu html de la notification
   * @param NotificationActionBase|null $action Action de la notification
   * @param string|null $uid Id de la notification. Si `null` elle sera générée
   */
  public function __construct(ENotificationType $notification_type, string $title, string $content, NotificationActionBase $action = null, string $uid = null) {
    parent::__construct($notification_type, $title, $content, $action);
    $this->uid = $uid ?? \LibMelanie\Lib\UUID::v4();
    $this->extra = [];
  }

  /**
   * Ajoute une nouvelle valeur
   *
   * @param string $key Clé qui permettra de retrouver la valeur
   * @param any $value Valeur
   * @return CommandNotification Chaînage
   */
  public function add_extra($key, $value)/* : CommandNotification*/ {
    $this->extra[$key] = $value;
    return $this;
  }

  /**
   * Récupère sous forme de tableau, les données de la notification. 
   *
   * @return array
   */
  public function get_for_command()/* : array*/
  {
    $config = parent::get_for_command();
    $config['uid'] = $this->uid;
    $config['local'] = true;
    $config['isread'] = false;

    if (isset($this->extra) && count($this->extra) > 0) {
      foreach ($this->extra as $key => $value) {
        $config[$key] = $value;
      }
    }

    return $config;
  }

  /**
   * Envoie la notification localement. Passe par `rcmail::get_instance()->output->command`.
   *
   * @return void
   */
  public function notify_local() {
    rcmail::get_instance()->output->command('plugin.push_notification', $this->get_for_command());
  }  
}



/*
Tuto : 
Créer et envoyer une notification bdd : 
Notification::Notif(ENotificationType::Chat(), 'Vous avez reçu un nouveau message', "$user vous a envoyé un message sur $channel", NotificationActionBase::Create('Voir le canal', 'Voir le canal', 'go_to_channel'));
Créer et envoyer une notification locale :
(new CommandNotification(ENotificationType::Chat(), 'Vous avez reçu un nouveau message', "$user vous a envoyé un message sur $channel", NotificationActionBase::Create('Voir le canal', 'Voir le canal', 'go_to_channel')))->add_extra('channel', $channel)->notify_local();
*/
