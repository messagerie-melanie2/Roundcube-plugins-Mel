<?php
class ENotificationType {
  private $type;
  private function __construct(string $type) {
    $this->type = $type;
  }

  public function get() : string
  {
    return $this->type;
  }

  public function is(ENotificationType $other) : bool 
  {
    return $other->type === $this->type;
  }

  public static function Mail() { return new ENotificationType('mail'); }
  public static function Agenda() { return new ENotificationType('agenda'); }
  public static function Workspace() { return new ENotificationType('workspace'); }
  public static function Webconf() { return new ENotificationType('webconf'); }
  public static function Information() { return new ENotificationType('info'); }
  public static function Onboarding() { return new ENotificationType('onboarding'); }
  public static function Misc() { return new ENotificationType('misc'); }
  public static function Suggestion() { return new ENotificationType('suggestion'); }
  public static function Chat() { return new ENotificationType('chat'); }
  public static function DoubleAuth() { return new ENotificationType('double_auth'); }
} 

abstract class NotificationActionBase {
  public string $text;
  public string $title;

  public function __construct(string $text, string $title) {
    $this->text = $text;
    $this->title = $title;
  }

  public static function Create(string $text, string $title, string $action, bool $iscommand = true) {
    if ($iscommand) return new NotificationAction($action, $text, $title);
    else return new NotificationActionHref($action, $text, $title);
  }
}

class NotificationAction extends NotificationActionBase {
  public string $command;

  public function __construct(string $command, string $text, string $title) {
    parent::__construct($text, $title);
    $this->command = $command;
  }
}

class NotificationActionHref extends NotificationActionBase {
    public string $href;

  public function __construct(string $href, string $text, string $title) {
    parent::__construct($text, $title);
    $this->href = $href;
  }
}

class NotificationActionCommandHref extends NotificationAction {
    public string $href;

  public function __construct(string $href, string $command, string $text, string $title) {
    parent::__construct($command, $text, $title);
    $this->href = $href;
  }
}

class Notification {
  private ENotificationType $notification_type;
  private NotificationActionBase $action;
  private string $title;
  private string $content;

  public function __construct(ENotificationType $notification_type, string $title, string $content, NotificationActionBase $action = null) {
    $this->$notification_type = $notification_type;
    $this->title = $title;
    $this->content = $content;
    $this->action = $action;
  }

  public function update_title(string $title) : Notification
  {
    $this->title = $title;
    return $this;
  }

  public function update_type(ENotificationType $type) : Notification
  {
    $this->notification_type = $type;
    return $this;
  }

  public function update_content(string $content) : Notification
  {
    $this->content = $content;
    return $this;
  }

    public function update_action(NotificationActionBase $action) : Notification
  {
    $this->action = $action;
    return $this;
  }

  public function get_for_command() : array
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

  public function notify($user = null) {
    self::NotifyUser($this, $user);
  }

  public static function NotifyUser(Notification $notification, $user = null) {
    mel_notification::notify($notification->notification_type->get(), $notification->title, $notification->content, $notification->action, $user);
  }

  public static function Notif(ENotificationType $notification_type, string $title, string $content, NotificationActionBase $action = null, $user = null) {
    self::NotifyUser(new Notification($notification_type, $title, $content, $action), $user);
  }
}

class CommandNotification extends Notification {
  private string $uid;
  private array $extra;

  public function __construct(ENotificationType $notification_type, string $title, string $content, NotificationActionBase $action = null, string $uid = null) {
    parent::__construct($notification_type, $title, $content, $action);
    $this->uid = $uid ?? \LibMelanie\Lib\UUID::v4();
    $this->extra = [];
  }

  public function add_extra($key, $value) : CommandNotification {
    $this->extra[$key] = $value;
    return $this;
  }

  public function get_for_command() : array
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

  public function notify_local() {
    rcmail::get_instance()->output->command('plugin.push_notification', $this->get_for_command());
  }  
}



