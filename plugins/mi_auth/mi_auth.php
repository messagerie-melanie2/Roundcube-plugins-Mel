<?php
require dirname(__FILE__) . '/vendor/autoload.php';
class mi_auth extends rcube_plugin
{
  public $task = '.*';
  function init(){
    mel_logs::get_instance()->log(mel_logs::DEBUG, "mi_auth : init");
    $this->rc = rcmail::get_instance();
    $this->load_config();
    $this->add_hook('unauthenticated', array($this, 'unauthenticated'));
    $this->add_hook('authenticate', array($this, 'authenticate'));
    $this->add_hook('startup', array($this, 'startup'));
    $this->add_hook('logout_after', [$this, 'logout_after']);
    $this->add_texts('localization/', true);
    $this->authConf = $this->rc->config->get('mi_auth', []);
    $this->rc->output->set_env('portail_uri', $this->authConf['portail_uri']);
    $this->rc->output->set_env('mi_auth_api_uri', $this->authConf['api_uri']);
    $this->rc->output->set_env('mi_auth_courrielleur', false);
    $this->rc->output->set_env('mi_auth_verify', $this->authConf['api_uri_ext'] . 'token/verify');
    $this->include_script('mi_auth.js');
  }

  function startup($args){
    if($this->rc->user->get_username()){

      $storage = $this->rc->autoselect_host();
      $res = $this->rc->login($this->rc->user->get_username(), $this->rc->get_user_password(), $storage, true);

      if(!$res){
        $this->rc->kill_session();
        $uri = $this->rc->url($args, true, true);
        header('Location: '. $this->authConf['portail_uri'] . "?redirect_uri=" . $uri);
        die();
      }else {
        $is_courrielleur = trim(rcube_utils::get_input_value('_courrielleur', rcube_utils::INPUT_GET));
        if (isset($is_courrielleur) && (($is_courrielleur == 1) || ($is_courrielleur == 2)))
          $this->rc->output->set_env('mi_auth_courrielleur', true);
        if($args['task'] == 'login'){
          if($this->rc->user->get_username()){
            $uri = $this->rc->url([], true, true);
            $ar = explode('?', $uri);
            header('Location: ' . $ar[0]);
            die();
          }
        }
        if($args["action"] == "portailutilisateur"){
          unset($args["action"]);
          $uri = $this->rc->url($args, true, true);
          header('Location: ' . $uri);
          die();
        }
        return $args;
      }
    }


    if($args["action"] == "portailutilisateur"){
      if(!isset($_REQUEST['_portail_token']))
        return $this->error($args);

      mel_logs::get_instance()->log(mel_logs::DEBUG, "mi_auth : startup");
      $portail_token = $_REQUEST['_portail_token'];
      mel_logs::get_instance()->log(mel_logs::DEBUG, "mi_auth : startup request");
      $client = new \Mi\MiAuth\requests($this->authConf);
      mel_logs::get_instance()->log(mel_logs::DEBUG, "mi_auth : startup auth");
      $ret = $client->auth();
      if(!isset($ret['token']))
        return $this->error($args);
      $auth_token = $ret['token'];
      mel_logs::get_instance()->log(mel_logs::DEBUG, "mi_auth : startup token");
      $ret = $client->portailToken($portail_token, $auth_token);
      if(!isset($ret['token']))
        return $this->error($args);
      $user_token = $ret['token'];
      list($head, $payload, $sign) = explode('.', $user_token);
      $password = json_decode(base64_decode($payload))->auth_token;
      mel_logs::get_instance()->log(mel_logs::DEBUG, "mi_auth : startup userinfo");
      $userInfo = $client->userInfo($user_token);
      if($userInfo == [] )
        return $this->error($args);
      $args['user'] = $userInfo['mceUid'];
      $args['pass'] =  $password;
      return $this->authenticate($args);
    }
    return $args;
  }

  private function error($args){
    $this->include_stylesheet($this->local_skin_path() . '/error.css');
    $this->rc->output->set_pagetitle($this->gettext('Problème de connexion'));
    $args['task'] = 'error';
    $msg = '<a href="'. $this->authConf['portail_uri'] .'">Retourner au portail</a>';
    $this->rc->output->show_message($msg, 'error', null, true, 3600);
    $args['abort'] = true;
    $args['valid'] = false;
    $args['error'] = 503;
    $this->rc->log_login($args['user'], true, $args['error']);

    $this->rc->plugins->exec_hook('login_failed', array(
          'code' => $args['error'],
          'host' => $args['host'],
          'user' => $args['user']
    ));
    $this->rc->kill_session();
    $this->rc->output->send('mi_auth.error');
    return $args;
  }

  function unauthenticated($args){
    $req = $_REQUEST;
    $req['_action'] = "portailutilisateur";
    $string = http_build_query($req);
    $redirect_uri = rawurlencode($this->rc->url([], true, true) . '&' . $string);
    $redirect = $this->authConf['portail_uri'] . '?redirect_uri=' . $redirect_uri;
    header('Location: '. $redirect);
    return $args;
  }

  function authenticate($args){
    if(!isset($_REQUEST['_action']))
      return $args;

    if(isset($_REQUEST['_action']) AND ($_REQUEST['_action'] !== 'portailutilisateur'))
      return $args;

    mel_logs::get_instance()->log(mel_logs::DEBUG, "mi_auth : authenticate " . $args['pass']);
    $args['cookiecheck'] = true;
    mel_logs::get_instance()->log(mel_logs::DEBUG, "mi_auth : user " . json_encode($args, JSON_PRETTY_PRINT));
    try{
      $storage = $this->rc->autoselect_host();
      if($this->rc->login($args['user'], $args['pass'], $storage, true)){
        $this->rc->session->remove('temp');
        $this->rc->session->regenerate_id(false);
        $this->rc->session->set_auth_cookie();
        $this->rc->log_login();
      }
      $req = $_REQUEST;
      if(!isset($req['_task']))
        $req['_task'] = 'mail';
      if(($req['_task'] == 'logout') OR ($req['_task'] == 'login'))
        $req['_task'] = 'mail';
      if(isset($req['_portail_admin']))
        unset($req['_portail_admin']);
      if(isset($req['_action']) AND ($req['_action'] == 'portailutilisateur'))
        unset($req['_action']);
      $redir = $this->rc->plugins->exec_hook('login_after', $req);
      $q = http_build_query($req);
      mel_logs::get_instance()->log(mel_logs::DEBUG, "mi_auth : redir" . json_encode($redir, JSON_PRETTY_PRINT));
      header('Location: ./?' . $q);
    }catch(\Throwable $e){
      $this->error($args);
    }
    return $args;
  }

  function logout_after($args){
    if(!isset($_REQUEST['_baduser'])){
      header('Location: '. $this->authConf['portail_uri'] . '#in/logout');
      die();
    }
  }
}
