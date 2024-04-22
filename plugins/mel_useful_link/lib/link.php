<?php

class MelBaseLink {
  public $id;
  public $title;

  public function __construct($id, $title)
  {
      $this->id = $id;
      $this->title = $title;
  }
}

class MelLink extends MelBaseLink {
  public $link;

  public function __construct($id, $title, $link)
  {
      parent::__construct($id, $title);
      $this->link = $link;
  }

  public function serialize()
  {
      return json_encode($this);
  }
}

class MelFolderLink extends MelBaseLink {
  public $links;

  public function __construct($id, $title, $links)
  {
      parent::__construct($id, $title);
      $this->links = $links;
  }

  public function serialize()
  {
      return json_encode($this);
  }
}