<?php
class ministere{
  private $tempFile;
  private $stream = null;
  public function __construct(){
    include dirname(__FILE__) . '/config.inc.php';
    $this->config = $config;
    $tempDir = $config["tempDir"];
    if(!is_dir($tempDir))
      mkdir($tempDir);
    $this->tempFiles = [
      "img" => $tempDir . "/img.bin",
      "imgType" => $tempDir . "/img.txt",
      "logo" => $tempDir . "/logo.bin",
      "logoType" => $tempDir . "/logo.txt",
      "info" => $tempDir . "/info.json",
    ];
    if(isset($config['api']))
      if(isset($config['api']["context"]))
        $this->stream = stream_context_create($config['api']["context"]);
  }

  public function getInfo(){
    if(!is_file($this->tempFiles['info'])){
      $this->setInfo();
    }

    if($this->needRenew($this->tempFiles['info'])){
      $this->setInfo();
    }
    return $this->tempFiles['info'];
  }

  public function getImg(): array{
    if(!is_file($this->tempFiles['img'])){
      $this->setImg();
      $this->setImgType();
    }
    if(!is_file($this->tempFiles['imgType'])){
      $this->setImg();
      $this->setImgType();
    }

    if($this->needRenew($this->tempFiles['img']) OR $this->needRenew($this->tempFiles['imgType'])){
      $this->setImg();
      $this->setImgType();
    }
    return [
      "img" => $this->tempFiles['img'],
      "imgType" => $this->tempFiles['imgType'],
    ];
  }

  public function getLogo(): array{
    if(!is_file($this->tempFiles['logo'])){
      $this->setLogo();
      $this->setLogoType();
    }
    if(!is_file($this->tempFiles['logoType'])){
      $this->setLogo();
      $this->setLogoType();
    }

    if($this->needRenew($this->tempFiles['logo']) OR $this->needRenew($this->tempFiles['logoType'])){
      $this->setLogo();
      $this->setLogoType();
    }
    return [
      "img" => $this->tempFiles['logo'],
      "imgType" => $this->tempFiles['imgType'],
    ];
  }

  private function needRenew($file): bool{
    $renew = false;
    $fileTime = filemtime($file);
    if((time() - $fileTime > $this->config['cacheTs']))
      $renew = true;
    return $renew;
  }

  private function setInfo(){
    $info = false;
    if($this->config["api"]["infoEnpoint"]){
      $info = file_get_contents($this->config["api"]["infoEnpoint"], false, $this->stream);
      if($info){
        $status = $this->httpCode($http_response_header);
        if($status !== 200)
          $info = false;
      }
    }
    if($info){
      file_put_contents($this->tempFiles['info'], $info);
    }else{
      file_put_contents($this->tempFiles['info'], json_encode($this->config["default"]["info"]));
    }
  }

  private function setImgType(){
    $imgType = false;
    if($this->config["api"]["imgInfoEndpoint"]){
      $imgType = file_get_contents($this->config["api"]["imgInfoEndpoint"], false, $this->stream);
      if($imgType){
        $status = $this->httpCode($http_response_header);
        if($status !== 200)
          $imgType = false;
      }
    }
    if($imgType){
      $imgType = json_decode($imgType);
      file_put_contents($this->tempFiles['imgType'], $imgType->imageData);
    }else{
      file_put_contents($this->tempFiles['imgType'], $this->config["default"]["imgType"]);
    }
  }
  private function setLogoType(){
    $imgType = false;
    if($this->config["api"]["logoInfoEndpoint"]){
      $imgType = file_get_contents($this->config["api"]["logoInfoEndpoint"], false, $this->stream);
      if($imgType){
        $status = $this->httpCode($http_response_header);
        if($status !== 200)
          $imgType = false;
      }
    }
    if($imgType){
      $imgType = json_decode($imgType);
      file_put_contents($this->tempFiles['logoType'], $imgType->imageData);
    }else{
      file_put_contents($this->tempFiles['logoType'], $this->config["default"]["logoType"]);
    }
  }

  private function setImg(){
    $img = false;
    if($this->config["api"]["imgEndpoint"]){
      $img = file_get_contents($this->config["api"]["imgEndpoint"], false, $this->stream);
      if($img){
        $status = $this->httpCode($http_response_header);
        if($status !== 200)
          $img = false;
      }
    }
    if($img){
      file_put_contents($this->tempFiles['img'], $img);
    }else{
      file_put_contents($this->tempFiles['img'], file_get_contents($this->config["default"]["img"]));
    }
  }

  private function setLogo(){
    $img = false;
    if($this->config["api"]["logoEndpoint"]){
      $img = file_get_contents($this->config["api"]["logoEndpoint"], false, $this->stream);
      if($img){
        $status = $this->httpCode($http_response_header);
        if($status !== 200)
          $img = false;
      }
    }
    if($img){
      file_put_contents($this->tempFiles['logo'], $img);
    }else{
      file_put_contents($this->tempFiles['logo'], file_get_contents($this->config["default"]["logo"]));
    }
  }

  private function httpCode($header): int{
    preg_match('{HTTP\/\S*\s(\d{3})}', $header[0], $match);
    return (integer)$match[1];
  }
}

if(isset($_REQUEST['q']) AND ($_REQUEST['q'] == "img")){
  $cl = new ministere();
  $imgInfo = $cl->getImg();
  header('Content-type: ' . file_get_contents($imgInfo['imgType']));
  echo file_get_contents($imgInfo['img']);
}

if(isset($_REQUEST['q']) AND ($_REQUEST['q'] == "logo")){
  $cl = new ministere();
  $imgInfo = $cl->getLogo();
  header('Content-type: ' . file_get_contents($imgInfo['imgType']));
  echo file_get_contents($imgInfo['img']);
}
